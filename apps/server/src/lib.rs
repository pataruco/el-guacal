pub mod api;
pub mod config;
pub mod model;

use api::queries::Query;
use async_graphql::{EmptyMutation, EmptySubscription, Schema};
use async_graphql_axum::GraphQL;
use axum::{
    response::{Html, IntoResponse},
    routing::get,
    Router,
};
use sqlx::PgPool;

pub type AppSchema = Schema<Query, EmptyMutation, EmptySubscription>;

pub fn create_schema(pool: PgPool) -> AppSchema {
    Schema::build(Query, EmptyMutation, EmptySubscription)
        .data(pool)
        .finish()
}

pub fn create_router(schema: AppSchema) -> Router {
    Router::new().route(
        "/graphql",
        get(graphql_handler).post_service(GraphQL::new(schema)),
    )
}

async fn graphql_handler() -> impl IntoResponse {
    Html(
        async_graphql::http::GraphiQLSource::build()
            .endpoint("/graphql")
            .finish(),
    )
}
