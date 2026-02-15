use crate::model::location::Location;
use crate::model::product::Product;
use async_graphql::{Context, Object};
use chrono::{DateTime, Utc};
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Clone, Debug)]
pub struct Store {
    pub store_id: Uuid,
    pub name: String,
    pub address: String,
    pub location: Location,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[Object]
impl Store {
    async fn store_id(&self) -> Uuid {
        self.store_id
    }
    async fn name(&self) -> &str {
        &self.name
    }
    async fn address(&self) -> &str {
        &self.address
    }
    async fn location(&self) -> &Location {
        &self.location
    }
    async fn created_at(&self) -> DateTime<Utc> {
        self.created_at
    }
    async fn updated_at(&self) -> DateTime<Utc> {
        self.updated_at
    }

    async fn products(&self, ctx: &Context<'_>) -> async_graphql::Result<Vec<Product>> {
        let pool = ctx.data::<PgPool>()?;
        let rows = sqlx::query(
            r#"
            SELECT p.product_id, p.name, p.brand, p.created_at, p.updated_at
            FROM products p
            JOIN store_products sp ON p.product_id = sp.product_id
            WHERE sp.store_id = $1
            "#,
        )
        .bind(self.store_id)
        .fetch_all(pool)
        .await?;

        let products = rows
            .into_iter()
            .map(|row| {
                use sqlx::Row;
                Product {
                    product_id: row.get::<Uuid, _>("product_id"),
                    name: row.get::<String, _>("name"),
                    brand: row.get::<String, _>("brand"),
                    created_at: row.get::<DateTime<Utc>, _>("created_at"),
                    updated_at: row.get::<DateTime<Utc>, _>("updated_at"),
                }
            })
            .collect();

        Ok(products)
    }
}
