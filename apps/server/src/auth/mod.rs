use jsonwebtoken::{DecodingKey, Validation, decode, decode_header};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, RwLock};
use std::time::{Duration, Instant};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FirebaseUser {
    pub uid: String,
    pub email: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    sub: String,
    email: Option<String>,
    aud: String,
    iss: String,
    exp: usize,
}

pub struct FirebaseVerifier {
    project_id: String,
    keys_cache: Arc<RwLock<Option<(HashMap<String, String>, Instant)>>>,
}

impl FirebaseVerifier {
    pub fn new(project_id: String) -> Self {
        Self {
            project_id,
            keys_cache: Arc::new(RwLock::new(None)),
        }
    }

    async fn get_public_keys(&self) -> anyhow::Result<HashMap<String, String>> {
        if let Some((keys, expiry)) = self.keys_cache.read().unwrap().as_ref() {
            if expiry > &Instant::now() {
                return Ok(keys.clone());
            }
        }

        let response = reqwest::get("https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com").await?;
        let keys: HashMap<String, String> = response.json().await?;

        let mut cache = self.keys_cache.write().unwrap();
        *cache = Some((keys.clone(), Instant::now() + Duration::from_secs(3600)));

        Ok(keys)
    }

    pub async fn verify_token(&self, token: &str) -> anyhow::Result<FirebaseUser> {
        let header = decode_header(token)?;
        let kid = header.kid.ok_or_else(|| anyhow::anyhow!("Missing kid"))?;

        let keys = self.get_public_keys().await?;
        let cert = keys.get(&kid).ok_or_else(|| anyhow::anyhow!("Invalid kid"))?;

        let mut validation = Validation::new(jsonwebtoken::Algorithm::RS256);
        validation.set_audience(&[&self.project_id]);
        validation.set_issuer(&[format!("https://securetoken.google.com/{}", self.project_id)]);

        let token_data = decode::<Claims>(
            token,
            &DecodingKey::from_rsa_pem(cert.as_bytes())?,
            &validation,
        )?;

        Ok(FirebaseUser {
            uid: token_data.claims.sub,
            email: token_data.claims.email,
        })
    }
}
