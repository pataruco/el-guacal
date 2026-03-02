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

    let allowed_origins = config
        .cors_allowed_origins
        .iter()
        .map(|origin| origin.parse().expect("Invalid CORS origin"))
        .collect();

    let schema = create_schema(pool, None);
    let app = create_router(schema, allowed_origins, config.gcp_project_id, None);

    let query = r"
        query {
            storesNear(location: {lat: 51.4622233, lng: -0.1140086}, radius: ZOOM_11) {
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

    let allowed_origins = config
        .cors_allowed_origins
        .iter()
        .map(|origin| origin.parse().expect("Invalid CORS origin"))
        .collect();

    let schema = create_schema(pool, None);
    let app = create_router(schema, allowed_origins, config.gcp_project_id, None);

    let query = r"
        query {
            storesNear(location: {lat: 51.4622233, lng: -0.1140086}, radius: ZOOM_11) {
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

#[tokio::test]
#[ignore = "integration tests"]
async fn test_graphql_store_mutations() {
    let config = Config::new().expect("Failed to load config");
    let pool = PgPoolOptions::new()
        .max_connections(1)
        .connect(&config.database_url)
        .await
        .expect("Failed to create pool");

    let schema = create_schema(pool.clone(), None);

    // Mock user
    let user = server::auth::FirebaseUser {
        uid: "test-user".to_string(),
        email: Some("test@example.com".to_string()),
    };

    // 1. Create Store
    // Get a product id first
    let product_id: uuid::Uuid = sqlx::query_scalar("SELECT product_id FROM products LIMIT 1")
        .fetch_one(&pool)
        .await
        .expect("Failed to fetch product_id");

    let create_mutation = format!(
        r#"
        mutation {{
            createStore(input: {{
                name: "New Store",
                address: "New Address",
                lat: 1.23,
                lng: 4.56,
                productIds: ["{}"]
            }}) {{
                storeId
                name
                address
            }}
        }}
    "#,
        product_id
    );

    let request = async_graphql::Request::new(create_mutation).data(user.clone());
    let response = schema.execute(request).await;

    assert!(response.errors.is_empty(), "Errors: {:?}", response.errors);
    let data = response.data.into_json().unwrap();
    let store_id = data["createStore"]["storeId"]
        .as_str()
        .expect("storeId should be a string")
        .to_string();
    assert_eq!(data["createStore"]["name"], "New Store");

    // 2. Update Store
    let update_mutation = format!(
        r#"
        mutation {{
            updateStore(input: {{
                storeId: "{}",
                name: "Updated Store"
            }}) {{
                name
            }}
        }}
    "#,
        store_id
    );

    let request = async_graphql::Request::new(update_mutation).data(user.clone());
    let response = schema.execute(request).await;
    assert!(response.errors.is_empty(), "Errors: {:?}", response.errors);
    let data = response.data.into_json().unwrap();
    assert_eq!(data["updateStore"]["name"], "Updated Store");

    // 3. Delete Store
    let delete_mutation = format!(
        r#"
        mutation {{
            deleteStore(id: "{}")
        }}
    "#,
        store_id
    );

    let request = async_graphql::Request::new(delete_mutation).data(user);
    let response = schema.execute(request).await;
    assert!(response.errors.is_empty(), "Errors: {:?}", response.errors);
    let data = response.data.into_json().unwrap();
    assert!(data["deleteStore"].as_bool().unwrap());
}
