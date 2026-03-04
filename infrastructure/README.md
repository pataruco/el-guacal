# Infrastructure

The infrastructure for El Guacal is managed using Terraform and hosted on Google Cloud Platform. It provisions the necessary resources for the GraphQL API, the web application, and the CI/CD pipeline.

## 🚀 Getting Started

### Prerequisites

We recommend using the root `Brewfile` to install all necessary tools.

```bash
# From the root directory
brew bundle
```

Alternatively, ensure you have the following installed locally:
- [Google Cloud SDK](https://cloud.google.com/sdk)
- [Terraform](https://www.terraform.io/)

---

## 🛠️ Usage

### 1. Configuration

Create a `terraform.tfvars` file by copying the example:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Populate the variables in `terraform.tfvars`:
- `project_id`: Your Google Cloud Project ID.
- `db_password`: Password for the PostgreSQL database.
- `github_repo`: The GitHub repository in `org/repo` format (for OIDC).
- `google_oauth_client_id` / `google_oauth_client_secret`: For Firebase Auth.

### 2. Authentication

Login to Google Cloud CLI and set up application default credentials:

```bash
gcloud auth login
gcloud auth application-default login
```

### 3. Deployment

Initialise Terraform and apply the changes:

```bash
terraform init
terraform apply
```

This will provision:
- **Artifact Registry:** To store server Docker images.
- **Cloud SQL:** PostgreSQL instance with PostGIS.
- **Cloud Run:** For hosting the Rust GraphQL API.
- **Firebase Hosting:** For the React web application.
- **Firebase Auth:** Configured with Google Sign-In.
- **Workload Identity Federation:** To allow GitHub Actions to deploy securely.

### 4. Post-Deployment

After a successful apply, Terraform will output several important values:

```bash
terraform output
```

You will need the `firebase_web_config` values to populate the `.env` file in `apps/web`.

---

## 🚢 Deployment via CI/CD

Infrastructure changes are typically applied through GitHub Actions when merging into main branches. The `github-actions-deployer` service account is automatically created and granted the necessary permissions to:
- Push images to Artifact Registry.
- Deploy services to Cloud Run.
- Deploy site content to Firebase Hosting.

For more details on the overall deployment process, see the root [README.md](../README.md).
