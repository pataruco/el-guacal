# 8. Frontend State Management and Data Fetching

## Status

Accepted

## Context

The frontend needs to manage global state (like user authentication and application settings) and handle data fetching from the GraphQL API. We need a solution that is efficient, scalable, and provides a good developer experience.

## Decision

We have chosen **Redux Toolkit (RTK)** for global state management and **RTK Query** for data fetching and caching.

Redux Toolkit simplifies the process of writing Redux logic, while RTK Query provides a powerful and declarative way to fetch, cache, and synchronize data from our GraphQL API. We use `graphql-codegen` to generate RTK Query hooks directly from our GraphQL schema and operations.

## Consequences

- **Positive**: Centralised and predictable state management.
- **Positive**: Automatic caching and data synchronization with the backend.
- **Positive**: Type-safe data fetching with automatically generated hooks.
- **Negative**: Adds some boilerplate and complexity to the frontend application.
- **Negative**: Requires learning and following Redux best practices.
