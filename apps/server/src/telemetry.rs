use opentelemetry::{global, trace::TracerProvider as _, KeyValue};
use opentelemetry_sdk::logs::SdkLoggerProvider;
use opentelemetry_sdk::propagation::TraceContextPropagator;
use opentelemetry_sdk::trace::SdkTracerProvider;
use opentelemetry_sdk::Resource;
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;
use tracing_subscriber::{EnvFilter, Registry};

pub struct Telemetry {
    tracer_provider: SdkTracerProvider,
    logger_provider: SdkLoggerProvider,
}

impl Telemetry {
    pub fn shutdown(self) {
        let _ = self.tracer_provider.shutdown();
        let _ = self.logger_provider.shutdown();
    }
}

pub fn init_telemetry() -> Telemetry {
    global::set_text_map_propagator(TraceContextPropagator::new());

    let resource = Resource::builder()
        .with_attributes([KeyValue::new("service.name", "El guacal server")])
        .build();

    // Tracing
    let otlp_exporter = opentelemetry_otlp::SpanExporter::builder()
        .with_tonic()
        .build()
        .expect("Failed to create span exporter");

    let tracer_provider = SdkTracerProvider::builder()
        .with_batch_exporter(otlp_exporter)
        .with_resource(resource.clone())
        .build();

    global::set_tracer_provider(tracer_provider.clone());
    let tracer = tracer_provider.tracer("el-guacal-server");
    let telemetry_layer = tracing_opentelemetry::layer().with_tracer(tracer);

    // Logging
    let log_exporter = opentelemetry_otlp::LogExporter::builder()
        .with_tonic()
        .build()
        .expect("Failed to create log exporter");

    let logger_provider = SdkLoggerProvider::builder()
        .with_batch_exporter(log_exporter)
        .with_resource(resource)
        .build();

    // OpenTelemetryTracingBridge requires a 'static reference to the provider.
    // We leak the provider to satisfy this requirement.
    let leaked_logger_provider: &'static SdkLoggerProvider =
        Box::leak(Box::new(logger_provider.clone()));
    let otel_log_layer =
        opentelemetry_appender_tracing::layer::OpenTelemetryTracingBridge::new(
            leaked_logger_provider,
        );

    // Stdout JSON layer
    let fmt_layer = tracing_subscriber::fmt::layer()
        .json()
        .with_writer(std::io::stdout);

    let env_filter =
        EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info"));

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
