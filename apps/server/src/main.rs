use el_guacal_server::config::Config;
use el_guacal_server::{create_router, create_schema};
use sqlx::postgres::PgPoolOptions;

#[tokio::main]
async fn main() {
    let config = match Config::new() {
        Ok(config) => config,
        Err(err) => {
            eprintln!("Failed to load configuration: {}", err);
            std::process::exit(1);
        }
    };

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&config.database_url)
        .await
        .expect("Failed to create pool");

    sqlx::migrate!()
        .run(&pool)
        .await
        .expect("Failed to run migrations");

    let schema = create_schema(pool);
    let router = create_router(schema);

    println!("Server running on http://0.0.0.0:{}", config.port);

    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", config.port))
        .await
        .unwrap();
    axum::serve(listener, router).await.unwrap();
}
