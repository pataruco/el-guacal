use sqlx::PgPool;
use crate::model::user::{User, UserRole};

/// Checks if the user has enough tokens to perform a submission.
///
/// # Errors
/// Returns an error message if the rate limit is exceeded or a database error occurs.
pub async fn check_rate_limit(pool: &PgPool, user: &User) -> Result<(), String> {
    let (capacity, refill_per_s) = match user.role {
        UserRole::Admin | UserRole::Moderator => (500, 1.0),
        UserRole::Contributor if user.trust_score >= 10 => (100, 0.00556), // 1 per 3 min
        UserRole::Contributor => (20, 0.00111), // 1 per 15 min
    };

    let key = format!("uid:{}", user.firebase_uid);

    let row = sqlx::query(
        r"
        INSERT INTO submission_quota (key, tokens, capacity, refill_per_s, refilled_at)
        VALUES ($1, $2 - 1, $2, $3, now())
        ON CONFLICT (key) DO UPDATE SET
          tokens = GREATEST(
            0,
            LEAST(
              submission_quota.capacity,
              submission_quota.tokens + FLOOR(
                EXTRACT(EPOCH FROM now() - submission_quota.refilled_at) * submission_quota.refill_per_s
              )::int
            ) - 1
          ),
          refilled_at = now()
        RETURNING tokens
        ",
    )
    .bind(&key)
    .bind(capacity)
    .bind(refill_per_s)
    .fetch_one(pool)
    .await;

    row.map_or_else(|_| Err("Rate limit exceeded. Please try again later.".to_string()), |r| {
        use sqlx::Row;
        let tokens: i32 = r.get("tokens");
        if tokens >= 0 {
            Ok(())
        } else {
            Err("Rate limit exceeded. Please try again later.".to_string())
        }
    })
}
