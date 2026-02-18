use async_graphql::SimpleObject;
use chrono::{DateTime, Utc};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(SimpleObject, FromRow, Clone, Debug)]
pub struct Product {
    pub product_id: Uuid,
    pub name: String,
    pub brand: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use uuid::Uuid;

    #[test]
    fn test_product_creation() {
        let id = Uuid::new_v4();
        let now = Utc::now();
        let product = Product {
            product_id: id,
            name: "Test Product".to_string(),
            brand: "Test Brand".to_string(),
            created_at: now,
            updated_at: now,
        };
        assert_eq!(product.product_id, id);
        assert_eq!(product.name, "Test Product");
        assert_eq!(product.brand, "Test Brand");
    }
}
