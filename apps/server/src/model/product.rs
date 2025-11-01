use uuid::Uuid;

pub struct Product {
    brand: String,
    created_at: String,
    id: Uuid,
    name: String,
    updated_at: Option<String>,
}

impl Product {
    pub fn new(name: String, brand: String) -> Self {
        Product {
            brand,
            created_at: chrono::offset::Utc::now().to_string(),
            id: Uuid::new_v4(),
            name,
            updated_at: None,
        }
    }
}
