use api::queries::Query;
use async_graphql::{http::GraphiQLSource, *};
use async_graphql_axum::GraphQL;
use axum::{
    Router,
    response::{Html, IntoResponse},
    routing::get,
};
mod api;

use el_guacal_server::config::Config;

#[tokio::main]
async fn main() {
    let config = match Config::new() {
        Ok(config) => config,
        Err(err) => {
            eprintln!("Failed to load configuration: {}", err);
            std::process::exit(1);
        }
    };

    let schema = Schema::build(Query, EmptyMutation, EmptySubscription).finish();
    let router = Router::new().route("/graphql", get(graphql).post_service(GraphQL::new(schema)));
    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", config.port))
        .await
        .unwrap();
    axum::serve(listener, router).await.unwrap();
}

async fn graphql() -> impl IntoResponse {
    Html(GraphiQLSource::build().endpoint("/graphql").finish())
}
