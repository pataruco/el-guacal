# 6. Database Access and Migrations

## Status

Accepted

## Context

We need a way to interact with the PostgreSQL database from our Rust backend in a type-safe and efficient manner. We also need a reliable system for managing database schema changes (migrations).

## Decision

We have chosen **sqlx** for database access and migration management.

`sqlx` is a compile-time checked, asynchronous SQL library for Rust. It allows us to write raw SQL while ensuring that our queries are valid against the database schema at compile time. It also includes a built-in migration tool that we use to manage schema changes across different environments.

## Consequences

- **Positive**: Compile-time verification of SQL queries reduces the risk of runtime errors.
- **Positive**: Asynchronous by design, fitting well with the `tokio` and `axum` ecosystem.
- **Positive**: Built-in migration management simplifies the deployment process.
- **Negative**: Requires a live database connection (or a cached schema file) during compilation for query verification.
- **Negative**: Less abstraction than a full ORM, requiring more manual SQL writing.
