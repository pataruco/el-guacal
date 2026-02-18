use async_graphql::SimpleObject;
use chrono::{DateTime, Utc};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(SimpleObject, FromRow, Clone, Debug)]
pub struct Product {
    pub product_id: Uuid,
    pub name: String,
    pub brand: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
