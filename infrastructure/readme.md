# Infrastructure

## Requirements

- Google Cloud CLI
- Terraform

We created a `Brewfile` to manage the installation of these tools.

```sh
brew bundle
```

## Usage

Create a `terraform.tfvars` file, copying from `terraform.tfvars.example`:

```sh
cp terraform.tfvars.example terraform.tfvars
```

Populate the variables in `terraform.tfvars`

Login to Google Cloud CLI:

```sh
gcloud auth application-default login
```

Then, initialise Terraform:

```sh
terraform init
```

Apply the infrastructure:

```sh
terraform apply
```

Verify the infrastructure:

```sh
terraform output
```
