use axum::{
    body::Body,
    http::{Request, StatusCode},
};
use serde_json::{Value, json};
use server::config::Config;
use server::{create_router, create_schema};
use sqlx::postgres::PgPoolOptions;
use tower::ServiceExt;

#[tokio::test]
// These "ignored" test are integration test and will run by cargo test -- --include-ignored
#[ignore = "integration tests"]
async fn test_graphql_stores_near() {
    let config = Config::new().expect("Failed to load config");
    let pool = PgPoolOptions::new()
        .max_connections(1)
        .connect(&config.database_url)
        .await
        .expect("Failed to create pool");

    let schema = create_schema(pool);
    let app = create_router(schema);

    let query = r"
        query {
            storesNear(location: {lat: 51.4622233, lng: -0.1140086}, radius: KM_1) {
                name
                address
                location {
                    lat
                    lng
                }
            }
        }
    ";

    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/graphql")
                .header("Content-Type", "application/json")
                .body(Body::from(json!({ "query": query }).to_string()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let body: Value = serde_json::from_slice(&body).unwrap();

    let stores = body["data"]["storesNear"]
        .as_array()
        .expect("storesNear should be an array");
    assert!(!stores.is_empty(), "Should return at least one store");

    let first_store = &stores[0];
    assert!(first_store["name"].is_string());
    assert!(first_store["address"].is_string());
}

#[tokio::test]
#[ignore = "integration tests"]
async fn test_graphql_store_products() {
    let config = Config::new().expect("Failed to load config");
    let pool = PgPoolOptions::new()
        .max_connections(1)
        .connect(&config.database_url)
        .await
        .expect("Failed to create pool");

    let schema = create_schema(pool);
    let app = create_router(schema);

    let query = r"
        query {
            storesNear(location: {lat: 51.4622233, lng: -0.1140086}, radius: KM_1) {
                name
                products {
                    name
                    brand
                }
            }
        }
    ";

    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/graphql")
                .header("Content-Type", "application/json")
                .body(Body::from(json!({ "query": query }).to_string()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let body: Value = serde_json::from_slice(&body).unwrap();

    if let Some(errors) = body["errors"].as_array() {
        panic!("GraphQL errors: {errors:?}");
    }

    let stores = body["data"]["storesNear"]
        .as_array()
        .expect("storesNear should be an array");
    assert!(!stores.is_empty(), "Should return at least one store");

    let products = stores[0]["products"]
        .as_array()
        .expect("products should be an array");
    assert!(
        !products.is_empty(),
        "Should return at least one product for the store"
    );
    assert_eq!(products[0]["name"], "Harina P.A.N.");
}
