pub mod api;
pub mod config;
pub mod model;
pub mod telemetry;

use api::queries::Query;
use async_graphql::{EmptyMutation, EmptySubscription, Schema};
use async_graphql_axum::GraphQL;
use axum::{
    Router,
    http::{HeaderValue, Method},
    response::{Html, IntoResponse},
    routing::get,
};
use sqlx::PgPool;
use tower_http::{cors::CorsLayer, trace::TraceLayer};

pub type AppSchema = Schema<Query, EmptyMutation, EmptySubscription>;

#[must_use]
pub fn create_schema(pool: PgPool) -> AppSchema {
    Schema::build(Query, EmptyMutation, EmptySubscription)
        .data(pool)
        .extension(async_graphql::extensions::Tracing)
        .extension(async_graphql::extensions::Logger)
        .finish()
}

pub fn create_router(
    schema: AppSchema,
    allowed_origins: Vec<HeaderValue>,
    gcp_project_id: Option<String>,
) -> Router {
    let cors = CorsLayer::new()
        .allow_methods([Method::GET, Method::POST])
        .allow_headers([axum::http::header::CONTENT_TYPE])
        .allow_origin(allowed_origins);

    Router::new()
        .route(
            "/graphql",
            get(graphql_handler).post_service(GraphQL::new(schema)),
        )
        .layer(
            TraceLayer::new_for_http().make_span_with(move |request: &axum::http::Request<_>| {
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
            }),
        )
        .layer(cors)
}

async fn graphql_handler() -> impl IntoResponse {
    Html(
        async_graphql::http::GraphiQLSource::build()
            .endpoint("/graphql")
            .finish(),
    )
}
