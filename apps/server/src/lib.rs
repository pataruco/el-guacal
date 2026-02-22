pub mod api;
pub mod config;
pub mod model;
pub mod telemetry;

use api::queries::Query;
use async_graphql::{EmptyMutation, EmptySubscription, Schema};
use async_graphql_axum::GraphQL;
use axum::{
    Router,
    http::StatusCode,
    response::{Html, IntoResponse},
    routing::get,
};
use sqlx::PgPool;
use tower_http::trace::TraceLayer;

pub type AppSchema = Schema<Query, EmptyMutation, EmptySubscription>;

#[must_use]
pub fn create_schema(pool: PgPool) -> AppSchema {
    Schema::build(Query, EmptyMutation, EmptySubscription)
        .data(pool)
        .extension(async_graphql::extensions::Tracing)
        .extension(async_graphql::extensions::Logger)
        .finish()
}

pub fn create_router(schema: AppSchema) -> Router {
    let api_routes = Router::new()
        .route(
            "/graphql",
            get(graphql_handler).post_service(GraphQL::new(schema)),
        )
        .layer(TraceLayer::new_for_http());

    Router::new()
        .merge(api_routes)
        .route("/health", get(health_handler))
}

async fn health_handler() -> impl IntoResponse {
    (StatusCode::OK, "OK")
}

async fn graphql_handler() -> impl IntoResponse {
    Html(
        async_graphql::http::GraphiQLSource::build()
            .endpoint("/graphql")
            .finish(),
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::http::StatusCode;

    #[tokio::test]
    async fn test_health_handler() {
        let response = health_handler().await.into_response();
        assert_eq!(response.status(), StatusCode::OK);
        let body = axum::body::to_bytes(response.into_body(), 100).await.unwrap();
        assert_eq!(body, "OK");
    }
}
