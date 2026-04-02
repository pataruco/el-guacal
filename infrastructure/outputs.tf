output "artifact_registry_url" {
  description = "The Artifact Registry path to push your Docker images to"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.api_repo.name}"
}

output "cloud_run_api_url" {
  description = "The public URL of the El Guacal GraphQL API"
  value       = google_cloud_run_v2_service.api.uri
}

output "firebase_hosting_url" {
  description = "The Firebase default URL of El Guacal Web App"
  value       = "https://${google_firebase_hosting_site.default.site_id}.web.app"
}

output "custom_domain_url" {
  description = "The custom domain URL of El Guacal Web App"
  value       = "https://${var.domain_name}"
}

output "api_custom_domain_url" {
  description = "The custom domain URL of El Guacal API"
  value       = "https://server.${var.domain_name}"
}

output "database_url" {
  description = "The PostgreSQL connection string for the Cloud Run service"
  value       = "postgresql://${google_sql_user.default.name}:${urlencode(var.db_password)}@localhost/productsdb?host=/cloudsql/${google_sql_database_instance.default.connection_name}"
  sensitive   = true
}

output "wif_provider_name" {
  description = "The Workload Identity Provider string for GitHub Actions"
  value       = google_iam_workload_identity_pool_provider.github_provider.name
}

output "wif_service_account_email" {
  description = "The Service Account email for GitHub Actions to impersonate"
  value       = google_service_account.github_deployer.email
}


output "firebase_web_config" {
  description = "Configuration settings for the React App (.env)"
  sensitive   = true
  value = {
    apiKey            = data.google_firebase_web_app_config.web.api_key
    authDomain        = data.google_firebase_web_app_config.web.auth_domain
    projectId         = var.project_id
    storageBucket     = data.google_firebase_web_app_config.web.storage_bucket
    messagingSenderId = data.google_firebase_web_app_config.web.messaging_sender_id
    appId             = google_firebase_web_app.web.app_id
  }
}
