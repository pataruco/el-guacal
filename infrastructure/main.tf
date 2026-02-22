# ---------------------------------------------------------
# 1. Enable Required GCP APIs
# ---------------------------------------------------------
resource "google_project_service" "apis" {
  for_each = toset([
    "run.googleapis.com",
    "sqladmin.googleapis.com",
    "firebase.googleapis.com",
    "firebasehosting.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "artifactregistry.googleapis.com"
  ])
  project            = var.project_id
  service            = each.key
  disable_on_destroy = false
}

# ---------------------------------------------------------
# 2. Artifact Registry
# ---------------------------------------------------------
resource "google_artifact_registry_repository" "api_repo" {
  location      = var.region
  repository_id = "el-guacal-repo"
  description   = "Docker repository for the Rust GraphQL API"
  format        = "DOCKER"
  depends_on    = [google_project_service.apis]
}

# ---------------------------------------------------------
# 3. Cloud SQL (PostgreSQL)
# ---------------------------------------------------------
resource "google_sql_database_instance" "default" {
  name             = "el-guacal-postgres"
  database_version = "POSTGRES_17"
  region           = var.region
  depends_on       = [google_project_service.apis]

  settings {
    tier      = "db-f1-micro"
    disk_size = 10
    disk_type = "PD_SSD"
  }

  deletion_protection = false
}

resource "google_sql_database" "default" {
  name     = "productsdb"
  instance = google_sql_database_instance.default.name
}

resource "google_sql_user" "default" {
  name     = "el-guacal"
  instance = google_sql_database_instance.default.name
  password = var.db_password
}

# ---------------------------------------------------------
# 4. Cloud Run (Rust GraphQL API)
# ---------------------------------------------------------
resource "google_cloud_run_v2_service" "api" {
  name       = "el-guacal-api"
  location   = var.region
  ingress    = "INGRESS_TRAFFIC_ALL"
  depends_on = [google_project_service.apis]

  template {
    containers {
      # Placeholder image so Terraform can provision the initial infrastructure
      image = "us-docker.pkg.dev/cloudrun/container/hello"

      env {
        name  = "DATABASE_URL"
        value = "postgresql://${google_sql_user.default.name}:${var.db_password}@/productsdb?host=/cloudsql/${google_sql_database_instance.default.connection_name}"
      }

      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }
    }

    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [google_sql_database_instance.default.connection_name]
      }
    }
  }

  # This prevents Terraform from overwriting the real Rust image
  # once your CI/CD pipeline starts pushing to Cloud Run.
  lifecycle {
    ignore_changes = [
      template[0].containers[0].image
    ]
  }
}

resource "google_cloud_run_service_iam_member" "public" {
  location = google_cloud_run_v2_service.api.location
  service  = google_cloud_run_v2_service.api.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# ---------------------------------------------------------
# 5. Firebase Hosting (Client-Side React App)
# ---------------------------------------------------------
resource "google_firebase_project" "default" {
  provider   = google-beta
  project    = var.project_id
  depends_on = [google_project_service.apis]
}

resource "google_firebase_hosting_site" "default" {
  provider = google-beta
  project  = google_firebase_project.default.project
  site_id  = var.project_id
}
