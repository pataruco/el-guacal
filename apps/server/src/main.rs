use server::{auth::FirebaseVerifier, config::Config, create_router, create_schema, telemetry};
use sqlx::{ConnectOptions as _, postgres::PgPoolOptions};
use std::str::FromStr as _;
use std::time::Duration;

#[tokio::main]
async fn main() {
    telemetry::init_telemetry();

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
        .log_slow_statements(
            tracing::log::LevelFilter::Warn,
            std::time::Duration::from_secs(1),
        );

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .acquire_timeout(Duration::from_secs(10))
        .connect_with(connect_options)
        .await
        .expect("Failed to create pool — is DATABASE_URL reachable from this environment?");

    sqlx::migrate!()
        .run(&pool)
        .await
        .expect("Failed to run migrations");

    // Seed admin user
    if let Some(admin_uid) = &config.seed_admin_firebase_uid {
        sqlx::query(
            r"
            INSERT INTO users (firebase_uid, role)
            VALUES ($1, 'admin')
            ON CONFLICT (firebase_uid) DO UPDATE SET role = 'admin'
            ",
        )
        .bind(admin_uid)
        .execute(&pool)
        .await
        .expect("Failed to seed admin user");
        println!("Seeded admin user: {admin_uid}");
    }

    let allowed_origins: Vec<axum::http::HeaderValue> = config
        .cors_allowed_origins
        .iter()
        .map(|origin| origin.parse().expect("Invalid CORS origin"))
        .collect();

    let firebase_verifier = config.gcp_project_id.clone().map(FirebaseVerifier::new);
    let verifier_arc = firebase_verifier.as_ref().map(|_| {
        std::sync::Arc::new(FirebaseVerifier::new(
            config.gcp_project_id.clone().unwrap(),
        ))
    });

    let schema = create_schema(pool.clone(), firebase_verifier);
    let router = create_router(
        schema,
        allowed_origins,
        config.gcp_project_id,
        verifier_arc,
        pool,
    );

    println!("Server running on http://0.0.0.0:{}/graphql", config.port);

    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", config.port))
        .await
        .unwrap();
    axum::serve(listener, router)
        .with_graceful_shutdown(shutdown_signal())
        .await
        .unwrap();
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
