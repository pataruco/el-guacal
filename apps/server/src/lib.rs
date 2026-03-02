pub mod api;
pub mod auth;
pub mod config;
pub mod model;
pub mod telemetry;

use api::{Mutation, Query};
use async_graphql::{EmptySubscription, Schema};
use auth::FirebaseVerifier;
use axum::{
    Router,
    http::{HeaderValue, Method},
    response::{Html, IntoResponse},
    routing::get,
};
use sqlx::PgPool;
use tower_http::{cors::CorsLayer, trace::TraceLayer};

pub type AppSchema = Schema<Query, Mutation, EmptySubscription>;

#[must_use]
pub fn create_schema(pool: PgPool, firebase_verifier: Option<FirebaseVerifier>) -> AppSchema {
    let mut builder =
        Schema::build(Query::default(), Mutation::default(), EmptySubscription).data(pool);

    if let Some(verifier) = firebase_verifier {
        builder = builder.data(verifier);
    }

    builder
        .extension(async_graphql::extensions::Tracing)
        .extension(async_graphql::extensions::Logger)
        .finish()
}

pub fn create_router(
    schema: AppSchema,
    allowed_origins: Vec<HeaderValue>,
    gcp_project_id: Option<String>,
    firebase_verifier: Option<std::sync::Arc<FirebaseVerifier>>,
) -> Router {
    let cors = CorsLayer::new()
        .allow_methods([Method::GET, Method::POST])
        .allow_headers([
            axum::http::header::CONTENT_TYPE,
            axum::http::header::AUTHORIZATION,
        ])
        .allow_origin(allowed_origins);

    Router::new()
        .route(
            "/graphql",
            get(graphql_handler).post(
                move |verifier: axum::extract::State<Option<std::sync::Arc<FirebaseVerifier>>>,
                      headers: axum::http::HeaderMap,
                      req: async_graphql_axum::GraphQLRequest| {
                    let mut req = req.into_inner();
                    let schema = schema.clone();
                    async move {
                        if let Some(verifier) = verifier.as_ref()
                            && let Some(auth_header) =
                                headers.get(axum::http::header::AUTHORIZATION)
                            && let Ok(auth_str) = auth_header.to_str()
                            && let Some(token) = auth_str.strip_prefix("Bearer ")
                            && let Ok(user) = verifier.verify_token(token).await
                        {
                            req = req.data(user);
                        }
                        async_graphql_axum::GraphQLResponse::from(schema.execute(req).await)
                    }
                },
            ),
        )
        .with_state(firebase_verifier)
        .layer(TraceLayer::new_for_http().make_span_with(
            move |request: &axum::http::Request<_>| {
                let trace_context = request
                    .headers()
                    .get("x-cloud-trace-context")
                    .and_then(|v| v.to_str().ok())
                    .unwrap_or("");

                // Format: TRACE_ID/SPAN_ID;o=TRACE_TRUE
                let trace_id = trace_context.split('/').next().unwrap_or("");

                let gcp_trace = if trace_id.is_empty() {
                    String::new()
                } else if let Some(project_id) = &gcp_project_id {
                    format!("projects/{project_id}/traces/{trace_id}")
                } else {
                    trace_id.to_string()
                };

                tracing::info_span!(
                    "http-request",
                    method = %request.method(),
                    uri = %request.uri(),
                    "logging.googleapis.com/trace" = %gcp_trace,
                )
            },
        ))
        .layer(cors)
}

async fn graphql_handler() -> impl IntoResponse {
    Html(
        async_graphql::http::GraphiQLSource::build()
            .endpoint("/graphql")
            .finish(),
    )
}
