use crate::model::location::Location;
use crate::model::store::Store;
use crate::model::user::User;
use async_graphql::{Context, Enum, Object, SimpleObject};
use chrono::{DateTime, Utc};
use sqlx::{PgPool, Row};
use uuid::Uuid;

#[derive(Enum, Copy, Clone, Eq, PartialEq, Debug)]
pub enum ProposalKind {
    Create,
    Update,
    Delete,
}

impl ProposalKind {
    #[must_use]
    pub const fn as_db_str(self) -> &'static str {
        match self {
            Self::Create => "create",
            Self::Update => "update",
            Self::Delete => "delete",
        }
    }

    #[must_use]
    pub fn from_db_str(s: &str) -> Option<Self> {
        match s {
            "create" => Some(Self::Create),
            "update" => Some(Self::Update),
            "delete" => Some(Self::Delete),
            _ => None,
        }
    }
}

#[derive(Enum, Copy, Clone, Eq, PartialEq, Debug)]
pub enum ProposalStatus {
    Pending,
    Approved,
    Rejected,
    Withdrawn,
    Superseded,
}

impl ProposalStatus {
    #[must_use]
    pub const fn as_db_str(self) -> &'static str {
        match self {
            Self::Pending => "pending",
            Self::Approved => "approved",
            Self::Rejected => "rejected",
            Self::Withdrawn => "withdrawn",
            Self::Superseded => "superseded",
        }
    }

    #[must_use]
    pub fn from_db_str(s: &str) -> Option<Self> {
        match s {
            "pending" => Some(Self::Pending),
            "approved" => Some(Self::Approved),
            "rejected" => Some(Self::Rejected),
            "withdrawn" => Some(Self::Withdrawn),
            "superseded" => Some(Self::Superseded),
            _ => None,
        }
    }
}

#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum ReviewDecision {
    Approve,
    Reject,
}

#[derive(SimpleObject, Clone, Debug)]
pub struct StoreDiff {
    pub field: String,
    pub before: Option<String>,
    pub after: Option<String>,
}

#[derive(Clone, Debug)]
pub struct StoreProposal {
    pub proposal_id: Uuid,
    pub kind: ProposalKind,
    pub status: ProposalStatus,
    pub target_store_id: Option<Uuid>,
    pub target_version: Option<i64>,
    pub payload: serde_json::Value,
    pub proposed_location: Option<Location>,
    pub proposer_user_id: Uuid,
    pub client_nonce: String,
    pub created_at: DateTime<Utc>,
    pub reviewed_by: Option<Uuid>,
    pub reviewed_at: Option<DateTime<Utc>>,
    pub review_note: Option<String>,
}

#[Object]
impl StoreProposal {
    async fn proposal_id(&self) -> Uuid {
        self.proposal_id
    }
    async fn kind(&self) -> ProposalKind {
        self.kind
    }
    async fn status(&self) -> ProposalStatus {
        self.status
    }
    async fn target_store_id(&self) -> Option<Uuid> {
        self.target_store_id
    }
    async fn target_version(&self) -> Option<i64> {
        self.target_version
    }
    async fn proposed_name(&self) -> Option<&str> {
        self.payload.get("name").and_then(serde_json::Value::as_str)
    }
    async fn proposed_address(&self) -> Option<&str> {
        self.payload.get("address").and_then(serde_json::Value::as_str)
    }
    async fn proposed_location(&self) -> Option<&Location> {
        self.proposed_location.as_ref()
    }
    async fn reason(&self) -> Option<&str> {
        self.payload.get("reason").and_then(serde_json::Value::as_str)
    }
    async fn client_nonce(&self) -> &str {
        &self.client_nonce
    }
    async fn created_at(&self) -> DateTime<Utc> {
        self.created_at
    }
    async fn reviewed_at(&self) -> Option<DateTime<Utc>> {
        self.reviewed_at
    }
    async fn review_note(&self) -> Option<&str> {
        self.review_note.as_deref()
    }

    async fn proposer(&self, ctx: &Context<'_>) -> async_graphql::Result<Option<User>> {
        let pool = ctx.data::<PgPool>()?;
        let row = sqlx::query(
            "SELECT user_id, firebase_uid, email, display_name, role, region, trust_score, email_verified, created_at, updated_at FROM users WHERE user_id = $1",
        )
        .bind(self.proposer_user_id)
        .fetch_optional(pool)
        .await?;

        Ok(row.map(|row| {
            User {
                user_id: row.get("user_id"),
                firebase_uid: row.get("firebase_uid"),
                email: row.get("email"),
                display_name: row.get("display_name"),
                role: row.get("role"),
                region: row.get("region"),
                trust_score: row.get("trust_score"),
                email_verified: row.get("email_verified"),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
            }
        }))
    }

    async fn reviewed_by_user(&self, ctx: &Context<'_>) -> async_graphql::Result<Option<User>> {
        let Some(reviewer_id) = self.reviewed_by else {
            return Ok(None);
        };
        let pool = ctx.data::<PgPool>()?;
        let row = sqlx::query(
            "SELECT user_id, firebase_uid, email, display_name, role, region, trust_score, email_verified, created_at, updated_at FROM users WHERE user_id = $1",
        )
        .bind(reviewer_id)
        .fetch_optional(pool)
        .await?;

        Ok(row.map(|row| {
            User {
                user_id: row.get("user_id"),
                firebase_uid: row.get("firebase_uid"),
                email: row.get("email"),
                display_name: row.get("display_name"),
                role: row.get("role"),
                region: row.get("region"),
                trust_score: row.get("trust_score"),
                email_verified: row.get("email_verified"),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
            }
        }))
    }

    async fn possible_duplicates(&self, ctx: &Context<'_>) -> async_graphql::Result<Vec<Store>> {
        let Some(loc) = &self.proposed_location else {
            return Ok(vec![]);
        };
        if self.kind != ProposalKind::Create {
            return Ok(vec![]);
        }
        let pool = ctx.data::<PgPool>()?;
        let rows = sqlx::query(
            r"
            SELECT store_id, name, address,
                   ST_Y(location::geometry) as lat, ST_X(location::geometry) as lng,
                   version, created_at, updated_at
            FROM stores
            WHERE ST_DWithin(location, ST_SetSRID(ST_Point($1, $2), 4326)::geography, 100)
            ORDER BY ST_Distance(location, ST_SetSRID(ST_Point($1, $2), 4326)::geography)
            LIMIT 5
            ",
        )
        .bind(loc.lng)
        .bind(loc.lat)
        .fetch_all(pool)
        .await?;

        Ok(rows
            .into_iter()
            .map(|row| {
                Store {
                    store_id: row.get("store_id"),
                    name: row.get("name"),
                    address: row.get("address"),
                    location: Location {
                        lat: row.get("lat"),
                        lng: row.get("lng"),
                    },
                    version: row.get("version"),
                    created_at: row.get("created_at"),
                    updated_at: row.get("updated_at"),
                }
            })
            .collect())
    }

    async fn diff_against_current(&self, ctx: &Context<'_>) -> async_graphql::Result<Vec<StoreDiff>> {
        let Some(target_id) = self.target_store_id else {
            return Ok(vec![]);
        };
        let pool = ctx.data::<PgPool>()?;
        let row = sqlx::query(
            r"SELECT name, address, ST_Y(location::geometry) as lat, ST_X(location::geometry) as lng
              FROM stores WHERE store_id = $1",
        )
        .bind(target_id)
        .fetch_optional(pool)
        .await?;

        let Some(row) = row else {
            return Ok(vec![]);
        };

        let mut diffs = Vec::new();

        if let Some(proposed_name) = self.payload.get("name").and_then(serde_json::Value::as_str) {
            let current: String = row.get("name");
            if proposed_name != current {
                diffs.push(StoreDiff {
                    field: "name".to_string(),
                    before: Some(current),
                    after: Some(proposed_name.to_string()),
                });
            }
        }

        if let Some(proposed_addr) = self.payload.get("address").and_then(serde_json::Value::as_str) {
            let current: String = row.get("address");
            if proposed_addr != current {
                diffs.push(StoreDiff {
                    field: "address".to_string(),
                    before: Some(current),
                    after: Some(proposed_addr.to_string()),
                });
            }
        }

        if let Some(proposed_lat) = self.payload.get("lat").and_then(serde_json::Value::as_f64) {
            let current: f64 = row.get("lat");
            if (proposed_lat - current).abs() > 0.000_001 {
                diffs.push(StoreDiff {
                    field: "lat".to_string(),
                    before: Some(current.to_string()),
                    after: Some(proposed_lat.to_string()),
                });
            }
        }

        if let Some(proposed_lng) = self.payload.get("lng").and_then(serde_json::Value::as_f64) {
            let current: f64 = row.get("lng");
            if (proposed_lng - current).abs() > 0.000_001 {
                diffs.push(StoreDiff {
                    field: "lng".to_string(),
                    before: Some(current.to_string()),
                    after: Some(proposed_lng.to_string()),
                });
            }
        }

        Ok(diffs)
    }
}

/// Cursor-based pagination edge
#[derive(SimpleObject, Clone)]
pub struct StoreProposalEdge {
    pub cursor: String,
    pub node: StoreProposal,
}

/// Cursor-based pagination connection
#[derive(SimpleObject, Clone)]
pub struct StoreProposalConnection {
    pub edges: Vec<StoreProposalEdge>,
    pub has_next_page: bool,
}

/// Helper: build a `StoreProposal` from a sqlx Row.
#[must_use]
pub fn proposal_from_row(row: &sqlx::postgres::PgRow) -> StoreProposal {
    let kind_str: String = row.get("kind");
    let status_str: String = row.get("status");

    // Extract lat/lng from proposed_location if present
    let proposed_lat: Option<f64> = row.try_get("proposed_lat").ok();
    let proposed_lng: Option<f64> = row.try_get("proposed_lng").ok();
    let proposed_location = match (proposed_lat, proposed_lng) {
        (Some(lat), Some(lng)) => Some(Location { lat, lng }),
        _ => None,
    };

    StoreProposal {
        proposal_id: row.get("proposal_id"),
        kind: ProposalKind::from_db_str(&kind_str).unwrap_or(ProposalKind::Create),
        status: ProposalStatus::from_db_str(&status_str).unwrap_or(ProposalStatus::Pending),
        target_store_id: row.get("target_store_id"),
        target_version: row.get("target_version"),
        payload: row.get("payload"),
        proposed_location,
        proposer_user_id: row.get("proposer_user_id"),
        client_nonce: row.get("client_nonce"),
        created_at: row.get("created_at"),
        reviewed_by: row.get("reviewed_by"),
        reviewed_at: row.get("reviewed_at"),
        review_note: row.get("review_note"),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_proposal_kind_as_db_str() {
        assert_eq!(ProposalKind::Create.as_db_str(), "create");
        assert_eq!(ProposalKind::Update.as_db_str(), "update");
        assert_eq!(ProposalKind::Delete.as_db_str(), "delete");
    }

    #[test]
    fn test_proposal_kind_from_db_str() {
        assert_eq!(ProposalKind::from_db_str("create"), Some(ProposalKind::Create));
        assert_eq!(ProposalKind::from_db_str("update"), Some(ProposalKind::Update));
        assert_eq!(ProposalKind::from_db_str("delete"), Some(ProposalKind::Delete));
        assert_eq!(ProposalKind::from_db_str("invalid"), None);
    }

    #[test]
    fn test_proposal_status_as_db_str() {
        assert_eq!(ProposalStatus::Pending.as_db_str(), "pending");
        assert_eq!(ProposalStatus::Approved.as_db_str(), "approved");
        assert_eq!(ProposalStatus::Rejected.as_db_str(), "rejected");
        assert_eq!(ProposalStatus::Withdrawn.as_db_str(), "withdrawn");
        assert_eq!(ProposalStatus::Superseded.as_db_str(), "superseded");
    }

    #[test]
    fn test_proposal_status_from_db_str() {
        assert_eq!(ProposalStatus::from_db_str("pending"), Some(ProposalStatus::Pending));
        assert_eq!(ProposalStatus::from_db_str("approved"), Some(ProposalStatus::Approved));
        assert_eq!(ProposalStatus::from_db_str("rejected"), Some(ProposalStatus::Rejected));
        assert_eq!(ProposalStatus::from_db_str("withdrawn"), Some(ProposalStatus::Withdrawn));
        assert_eq!(ProposalStatus::from_db_str("superseded"), Some(ProposalStatus::Superseded));
        assert_eq!(ProposalStatus::from_db_str("unknown"), None);
    }

    #[test]
    fn test_proposal_kind_roundtrip() {
        for kind in [ProposalKind::Create, ProposalKind::Update, ProposalKind::Delete] {
            assert_eq!(ProposalKind::from_db_str(kind.as_db_str()), Some(kind));
        }
    }

    #[test]
    fn test_proposal_status_roundtrip() {
        for status in [
            ProposalStatus::Pending,
            ProposalStatus::Approved,
            ProposalStatus::Rejected,
            ProposalStatus::Withdrawn,
            ProposalStatus::Superseded,
        ] {
            assert_eq!(ProposalStatus::from_db_str(status.as_db_str()), Some(status));
        }
    }
}
