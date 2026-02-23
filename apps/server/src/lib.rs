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

pub fn create_router(schema: AppSchema, allowed_origins: Vec<HeaderValue>) -> Router {
    let cors = CorsLayer::new()
        .allow_methods([Method::GET, Method::POST])
        .allow_headers([axum::http::header::CONTENT_TYPE])
        .allow_origin(allowed_origins);

    Router::new()
        .route(
            "/graphql",
            get(graphql_handler).post_service(GraphQL::new(schema)),
        )
        .layer(TraceLayer::new_for_http())
        .layer(cors)
}

async fn graphql_handler() -> impl IntoResponse {
    Html(
        async_graphql::http::GraphiQLSource::build()
            .endpoint("/graphql")
            .finish(),
    )
}
