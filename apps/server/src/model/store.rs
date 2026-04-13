use crate::model::location::Location;
use async_graphql::SimpleObject;
use serde::Serialize;
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, FromRow, SimpleObject, Serialize)]
pub struct Store {
    pub store_id: Uuid,
    pub name: String,
    pub address: String,
    pub location: Location,
    pub version: i64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
