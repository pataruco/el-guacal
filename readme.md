# El Guacal

El Guacal aims to be a complete, up-to-date, sustainable source of Venezuelan product locations around the world.

## 🇻🇪 About the Project / Sobre el Proyecto

Everyone, at some point, needs a taste of home. For the millions of Venezuelans living abroad, finding specific ingredients—like Harina P.A.N., queso de mano, or Pirulin—can be a challenge.

El Guacal aims to be a the largest open database of Venezuelan commercial footprints. It helps the diaspora locate the products that connect them to their culture.

The information comes from the public—anyone can go on the repository and add, edit, or remove locations.

### The context

The need for this project is driven by one of the largest displacement crises in the world. As of late 2024, there are over 7.9 million Venezuelan refugees and migrants worldwide [1](https://www.r4v.info/en/refugeeandmigrants). This represents approximately 20-30% of the country's total population [2](https://www.r4v.info/en/document/r4v-latin-america-and-caribbean-venezuelan-refugees-and-migrants-region-nov-2024).

This massive movement has created a global demand for Venezuelan goods, leading to a surge in entrepreneurship among migrants who open bodegas, restaurants, and import businesses to serve their communities [3](https://www.americasquarterly.org/article/the-future-of-venezuelas-diaspora/).

---

## 🚀 Getting Started

This repository is a monorepo managed with [moon](https://moonrepo.dev/).

### Prerequisites

We use Homebrew to manage dependencies. You can install all required tools by running:

```bash
brew bundle
```

Alternatively, ensure you have the following installed:
- [moon](https://moonrepo.dev/)
- [pnpm](https://pnpm.io/)
- [Rust](https://www.rust-lang.org/)
- [Node.js](https://nodejs.org/) (lts/krypton recommended)
- [Docker](https://www.docker.com/) (or any container runtime)
- [Google Cloud SDK](https://cloud.google.com/sdk)
- [Terraform](https://www.terraform.io/)

### Installation

Install all project dependencies:

```bash
pnpm install
```

---

## 🛠️ Development

We use `moon` as our task runner. You can run tasks for individual projects from the root.

### 🖥️ Server (Rust)

1. Start the database:
   ```bash
   docker compose up -d
   ```
2. Run migrations:
   ```bash
   moon run server:migrate-run
   ```
3. Start the development server:
   ```bash
   moon run server:dev
   ```

For more details, see [apps/server/README.md](apps/server/README.md).

### 🌐 Web (React)

1. Generate the GraphQL client:
   ```bash
   moon run web:graphql-codegen
   ```
2. Start the development server:
   ```bash
   moon run web:dev
   ```

For more details, see [apps/web/README.md](apps/web/README.md).

---

## 🏗️ Infrastructure

The infrastructure is managed with Terraform and located in the `infrastructure/` directory.

For more details, see [infrastructure/readme.md](infrastructure/readme.md).

---

## 🚢 Deployment

Deployments are handled automatically via GitHub Actions.

### 🧪 CI/CD

- **Pull Requests:** Every PR triggers linting and testing for both the server and the web application.
- **Manual Deploys:** We use `workflow_dispatch` for production deployments.

### 🚀 Production Deployment

1. **Server:** Go to the "Actions" tab, select "Deploy server to production", and provide the version tag.
2. **Web:** Go to the "Actions" tab, select "Deploy web to production", and provide the version tag.

The release process is managed via [Release Please](https://github.com/googleapis/release-please), which automatically creates tags and releases based on conventional commits.
