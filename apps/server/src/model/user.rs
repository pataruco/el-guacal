use async_graphql::Object;
use chrono::{DateTime, Utc};
use uuid::Uuid;

#[derive(Clone, Debug)]
pub struct User {
    pub user_id: Uuid,
    pub firebase_uid: String,
    pub email: Option<String>,
    pub display_name: Option<String>,
    pub role: String,
    pub region: Option<String>,
    pub trust_score: i32,
    pub email_verified: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[Object]
impl User {
    async fn user_id(&self) -> Uuid {
        self.user_id
    }
    async fn display_name(&self) -> Option<&str> {
        self.display_name.as_deref()
    }
    async fn role(&self) -> &str {
        &self.role
    }
    async fn trust_score(&self) -> i32 {
        self.trust_score
    }
    async fn region(&self) -> Option<&str> {
        self.region.as_deref()
    }
}
