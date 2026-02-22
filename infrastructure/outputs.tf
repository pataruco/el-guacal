output "artifact_registry_url" {
  description = "The Artifact Registry path to push your Docker images to"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.api_repo.name}"
}

output "cloud_run_api_url" {
  description = "The public URL of the El Guacal GraphQL API"
  value       = google_cloud_run_v2_service.api.uri
}

output "firebase_hosting_url" {
  description = "The public URL of El Guacal Web App"
  value       = "https://${google_firebase_hosting_site.default.site_id}.web.app"
}
