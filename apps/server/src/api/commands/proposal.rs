use crate::model::proposal::{StoreProposal, ProposalKind, ProposalStatus};
use crate::model::user::{User, UserRole};
use crate::rate_limit::check_rate_limit;
use crate::model::location::Location;
use async_graphql::{Context, Object, Result, InputObject, Enum};
use sqlx::{PgPool, Row, Postgres, Transaction};
use uuid::Uuid;
use serde_json::json;

#[derive(Default)]
pub struct ProposalCommand;

#[derive(InputObject)]
pub struct SubmitCreateStoreProposalInput {
    pub name: String,
    pub address: String,
    pub lat: f64,
    pub lng: f64,
    pub product_ids: Vec<Uuid>,
    pub client_nonce: String,
}

#[derive(InputObject)]
pub struct SubmitUpdateStoreProposalInput {
    pub target_store_id: Uuid,
    pub expected_version: i64,
    pub name: Option<String>,
    pub address: Option<String>,
    pub lat: Option<f64>,
    pub lng: Option<f64>,
    pub product_ids: Option<Vec<Uuid>>,
    pub client_nonce: String,
}

#[derive(InputObject)]
pub struct SubmitDeleteStoreProposalInput {
    pub target_store_id: Uuid,
    pub expected_version: i64,
    pub reason: String,
    pub client_nonce: String,
}

#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum ReviewDecision {
    Approve,
    Reject,
}

#[derive(InputObject)]
pub struct ReviewProposalInput {
    pub proposal_id: Uuid,
    pub decision: ReviewDecision,
    pub note: Option<String>,
}

#[derive(InputObject)]
pub struct SetUserRoleInput {
    pub firebase_uid: String,
    pub role: UserRole,
    pub region: Option<String>,
}

async fn fetch_proposal_with_location(pool: &PgPool, id: Uuid) -> sqlx::Result<Option<StoreProposal>> {
    let row = sqlx::query(
        r"SELECT
            proposal_id, proposer_user_id, kind, status,
            target_store_id, target_version, payload,
            ST_Y(proposed_location::geometry) as lat, ST_X(proposed_location::geometry) as lng,
            possible_duplicates, reviewed_by, reviewed_at, review_note, client_nonce, created_at, updated_at
        FROM store_proposals WHERE proposal_id = $1"
    ).bind(id).fetch_optional(pool).await?;

    Ok(row.map(|r| StoreProposal {
        proposal_id: r.get("proposal_id"),
        proposer_user_id: r.get("proposer_user_id"),
        kind: r.get("kind"),
        status: r.get("status"),
        target_store_id: r.get("target_store_id"),
        target_version: r.get("target_version"),
        payload: r.get("payload"),
        proposed_location: match (r.try_get::<f64, _>("lat"), r.try_get::<f64, _>("lng")) {
            (Ok(lat), Ok(lng)) => Some(Location { lat, lng }),
            _ => None,
        },
        possible_duplicates: r.get("possible_duplicates"),
        reviewed_by: r.get("reviewed_by"),
        reviewed_at: r.get("reviewed_at"),
        review_note: r.get("review_note"),
        client_nonce: r.get("client_nonce"),
        created_at: r.get("created_at"),
        updated_at: r.get("updated_at"),
    }))
}

impl ProposalCommand {
    async fn apply_approved_proposal(
        tx: &mut Transaction<'_, Postgres>,
        proposal: &StoreProposal,
    ) -> Result<()> {
        match proposal.kind {
            ProposalKind::Create => {
                let name = proposal.payload["name"].as_str().unwrap();
                let address = proposal.payload["address"].as_str().unwrap();
                let product_ids: Vec<Uuid> = serde_json::from_value(proposal.payload["product_ids"].clone())?;
                let loc = proposal.proposed_location.as_ref().unwrap();

                let row = sqlx::query(
                    r"INSERT INTO stores (name, address, location)
                       VALUES ($1, $2, ST_SetSRID(ST_Point($3, $4), 4326)::geography)
                       RETURNING store_id",
                )
                .bind(name).bind(address).bind(loc.lng).bind(loc.lat)
                .fetch_one(&mut **tx).await?;

                let store_id: Uuid = row.get("store_id");
                for pid in product_ids {
                    sqlx::query("INSERT INTO store_products (store_id, product_id) VALUES ($1, $2)")
                        .bind(store_id).bind(pid).execute(&mut **tx).await?;
                }
            },
            ProposalKind::Update => {
                let target_id = proposal.target_store_id.unwrap();
                let name = proposal.payload["name"].as_str();
                let address = proposal.payload["address"].as_str();
                let lat = proposal.payload["lat"].as_f64();
                let lng = proposal.payload["lng"].as_f64();
                let product_ids: Option<Vec<Uuid>> = serde_json::from_value(proposal.payload["product_ids"].clone()).ok();

                sqlx::query(
                    r"UPDATE stores SET
                       name = COALESCE($1, name),
                       address = COALESCE($2, address),
                       location = CASE WHEN $3::float8 IS NOT NULL AND $4::float8 IS NOT NULL THEN ST_SetSRID(ST_Point($4, $3), 4326)::geography ELSE location END,
                       version = version + 1, updated_at = NOW()
                       WHERE store_id = $5",
                )
                .bind(name).bind(address).bind(lat).bind(lng).bind(target_id)
                .execute(&mut **tx).await?;

                if let Some(pids) = product_ids {
                    sqlx::query("DELETE FROM store_products WHERE store_id = $1").bind(target_id).execute(&mut **tx).await?;
                    for pid in pids {
                        sqlx::query("INSERT INTO store_products (store_id, product_id) VALUES ($1, $2)")
                            .bind(target_id).bind(pid).execute(&mut **tx).await?;
                    }
                }
            },
            ProposalKind::Delete => {
                sqlx::query("DELETE FROM stores WHERE store_id = $1").bind(proposal.target_store_id.unwrap()).execute(&mut **tx).await?;
            }
        }
        Ok(())
    }

    async fn handle_approval(
        tx: &mut Transaction<'_, Postgres>,
        proposal: &StoreProposal,
        user_id: Uuid,
        note: &Option<String>,
    ) -> Result<()> {
        if let Some(target_id) = proposal.target_store_id {
            let row = sqlx::query("SELECT version FROM stores WHERE store_id = $1 FOR UPDATE")
                .bind(target_id).fetch_one(&mut **tx).await?;
            if row.get::<i64, _>("version") != proposal.target_version.unwrap_or(0) {
                 sqlx::query("UPDATE store_proposals SET status = 'superseded', reviewed_by = $1, reviewed_at = NOW(), review_note = $2, updated_at = NOW() WHERE proposal_id = $3")
                    .bind(user_id).bind(note).bind(proposal.proposal_id).execute(&mut **tx).await?;
                 sqlx::query("INSERT INTO proposal_audit_log (proposal_id, action, actor_user_id) VALUES ($1, 'superseded', $2)")
                    .bind(proposal.proposal_id).bind(user_id).execute(&mut **tx).await?;
                 return Ok(());
            }
        }
        Self::apply_approved_proposal(tx, proposal).await?;
        sqlx::query("UPDATE users SET trust_score = trust_score + 1 WHERE user_id = $1").bind(proposal.proposer_user_id).execute(&mut **tx).await?;
        sqlx::query("UPDATE store_proposals SET status = 'approved', reviewed_by = $1, reviewed_at = NOW(), review_note = $2, updated_at = NOW() WHERE proposal_id = $3")
            .bind(user_id).bind(note).bind(proposal.proposal_id).execute(&mut **tx).await?;
        sqlx::query("INSERT INTO proposal_audit_log (proposal_id, action, actor_user_id) VALUES ($1, 'approved', $2), ($1, 'applied', $2)")
            .bind(proposal.proposal_id).bind(user_id).execute(&mut **tx).await?;
        Ok(())
    }
}

#[Object]
impl ProposalCommand {
    async fn submit_create_store_proposal(
        &self,
        ctx: &Context<'_>,
        input: SubmitCreateStoreProposalInput,
    ) -> Result<StoreProposal> {
        let pool = ctx.data::<PgPool>()?;
        let user = ctx.data::<User>()?;
        check_rate_limit(pool, user).await.map_err(async_graphql::Error::new)?;

        let duplicates = sqlx::query(r"SELECT store_id, name, address FROM stores WHERE ST_DWithin(location, ST_SetSRID(ST_Point($1, $2), 4326)::geography, 50)")
            .bind(input.lng).bind(input.lat).fetch_all(pool).await?
            .into_iter().map(|r| json!({"store_id": r.get::<Uuid, _>("store_id"), "name": r.get::<String, _>("name"), "address": r.get::<String, _>("address")})).collect::<Vec<_>>();

        let payload = json!({"name": input.name, "address": input.address, "product_ids": input.product_ids});
        let row = sqlx::query(r"INSERT INTO store_proposals (proposer_user_id, kind, status, payload, proposed_location, possible_duplicates, client_nonce) VALUES ($1, 'create', 'pending', $2, ST_SetSRID(ST_Point($3, $4), 4326)::geography, $5, $6) RETURNING proposal_id")
            .bind(user.user_id).bind(payload).bind(input.lng).bind(input.lat).bind(json!(duplicates)).bind(input.client_nonce).fetch_one(pool).await?;

        let proposal_id: Uuid = row.get("proposal_id");
        sqlx::query("INSERT INTO proposal_audit_log (proposal_id, action, actor_user_id) VALUES ($1, 'submitted', $2)")
            .bind(proposal_id).bind(user.user_id).execute(pool).await?;
        Ok(fetch_proposal_with_location(pool, proposal_id).await?.unwrap())
    }

    async fn submit_update_store_proposal(
        &self,
        ctx: &Context<'_>,
        input: SubmitUpdateStoreProposalInput,
    ) -> Result<StoreProposal> {
        let pool = ctx.data::<PgPool>()?;
        let user = ctx.data::<User>()?;
        check_rate_limit(pool, user).await.map_err(async_graphql::Error::new)?;

        if input.name.is_none() && input.address.is_none() && input.lat.is_none() && input.lng.is_none() && input.product_ids.is_none() {
            return Err(async_graphql::Error::new("At least one field must be set"));
        }

        let row = sqlx::query("SELECT version FROM stores WHERE store_id = $1").bind(input.target_store_id).fetch_optional(pool).await?.ok_or_else(|| async_graphql::Error::new("Store not found"))?;
        if row.get::<i64, _>("version") != input.expected_version {
            return Err(async_graphql::Error::new("Store has been modified by someone else. Please refresh."));
        }

        let payload = json!({"name": input.name, "address": input.address, "lat": input.lat, "lng": input.lng, "product_ids": input.product_ids});
        let row = sqlx::query(r"INSERT INTO store_proposals (proposer_user_id, kind, status, target_store_id, target_version, payload, proposed_location, client_nonce) VALUES ($1, 'update', 'pending', $2, $3, $4, CASE WHEN $5::float8 IS NOT NULL AND $6::float8 IS NOT NULL THEN ST_SetSRID(ST_Point($6, $5), 4326)::geography ELSE NULL END, $7) RETURNING proposal_id")
            .bind(user.user_id).bind(input.target_store_id).bind(input.expected_version).bind(payload).bind(input.lat).bind(input.lng).bind(input.client_nonce).fetch_one(pool).await?;

        let proposal_id: Uuid = row.get("proposal_id");
        sqlx::query("INSERT INTO proposal_audit_log (proposal_id, action, actor_user_id) VALUES ($1, 'submitted', $2)")
            .bind(proposal_id).bind(user.user_id).execute(pool).await?;
        Ok(fetch_proposal_with_location(pool, proposal_id).await?.unwrap())
    }

    async fn submit_delete_store_proposal(
        &self,
        ctx: &Context<'_>,
        input: SubmitDeleteStoreProposalInput,
    ) -> Result<StoreProposal> {
        let pool = ctx.data::<PgPool>()?;
        let user = ctx.data::<User>()?;
        check_rate_limit(pool, user).await.map_err(async_graphql::Error::new)?;

        if user.role == UserRole::Contributor && user.trust_score < 3 {
             return Err(async_graphql::Error::new("Insufficient trust score to propose deletions"));
        }

        let row = sqlx::query("SELECT version FROM stores WHERE store_id = $1").bind(input.target_store_id).fetch_optional(pool).await?.ok_or_else(|| async_graphql::Error::new("Store not found"))?;
        if row.get::<i64, _>("version") != input.expected_version {
            return Err(async_graphql::Error::new("Store has been modified by someone else. Please refresh."));
        }

        let payload = json!({"reason": input.reason});
        let row = sqlx::query(r"INSERT INTO store_proposals (proposer_user_id, kind, status, target_store_id, target_version, payload, client_nonce) VALUES ($1, 'delete', 'pending', $2, $3, $4, $5) RETURNING proposal_id")
            .bind(user.user_id).bind(input.target_store_id).bind(input.expected_version).bind(payload).bind(input.client_nonce).fetch_one(pool).await?;

        let proposal_id: Uuid = row.get("proposal_id");
        sqlx::query("INSERT INTO proposal_audit_log (proposal_id, action, actor_user_id) VALUES ($1, 'submitted', $2)")
            .bind(proposal_id).bind(user.user_id).execute(pool).await?;
        Ok(fetch_proposal_with_location(pool, proposal_id).await?.unwrap())
    }

    async fn withdraw_store_proposal(&self, ctx: &Context<'_>, proposal_id: Uuid) -> Result<StoreProposal> {
        let pool = ctx.data::<PgPool>()?;
        let user = ctx.data::<User>()?;
        let proposal = fetch_proposal_with_location(pool, proposal_id).await?.ok_or_else(|| async_graphql::Error::new("Proposal not found"))?;

        if user.role == UserRole::Contributor && proposal.proposer_user_id != user.user_id {
            return Err(async_graphql::Error::new("Forbidden"));
        }
        if proposal.status != ProposalStatus::Pending {
            return Err(async_graphql::Error::new("Only pending proposals can be withdrawn"));
        }

        sqlx::query("UPDATE store_proposals SET status = 'withdrawn', updated_at = NOW() WHERE proposal_id = $1").bind(proposal_id).execute(pool).await?;
        sqlx::query("INSERT INTO proposal_audit_log (proposal_id, action, actor_user_id) VALUES ($1, 'withdrawn', $2)").bind(proposal_id).bind(user.user_id).execute(pool).await?;
        Ok(fetch_proposal_with_location(pool, proposal_id).await?.unwrap())
    }

    #[allow(clippy::too_many_lines)]
    async fn review_store_proposal(
        &self,
        ctx: &Context<'_>,
        input: ReviewProposalInput,
    ) -> Result<StoreProposal> {
        let pool = ctx.data::<PgPool>()?;
        let user = ctx.data::<User>()?;
        if user.role == UserRole::Contributor {
            return Err(async_graphql::Error::new("Forbidden"));
        }

        let mut tx = pool.begin().await?;
        let row = sqlx::query(r"SELECT proposal_id, proposer_user_id, kind, status, target_store_id, target_version, payload, ST_Y(proposed_location::geometry) as lat, ST_X(proposed_location::geometry) as lng, possible_duplicates, reviewed_by, reviewed_at, review_note, client_nonce, created_at, updated_at FROM store_proposals WHERE proposal_id = $1 FOR UPDATE")
            .bind(input.proposal_id).fetch_optional(&mut *tx).await?.ok_or_else(|| async_graphql::Error::new("Proposal not found"))?;

        let proposal = StoreProposal {
            proposal_id: row.get("proposal_id"), proposer_user_id: row.get("proposer_user_id"), kind: row.get("kind"), status: row.get("status"), target_store_id: row.get("target_store_id"), target_version: row.get("target_version"), payload: row.get("payload"),
            proposed_location: match (row.try_get::<f64, _>("lat"), row.try_get::<f64, _>("lng")) { (Ok(lat), Ok(lng)) => Some(Location { lat, lng }), _ => None },
            possible_duplicates: row.get("possible_duplicates"), reviewed_by: row.get("reviewed_by"), reviewed_at: row.get("reviewed_at"), review_note: row.get("review_note"), client_nonce: row.get("client_nonce"), created_at: row.get("created_at"), updated_at: row.get("updated_at"),
        };

        if proposal.status != ProposalStatus::Pending {
            return Err(async_graphql::Error::new("Proposal is no longer pending"));
        }

        if input.decision == ReviewDecision::Approve {
             Self::handle_approval(&mut tx, &proposal, user.user_id, &input.note).await?;
        } else {
            sqlx::query("UPDATE users SET trust_score = trust_score - 1 WHERE user_id = $1").bind(proposal.proposer_user_id).execute(&mut *tx).await?;
            sqlx::query("UPDATE store_proposals SET status = 'rejected', reviewed_by = $1, reviewed_at = NOW(), review_note = $2, updated_at = NOW() WHERE proposal_id = $3").bind(user.user_id).bind(&input.note).bind(input.proposal_id).execute(&mut *tx).await?;
            sqlx::query("INSERT INTO proposal_audit_log (proposal_id, action, actor_user_id) VALUES ($1, 'rejected', $2)").bind(input.proposal_id).bind(user.user_id).execute(&mut *tx).await?;
        }

        tx.commit().await?;
        Ok(fetch_proposal_with_location(pool, input.proposal_id).await?.unwrap())
    }

    async fn set_user_role(&self, ctx: &Context<'_>, input: SetUserRoleInput) -> Result<User> {
        let pool = ctx.data::<PgPool>()?;
        let user = ctx.data::<User>()?;
        if user.role != UserRole::Admin { return Err(async_graphql::Error::new("Only admins can set user roles")); }

        let row = sqlx::query(r"INSERT INTO users (firebase_uid, role, region) VALUES ($1, $2, $3) ON CONFLICT (firebase_uid) DO UPDATE SET role = $2, region = $3, updated_at = NOW() RETURNING user_id, firebase_uid, role, trust_score, region, created_at, updated_at")
            .bind(&input.firebase_uid).bind(format!("{0:?}", input.role).to_lowercase()).bind(&input.region).fetch_one(pool).await?;

        Ok(User { user_id: row.get("user_id"), firebase_uid: row.get("firebase_uid"), role: row.get("role"), trust_score: row.get("trust_score"), region: row.get("region"), created_at: row.get("created_at"), updated_at: row.get("updated_at") })
    }
}
