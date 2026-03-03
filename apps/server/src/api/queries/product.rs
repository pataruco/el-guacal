use async_graphql::{Context, Object, Result};
use sqlx::PgPool;

use crate::model::product::Product;

#[derive(Default)]
pub struct ProductQuery;

#[Object]
impl ProductQuery {
    async fn all_products(&self, ctx: &Context<'_>) -> Result<Vec<Product>> {
        let pool = ctx.data::<PgPool>()?;
        let products = sqlx::query_as::<_, Product>(
            r"
            SELECT product_id, name, brand, created_at, updated_at
            FROM products
            ORDER BY name ASC
            ",
        )
        .fetch_all(pool)
        .await?;

        Ok(products)
    }
}
