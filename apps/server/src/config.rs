use dotenvy::dotenv;
use serde::Deserialize;
use std::env;

const fn default_port() -> u16 {
    8000
}

fn default_database_url() -> String {
    "postgres://pataruco:pataruco@localhost/productsdb".to_string()
}

#[derive(Debug, Clone, Deserialize)]
pub struct Config {
    #[serde(default = "default_port")]
    pub port: u16,
    pub database_url: String,
}

impl Config {
    /// Creates a new `Config` instance from environment variables.
    ///
    /// # Errors
    ///
    /// Returns an error if the `PORT` environment variable is set
    pub fn new() -> Result<Self, anyhow::Error> {
        dotenv().ok();

        let port = env::var("PORT")
            .map(|p| p.parse::<u16>())
            .unwrap_or(Ok(default_port()))?;

        let config = Self {
            port,
            database_url: env::var("DATABASE_URL").unwrap_or_else(|_| default_database_url()),
        };

        Ok(config)
    }
}
