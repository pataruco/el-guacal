# El Guacal Server

This is the GraphQL server for El Guacal, built with Rust using Axum and async-graphql.

## Development

### Prerequisites

- [Moon](https://moonrepo.dev/) task runner.
- [Colima](https://github.com/abiosoft/colima) for running the database.

### Database Setup

1. Start the PostgreSQL database with PostGIS:
   ```bash
   colima start
   docker compose up -d
   ```

2. Install `sqlx-cli` (if not already installed):
   ```bash
   moon run server:install-sqlx
   ```

3. Run migrations:
   ```bash
   moon run server:migrate-run
   ```

### Database Migrations

The following `moon` tasks are available for migration management:

- Create a new migration:
  ```bash
  moon run server:migrate-create -- <migration_name>
  ```
- Run pending migrations:
  ```bash
  moon run server:migrate-run
  ```
- Revert the last migration:
  ```bash
  moon run server:migrate-revert
  ```
- Check migration status:
  ```bash
  moon run server:migrate-status
  ```

Migrations are stored in the `apps/server/migrations/` directory.

### Testing

#### Running All Tests

You can run both unit and integration tests using:

```bash
moon run server:test
```

#### Unit Tests

Unit tests are located within the source files (e.g., `src/model/`). They test individual components like models and utility functions in isolation.

#### Integration Tests

Integration tests are located in `apps/server/tests/`. They test the "edges" of the application by sending actual GraphQL requests to the Axum router and verifying the responses against a real database.

Ensure the database is running and migrations are applied before running integration tests.
