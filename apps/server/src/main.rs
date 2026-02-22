use server::{config::Config, create_router, create_schema, telemetry};
use sqlx::{ConnectOptions as _, postgres::PgPoolOptions};
use std::str::FromStr as _;

#[tokio::main]
async fn main() {
    let telemetry = telemetry::init_telemetry();

    let config = match Config::new() {
        Ok(config) => config,
        Err(err) => {
            eprintln!("Failed to load configuration: {err}");
            std::process::exit(1);
        }
    };

    let mut connect_options = sqlx::postgres::PgConnectOptions::from_str(&config.database_url)
        .expect("Failed to parse database URL");

    connect_options = connect_options
        .log_statements(tracing::log::LevelFilter::Info)
        .log_slow_statements(tracing::log::LevelFilter::Warn, std::time::Duration::from_secs(1));

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect_with(connect_options)
        .await
        .expect("Failed to create pool");

    sqlx::migrate!()
        .run(&pool)
        .await
        .expect("Failed to run migrations");

    let schema = create_schema(pool);
    let router = create_router(schema);

    println!("Server running on http://0.0.0.0:{}/graphql", config.port);

    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", config.port))
        .await
        .unwrap();
    axum::serve(listener, router)
        .with_graceful_shutdown(shutdown_signal())
        .await
        .unwrap();

    telemetry.shutdown();
}

async fn shutdown_signal() {
    let ctrl_c = async {
        tokio::signal::ctrl_c()
            .await
            .expect("failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
            .expect("failed to install signal handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        () = ctrl_c => {},
        () = terminate => {},
    }
}
