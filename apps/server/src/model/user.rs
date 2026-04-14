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

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use uuid::Uuid;

    #[test]
    fn test_user_creation() {
        let id = Uuid::new_v4();
        let now = Utc::now();
        let user = User {
            user_id: id,
            firebase_uid: "abc123".to_string(),
            email: Some("test@example.com".to_string()),
            display_name: Some("Test User".to_string()),
            role: "contributor".to_string(),
            region: None,
            trust_score: 0,
            email_verified: true,
            created_at: now,
            updated_at: now,
        };
        assert_eq!(user.user_id, id);
        assert_eq!(user.firebase_uid, "abc123");
        assert_eq!(user.role, "contributor");
        assert_eq!(user.trust_score, 0);
        assert!(user.email_verified);
    }

    #[test]
    fn test_user_optional_fields() {
        let now = Utc::now();
        let user = User {
            user_id: Uuid::new_v4(),
            firebase_uid: "xyz".to_string(),
            email: None,
            display_name: None,
            role: "admin".to_string(),
            region: Some("caracas".to_string()),
            trust_score: 50,
            email_verified: false,
            created_at: now,
            updated_at: now,
        };
        assert!(user.email.is_none());
        assert!(user.display_name.is_none());
        assert_eq!(user.region.as_deref(), Some("caracas"));
    }
}
