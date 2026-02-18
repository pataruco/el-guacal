use async_graphql::SimpleObject;
use serde::{Deserialize, Serialize};

#[derive(SimpleObject, Serialize, Deserialize, Clone, Debug)]
pub struct Location {
    pub lat: f64,
    pub lng: f64,
}

impl Location {
    #[must_use]
    pub fn new(lat: f64, lng: f64) -> Self {
        Location { lat, lng }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_location_new() {
        let lat = 51.5074;
        let lng = -0.1278;
        let loc = Location::new(lat, lng);
        assert_eq!(loc.lat, lat);
        assert_eq!(loc.lng, lng);
    }
}
