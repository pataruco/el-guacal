use async_graphql::SimpleObject;
use serde::{Deserialize, Serialize};

#[derive(SimpleObject, Serialize, Deserialize, Clone, Debug)]
pub struct Location {
    pub lat: f64,
    pub lng: f64,
}

impl Location {
    pub fn new(lat: f64, lng: f64) -> Self {
        Location { lat, lng }
    }
}
