# El Guacal Web

This is the web application for El Guacal, built with React, Vite, and React Router v7.

## 🚀 Getting Started

### Prerequisites

We recommend using the root `Brewfile` to install all necessary tools.

```bash
# From the root directory
brew bundle
```

Alternatively, ensure you have the following installed locally:
- [Node.js](https://nodejs.org/) (lts/krypton recommended)
- [pnpm](https://pnpm.io/)
- [moon](https://moonrepo.dev/)

### Environment Variables

Before running the web app, create a `.env` file from the example:

```bash
cp .env.example .env
```

Populate the variables with your Firebase and Google Maps API credentials.

---

## 🛠️ Development

We use `moon` as our task runner. Commands should be run from the root directory.

### Running the Web App

1. Generate the GraphQL client:
   ```bash
   moon run web:graphql-codegen
   ```
2. Start the development server:
   ```bash
   moon run web:dev
   ```

The web app will be available at `http://localhost:5173` by default.

### Linting and Formatting

Run the linter and formatter:
```bash
moon run web:lint
moon run web:format
```

---

## 🧪 Testing

Run the unit tests:
```bash
moon run web:test
```

---

## 🏗️ Build

To create a production build (SSG):
```bash
moon run web:build
```

The output will be in the `dist/` directory.

---

## 🚢 Deployment

The web app is deployed to Firebase Hosting. Deployment is managed via GitHub Actions.

For more details on the deployment process, see the root [README.md](../../readme.md).
