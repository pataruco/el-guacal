pub struct Location {
    lat: f64,
    lng: f64,
}

impl Location {
    pub fn new(lat: f64, lng: f64) -> Self {
        Location { lat, lng }
    }
}
