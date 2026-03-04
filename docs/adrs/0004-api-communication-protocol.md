# 4. API Communication Protocol

## Status

Accepted

## Context

The frontend and backend need a structured and efficient way to communicate. We need a protocol that allows the frontend to request exactly the data it needs, reducing over-fetching and under-fetching.

## Decision

We have chosen GraphQL as the communication protocol between the frontend and backend. Specifically, we use the `async-graphql` library on the Rust backend and `graphql-codegen` on the React frontend to generate type-safe clients.

## Consequences

- Positive: Clients can fetch only the data they need, improving performance on mobile devices and slow connections.
- Positive: Strongly typed schema provides a clear contract between frontend and backend.
- Positive: Excellent developer experience with tools like GraphiQL and automatic code generation.
- Negative: Adds complexity to the backend implementation compared to a simple REST API.
- Negative: Requires additional tooling for code generation and schema management.
