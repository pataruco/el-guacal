use sqlx::{PgPool, Row};

/// Checks and consumes a rate-limit token for the given key.
///
/// # Errors
///
/// Returns an error if the database query fails.
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

    let tokens: i32 = row.get("tokens");
    Ok(tokens >= 0)
}

/// Returns rate-limit parameters based on user role and trust score.
#[must_use]
pub fn rate_limit_params(role: &str, trust_score: i32) -> (i32, f64) {
    match role {
        "admin" | "moderator" => (500, 1.0),
        _ if trust_score >= 10 => (100, 1.0 / 180.0), // +1 every 3 min
        _ => (20, 1.0 / 900.0),                        // +1 every 15 min
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_admin_gets_high_capacity() {
        let (capacity, refill) = rate_limit_params("admin", 0);
        assert_eq!(capacity, 500);
        assert!((refill - 1.0).abs() < f64::EPSILON);
    }

    #[test]
    fn test_moderator_gets_high_capacity() {
        let (capacity, refill) = rate_limit_params("moderator", 0);
        assert_eq!(capacity, 500);
        assert!((refill - 1.0).abs() < f64::EPSILON);
    }

    #[test]
    fn test_trusted_contributor_gets_medium_capacity() {
        let (capacity, _) = rate_limit_params("contributor", 10);
        assert_eq!(capacity, 100);
    }

    #[test]
    fn test_new_contributor_gets_low_capacity() {
        let (capacity, _) = rate_limit_params("contributor", 0);
        assert_eq!(capacity, 20);
    }

    #[test]
    fn test_trust_threshold_boundary() {
        let (low_cap, _) = rate_limit_params("contributor", 9);
        let (high_cap, _) = rate_limit_params("contributor", 10);
        assert_eq!(low_cap, 20);
        assert_eq!(high_cap, 100);
    }
}
