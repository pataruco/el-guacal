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
