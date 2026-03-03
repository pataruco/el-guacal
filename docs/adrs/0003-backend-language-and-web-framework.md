# 3. Backend Language and Web Framework

## Status

Accepted

## Context

The backend needs to be performant, reliable, and capable of handling concurrent requests efficiently. It also needs to integrate well with a GraphQL API and a PostgreSQL database.

## Decision

We have chosen **Rust** as the primary programming language for the backend, using the **Axum** web framework.

Rust provides memory safety without a garbage collector, high performance, and excellent support for asynchronous programming. Axum, built on top of the `tokio` runtime and `tower` ecosystem, offers a modular and type-safe approach to building web applications.

## Consequences

- **Positive**: High performance and low resource consumption, making it ideal for deployment on Google Cloud Run.
- **Positive**: Strong type system and memory safety guarantees reduce the likelihood of runtime errors.
- **Positive**: Excellent ecosystem for building asynchronous web services and GraphQL APIs.
- **Negative**: Steeper learning curve compared to languages like Python or Node.js.
- **Negative**: Longer compilation times compared to interpreted languages.
