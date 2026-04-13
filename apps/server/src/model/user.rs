use async_graphql::{Enum, SimpleObject};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Copy, Clone, Eq, PartialEq, Enum, Serialize, Deserialize, sqlx::Type)]
#[sqlx(rename_all = "lowercase")]
pub enum UserRole {
    Contributor,
    Moderator,
    Admin,
}

#[derive(Debug, Clone, FromRow, SimpleObject)]
pub struct User {
    pub user_id: Uuid,
    pub firebase_uid: String,
    pub role: UserRole,
    pub trust_score: i32,
    pub region: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}
