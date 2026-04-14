use sqlx::PgPool;

/// Checks and consumes a rate-limit token for the given key.
/// Returns `Ok(true)` if the request is allowed, `Ok(false)` if rate-limited.
pub async fn check_rate_limit(
    pool: &PgPool,
    key: &str,
    capacity: i32,
    refill_per_s: f64,
) -> anyhow::Result<bool> {
    let row = sqlx::query(
        r"
        INSERT INTO submission_quota (key, tokens, capacity, refill_per_s, refilled_at)
        VALUES ($1, $2 - 1, $2, $3, now())
        ON CONFLICT (key) DO UPDATE SET
            tokens = LEAST(
                submission_quota.capacity,
                submission_quota.tokens +
                    FLOOR(EXTRACT(EPOCH FROM (now() - submission_quota.refilled_at)) * submission_quota.refill_per_s)::integer
            ) - 1,
            refilled_at = CASE
                WHEN EXTRACT(EPOCH FROM (now() - submission_quota.refilled_at)) * submission_quota.refill_per_s >= 1
                THEN now()
                ELSE submission_quota.refilled_at
            END
        RETURNING tokens
        ",
    )
    .bind(key)
    .bind(capacity)
    .bind(refill_per_s)
    .fetch_one(pool)
    .await?;

    use sqlx::Row;
    let tokens: i32 = row.get("tokens");
    Ok(tokens >= 0)
}

/// Returns rate-limit parameters based on user role and trust score.
pub fn rate_limit_params(role: &str, trust_score: i32) -> (i32, f64) {
    match role {
        "admin" | "moderator" => (500, 1.0),
        _ if trust_score >= 10 => (100, 1.0 / 180.0), // +1 every 3 min
        _ => (20, 1.0 / 900.0),                        // +1 every 15 min
    }
}
