use crate::auth::AuthenticatedUser;
use crate::model::user::User;
use async_graphql::{Context, InputObject, Object};
use sqlx::{PgPool, Row};

#[derive(Default)]
pub struct UserCommand;

#[derive(InputObject)]
pub struct SetUserRoleInput {
    pub firebase_uid: String,
    pub role: String,
    pub region: Option<String>,
}

#[Object]
impl UserCommand {
    async fn set_user_role(
        &self,
        ctx: &Context<'_>,
        input: SetUserRoleInput,
    ) -> async_graphql::Result<User> {
        let auth = ctx
            .data_opt::<AuthenticatedUser>()
            .ok_or_else(|| async_graphql::Error::new("Unauthorized"))?;

        if auth.role != "admin" {
            return Err(async_graphql::Error::new("Forbidden: admin required"));
        }

        // Validate role value
        if !["contributor", "moderator", "admin"].contains(&input.role.as_str()) {
            return Err(async_graphql::Error::new(
                "Invalid role. Must be contributor, moderator, or admin",
            ));
        }

        let pool = ctx.data::<PgPool>()?;

        let row = sqlx::query(
            r"
            UPDATE users SET role = $1, region = $2, updated_at = now()
            WHERE firebase_uid = $3
            RETURNING user_id, firebase_uid, email, display_name, role, region,
                      trust_score, email_verified, created_at, updated_at
            ",
        )
        .bind(&input.role)
        .bind(&input.region)
        .bind(&input.firebase_uid)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| async_graphql::Error::new("User not found"))?;

        Ok(User {
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
        })
    }
}
