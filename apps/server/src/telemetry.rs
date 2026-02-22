use opentelemetry::{KeyValue, global, trace::TracerProvider as _};
use opentelemetry_sdk::Resource;
use opentelemetry_sdk::logs::SdkLoggerProvider;
use opentelemetry_sdk::propagation::TraceContextPropagator;
use opentelemetry_sdk::trace::SdkTracerProvider;
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;
use tracing_subscriber::{EnvFilter, Registry};

pub struct Telemetry {
    tracer_provider: Option<SdkTracerProvider>,
    logger_provider: Option<SdkLoggerProvider>,
}

impl Telemetry {
    pub fn shutdown(self) {
        if let Some(tp) = self.tracer_provider {
            let _ = tp.shutdown();
        }
        if let Some(lp) = self.logger_provider {
            let _ = lp.shutdown();
        }
    }
}

/// Initializes OpenTelemetry for tracing and logging.
///
/// If an OTLP collector endpoint is not available, falls back to stdout-only
/// logging so the server can still start in environments like Cloud Run where
/// no collector is configured.
pub fn init_telemetry() -> Telemetry {
    global::set_text_map_propagator(TraceContextPropagator::new());

    let resource = Resource::builder()
        .with_attributes([KeyValue::new("service.name", "El guacal server")])
        .build();

    // Attempt to set up OTLP tracing
    let (tracer_provider, telemetry_layer) = match opentelemetry_otlp::SpanExporter::builder()
        .with_tonic()
        .build()
    {
        Ok(otlp_exporter) => {
            let tp = SdkTracerProvider::builder()
                .with_batch_exporter(otlp_exporter)
                .with_resource(resource.clone())
                .build();

            global::set_tracer_provider(tp.clone());
            let tracer = tp.tracer("el-guacal-server");
            let layer = tracing_opentelemetry::layer().with_tracer(tracer);
            (Some(tp), Some(layer))
        }
        Err(err) => {
            eprintln!("OTLP span exporter unavailable, skipping: {err}");
            (None, None)
        }
    };

    // Attempt to set up OTLP logging
    let (logger_provider, otel_log_layer) = match opentelemetry_otlp::LogExporter::builder()
        .with_tonic()
        .build()
    {
        Ok(log_exporter) => {
            let lp = SdkLoggerProvider::builder()
                .with_batch_exporter(log_exporter)
                .with_resource(resource)
                .build();

            // OpenTelemetryTracingBridge requires a 'static reference to the provider.
            // We leak the provider to satisfy this requirement.
            let leaked_logger_provider: &'static SdkLoggerProvider =
                Box::leak(Box::new(lp.clone()));
            let layer = opentelemetry_appender_tracing::layer::OpenTelemetryTracingBridge::new(
                leaked_logger_provider,
            );
            (Some(lp), Some(layer))
        }
        Err(err) => {
            eprintln!("OTLP log exporter unavailable, skipping: {err}");
            (None, None)
        }
    };

    // Stdout JSON layer (always active)
    let fmt_layer = tracing_subscriber::fmt::layer()
        .json()
        .with_writer(std::io::stdout);

    let env_filter =
        EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info,sqlx=info"));

    Registry::default()
        .with(env_filter)
        .with(fmt_layer)
        .with(telemetry_layer)
        .with(otel_log_layer)
        .init();

    Telemetry {
        tracer_provider,
        logger_provider,
    }
}
