# El Guacal Server

This is the GraphQL server for El Guacal, built with Rust using Axum and async-graphql.

## 🚀 Getting Started

### Prerequisites

We recommend using the root `Brewfile` to install all necessary tools.

```bash
# From the root directory
brew bundle
```

Alternatively, ensure you have the following installed locally:
- [Rust](https://www.rust-lang.org/)
- [Docker](https://www.docker.com/) (or any container runtime)
- [moon](https://moonrepo.dev/)

### Environment Variables

Before running the server, create a `.env` file from the example:

```bash
cp .env.example .env
```

Populate the variables according to your local setup.

---

## 🛠️ Development

We use `moon` as our task runner. Commands should be run from the root directory.

### Database Setup

1. Start the PostgreSQL database with PostGIS:
   ```bash
   docker compose up -d
   ```

2. Install `sqlx-cli`:
   ```bash
   moon run server:install-sqlx
   ```

3. Run migrations:
   ```bash
   moon run server:migrate-run
   ```

### Running the Server

Start the development server:
```bash
moon run server:dev
```

The server will be available at `http://localhost:3000/graphql` by default.

### Database Migrations

Use these `moon` tasks for migration management:

- **Create a new migration:**
  ```bash
  moon run server:migrate-create -- <migration_name>
  ```
- **Run pending migrations:**
  ```bash
  moon run server:migrate-run
  ```
- **Revert the last migration:**
  ```bash
  moon run server:migrate-revert
  ```
- **Check migration status:**
  ```bash
  moon run server:migrate-status
  ```

Migrations are stored in the `apps/server/migrations/` directory.

### Linting and Formatting

Run the linter:
```bash
moon run server:lint
```

---

## 🧪 Testing

### Running All Tests

You can run both unit and integration tests using:
```bash
moon run server:test
```

### Unit Tests

Unit tests are located within the source files (e.g., `src/model/`). They test individual components like models and utility functions in isolation.

### Integration Tests

Integration tests are located in `apps/server/tests/`. They test the application by sending GraphQL requests to the router and verifying responses against a real database.

```bash
moon run server:integration-test
```

Ensure the database is running and migrations are applied before running integration tests.

---

## 🚢 Deployment

The server is deployed as a Docker container to Google Cloud Run. Deployment is managed via GitHub Actions.

For more details on the deployment process, see the root [README.md](../../readme.md).
