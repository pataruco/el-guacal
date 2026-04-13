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
    #[serde(with = "chrono::serde::ts_seconds")]
    pub created_at: DateTime<Utc>,
    #[serde(with = "chrono::serde::ts_seconds")]
    pub updated_at: DateTime<Utc>,
}
