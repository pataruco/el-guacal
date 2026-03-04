# 10. Infrastructure as Code

## Status

Accepted

## Context

We need a way to manage our cloud infrastructure (Google Cloud Platform, Firebase) in a repeatable, version-controlled, and automated manner.

## Decision

We have chosen Terraform as our Infrastructure as Code (IaC) tool.

We use Terraform to define and manage all our GCP resources, including Cloud Run services, Cloud SQL instances, Artifact Registry, and Firebase projects. This allows us to track infrastructure changes in our git repository and ensure that our environments are consistent.

## Consequences

- Positive: Infrastructure is documented, version-controlled, and easy to replicate.
- Positive: Automated provisioning and updates reduce the risk of manual configuration errors.
- Positive: Clear overview of all cloud resources and their configurations.
- Negative: Requires learning Terraform syntax and managing state files securely.
- Negative: Adds complexity to the initial setup and maintenance of the project.
