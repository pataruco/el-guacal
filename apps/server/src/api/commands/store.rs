use crate::auth::{AuthenticatedUser, FirebaseUser};
use crate::model::location::Location;
use crate::model::store::Store;
use async_graphql::{Context, InputObject, Object};
use chrono::{DateTime, Utc};
use sqlx::{PgPool, Row};
use uuid::Uuid;

#[derive(Default)]
pub struct StoreCommand;

#[derive(InputObject)]
pub struct CreateStoreInput {
    pub name: String,
    pub address: String,
    pub lat: f64,
    pub lng: f64,
    pub product_ids: Vec<Uuid>,
}

#[derive(InputObject)]
pub struct UpdateStoreInput {
    pub store_id: Uuid,
    pub name: Option<String>,
    pub address: Option<String>,
    pub lat: Option<f64>,
    pub lng: Option<f64>,
    pub product_ids: Option<Vec<Uuid>>,
}

#[Object]
impl StoreCommand {
    #[graphql(deprecation = "Use submitCreateStoreProposal. Kept for admin bulk imports.")]
    async fn create_store(
        &self,
        ctx: &Context<'_>,
        input: CreateStoreInput,
    ) -> async_graphql::Result<Store> {
        let _user = ctx
            .data_opt::<FirebaseUser>()
            .ok_or_else(|| async_graphql::Error::new("Unauthorized"))?;

        // Gate to admin only (deprecated — use submitCreateStoreProposal)
        if let Some(auth) = ctx.data_opt::<AuthenticatedUser>()
            && auth.role != "admin"
        {
            return Err(async_graphql::Error::new(
                "Forbidden: use submitCreateStoreProposal instead. Direct mutations are admin-only.",
            ));
        }

        let pool = ctx.data::<PgPool>()?;

        let mut tx = pool.begin().await?;

        let row = sqlx::query(
            r"
            INSERT INTO stores (name, address, location)
            VALUES ($1, $2, ST_SetSRID(ST_Point($3, $4), 4326)::geography)
            RETURNING store_id, name, address, ST_Y(location::geometry) as lat, ST_X(location::geometry) as lng, version, created_at, updated_at
            ",
        )
        .bind(&input.name)
        .bind(&input.address)
        .bind(input.lng)
        .bind(input.lat)
        .fetch_one(&mut *tx)
        .await?;

        let store = Store {
            store_id: row.get::<Uuid, _>("store_id"),
            name: row.get::<String, _>("name"),
            address: row.get::<String, _>("address"),
            location: Location {
                lat: row.get::<f64, _>("lat"),
                lng: row.get::<f64, _>("lng"),
            },
            version: row.get::<i64, _>("version"),
            created_at: row.get::<DateTime<Utc>, _>("created_at"),
            updated_at: row.get::<DateTime<Utc>, _>("updated_at"),
        };

        for product_id in input.product_ids {
            sqlx::query("INSERT INTO store_products (store_id, product_id) VALUES ($1, $2)")
                .bind(store.store_id)
                .bind(product_id)
                .execute(&mut *tx)
                .await?;
        }

        tx.commit().await?;

        Ok(store)
    }

    #[graphql(deprecation = "Use submitUpdateStoreProposal. Kept for admin bulk imports.")]
    async fn update_store(
        &self,
        ctx: &Context<'_>,
        input: UpdateStoreInput,
    ) -> async_graphql::Result<Store> {
        let _user = ctx
            .data_opt::<FirebaseUser>()
            .ok_or_else(|| async_graphql::Error::new("Unauthorized"))?;

        // Gate to admin only (deprecated — use submitUpdateStoreProposal)
        if let Some(auth) = ctx.data_opt::<AuthenticatedUser>()
            && auth.role != "admin"
        {
            return Err(async_graphql::Error::new(
                "Forbidden: use submitUpdateStoreProposal instead. Direct mutations are admin-only.",
            ));
        }

        let pool = ctx.data::<PgPool>()?;
        let mut tx = pool.begin().await?;

        if let Some(name) = &input.name {
            sqlx::query("UPDATE stores SET name = $1 WHERE store_id = $2")
                .bind(name)
                .bind(input.store_id)
                .execute(&mut *tx)
                .await?;
        }

        if let Some(address) = &input.address {
            sqlx::query("UPDATE stores SET address = $1 WHERE store_id = $2")
                .bind(address)
                .bind(input.store_id)
                .execute(&mut *tx)
                .await?;
        }

        if let (Some(lat), Some(lng)) = (input.lat, input.lng) {
            sqlx::query(
                "UPDATE stores SET location = ST_SetSRID(ST_Point($1, $2), 4326)::geography WHERE store_id = $3",
            )
            .bind(lng)
            .bind(lat)
            .bind(input.store_id)
            .execute(&mut *tx)
            .await?;
        }

        if let Some(product_ids) = input.product_ids {
            sqlx::query("DELETE FROM store_products WHERE store_id = $1")
                .bind(input.store_id)
                .execute(&mut *tx)
                .await?;

            for product_id in product_ids {
                sqlx::query("INSERT INTO store_products (store_id, product_id) VALUES ($1, $2)")
                    .bind(input.store_id)
                    .bind(product_id)
                    .execute(&mut *tx)
                    .await?;
            }
        }

        let row = sqlx::query(
            r"
            SELECT store_id, name, address, ST_Y(location::geometry) as lat, ST_X(location::geometry) as lng, version, created_at, updated_at
            FROM stores
            WHERE store_id = $1
            ",
        )
        .bind(input.store_id)
        .fetch_one(&mut *tx)
        .await?;

        let store = Store {
            store_id: row.get::<Uuid, _>("store_id"),
            name: row.get::<String, _>("name"),
            address: row.get::<String, _>("address"),
            location: Location {
                lat: row.get::<f64, _>("lat"),
                lng: row.get::<f64, _>("lng"),
            },
            version: row.get::<i64, _>("version"),
            created_at: row.get::<DateTime<Utc>, _>("created_at"),
            updated_at: row.get::<DateTime<Utc>, _>("updated_at"),
        };

        tx.commit().await?;

        Ok(store)
    }

    #[graphql(deprecation = "Use submitDeleteStoreProposal. Kept for admin emergencies.")]
    async fn delete_store(&self, ctx: &Context<'_>, id: Uuid) -> async_graphql::Result<bool> {
        let _user = ctx
            .data_opt::<FirebaseUser>()
            .ok_or_else(|| async_graphql::Error::new("Unauthorized"))?;

        // Gate to admin only (deprecated — use submitDeleteStoreProposal)
        if let Some(auth) = ctx.data_opt::<AuthenticatedUser>()
            && auth.role != "admin"
        {
            return Err(async_graphql::Error::new(
                "Forbidden: use submitDeleteStoreProposal instead. Direct mutations are admin-only.",
            ));
        }

        let pool = ctx.data::<PgPool>()?;

        let result = sqlx::query("DELETE FROM stores WHERE store_id = $1")
            .bind(id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }
}
