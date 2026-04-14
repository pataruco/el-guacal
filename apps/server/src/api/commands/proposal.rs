use crate::auth::AuthenticatedUser;
use crate::model::proposal::{ReviewDecision, StoreProposal, proposal_from_row};
use crate::rate_limit;
use async_graphql::{Context, InputObject, Object};
use sqlx::{PgPool, Row};
use uuid::Uuid;

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
    pub not_a_duplicate: Option<bool>,
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

#[derive(InputObject)]
pub struct ReviewProposalInput {
    pub proposal_id: Uuid,
    pub decision: ReviewDecision,
    pub note: Option<String>,
}

#[Object]
impl ProposalCommand {
    async fn submit_create_store_proposal(
        &self,
        ctx: &Context<'_>,
        input: SubmitCreateStoreProposalInput,
    ) -> async_graphql::Result<StoreProposal> {
        let auth = ctx
            .data_opt::<AuthenticatedUser>()
            .ok_or_else(|| async_graphql::Error::new("Unauthorized"))?;
        let pool = ctx.data::<PgPool>()?;

        // Rate limit
        let (capacity, refill) = rate_limit::rate_limit_params(&auth.role, 0);
        if !rate_limit::check_rate_limit(pool, &format!("uid:{}", auth.user_id), capacity, refill)
            .await?
        {
            return Err(async_graphql::Error::new("Rate limit exceeded"));
        }

        let payload = serde_json::json!({
            "name": input.name,
            "address": input.address,
            "lat": input.lat,
            "lng": input.lng,
            "product_ids": input.product_ids,
        });

        let row = sqlx::query(
            r"
            INSERT INTO store_proposals
                (kind, payload, proposed_location, proposer_user_id, client_nonce)
            VALUES
                ('create', $1, ST_SetSRID(ST_Point($2, $3), 4326)::geography, $4, $5)
            ON CONFLICT (proposer_user_id, client_nonce) DO UPDATE
                SET kind = store_proposals.kind  -- no-op, return existing row
            RETURNING proposal_id, kind::text, status::text, target_store_id, target_version,
                      payload, proposer_user_id, client_nonce, created_at,
                      reviewed_by, reviewed_at, review_note,
                      ST_Y(proposed_location::geometry) as proposed_lat,
                      ST_X(proposed_location::geometry) as proposed_lng
            ",
        )
        .bind(&payload)
        .bind(input.lng)
        .bind(input.lat)
        .bind(auth.user_id)
        .bind(&input.client_nonce)
        .fetch_one(pool)
        .await?;

        let proposal = proposal_from_row(&row);

        // Write audit log entry
        sqlx::query(
            "INSERT INTO proposal_audit_log (proposal_id, action, actor_user_id) VALUES ($1, 'submitted', $2)",
        )
        .bind(proposal.proposal_id)
        .bind(auth.user_id)
        .execute(pool)
        .await?;

        Ok(proposal)
    }

    async fn submit_update_store_proposal(
        &self,
        ctx: &Context<'_>,
        input: SubmitUpdateStoreProposalInput,
    ) -> async_graphql::Result<StoreProposal> {
        let auth = ctx
            .data_opt::<AuthenticatedUser>()
            .ok_or_else(|| async_graphql::Error::new("Unauthorized"))?;
        let pool = ctx.data::<PgPool>()?;

        // Rate limit
        let (capacity, refill) = rate_limit::rate_limit_params(&auth.role, 0);
        if !rate_limit::check_rate_limit(pool, &format!("uid:{}", auth.user_id), capacity, refill)
            .await?
        {
            return Err(async_graphql::Error::new("Rate limit exceeded"));
        }

        let mut payload = serde_json::Map::new();
        if let Some(name) = &input.name {
            payload.insert("name".to_string(), serde_json::json!(name));
        }
        if let Some(address) = &input.address {
            payload.insert("address".to_string(), serde_json::json!(address));
        }
        if let Some(lat) = input.lat {
            payload.insert("lat".to_string(), serde_json::json!(lat));
        }
        if let Some(lng) = input.lng {
            payload.insert("lng".to_string(), serde_json::json!(lng));
        }
        if let Some(product_ids) = &input.product_ids {
            payload.insert("product_ids".to_string(), serde_json::json!(product_ids));
        }

        let proposed_location_lng = input.lng;
        let proposed_location_lat = input.lat;

        let row = sqlx::query(
            r"
            INSERT INTO store_proposals
                (kind, target_store_id, target_version, payload, proposed_location, proposer_user_id, client_nonce)
            VALUES
                ('update', $1, $2, $3,
                 CASE WHEN $4::double precision IS NOT NULL AND $5::double precision IS NOT NULL
                      THEN ST_SetSRID(ST_Point($4, $5), 4326)::geography
                      ELSE NULL END,
                 $6, $7)
            ON CONFLICT (proposer_user_id, client_nonce) DO UPDATE
                SET kind = store_proposals.kind
            RETURNING proposal_id, kind::text, status::text, target_store_id, target_version,
                      payload, proposer_user_id, client_nonce, created_at,
                      reviewed_by, reviewed_at, review_note,
                      ST_Y(proposed_location::geometry) as proposed_lat,
                      ST_X(proposed_location::geometry) as proposed_lng
            ",
        )
        .bind(input.target_store_id)
        .bind(input.expected_version)
        .bind(serde_json::Value::Object(payload))
        .bind(proposed_location_lng)
        .bind(proposed_location_lat)
        .bind(auth.user_id)
        .bind(&input.client_nonce)
        .fetch_one(pool)
        .await?;

        let proposal = proposal_from_row(&row);

        sqlx::query(
            "INSERT INTO proposal_audit_log (proposal_id, action, actor_user_id) VALUES ($1, 'submitted', $2)",
        )
        .bind(proposal.proposal_id)
        .bind(auth.user_id)
        .execute(pool)
        .await?;

        Ok(proposal)
    }

    async fn submit_delete_store_proposal(
        &self,
        ctx: &Context<'_>,
        input: SubmitDeleteStoreProposalInput,
    ) -> async_graphql::Result<StoreProposal> {
        let auth = ctx
            .data_opt::<AuthenticatedUser>()
            .ok_or_else(|| async_graphql::Error::new("Unauthorized"))?;
        let pool = ctx.data::<PgPool>()?;

        // Trust check: trust_score >= 3 for contributors
        if auth.role == "contributor" {
            let trust: i32 = sqlx::query_scalar("SELECT trust_score FROM users WHERE user_id = $1")
                .bind(auth.user_id)
                .fetch_one(pool)
                .await?;
            if trust < 3 {
                return Err(async_graphql::Error::new(
                    "You need a trust score of at least 3 to propose deletions",
                ));
            }
        }

        let payload = serde_json::json!({ "reason": input.reason });

        let row = sqlx::query(
            r"
            INSERT INTO store_proposals
                (kind, target_store_id, target_version, payload, proposer_user_id, client_nonce)
            VALUES ('delete', $1, $2, $3, $4, $5)
            ON CONFLICT (proposer_user_id, client_nonce) DO UPDATE
                SET kind = store_proposals.kind
            RETURNING proposal_id, kind::text, status::text, target_store_id, target_version,
                      payload, proposer_user_id, client_nonce, created_at,
                      reviewed_by, reviewed_at, review_note,
                      NULL::double precision as proposed_lat,
                      NULL::double precision as proposed_lng
            ",
        )
        .bind(input.target_store_id)
        .bind(input.expected_version)
        .bind(&payload)
        .bind(auth.user_id)
        .bind(&input.client_nonce)
        .fetch_one(pool)
        .await?;

        let proposal = proposal_from_row(&row);

        sqlx::query(
            "INSERT INTO proposal_audit_log (proposal_id, action, actor_user_id) VALUES ($1, 'submitted', $2)",
        )
        .bind(proposal.proposal_id)
        .bind(auth.user_id)
        .execute(pool)
        .await?;

        Ok(proposal)
    }

    async fn withdraw_store_proposal(
        &self,
        ctx: &Context<'_>,
        proposal_id: Uuid,
    ) -> async_graphql::Result<StoreProposal> {
        let auth = ctx
            .data_opt::<AuthenticatedUser>()
            .ok_or_else(|| async_graphql::Error::new("Unauthorized"))?;
        let pool = ctx.data::<PgPool>()?;

        let row = sqlx::query(
            r"
            UPDATE store_proposals
            SET status = 'withdrawn'
            WHERE proposal_id = $1 AND proposer_user_id = $2 AND status = 'pending'
            RETURNING proposal_id, kind::text, status::text, target_store_id, target_version,
                      payload, proposer_user_id, client_nonce, created_at,
                      reviewed_by, reviewed_at, review_note,
                      ST_Y(proposed_location::geometry) as proposed_lat,
                      ST_X(proposed_location::geometry) as proposed_lng
            ",
        )
        .bind(proposal_id)
        .bind(auth.user_id)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| {
            async_graphql::Error::new("Proposal not found, not yours, or not pending")
        })?;

        let proposal = proposal_from_row(&row);

        sqlx::query(
            "INSERT INTO proposal_audit_log (proposal_id, action, actor_user_id) VALUES ($1, 'withdrawn', $2)",
        )
        .bind(proposal.proposal_id)
        .bind(auth.user_id)
        .execute(pool)
        .await?;

        Ok(proposal)
    }

    async fn review_store_proposal(
        &self,
        ctx: &Context<'_>,
        input: ReviewProposalInput,
    ) -> async_graphql::Result<StoreProposal> {
        let auth = ctx
            .data_opt::<AuthenticatedUser>()
            .ok_or_else(|| async_graphql::Error::new("Unauthorized"))?;

        if auth.role != "moderator" && auth.role != "admin" {
            return Err(async_graphql::Error::new("Forbidden: moderator or admin required"));
        }

        let pool = ctx.data::<PgPool>()?;
        let mut tx = pool.begin().await?;

        // 1. Lock the proposal
        let proposal_row = sqlx::query(
            r"
            SELECT proposal_id, kind::text, status::text, target_store_id, target_version,
                   payload, proposer_user_id, client_nonce, created_at,
                   reviewed_by, reviewed_at, review_note,
                   ST_Y(proposed_location::geometry) as proposed_lat,
                   ST_X(proposed_location::geometry) as proposed_lng
            FROM store_proposals
            WHERE proposal_id = $1
            FOR UPDATE
            ",
        )
        .bind(input.proposal_id)
        .fetch_optional(&mut *tx)
        .await?
        .ok_or_else(|| async_graphql::Error::new("Proposal not found"))?;

        let status_str: String = proposal_row.get("status");
        if status_str != "pending" {
            return Err(async_graphql::Error::new(format!(
                "Proposal is not pending (current: {status_str})"
            )));
        }

        let kind_str: String = proposal_row.get("kind");
        let payload: serde_json::Value = proposal_row.get("payload");
        let target_store_id: Option<Uuid> = proposal_row.get("target_store_id");
        let target_version: Option<i64> = proposal_row.get("target_version");
        let proposer_user_id: Uuid = proposal_row.get("proposer_user_id");

        match input.decision {
            ReviewDecision::Reject => {
                // Mark rejected
                sqlx::query(
                    r"
                    UPDATE store_proposals
                    SET status = 'rejected', reviewed_by = $1, reviewed_at = now(), review_note = $2
                    WHERE proposal_id = $3
                    ",
                )
                .bind(auth.user_id)
                .bind(&input.note)
                .bind(input.proposal_id)
                .execute(&mut *tx)
                .await?;

                // Decrement trust
                sqlx::query("UPDATE users SET trust_score = trust_score - 3 WHERE user_id = $1")
                    .bind(proposer_user_id)
                    .execute(&mut *tx)
                    .await?;

                sqlx::query(
                    "INSERT INTO proposal_audit_log (proposal_id, action, actor_user_id) VALUES ($1, 'rejected', $2)",
                )
                .bind(input.proposal_id)
                .bind(auth.user_id)
                .execute(&mut *tx)
                .await?;
            }
            ReviewDecision::Approve => {
                // For update/delete: check version
                if let (Some(target_id), Some(expected_ver)) = (target_store_id, target_version) {
                    let store_row = sqlx::query("SELECT version FROM stores WHERE store_id = $1 FOR UPDATE")
                        .bind(target_id)
                        .fetch_optional(&mut *tx)
                        .await?;

                    match store_row {
                        Some(sr) => {
                            let current_ver: i64 = sr.get("version");
                            if current_ver != expected_ver {
                                // Superseded
                                sqlx::query(
                                    r"
                                    UPDATE store_proposals
                                    SET status = 'superseded', reviewed_by = $1, reviewed_at = now(),
                                        review_note = 'Target store version changed since submission'
                                    WHERE proposal_id = $2
                                    ",
                                )
                                .bind(auth.user_id)
                                .bind(input.proposal_id)
                                .execute(&mut *tx)
                                .await?;

                                sqlx::query(
                                    "INSERT INTO proposal_audit_log (proposal_id, action, actor_user_id, details) VALUES ($1, 'superseded', $2, $3)",
                                )
                                .bind(input.proposal_id)
                                .bind(auth.user_id)
                                .bind(serde_json::json!({
                                    "expected_version": expected_ver,
                                    "current_version": current_ver,
                                }))
                                .execute(&mut *tx)
                                .await?;

                                tx.commit().await?;

                                // Re-fetch the updated proposal
                                let final_row = sqlx::query(
                                    r"
                                    SELECT proposal_id, kind::text, status::text, target_store_id, target_version,
                                           payload, proposer_user_id, client_nonce, created_at,
                                           reviewed_by, reviewed_at, review_note,
                                           ST_Y(proposed_location::geometry) as proposed_lat,
                                           ST_X(proposed_location::geometry) as proposed_lng
                                    FROM store_proposals WHERE proposal_id = $1
                                    ",
                                )
                                .bind(input.proposal_id)
                                .fetch_one(pool)
                                .await?;

                                return Ok(proposal_from_row(&final_row));
                            }
                        }
                        None => {
                            return Err(async_graphql::Error::new("Target store no longer exists"));
                        }
                    }
                }

                // Apply the change based on kind
                match kind_str.as_str() {
                    "create" => {
                        let name = payload["name"].as_str().unwrap_or("");
                        let address = payload["address"].as_str().unwrap_or("");
                        let lat = payload["lat"].as_f64().unwrap_or(0.0);
                        let lng = payload["lng"].as_f64().unwrap_or(0.0);

                        let store_row = sqlx::query(
                            r"
                            INSERT INTO stores (name, address, location)
                            VALUES ($1, $2, ST_SetSRID(ST_Point($3, $4), 4326)::geography)
                            RETURNING store_id
                            ",
                        )
                        .bind(name)
                        .bind(address)
                        .bind(lng)
                        .bind(lat)
                        .fetch_one(&mut *tx)
                        .await?;

                        let new_store_id: Uuid = store_row.get("store_id");

                        if let Some(product_ids) = payload["product_ids"].as_array() {
                            for pid in product_ids {
                                if let Some(pid_str) = pid.as_str() {
                                    if let Ok(pid_uuid) = Uuid::parse_str(pid_str) {
                                        sqlx::query("INSERT INTO store_products (store_id, product_id) VALUES ($1, $2)")
                                            .bind(new_store_id)
                                            .bind(pid_uuid)
                                            .execute(&mut *tx)
                                            .await?;
                                    }
                                }
                            }
                        }

                        // Update the proposal with the new store_id
                        sqlx::query("UPDATE store_proposals SET target_store_id = $1 WHERE proposal_id = $2")
                            .bind(new_store_id)
                            .bind(input.proposal_id)
                            .execute(&mut *tx)
                            .await?;
                    }
                    "update" => {
                        let target_id = target_store_id.unwrap();

                        if let Some(name) = payload.get("name").and_then(|v| v.as_str()) {
                            sqlx::query("UPDATE stores SET name = $1 WHERE store_id = $2")
                                .bind(name)
                                .bind(target_id)
                                .execute(&mut *tx)
                                .await?;
                        }
                        if let Some(address) = payload.get("address").and_then(|v| v.as_str()) {
                            sqlx::query("UPDATE stores SET address = $1 WHERE store_id = $2")
                                .bind(address)
                                .bind(target_id)
                                .execute(&mut *tx)
                                .await?;
                        }
                        if let (Some(lat), Some(lng)) = (
                            payload.get("lat").and_then(|v| v.as_f64()),
                            payload.get("lng").and_then(|v| v.as_f64()),
                        ) {
                            sqlx::query("UPDATE stores SET location = ST_SetSRID(ST_Point($1, $2), 4326)::geography WHERE store_id = $3")
                                .bind(lng)
                                .bind(lat)
                                .bind(target_id)
                                .execute(&mut *tx)
                                .await?;
                        }
                        if let Some(product_ids) = payload.get("product_ids").and_then(|v| v.as_array()) {
                            sqlx::query("DELETE FROM store_products WHERE store_id = $1")
                                .bind(target_id)
                                .execute(&mut *tx)
                                .await?;
                            for pid in product_ids {
                                if let Some(pid_str) = pid.as_str() {
                                    if let Ok(pid_uuid) = Uuid::parse_str(pid_str) {
                                        sqlx::query("INSERT INTO store_products (store_id, product_id) VALUES ($1, $2)")
                                            .bind(target_id)
                                            .bind(pid_uuid)
                                            .execute(&mut *tx)
                                            .await?;
                                    }
                                }
                            }
                        }

                        // Bump version
                        sqlx::query("UPDATE stores SET version = version + 1 WHERE store_id = $1")
                            .bind(target_id)
                            .execute(&mut *tx)
                            .await?;
                    }
                    "delete" => {
                        let target_id = target_store_id.unwrap();
                        sqlx::query("DELETE FROM stores WHERE store_id = $1")
                            .bind(target_id)
                            .execute(&mut *tx)
                            .await?;
                    }
                    _ => {}
                }

                // Mark approved
                sqlx::query(
                    r"
                    UPDATE store_proposals
                    SET status = 'approved', reviewed_by = $1, reviewed_at = now(), review_note = $2
                    WHERE proposal_id = $3
                    ",
                )
                .bind(auth.user_id)
                .bind(&input.note)
                .bind(input.proposal_id)
                .execute(&mut *tx)
                .await?;

                // Increment proposer trust
                sqlx::query("UPDATE users SET trust_score = trust_score + 1 WHERE user_id = $1")
                    .bind(proposer_user_id)
                    .execute(&mut *tx)
                    .await?;

                // Audit entries
                sqlx::query(
                    "INSERT INTO proposal_audit_log (proposal_id, action, actor_user_id) VALUES ($1, 'approved', $2), ($1, 'applied', $2)",
                )
                .bind(input.proposal_id)
                .bind(auth.user_id)
                .execute(&mut *tx)
                .await?;
            }
        }

        tx.commit().await?;

        // Re-fetch the final state
        let final_row = sqlx::query(
            r"
            SELECT proposal_id, kind::text, status::text, target_store_id, target_version,
                   payload, proposer_user_id, client_nonce, created_at,
                   reviewed_by, reviewed_at, review_note,
                   ST_Y(proposed_location::geometry) as proposed_lat,
                   ST_X(proposed_location::geometry) as proposed_lng
            FROM store_proposals WHERE proposal_id = $1
            ",
        )
        .bind(input.proposal_id)
        .fetch_one(pool)
        .await?;

        Ok(proposal_from_row(&final_row))
    }
}
