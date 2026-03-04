# Infrastructure

The infrastructure for El Guacal is managed using Terraform and hosted on Google Cloud Platform.

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

### Configuration

1. Create a `terraform.tfvars` file by copying the example:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

2. Populate the variables in `terraform.tfvars` with the correct values for your environment.

### Deployment

1. Login to Google Cloud CLI:
   ```bash
   gcloud auth application-default login
   ```

2. Initialise Terraform:
   ```bash
   terraform init
   ```

3. Apply the infrastructure changes:
   ```bash
   terraform apply
   ```

### Verification

To see the outputs of your infrastructure (e.g., service URLs):
```bash
terraform output
```

---

## 🚢 Deployment via CI/CD

While manual deployment is possible, infrastructure changes are typically applied through GitHub Actions when merging into main branches.

For more details on the deployment process, see the root [README.md](../readme.md).
