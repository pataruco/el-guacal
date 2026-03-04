# 13. Continuous Integration and Deployment

## Status

Accepted

## Context

We need an automated way to build, test, and deploy our application whenever changes are pushed to our repository.

## Decision

We have chosen GitHub Actions for our CI/CD pipelines.

We use Workload Identity Federation to securely authenticate GitHub Actions with Google Cloud Platform without the need for long-lived service account keys. Our pipelines include tasks for:

- Linting and testing the backend (Rust) and frontend (React).
- Building and pushing the Docker image for the backend to Google Artifact Registry.
- Deploying the backend to Google Cloud Run.
- Building and deploying the static frontend to Firebase Hosting.

## Consequences

- Positive: Fully automated and reliable deployment process.
- Positive: Improved security through the use of Workload Identity Federation.
- Positive: Consistent and repeatable builds across different environments.
- Negative: Requires managing complex GitHub Actions workflows and GCP IAM roles.
- Negative: Dependence on GitHub's infrastructure for CI/CD.
