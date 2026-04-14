use crate::auth::AuthenticatedUser;
use crate::model::proposal::{
    ProposalKind, ProposalStatus, StoreProposal, StoreProposalConnection, StoreProposalEdge,
    proposal_from_row,
};
use async_graphql::{Context, Object};
use sqlx::{PgPool, Row};
use uuid::Uuid;

#[derive(Default)]
pub struct ProposalQuery;

#[Object]
impl ProposalQuery {
    async fn store_proposal(
        &self,
        ctx: &Context<'_>,
        id: Uuid,
    ) -> async_graphql::Result<Option<StoreProposal>> {
        let auth = ctx
            .data_opt::<AuthenticatedUser>()
            .ok_or_else(|| async_graphql::Error::new("Unauthorized"))?;
        let pool = ctx.data::<PgPool>()?;

        let row = sqlx::query(
            r"
            SELECT proposal_id, kind::text, status::text, target_store_id, target_version,
                   payload, proposer_user_id, client_nonce, created_at,
                   reviewed_by, reviewed_at, review_note,
                   ST_Y(proposed_location::geometry) as proposed_lat,
                   ST_X(proposed_location::geometry) as proposed_lng
            FROM store_proposals
            WHERE proposal_id = $1
            ",
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        match row {
            Some(r) => {
                let proposer_id: Uuid = r.get("proposer_user_id");
                // Contributors can only see their own proposals
                if auth.role == "contributor" && proposer_id != auth.user_id {
                    return Err(async_graphql::Error::new("Forbidden"));
                }
                Ok(Some(proposal_from_row(&r)))
            }
            None => Ok(None),
        }
    }

    #[allow(clippy::cast_sign_loss)]
    async fn my_store_proposals(
        &self,
        ctx: &Context<'_>,
        status: Option<ProposalStatus>,
        limit: Option<i32>,
        cursor: Option<String>,
    ) -> async_graphql::Result<StoreProposalConnection> {
        let auth = ctx
            .data_opt::<AuthenticatedUser>()
            .ok_or_else(|| async_graphql::Error::new("Unauthorized"))?;
        let pool = ctx.data::<PgPool>()?;

        let limit = limit.unwrap_or(50).min(100);
        let cursor_time = cursor
            .as_deref()
            .and_then(|c| chrono::DateTime::parse_from_rfc3339(c).ok())
            .map(|dt| dt.with_timezone(&chrono::Utc));

        let rows = if let Some(status_filter) = status {
            sqlx::query(
                r"
                SELECT proposal_id, kind::text, status::text, target_store_id, target_version,
                       payload, proposer_user_id, client_nonce, created_at,
                       reviewed_by, reviewed_at, review_note,
                       ST_Y(proposed_location::geometry) as proposed_lat,
                       ST_X(proposed_location::geometry) as proposed_lng
                FROM store_proposals
                WHERE proposer_user_id = $1
                  AND status = $2::text::proposal_status
                  AND ($3::timestamptz IS NULL OR created_at < $3)
                ORDER BY created_at DESC
                LIMIT $4
                ",
            )
            .bind(auth.user_id)
            .bind(status_filter.as_db_str())
            .bind(cursor_time)
            .bind(limit + 1)
            .fetch_all(pool)
            .await?
        } else {
            sqlx::query(
                r"
                SELECT proposal_id, kind::text, status::text, target_store_id, target_version,
                       payload, proposer_user_id, client_nonce, created_at,
                       reviewed_by, reviewed_at, review_note,
                       ST_Y(proposed_location::geometry) as proposed_lat,
                       ST_X(proposed_location::geometry) as proposed_lng
                FROM store_proposals
                WHERE proposer_user_id = $1
                  AND ($2::timestamptz IS NULL OR created_at < $2)
                ORDER BY created_at DESC
                LIMIT $3
                ",
            )
            .bind(auth.user_id)
            .bind(cursor_time)
            .bind(limit + 1)
            .fetch_all(pool)
            .await?
        };

        let has_next_page = rows.len() > limit as usize;
        let edges: Vec<StoreProposalEdge> = rows
            .into_iter()
            .take(limit as usize)
            .map(|row| {
                let proposal = proposal_from_row(&row);
                let cursor = proposal.created_at.to_rfc3339();
                StoreProposalEdge {
                    cursor,
                    node: proposal,
                }
            })
            .collect();

        Ok(StoreProposalConnection {
            edges,
            has_next_page,
        })
    }

    #[allow(unused_variables, clippy::cast_sign_loss)]
    async fn pending_store_proposals(
        &self,
        ctx: &Context<'_>,
        region: Option<String>,
        kind: Option<ProposalKind>,
        limit: Option<i32>,
        cursor: Option<String>,
    ) -> async_graphql::Result<StoreProposalConnection> {
        let auth = ctx
            .data_opt::<AuthenticatedUser>()
            .ok_or_else(|| async_graphql::Error::new("Unauthorized"))?;

        if auth.role != "moderator" && auth.role != "admin" {
            return Err(async_graphql::Error::new("Forbidden: moderator or admin required"));
        }

        let pool = ctx.data::<PgPool>()?;
        let limit = limit.unwrap_or(50).min(100);
        let cursor_time = cursor
            .as_deref()
            .and_then(|c| chrono::DateTime::parse_from_rfc3339(c).ok())
            .map(|dt| dt.with_timezone(&chrono::Utc));

        let kind_str = kind.map(|k| k.as_db_str().to_string());

        let rows = sqlx::query(
            r"
            SELECT proposal_id, kind::text, status::text, target_store_id, target_version,
                   payload, proposer_user_id, client_nonce, created_at,
                   reviewed_by, reviewed_at, review_note,
                   ST_Y(proposed_location::geometry) as proposed_lat,
                   ST_X(proposed_location::geometry) as proposed_lng
            FROM store_proposals
            WHERE status = 'pending'
              AND ($1::text IS NULL OR kind = $1::text::proposal_kind)
              AND ($2::timestamptz IS NULL OR created_at < $2)
            ORDER BY created_at ASC
            LIMIT $3
            ",
        )
        .bind(&kind_str)
        .bind(cursor_time)
        .bind(limit + 1)
        .fetch_all(pool)
        .await?;

        let has_next_page = rows.len() > limit as usize;
        let edges: Vec<StoreProposalEdge> = rows
            .into_iter()
            .take(limit as usize)
            .map(|row| {
                let proposal = proposal_from_row(&row);
                let cursor = proposal.created_at.to_rfc3339();
                StoreProposalEdge {
                    cursor,
                    node: proposal,
                }
            })
            .collect();

        Ok(StoreProposalConnection {
            edges,
            has_next_page,
        })
    }
}
