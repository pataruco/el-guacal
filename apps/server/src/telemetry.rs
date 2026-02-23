use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;
use tracing_subscriber::{EnvFilter, Registry};

/// Initializes logging with JSON output to stdout.
pub fn init_telemetry() {
    let fmt_layer = tracing_subscriber::fmt::layer()
        .json()
        .with_writer(std::io::stdout);

    let env_filter =
        EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info,sqlx=info"));

    Registry::default()
        .with(env_filter)
        .with(fmt_layer)
        .init();
}
