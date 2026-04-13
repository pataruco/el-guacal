variable "project_id" {
  type        = string
  description = "Your Google Cloud Project ID"
}

variable "region" {
  type        = string
  default     = "europe-west2"
  description = "The GCP region to deploy resources in"
}

variable "db_password" {
  type        = string
  description = "The database password for the 'pataruco' user"
  sensitive   = true
}

variable "github_repo" {
  type        = string
  description = "The GitHub repository in org/repo format (e.g., pataruco/el-guacal)"
  default     = "pataruco/el-guacal"
}

variable "google_oauth_client_id" {
  type        = string
  description = "Google OAuth 2.0 Client ID for Google Sign-In"
  sensitive   = true
}

variable "google_oauth_client_secret" {
  type        = string
  description = "Google OAuth 2.0 Client Secret for Google Sign-In"
  sensitive   = true
}

variable "domain_name" {
  type        = string
  description = "The custom domain name for the application (e.g., elguacal.com)"
  default     = "elguacal.com"
}
