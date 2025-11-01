use crate::model::{location::Location, product::Product};
use chrono;
use uuid::Uuid;

pub struct Store {
    address: String,
    created_at: String,
    id: Uuid,
    location: Location,
    name: String,
    products: Option<Vec<Product>>,
    updated_at: Option<String>,
}

impl Store {
    pub fn new(
        address: String,
        location: Location,
        name: String,
        products: Option<Vec<Product>>,
    ) -> Self {
        Store {
            address,
            created_at: chrono::offset::Utc::now().to_string(),
            id: Uuid::new_v4(),
            location,
            name,
            products,
            updated_at: None,
        }
    }
}
