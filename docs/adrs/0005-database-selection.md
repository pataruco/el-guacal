# 5. Database Selection

## Status

Accepted

## Context

The application needs to store and query store locations, which involves spatial data (coordinates). We need a robust, reliable, and scalable database that supports complex spatial queries.

## Decision

We have chosen **PostgreSQL** with the **PostGIS** extension as our primary database.

PostgreSQL is a mature and highly reliable relational database. PostGIS is the industry-standard extension for handling geographic and spatial data in PostgreSQL, providing powerful functions for proximity searches and spatial indexing.

## Consequences

- **Positive**: Industry-standard support for spatial data and queries.
- **Positive**: High reliability, data integrity, and support for complex transactions.
- **Positive**: Wide range of tools and managed service options (e.g., Google Cloud SQL).
- **Negative**: Requires managing a database server (or using a managed service) and handling migrations.
