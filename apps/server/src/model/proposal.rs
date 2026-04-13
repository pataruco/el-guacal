use async_graphql::{Enum, SimpleObject};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use crate::model::location::Location;

#[derive(Debug, Copy, Clone, Eq, PartialEq, Enum, Serialize, Deserialize, sqlx::Type)]
#[sqlx(rename_all = "lowercase")]
pub enum ProposalKind {
    Create,
    Update,
    Delete,
}

#[derive(Debug, Copy, Clone, Eq, PartialEq, Enum, Serialize, Deserialize, sqlx::Type)]
#[sqlx(rename_all = "lowercase")]
pub enum ProposalStatus {
    Pending,
    Approved,
    Rejected,
    Withdrawn,
    Superseded,
}

#[derive(Debug, Clone, SimpleObject)]
pub struct StoreProposal {
    pub proposal_id: Uuid,
    pub proposer_user_id: Uuid,
    pub kind: ProposalKind,
    pub status: ProposalStatus,
    pub target_store_id: Option<Uuid>,
    pub target_version: Option<i64>,
    pub payload: serde_json::Value,
    pub proposed_location: Option<Location>,
    pub possible_duplicates: serde_json::Value,
    pub reviewed_by: Option<Uuid>,
    pub reviewed_at: Option<chrono::DateTime<chrono::Utc>>,
    pub review_note: Option<String>,
    pub client_nonce: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, FromRow, SimpleObject)]
pub struct ProposalAuditLog {
    pub audit_id: Uuid,
    pub proposal_id: Uuid,
    pub action: String,
    pub actor_user_id: Uuid,
    pub created_at: chrono::DateTime<chrono::Utc>,
}
