# 11. Observability and Structured Logging

## Status

Accepted

## Context

We need a way to monitor the health and performance of our backend and to debug issues effectively in production. This requires structured logging and the ability to correlate logs with individual requests and traces.

## Decision

We have implemented structured JSON logging on the backend, optimized for Google Cloud Logging.

We use the `tracing` and `tracing-subscriber` libraries in Rust to generate structured logs. Our configuration includes extracting the `X-Cloud-Trace-Context` header from incoming requests and mapping it to the `logging.googleapis.com/trace` field in our JSON logs. This allows for seamless correlation between logs and traces in the Google Cloud Console.

## Consequences

- Positive: Easy and efficient log searching and analysis in Google Cloud Logging.
- Positive: Improved debugging capabilities through log-trace correlation.
- Positive: Standardised log format across the entire backend application.
- Negative: Requires careful configuration of the logging subscriber and header extraction logic.
- Negative: Slightly increased log volume due to the JSON format and additional metadata.
