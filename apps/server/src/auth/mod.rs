use jsonwebtoken::{DecodingKey, Validation, decode, decode_header};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use std::collections::HashMap;
use std::sync::{Arc, RwLock};
use std::time::{Duration, Instant};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FirebaseUser {
    pub uid: String,
    pub email: Option<String>,
    pub email_verified: bool,
}

#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    sub: String,
    email: Option<String>,
    email_verified: Option<bool>,
    aud: String,
    iss: String,
    exp: usize,
}

type KeysCache = Arc<RwLock<Option<(HashMap<String, String>, Instant)>>>;

pub struct FirebaseVerifier {
    project_id: String,
    keys_cache: KeysCache,
}

impl FirebaseVerifier {
    #[must_use]
    pub fn new(project_id: String) -> Self {
        Self {
            project_id,
            keys_cache: Arc::new(RwLock::new(None)),
        }
    }

    async fn get_public_keys(&self) -> anyhow::Result<HashMap<String, String>> {
        if let Some((keys, expiry)) = self.keys_cache.read().unwrap().as_ref()
            && expiry > &Instant::now()
        {
            return Ok(keys.clone());
        }

        let response = reqwest::get("https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com").await?;
        let keys: HashMap<String, String> = response.json().await?;

        {
            let mut cache = self.keys_cache.write().unwrap();
            *cache = Some((keys.clone(), Instant::now() + Duration::from_secs(3600)));
        }

        Ok(keys)
    }

    /// Verifies a Firebase ID token and returns the associated user.
    ///
    /// # Errors
    ///
    /// Returns an error if the token header is missing a `kid`, the public key
    /// cannot be fetched or matched, or the token fails JWT validation.
    pub async fn verify_token(&self, token: &str) -> anyhow::Result<FirebaseUser> {
        let header = decode_header(token)?;
        let kid = header.kid.ok_or_else(|| anyhow::anyhow!("Missing kid"))?;

        let keys = self.get_public_keys().await?;
        let cert = keys
            .get(&kid)
            .ok_or_else(|| anyhow::anyhow!("Invalid kid"))?;

        let mut validation = Validation::new(jsonwebtoken::Algorithm::RS256);
        validation.set_audience(&[&self.project_id]);
        validation.set_issuer(&[format!(
            "https://securetoken.google.com/{}",
            self.project_id
        )]);

        let token_data = decode::<Claims>(
            token,
            &DecodingKey::from_rsa_pem(cert.as_bytes())?,
            &validation,
        )?;

        Ok(FirebaseUser {
            uid: token_data.claims.sub,
            email: token_data.claims.email,
            email_verified: token_data.claims.email_verified.unwrap_or(false),
        })
    }
}

/// The authenticated user's Postgres identity, injected by the middleware.
#[derive(Debug, Clone)]
pub struct AuthenticatedUser {
    pub user_id: Uuid,
    pub role: String,
}

/// Upserts a Firebase user into the `users` table, returning their user_id and role.
pub async fn upsert_user(
    pool: &PgPool,
    firebase_user: &FirebaseUser,
) -> anyhow::Result<(Uuid, String)> {
    let row = sqlx::query(
        r"
        INSERT INTO users (firebase_uid, email, email_verified)
        VALUES ($1, $2, $3)
        ON CONFLICT (firebase_uid) DO UPDATE
            SET email = EXCLUDED.email,
                email_verified = EXCLUDED.email_verified,
                updated_at = now()
        RETURNING user_id, role
        ",
    )
    .bind(&firebase_user.uid)
    .bind(&firebase_user.email)
    .bind(firebase_user.email_verified)
    .fetch_one(pool)
    .await?;

    use sqlx::Row;
    Ok((row.get("user_id"), row.get("role")))
}

/// Seeds the admin user on startup if SEED_ADMIN_FIREBASE_UID is set.
pub async fn seed_admin(pool: &PgPool, firebase_uid: &str) -> anyhow::Result<()> {
    sqlx::query(
        r"
        INSERT INTO users (firebase_uid, role)
        VALUES ($1, 'admin')
        ON CONFLICT (firebase_uid) DO UPDATE SET role = 'admin', updated_at = now()
        ",
    )
    .bind(firebase_uid)
    .execute(pool)
    .await?;
    tracing::info!("Seeded admin user for firebase_uid={}", firebase_uid);
    Ok(())
}
