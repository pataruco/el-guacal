use crate::model::proposal::{StoreProposal, ProposalStatus, ProposalKind};
use crate::model::user::{User, UserRole};
use crate::model::location::Location;
use async_graphql::{Context, Object, Result};
use sqlx::{PgPool, Row};
use uuid::Uuid;

#[derive(Default)]
pub struct ProposalQuery;

fn map_proposal_row(row: &sqlx::postgres::PgRow) -> StoreProposal {
    StoreProposal {
        proposal_id: row.get("proposal_id"),
        proposer_user_id: row.get("proposer_user_id"),
        kind: row.get("kind"),
        status: row.get("status"),
        target_store_id: row.get("target_store_id"),
        target_version: row.get("target_version"),
        payload: row.get("payload"),
        proposed_location: match (row.try_get::<f64, _>("lat"), row.try_get::<f64, _>("lng")) {
            (Ok(lat), Ok(lng)) => Some(Location { lat, lng }),
            _ => None,
        },
        possible_duplicates: row.get("possible_duplicates"),
        reviewed_by: row.get("reviewed_by"),
        reviewed_at: row.get("reviewed_at"),
        review_note: row.get("review_note"),
        client_nonce: row.get("client_nonce"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
    }
}

#[Object]
impl ProposalQuery {
    async fn store_proposal(&self, ctx: &Context<'_>, id: Uuid) -> Result<StoreProposal> {
        let pool = ctx.data::<PgPool>()?;
        let user = ctx.data::<User>()?;

        let row = sqlx::query(
            r"
            SELECT
                proposal_id,
                proposer_user_id,
                kind,
                status,
                target_store_id,
                target_version,
                payload,
                ST_Y(proposed_location::geometry) as lat,
                ST_X(proposed_location::geometry) as lng,
                possible_duplicates,
                reviewed_by,
                reviewed_at,
                review_note,
                client_nonce,
                created_at,
                updated_at
            FROM store_proposals
            WHERE proposal_id = $1
            ",
        )
        .bind(id)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| async_graphql::Error::new("Proposal not found"))?;

        let proposal = map_proposal_row(&row);

        if user.role == UserRole::Contributor && proposal.proposer_user_id != user.user_id {
            return Err(async_graphql::Error::new("Forbidden"));
        }

        Ok(proposal)
    }

    async fn my_store_proposals(
        &self,
        ctx: &Context<'_>,
        status: Option<ProposalStatus>,
        limit: Option<i64>,
    ) -> Result<Vec<StoreProposal>> {
        let pool = ctx.data::<PgPool>()?;
        let user = ctx.data::<User>()?;
        let limit = limit.unwrap_or(50);

        let status_str = status.map(|s| format!("{s:?}").to_lowercase());

        let rows = sqlx::query(
            r"
            SELECT
                proposal_id,
                proposer_user_id,
                kind,
                status,
                target_store_id,
                target_version,
                payload,
                ST_Y(proposed_location::geometry) as lat,
                ST_X(proposed_location::geometry) as lng,
                possible_duplicates,
                reviewed_by,
                reviewed_at,
                review_note,
                client_nonce,
                created_at,
                updated_at
            FROM store_proposals
            WHERE proposer_user_id = $1
            AND ($2::varchar IS NULL OR status = $2::varchar)
            ORDER BY created_at DESC
            LIMIT $3
            ",
        )
        .bind(user.user_id)
        .bind(status_str)
        .bind(limit)
        .fetch_all(pool)
        .await?;

        Ok(rows.iter().map(map_proposal_row).collect())
    }

    async fn pending_store_proposals(
        &self,
        ctx: &Context<'_>,
        location: Option<crate::api::queries::store::LocationInput>,
        radius: Option<crate::api::queries::store::Radius>,
        kind: Option<ProposalKind>,
        limit: Option<i64>,
    ) -> Result<Vec<StoreProposal>> {
        let pool = ctx.data::<PgPool>()?;
        let user = ctx.data::<User>()?;
        let limit = limit.unwrap_or(50);

        if user.role == UserRole::Contributor {
            return Err(async_graphql::Error::new("Forbidden"));
        }

        let radius_meters = if let (Some(loc), Some(rad)) = (location.as_ref(), radius) {
             Some(rad.to_meters(loc.lat))
        } else {
             None
        };

        let kind_str = kind.map(|k| format!("{k:?}").to_lowercase());
        let lng = location.as_ref().map(|l| l.lng);
        let lat = location.as_ref().map(|l| l.lat);

        let rows = sqlx::query(
            r"
            SELECT
                proposal_id,
                proposer_user_id,
                kind,
                status,
                target_store_id,
                target_version,
                payload,
                ST_Y(proposed_location::geometry) as lat,
                ST_X(proposed_location::geometry) as lng,
                possible_duplicates,
                reviewed_by,
                reviewed_at,
                review_note,
                client_nonce,
                created_at,
                updated_at
            FROM store_proposals
            WHERE status = 'pending'
            AND ($1::varchar IS NULL OR kind = $1::varchar)
            AND (
                $2::float8 IS NULL OR
                ST_DWithin(
                    proposed_location,
                    ST_SetSRID(ST_Point($3, $4), 4326)::geography,
                    $2
                )
            )
            ORDER BY created_at ASC
            LIMIT $5
            ",
        )
        .bind(kind_str)
        .bind(radius_meters)
        .bind(lng)
        .bind(lat)
        .bind(limit)
        .fetch_all(pool)
        .await?;

        Ok(rows.iter().map(map_proposal_row).collect())
    }
}
