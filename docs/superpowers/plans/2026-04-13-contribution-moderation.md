# Contribution & Moderation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a moderation pipeline so that all store submissions (create, update, delete) go through a review queue before touching canonical tables.

**Architecture:** A new `users` table mirrors Firebase uids with app-level roles. A `store_proposals` table holds pending submissions with jsonb payloads. New GraphQL mutations (`submit*Proposal`, `reviewStoreProposal`) replace the direct write path. Approval applies changes atomically in a Postgres transaction. The read path (`storesNear`, `getStoreById`) is unchanged.

**Tech Stack:** Rust/Axum + async-graphql + sqlx (runtime queries) + Postgres/PostGIS + Firebase Auth. React Router + RTK Query + Formik + i18next on the frontend.

**Design doc:** `docs/design/contribution-and-moderation.md`

---

## File Map

### Backend (apps/server/)

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `migrations/20260413000000_contribution_moderation.sql` | New tables: `users`, `store_proposals`, `proposal_audit_log`, `submission_quota`; `stores.version` column |
| Create | `src/model/user.rs` | `User` struct + async-graphql `#[Object]` |
| Create | `src/model/proposal.rs` | `StoreProposal`, enums (`ProposalKind`, `ProposalStatus`, `ReviewDecision`), `StoreDiff`, connection types |
| Modify | `src/model/mod.rs` | Add `pub mod user; pub mod proposal;` |
| Modify | `src/model/store.rs` | Add `version: i64` field to `Store` struct |
| Create | `src/api/commands/proposal.rs` | `ProposalCommand` — submit/withdraw/review mutations |
| Create | `src/api/commands/user.rs` | `UserCommand` — `setUserRole` mutation |
| Modify | `src/api/commands/mod.rs` | Add `pub mod proposal; pub mod user;` |
| Modify | `src/api/commands/store.rs` | Gate existing mutations behind `admin` role, mark deprecated |
| Create | `src/api/queries/proposal.rs` | `ProposalQuery` — `storeProposal`, `myStoreProposals`, `pendingStoreProposals` |
| Modify | `src/api/queries/mod.rs` | Add `pub mod proposal;` |
| Modify | `src/api/mod.rs` | Register new command/query structs in `Mutation`/`Query` MergedObjects |
| Create | `src/rate_limit.rs` | Token-bucket rate limiter backed by `submission_quota` table |
| Modify | `src/lib.rs` | Add `pub mod rate_limit;`, seed admin on startup |
| Modify | `src/config.rs` | Add `SEED_ADMIN_FIREBASE_UID` env var |
| Modify | `src/auth/mod.rs` | Add `email_verified` to `FirebaseUser`; add upsert-user-on-request helper |
| Modify | `src/main.rs` | Call admin seed on startup |
| Modify | `src/bin/export_schema.rs` | No changes needed (schema auto-discovers new MergedObjects) |
| Modify | `tests/api_tests.rs` | Add integration tests for proposal lifecycle |

### Frontend (apps/web/)

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `app/graphql/mutations/submit-create-proposal/index.graphql` | GraphQL mutation document |
| Create | `app/graphql/mutations/submit-update-proposal/index.graphql` | GraphQL mutation document |
| Create | `app/graphql/mutations/submit-delete-proposal/index.graphql` | GraphQL mutation document |
| Create | `app/graphql/mutations/withdraw-proposal/index.graphql` | GraphQL mutation document |
| Create | `app/graphql/queries/my-proposals/index.graphql` | GraphQL query document |
| Modify | `app/store/features/guacal-api/base.ts` | Add `'Proposal'` tag type |
| Modify | `app/store/features/guacal-api/enhanced.ts` | Wire up new endpoint cache tags |
| Modify | `app/components/store/StoreForm.tsx` | Add `clientNonce` field, adapt for proposal flow |
| Modify | `app/routes/_locale.stores.new.tsx` | Switch to `submitCreateStoreProposal`, show confirmation |
| Modify | `app/routes/_locale.stores.edit.tsx` | Switch to `submitUpdateStoreProposal`, show confirmation |
| Create | `app/routes/_locale.my-submissions.tsx` | "My submissions" page |
| Create | `app/components/proposal-status/index.tsx` | Status badge component |
| Create | `app/components/duplicate-warning/index.tsx` | Duplicate store warning screen |
| Modify | `app/i18n/translations/en-GB.json` | New keys for proposal UX copy |
| Modify | `app/i18n/translations/es-VE.json` | New keys for proposal UX copy |

---

## Task 1: Database Migration

**Files:**
- Create: `apps/server/migrations/20260413000000_contribution_moderation.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- 1. Users table — mirror of Firebase uid with app-level role and trust
CREATE TABLE users (
  user_id        uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  firebase_uid   text UNIQUE NOT NULL,
  email          text,
  display_name   text,
  role           text NOT NULL DEFAULT 'contributor'
                 CHECK (role IN ('contributor','moderator','admin')),
  region         text,
  trust_score    integer NOT NULL DEFAULT 0,
  email_verified boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at_users BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- 2. Optimistic concurrency on stores
ALTER TABLE stores ADD COLUMN version bigint NOT NULL DEFAULT 1;

-- 3. Proposal enums
CREATE TYPE proposal_kind   AS ENUM ('create','update','delete');
CREATE TYPE proposal_status AS ENUM ('pending','approved','rejected','withdrawn','superseded');

-- 4. Store proposals table
CREATE TABLE store_proposals (
  proposal_id        uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  kind               proposal_kind NOT NULL,
  status             proposal_status NOT NULL DEFAULT 'pending',
  target_store_id    uuid REFERENCES stores(store_id) ON DELETE SET NULL,
  target_version     bigint,
  payload            jsonb NOT NULL,
  proposed_location  geography(Point),
  proposer_user_id   uuid NOT NULL REFERENCES users(user_id),
  client_nonce       text NOT NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  reviewed_by        uuid REFERENCES users(user_id),
  reviewed_at        timestamptz,
  review_note        text,
  CONSTRAINT unique_pending_nonce UNIQUE (proposer_user_id, client_nonce)
);

CREATE INDEX idx_proposals_pending
  ON store_proposals (status, created_at)
  WHERE status = 'pending';

CREATE INDEX idx_proposals_target
  ON store_proposals (target_store_id)
  WHERE target_store_id IS NOT NULL;

CREATE INDEX idx_proposals_proposer
  ON store_proposals (proposer_user_id);

CREATE INDEX idx_proposals_location
  ON store_proposals USING GIST (proposed_location);

-- 5. Audit log
CREATE TABLE proposal_audit_log (
  audit_id       bigserial PRIMARY KEY,
  proposal_id    uuid NOT NULL REFERENCES store_proposals(proposal_id),
  action         text NOT NULL,
  actor_user_id  uuid REFERENCES users(user_id),
  at             timestamptz NOT NULL DEFAULT now(),
  details        jsonb
);

CREATE INDEX idx_audit_proposal ON proposal_audit_log (proposal_id);
CREATE INDEX idx_audit_time     ON proposal_audit_log (at);

-- 6. Rate-limiting token buckets
CREATE TABLE submission_quota (
  key          text PRIMARY KEY,
  tokens       integer NOT NULL,
  capacity     integer NOT NULL,
  refill_per_s double precision NOT NULL,
  refilled_at  timestamptz NOT NULL DEFAULT now()
);
```

- [ ] **Step 2: Run the migration locally**

Run: `cd apps/server && sqlx migrate run`
Expected: Migration applied successfully. Verify with `sqlx migrate info` showing the new migration as applied.

- [ ] **Step 3: Commit**

```bash
git add apps/server/migrations/20260413000000_contribution_moderation.sql
git commit -m "feat(server): add contribution & moderation migration

Creates users, store_proposals, proposal_audit_log, submission_quota
tables and adds version column to stores."
```

---

## Task 2: User Model & Auth Upsert

**Files:**
- Create: `apps/server/src/model/user.rs`
- Modify: `apps/server/src/model/mod.rs`
- Modify: `apps/server/src/auth/mod.rs`
- Modify: `apps/server/src/config.rs`

- [ ] **Step 1: Create the User model**

Create `apps/server/src/model/user.rs`:

```rust
use async_graphql::Object;
use chrono::{DateTime, Utc};
use uuid::Uuid;

#[derive(Clone, Debug)]
pub struct User {
    pub user_id: Uuid,
    pub firebase_uid: String,
    pub email: Option<String>,
    pub display_name: Option<String>,
    pub role: String,
    pub region: Option<String>,
    pub trust_score: i32,
    pub email_verified: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[Object]
impl User {
    async fn user_id(&self) -> Uuid {
        self.user_id
    }
    async fn display_name(&self) -> Option<&str> {
        self.display_name.as_deref()
    }
    async fn role(&self) -> &str {
        &self.role
    }
    async fn trust_score(&self) -> i32 {
        self.trust_score
    }
    async fn region(&self) -> Option<&str> {
        self.region.as_deref()
    }
}
```

- [ ] **Step 2: Register the module**

In `apps/server/src/model/mod.rs`, add:

```rust
pub mod user;
```

So it becomes:

```rust
pub mod location;
pub mod product;
pub mod store;
pub mod user;
```

- [ ] **Step 3: Add `email_verified` to `FirebaseUser` and add upsert helper**

In `apps/server/src/auth/mod.rs`:

1. Add `email_verified` field to `FirebaseUser`:

```rust
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FirebaseUser {
    pub uid: String,
    pub email: Option<String>,
    pub email_verified: bool,
}
```

2. Add `email_verified` to `Claims`:

```rust
#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    sub: String,
    email: Option<String>,
    email_verified: Option<bool>,
    aud: String,
    iss: String,
    exp: usize,
}
```

3. Update `verify_token` return:

```rust
Ok(FirebaseUser {
    uid: token_data.claims.sub,
    email: token_data.claims.email,
    email_verified: token_data.claims.email_verified.unwrap_or(false),
})
```

4. Add a standalone upsert function at the bottom of the file:

```rust
use sqlx::PgPool;
use uuid::Uuid;

/// Upserts a Firebase user into the `users` table, returning their user_id and role.
/// Called on every authenticated request from the middleware.
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
```

- [ ] **Step 4: Add `SEED_ADMIN_FIREBASE_UID` to Config**

In `apps/server/src/config.rs`, add the field and read it:

```rust
#[derive(Debug, Clone, Deserialize)]
pub struct Config {
    #[serde(default = "default_port")]
    pub port: u16,
    pub database_url: String,
    pub cors_allowed_origins: Vec<String>,
    pub gcp_project_id: Option<String>,
    pub seed_admin_firebase_uid: Option<String>,
}
```

And in `Config::new()`, add before the `Ok`:

```rust
seed_admin_firebase_uid: env::var("SEED_ADMIN_FIREBASE_UID").ok(),
```

- [ ] **Step 5: Update `FirebaseUser` construction in tests**

In `apps/server/tests/api_tests.rs`, update all `FirebaseUser` construction to include the new field:

```rust
let user = server::auth::FirebaseUser {
    uid: "test-user".to_string(),
    email: Some("test@example.com".to_string()),
    email_verified: true,
};
```

(Apply this to all four test functions that create a `FirebaseUser`.)

- [ ] **Step 6: Verify it compiles**

Run: `cd apps/server && cargo check`
Expected: Compiles without errors.

- [ ] **Step 7: Commit**

```bash
git add apps/server/src/model/user.rs apps/server/src/model/mod.rs \
       apps/server/src/auth/mod.rs apps/server/src/config.rs \
       apps/server/tests/api_tests.rs
git commit -m "feat(server): add User model, upsert-on-auth, and seed admin config"
```

---

## Task 3: User Upsert Middleware & Admin Seed on Startup

**Files:**
- Modify: `apps/server/src/lib.rs`
- Modify: `apps/server/src/main.rs`

- [ ] **Step 1: Update the GraphQL POST handler to upsert users**

In `apps/server/src/lib.rs`, inside the `create_router` function, update the POST closure for `/graphql`. After verifying the Firebase token and getting `user`, upsert the user and inject both `FirebaseUser` and `(Uuid, String)` (user_id, role) into the request data:

Replace the existing auth block inside the POST handler:

```rust
if let Some(verifier) = verifier.as_ref()
    && let Some(auth_header) =
        headers.get(axum::http::header::AUTHORIZATION)
    && let Ok(auth_str) = auth_header.to_str()
    && let Some(token) = auth_str.strip_prefix("Bearer ")
    && let Ok(user) = verifier.verify_token(token).await
{
    // Upsert user into Postgres and get their user_id + role
    if let Ok((user_id, role)) =
        auth::upsert_user(&pool_clone, &user).await
    {
        req = req
            .data(user)
            .data(auth::AuthenticatedUser { user_id, role });
    } else {
        req = req.data(user);
    }
}
```

Add a new struct to `auth/mod.rs`:

```rust
/// The authenticated user's Postgres identity, injected by the middleware.
#[derive(Debug, Clone)]
pub struct AuthenticatedUser {
    pub user_id: Uuid,
    pub role: String,
}
```

The `create_router` function needs a clone of the pool for the closure. Add `let pool_clone = pool.clone();` before the router builder and pass it into the closure.

- [ ] **Step 2: Seed admin on startup**

In `apps/server/src/main.rs`, after `sqlx::migrate!().run(&pool).await`, add:

```rust
if let Some(admin_uid) = &config.seed_admin_firebase_uid {
    server::auth::seed_admin(&pool, admin_uid)
        .await
        .expect("Failed to seed admin user");
}
```

- [ ] **Step 3: Verify it compiles**

Run: `cd apps/server && cargo check`
Expected: Compiles without errors.

- [ ] **Step 4: Commit**

```bash
git add apps/server/src/lib.rs apps/server/src/main.rs apps/server/src/auth/mod.rs
git commit -m "feat(server): upsert user on every auth request, seed admin on startup"
```

---

## Task 4: Proposal Model & Enums

**Files:**
- Create: `apps/server/src/model/proposal.rs`
- Modify: `apps/server/src/model/mod.rs`
- Modify: `apps/server/src/model/store.rs`

- [ ] **Step 1: Add `version` to the Store model**

In `apps/server/src/model/store.rs`, add the field to the struct:

```rust
#[derive(Clone, Debug)]
pub struct Store {
    pub store_id: Uuid,
    pub name: String,
    pub address: String,
    pub location: Location,
    pub version: i64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
```

Add the GraphQL field resolver inside the `#[Object] impl Store` block:

```rust
async fn version(&self) -> i64 {
    self.version
}
```

- [ ] **Step 2: Update all Store construction sites to include `version`**

In `apps/server/src/api/commands/store.rs`, update the `create_store` SQL to also return `version`:

```sql
RETURNING store_id, name, address, ST_Y(location::geometry) as lat, ST_X(location::geometry) as lng, version, created_at, updated_at
```

And the Store construction:

```rust
let store = Store {
    store_id: row.get::<Uuid, _>("store_id"),
    name: row.get::<String, _>("name"),
    address: row.get::<String, _>("address"),
    location: Location {
        lat: row.get::<f64, _>("lat"),
        lng: row.get::<f64, _>("lng"),
    },
    version: row.get::<i64, _>("version"),
    created_at: row.get::<DateTime<Utc>, _>("created_at"),
    updated_at: row.get::<DateTime<Utc>, _>("updated_at"),
};
```

Apply the same change to `update_store`'s SELECT and Store construction, and to both query functions in `apps/server/src/api/queries/store.rs` (`stores_near` and `get_store_by_id`). Each SELECT needs `, version` added, and each Store construction needs `version: row.get::<i64, _>("version")`.

- [ ] **Step 3: Create the Proposal model**

Create `apps/server/src/model/proposal.rs`:

```rust
use crate::model::location::Location;
use crate::model::store::Store;
use crate::model::user::User;
use async_graphql::{Context, Enum, Object, SimpleObject};
use chrono::{DateTime, Utc};
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Enum, Copy, Clone, Eq, PartialEq, Debug)]
pub enum ProposalKind {
    Create,
    Update,
    Delete,
}

impl ProposalKind {
    pub fn as_db_str(self) -> &'static str {
        match self {
            Self::Create => "create",
            Self::Update => "update",
            Self::Delete => "delete",
        }
    }

    pub fn from_db_str(s: &str) -> Option<Self> {
        match s {
            "create" => Some(Self::Create),
            "update" => Some(Self::Update),
            "delete" => Some(Self::Delete),
            _ => None,
        }
    }
}

#[derive(Enum, Copy, Clone, Eq, PartialEq, Debug)]
pub enum ProposalStatus {
    Pending,
    Approved,
    Rejected,
    Withdrawn,
    Superseded,
}

impl ProposalStatus {
    pub fn as_db_str(self) -> &'static str {
        match self {
            Self::Pending => "pending",
            Self::Approved => "approved",
            Self::Rejected => "rejected",
            Self::Withdrawn => "withdrawn",
            Self::Superseded => "superseded",
        }
    }

    pub fn from_db_str(s: &str) -> Option<Self> {
        match s {
            "pending" => Some(Self::Pending),
            "approved" => Some(Self::Approved),
            "rejected" => Some(Self::Rejected),
            "withdrawn" => Some(Self::Withdrawn),
            "superseded" => Some(Self::Superseded),
            _ => None,
        }
    }
}

#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum ReviewDecision {
    Approve,
    Reject,
}

#[derive(SimpleObject, Clone, Debug)]
pub struct StoreDiff {
    pub field: String,
    pub before: Option<String>,
    pub after: Option<String>,
}

#[derive(Clone, Debug)]
pub struct StoreProposal {
    pub proposal_id: Uuid,
    pub kind: ProposalKind,
    pub status: ProposalStatus,
    pub target_store_id: Option<Uuid>,
    pub target_version: Option<i64>,
    pub payload: serde_json::Value,
    pub proposed_location: Option<Location>,
    pub proposer_user_id: Uuid,
    pub client_nonce: String,
    pub created_at: DateTime<Utc>,
    pub reviewed_by: Option<Uuid>,
    pub reviewed_at: Option<DateTime<Utc>>,
    pub review_note: Option<String>,
}

#[Object]
impl StoreProposal {
    async fn proposal_id(&self) -> Uuid {
        self.proposal_id
    }
    async fn kind(&self) -> ProposalKind {
        self.kind
    }
    async fn status(&self) -> ProposalStatus {
        self.status
    }
    async fn target_store_id(&self) -> Option<Uuid> {
        self.target_store_id
    }
    async fn target_version(&self) -> Option<i64> {
        self.target_version
    }
    async fn proposed_name(&self) -> Option<&str> {
        self.payload.get("name").and_then(|v| v.as_str())
    }
    async fn proposed_address(&self) -> Option<&str> {
        self.payload.get("address").and_then(|v| v.as_str())
    }
    async fn proposed_location(&self) -> Option<&Location> {
        self.proposed_location.as_ref()
    }
    async fn reason(&self) -> Option<&str> {
        self.payload.get("reason").and_then(|v| v.as_str())
    }
    async fn client_nonce(&self) -> &str {
        &self.client_nonce
    }
    async fn created_at(&self) -> DateTime<Utc> {
        self.created_at
    }
    async fn reviewed_at(&self) -> Option<DateTime<Utc>> {
        self.reviewed_at
    }
    async fn review_note(&self) -> Option<&str> {
        self.review_note.as_deref()
    }

    async fn proposer(&self, ctx: &Context<'_>) -> async_graphql::Result<Option<User>> {
        let pool = ctx.data::<PgPool>()?;
        let row = sqlx::query(
            "SELECT user_id, firebase_uid, email, display_name, role, region, trust_score, email_verified, created_at, updated_at FROM users WHERE user_id = $1",
        )
        .bind(self.proposer_user_id)
        .fetch_optional(pool)
        .await?;

        Ok(row.map(|row| {
            use sqlx::Row;
            User {
                user_id: row.get("user_id"),
                firebase_uid: row.get("firebase_uid"),
                email: row.get("email"),
                display_name: row.get("display_name"),
                role: row.get("role"),
                region: row.get("region"),
                trust_score: row.get("trust_score"),
                email_verified: row.get("email_verified"),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
            }
        }))
    }

    async fn reviewed_by_user(&self, ctx: &Context<'_>) -> async_graphql::Result<Option<User>> {
        let Some(reviewer_id) = self.reviewed_by else {
            return Ok(None);
        };
        let pool = ctx.data::<PgPool>()?;
        let row = sqlx::query(
            "SELECT user_id, firebase_uid, email, display_name, role, region, trust_score, email_verified, created_at, updated_at FROM users WHERE user_id = $1",
        )
        .bind(reviewer_id)
        .fetch_optional(pool)
        .await?;

        Ok(row.map(|row| {
            use sqlx::Row;
            User {
                user_id: row.get("user_id"),
                firebase_uid: row.get("firebase_uid"),
                email: row.get("email"),
                display_name: row.get("display_name"),
                role: row.get("role"),
                region: row.get("region"),
                trust_score: row.get("trust_score"),
                email_verified: row.get("email_verified"),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
            }
        }))
    }

    async fn possible_duplicates(&self, ctx: &Context<'_>) -> async_graphql::Result<Vec<Store>> {
        let Some(loc) = &self.proposed_location else {
            return Ok(vec![]);
        };
        if self.kind != ProposalKind::Create {
            return Ok(vec![]);
        }
        let pool = ctx.data::<PgPool>()?;
        let rows = sqlx::query(
            r"
            SELECT store_id, name, address,
                   ST_Y(location::geometry) as lat, ST_X(location::geometry) as lng,
                   version, created_at, updated_at
            FROM stores
            WHERE ST_DWithin(location, ST_SetSRID(ST_Point($1, $2), 4326)::geography, 100)
            ORDER BY ST_Distance(location, ST_SetSRID(ST_Point($1, $2), 4326)::geography)
            LIMIT 5
            ",
        )
        .bind(loc.lng)
        .bind(loc.lat)
        .fetch_all(pool)
        .await?;

        Ok(rows
            .into_iter()
            .map(|row| {
                use sqlx::Row;
                Store {
                    store_id: row.get("store_id"),
                    name: row.get("name"),
                    address: row.get("address"),
                    location: Location {
                        lat: row.get("lat"),
                        lng: row.get("lng"),
                    },
                    version: row.get("version"),
                    created_at: row.get("created_at"),
                    updated_at: row.get("updated_at"),
                }
            })
            .collect())
    }

    async fn diff_against_current(&self, ctx: &Context<'_>) -> async_graphql::Result<Vec<StoreDiff>> {
        let Some(target_id) = self.target_store_id else {
            return Ok(vec![]);
        };
        let pool = ctx.data::<PgPool>()?;
        let row = sqlx::query(
            r"SELECT name, address, ST_Y(location::geometry) as lat, ST_X(location::geometry) as lng
              FROM stores WHERE store_id = $1",
        )
        .bind(target_id)
        .fetch_optional(pool)
        .await?;

        let Some(row) = row else {
            return Ok(vec![]);
        };

        use sqlx::Row;
        let mut diffs = Vec::new();

        if let Some(proposed_name) = self.payload.get("name").and_then(|v| v.as_str()) {
            let current: String = row.get("name");
            if proposed_name != current {
                diffs.push(StoreDiff {
                    field: "name".to_string(),
                    before: Some(current),
                    after: Some(proposed_name.to_string()),
                });
            }
        }

        if let Some(proposed_addr) = self.payload.get("address").and_then(|v| v.as_str()) {
            let current: String = row.get("address");
            if proposed_addr != current {
                diffs.push(StoreDiff {
                    field: "address".to_string(),
                    before: Some(current),
                    after: Some(proposed_addr.to_string()),
                });
            }
        }

        if let Some(proposed_lat) = self.payload.get("lat").and_then(|v| v.as_f64()) {
            let current: f64 = row.get("lat");
            if (proposed_lat - current).abs() > 0.000001 {
                diffs.push(StoreDiff {
                    field: "lat".to_string(),
                    before: Some(current.to_string()),
                    after: Some(proposed_lat.to_string()),
                });
            }
        }

        if let Some(proposed_lng) = self.payload.get("lng").and_then(|v| v.as_f64()) {
            let current: f64 = row.get("lng");
            if (proposed_lng - current).abs() > 0.000001 {
                diffs.push(StoreDiff {
                    field: "lng".to_string(),
                    before: Some(current.to_string()),
                    after: Some(proposed_lng.to_string()),
                });
            }
        }

        Ok(diffs)
    }
}

/// Cursor-based pagination edge
#[derive(SimpleObject, Clone)]
pub struct StoreProposalEdge {
    pub cursor: String,
    pub node: StoreProposal,
}

/// Cursor-based pagination connection
#[derive(SimpleObject, Clone)]
pub struct StoreProposalConnection {
    pub edges: Vec<StoreProposalEdge>,
    pub has_next_page: bool,
}

/// Helper: build a StoreProposal from a sqlx Row
pub fn proposal_from_row(row: &sqlx::postgres::PgRow) -> StoreProposal {
    use sqlx::Row;

    let kind_str: String = row.get("kind");
    let status_str: String = row.get("status");

    // Extract lat/lng from proposed_location if present
    let proposed_lat: Option<f64> = row.try_get("proposed_lat").ok();
    let proposed_lng: Option<f64> = row.try_get("proposed_lng").ok();
    let proposed_location = match (proposed_lat, proposed_lng) {
        (Some(lat), Some(lng)) => Some(Location { lat, lng }),
        _ => None,
    };

    StoreProposal {
        proposal_id: row.get("proposal_id"),
        kind: ProposalKind::from_db_str(&kind_str).unwrap_or(ProposalKind::Create),
        status: ProposalStatus::from_db_str(&status_str).unwrap_or(ProposalStatus::Pending),
        target_store_id: row.get("target_store_id"),
        target_version: row.get("target_version"),
        payload: row.get("payload"),
        proposed_location,
        proposer_user_id: row.get("proposer_user_id"),
        client_nonce: row.get("client_nonce"),
        created_at: row.get("created_at"),
        reviewed_by: row.get("reviewed_by"),
        reviewed_at: row.get("reviewed_at"),
        review_note: row.get("review_note"),
    }
}
```

- [ ] **Step 4: Register the module**

In `apps/server/src/model/mod.rs`:

```rust
pub mod location;
pub mod product;
pub mod proposal;
pub mod store;
pub mod user;
```

- [ ] **Step 5: Update Store construction in tests**

In `apps/server/src/model/store.rs` tests, update the Store construction to include `version: 1`:

```rust
let store = Store {
    store_id: id,
    name: "Test Store".to_string(),
    address: "123 Test St".to_string(),
    location: loc.clone(),
    version: 1,
    created_at: now,
    updated_at: now,
};
```

- [ ] **Step 6: Verify it compiles**

Run: `cd apps/server && cargo check`
Expected: Compiles without errors.

- [ ] **Step 7: Commit**

```bash
git add apps/server/src/model/proposal.rs apps/server/src/model/mod.rs \
       apps/server/src/model/store.rs apps/server/src/api/commands/store.rs \
       apps/server/src/api/queries/store.rs
git commit -m "feat(server): add StoreProposal model, enums, and version field on Store"
```

---

## Task 5: Rate Limiter

**Files:**
- Create: `apps/server/src/rate_limit.rs`
- Modify: `apps/server/src/lib.rs`

- [ ] **Step 1: Create the rate limiter module**

Create `apps/server/src/rate_limit.rs`:

```rust
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
        _ => (20, 1.0 / 900.0), // +1 every 15 min
    }
}
```

- [ ] **Step 2: Register the module**

In `apps/server/src/lib.rs`, add:

```rust
pub mod rate_limit;
```

- [ ] **Step 3: Verify it compiles**

Run: `cd apps/server && cargo check`
Expected: Compiles without errors.

- [ ] **Step 4: Commit**

```bash
git add apps/server/src/rate_limit.rs apps/server/src/lib.rs
git commit -m "feat(server): add Postgres-backed token-bucket rate limiter"
```

---

## Task 6: Proposal Submit Mutations

**Files:**
- Create: `apps/server/src/api/commands/proposal.rs`
- Modify: `apps/server/src/api/commands/mod.rs`

- [ ] **Step 1: Create the ProposalCommand resolver**

Create `apps/server/src/api/commands/proposal.rs`:

```rust
use crate::auth::AuthenticatedUser;
use crate::model::location::Location;
use crate::model::proposal::{
    ProposalKind, ProposalStatus, ReviewDecision, StoreProposal, proposal_from_row,
};
use crate::model::store::Store;
use crate::rate_limit;
use async_graphql::{Context, InputObject, Object};
use sqlx::{PgPool, Row};
use uuid::Uuid;

#[derive(Default)]
pub struct ProposalCommand;

#[derive(InputObject)]
pub struct SubmitCreateStoreProposalInput {
    pub name: String,
    pub address: String,
    pub lat: f64,
    pub lng: f64,
    pub product_ids: Vec<Uuid>,
    pub client_nonce: String,
    pub not_a_duplicate: Option<bool>,
}

#[derive(InputObject)]
pub struct SubmitUpdateStoreProposalInput {
    pub target_store_id: Uuid,
    pub expected_version: i64,
    pub name: Option<String>,
    pub address: Option<String>,
    pub lat: Option<f64>,
    pub lng: Option<f64>,
    pub product_ids: Option<Vec<Uuid>>,
    pub client_nonce: String,
}

#[derive(InputObject)]
pub struct SubmitDeleteStoreProposalInput {
    pub target_store_id: Uuid,
    pub expected_version: i64,
    pub reason: String,
    pub client_nonce: String,
}

#[derive(InputObject)]
pub struct ReviewProposalInput {
    pub proposal_id: Uuid,
    pub decision: ReviewDecision,
    pub note: Option<String>,
}

#[Object]
impl ProposalCommand {
    async fn submit_create_store_proposal(
        &self,
        ctx: &Context<'_>,
        input: SubmitCreateStoreProposalInput,
    ) -> async_graphql::Result<StoreProposal> {
        let auth = ctx
            .data_opt::<AuthenticatedUser>()
            .ok_or_else(|| async_graphql::Error::new("Unauthorized"))?;
        let pool = ctx.data::<PgPool>()?;

        // Rate limit
        let (capacity, refill) = rate_limit::rate_limit_params(&auth.role, 0);
        if !rate_limit::check_rate_limit(pool, &format!("uid:{}", auth.user_id), capacity, refill)
            .await?
        {
            return Err(async_graphql::Error::new("Rate limit exceeded"));
        }

        let payload = serde_json::json!({
            "name": input.name,
            "address": input.address,
            "lat": input.lat,
            "lng": input.lng,
            "product_ids": input.product_ids,
        });

        let row = sqlx::query(
            r"
            INSERT INTO store_proposals
                (kind, payload, proposed_location, proposer_user_id, client_nonce)
            VALUES
                ('create', $1, ST_SetSRID(ST_Point($2, $3), 4326)::geography, $4, $5)
            ON CONFLICT (proposer_user_id, client_nonce) DO UPDATE
                SET kind = store_proposals.kind  -- no-op, return existing row
            RETURNING proposal_id, kind::text, status::text, target_store_id, target_version,
                      payload, proposer_user_id, client_nonce, created_at,
                      reviewed_by, reviewed_at, review_note,
                      ST_Y(proposed_location::geometry) as proposed_lat,
                      ST_X(proposed_location::geometry) as proposed_lng
            ",
        )
        .bind(&payload)
        .bind(input.lng)
        .bind(input.lat)
        .bind(auth.user_id)
        .bind(&input.client_nonce)
        .fetch_one(pool)
        .await?;

        let proposal = proposal_from_row(&row);

        // Write audit log entry
        sqlx::query(
            "INSERT INTO proposal_audit_log (proposal_id, action, actor_user_id) VALUES ($1, 'submitted', $2)",
        )
        .bind(proposal.proposal_id)
        .bind(auth.user_id)
        .execute(pool)
        .await?;

        Ok(proposal)
    }

    async fn submit_update_store_proposal(
        &self,
        ctx: &Context<'_>,
        input: SubmitUpdateStoreProposalInput,
    ) -> async_graphql::Result<StoreProposal> {
        let auth = ctx
            .data_opt::<AuthenticatedUser>()
            .ok_or_else(|| async_graphql::Error::new("Unauthorized"))?;
        let pool = ctx.data::<PgPool>()?;

        // Rate limit
        let (capacity, refill) = rate_limit::rate_limit_params(&auth.role, 0);
        if !rate_limit::check_rate_limit(pool, &format!("uid:{}", auth.user_id), capacity, refill)
            .await?
        {
            return Err(async_graphql::Error::new("Rate limit exceeded"));
        }

        let mut payload = serde_json::Map::new();
        if let Some(name) = &input.name {
            payload.insert("name".to_string(), serde_json::json!(name));
        }
        if let Some(address) = &input.address {
            payload.insert("address".to_string(), serde_json::json!(address));
        }
        if let Some(lat) = input.lat {
            payload.insert("lat".to_string(), serde_json::json!(lat));
        }
        if let Some(lng) = input.lng {
            payload.insert("lng".to_string(), serde_json::json!(lng));
        }
        if let Some(product_ids) = &input.product_ids {
            payload.insert("product_ids".to_string(), serde_json::json!(product_ids));
        }

        let proposed_location_lng = input.lng;
        let proposed_location_lat = input.lat;

        let row = sqlx::query(
            r"
            INSERT INTO store_proposals
                (kind, target_store_id, target_version, payload, proposed_location, proposer_user_id, client_nonce)
            VALUES
                ('update', $1, $2, $3,
                 CASE WHEN $4::double precision IS NOT NULL AND $5::double precision IS NOT NULL
                      THEN ST_SetSRID(ST_Point($4, $5), 4326)::geography
                      ELSE NULL END,
                 $6, $7)
            ON CONFLICT (proposer_user_id, client_nonce) DO UPDATE
                SET kind = store_proposals.kind
            RETURNING proposal_id, kind::text, status::text, target_store_id, target_version,
                      payload, proposer_user_id, client_nonce, created_at,
                      reviewed_by, reviewed_at, review_note,
                      ST_Y(proposed_location::geometry) as proposed_lat,
                      ST_X(proposed_location::geometry) as proposed_lng
            ",
        )
        .bind(input.target_store_id)
        .bind(input.expected_version)
        .bind(serde_json::Value::Object(payload))
        .bind(proposed_location_lng)
        .bind(proposed_location_lat)
        .bind(auth.user_id)
        .bind(&input.client_nonce)
        .fetch_one(pool)
        .await?;

        let proposal = proposal_from_row(&row);

        sqlx::query(
            "INSERT INTO proposal_audit_log (proposal_id, action, actor_user_id) VALUES ($1, 'submitted', $2)",
        )
        .bind(proposal.proposal_id)
        .bind(auth.user_id)
        .execute(pool)
        .await?;

        Ok(proposal)
    }

    async fn submit_delete_store_proposal(
        &self,
        ctx: &Context<'_>,
        input: SubmitDeleteStoreProposalInput,
    ) -> async_graphql::Result<StoreProposal> {
        let auth = ctx
            .data_opt::<AuthenticatedUser>()
            .ok_or_else(|| async_graphql::Error::new("Unauthorized"))?;
        let pool = ctx.data::<PgPool>()?;

        // Trust check: trust_score >= 3 for contributors
        if auth.role == "contributor" {
            let trust: i32 = sqlx::query_scalar("SELECT trust_score FROM users WHERE user_id = $1")
                .bind(auth.user_id)
                .fetch_one(pool)
                .await?;
            if trust < 3 {
                return Err(async_graphql::Error::new(
                    "You need a trust score of at least 3 to propose deletions",
                ));
            }
        }

        let payload = serde_json::json!({ "reason": input.reason });

        let row = sqlx::query(
            r"
            INSERT INTO store_proposals
                (kind, target_store_id, target_version, payload, proposer_user_id, client_nonce)
            VALUES ('delete', $1, $2, $3, $4, $5)
            ON CONFLICT (proposer_user_id, client_nonce) DO UPDATE
                SET kind = store_proposals.kind
            RETURNING proposal_id, kind::text, status::text, target_store_id, target_version,
                      payload, proposer_user_id, client_nonce, created_at,
                      reviewed_by, reviewed_at, review_note,
                      NULL::double precision as proposed_lat,
                      NULL::double precision as proposed_lng
            ",
        )
        .bind(input.target_store_id)
        .bind(input.expected_version)
        .bind(&payload)
        .bind(auth.user_id)
        .bind(&input.client_nonce)
        .fetch_one(pool)
        .await?;

        let proposal = proposal_from_row(&row);

        sqlx::query(
            "INSERT INTO proposal_audit_log (proposal_id, action, actor_user_id) VALUES ($1, 'submitted', $2)",
        )
        .bind(proposal.proposal_id)
        .bind(auth.user_id)
        .execute(pool)
        .await?;

        Ok(proposal)
    }

    async fn withdraw_store_proposal(
        &self,
        ctx: &Context<'_>,
        proposal_id: Uuid,
    ) -> async_graphql::Result<StoreProposal> {
        let auth = ctx
            .data_opt::<AuthenticatedUser>()
            .ok_or_else(|| async_graphql::Error::new("Unauthorized"))?;
        let pool = ctx.data::<PgPool>()?;

        let row = sqlx::query(
            r"
            UPDATE store_proposals
            SET status = 'withdrawn'
            WHERE proposal_id = $1 AND proposer_user_id = $2 AND status = 'pending'
            RETURNING proposal_id, kind::text, status::text, target_store_id, target_version,
                      payload, proposer_user_id, client_nonce, created_at,
                      reviewed_by, reviewed_at, review_note,
                      ST_Y(proposed_location::geometry) as proposed_lat,
                      ST_X(proposed_location::geometry) as proposed_lng
            ",
        )
        .bind(proposal_id)
        .bind(auth.user_id)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| {
            async_graphql::Error::new("Proposal not found, not yours, or not pending")
        })?;

        let proposal = proposal_from_row(&row);

        sqlx::query(
            "INSERT INTO proposal_audit_log (proposal_id, action, actor_user_id) VALUES ($1, 'withdrawn', $2)",
        )
        .bind(proposal.proposal_id)
        .bind(auth.user_id)
        .execute(pool)
        .await?;

        Ok(proposal)
    }

    async fn review_store_proposal(
        &self,
        ctx: &Context<'_>,
        input: ReviewProposalInput,
    ) -> async_graphql::Result<StoreProposal> {
        let auth = ctx
            .data_opt::<AuthenticatedUser>()
            .ok_or_else(|| async_graphql::Error::new("Unauthorized"))?;

        if auth.role != "moderator" && auth.role != "admin" {
            return Err(async_graphql::Error::new("Forbidden: moderator or admin required"));
        }

        let pool = ctx.data::<PgPool>()?;
        let mut tx = pool.begin().await?;

        // 1. Lock the proposal
        let proposal_row = sqlx::query(
            r"
            SELECT proposal_id, kind::text, status::text, target_store_id, target_version,
                   payload, proposer_user_id, client_nonce, created_at,
                   reviewed_by, reviewed_at, review_note,
                   ST_Y(proposed_location::geometry) as proposed_lat,
                   ST_X(proposed_location::geometry) as proposed_lng
            FROM store_proposals
            WHERE proposal_id = $1
            FOR UPDATE
            ",
        )
        .bind(input.proposal_id)
        .fetch_optional(&mut *tx)
        .await?
        .ok_or_else(|| async_graphql::Error::new("Proposal not found"))?;

        let status_str: String = proposal_row.get("status");
        if status_str != "pending" {
            return Err(async_graphql::Error::new(format!(
                "Proposal is not pending (current: {status_str})"
            )));
        }

        let kind_str: String = proposal_row.get("kind");
        let payload: serde_json::Value = proposal_row.get("payload");
        let target_store_id: Option<Uuid> = proposal_row.get("target_store_id");
        let target_version: Option<i64> = proposal_row.get("target_version");
        let proposer_user_id: Uuid = proposal_row.get("proposer_user_id");

        match input.decision {
            ReviewDecision::Reject => {
                // Mark rejected
                sqlx::query(
                    r"
                    UPDATE store_proposals
                    SET status = 'rejected', reviewed_by = $1, reviewed_at = now(), review_note = $2
                    WHERE proposal_id = $3
                    ",
                )
                .bind(auth.user_id)
                .bind(&input.note)
                .bind(input.proposal_id)
                .execute(&mut *tx)
                .await?;

                // Decrement trust
                sqlx::query("UPDATE users SET trust_score = trust_score - 3 WHERE user_id = $1")
                    .bind(proposer_user_id)
                    .execute(&mut *tx)
                    .await?;

                sqlx::query(
                    "INSERT INTO proposal_audit_log (proposal_id, action, actor_user_id) VALUES ($1, 'rejected', $2)",
                )
                .bind(input.proposal_id)
                .bind(auth.user_id)
                .execute(&mut *tx)
                .await?;
            }
            ReviewDecision::Approve => {
                // For update/delete: check version
                if let (Some(target_id), Some(expected_ver)) = (target_store_id, target_version) {
                    let store_row = sqlx::query("SELECT version FROM stores WHERE store_id = $1 FOR UPDATE")
                        .bind(target_id)
                        .fetch_optional(&mut *tx)
                        .await?;

                    match store_row {
                        Some(sr) => {
                            let current_ver: i64 = sr.get("version");
                            if current_ver != expected_ver {
                                // Superseded
                                sqlx::query(
                                    r"
                                    UPDATE store_proposals
                                    SET status = 'superseded', reviewed_by = $1, reviewed_at = now(),
                                        review_note = 'Target store version changed since submission'
                                    WHERE proposal_id = $2
                                    ",
                                )
                                .bind(auth.user_id)
                                .bind(input.proposal_id)
                                .execute(&mut *tx)
                                .await?;

                                sqlx::query(
                                    "INSERT INTO proposal_audit_log (proposal_id, action, actor_user_id, details) VALUES ($1, 'superseded', $2, $3)",
                                )
                                .bind(input.proposal_id)
                                .bind(auth.user_id)
                                .bind(serde_json::json!({
                                    "expected_version": expected_ver,
                                    "current_version": current_ver,
                                }))
                                .execute(&mut *tx)
                                .await?;

                                tx.commit().await?;

                                // Re-fetch the updated proposal
                                let final_row = sqlx::query(
                                    r"
                                    SELECT proposal_id, kind::text, status::text, target_store_id, target_version,
                                           payload, proposer_user_id, client_nonce, created_at,
                                           reviewed_by, reviewed_at, review_note,
                                           ST_Y(proposed_location::geometry) as proposed_lat,
                                           ST_X(proposed_location::geometry) as proposed_lng
                                    FROM store_proposals WHERE proposal_id = $1
                                    ",
                                )
                                .bind(input.proposal_id)
                                .fetch_one(pool)
                                .await?;

                                return Ok(proposal_from_row(&final_row));
                            }
                        }
                        None => {
                            return Err(async_graphql::Error::new("Target store no longer exists"));
                        }
                    }
                }

                // Apply the change based on kind
                match kind_str.as_str() {
                    "create" => {
                        let name = payload["name"].as_str().unwrap_or("");
                        let address = payload["address"].as_str().unwrap_or("");
                        let lat = payload["lat"].as_f64().unwrap_or(0.0);
                        let lng = payload["lng"].as_f64().unwrap_or(0.0);

                        let store_row = sqlx::query(
                            r"
                            INSERT INTO stores (name, address, location)
                            VALUES ($1, $2, ST_SetSRID(ST_Point($3, $4), 4326)::geography)
                            RETURNING store_id
                            ",
                        )
                        .bind(name)
                        .bind(address)
                        .bind(lng)
                        .bind(lat)
                        .fetch_one(&mut *tx)
                        .await?;

                        let new_store_id: Uuid = store_row.get("store_id");

                        if let Some(product_ids) = payload["product_ids"].as_array() {
                            for pid in product_ids {
                                if let Some(pid_str) = pid.as_str() {
                                    if let Ok(pid_uuid) = Uuid::parse_str(pid_str) {
                                        sqlx::query("INSERT INTO store_products (store_id, product_id) VALUES ($1, $2)")
                                            .bind(new_store_id)
                                            .bind(pid_uuid)
                                            .execute(&mut *tx)
                                            .await?;
                                    }
                                }
                            }
                        }

                        // Update the proposal with the new store_id
                        sqlx::query("UPDATE store_proposals SET target_store_id = $1 WHERE proposal_id = $2")
                            .bind(new_store_id)
                            .bind(input.proposal_id)
                            .execute(&mut *tx)
                            .await?;
                    }
                    "update" => {
                        let target_id = target_store_id.unwrap();

                        if let Some(name) = payload.get("name").and_then(|v| v.as_str()) {
                            sqlx::query("UPDATE stores SET name = $1 WHERE store_id = $2")
                                .bind(name)
                                .bind(target_id)
                                .execute(&mut *tx)
                                .await?;
                        }
                        if let Some(address) = payload.get("address").and_then(|v| v.as_str()) {
                            sqlx::query("UPDATE stores SET address = $1 WHERE store_id = $2")
                                .bind(address)
                                .bind(target_id)
                                .execute(&mut *tx)
                                .await?;
                        }
                        if let (Some(lat), Some(lng)) = (
                            payload.get("lat").and_then(|v| v.as_f64()),
                            payload.get("lng").and_then(|v| v.as_f64()),
                        ) {
                            sqlx::query("UPDATE stores SET location = ST_SetSRID(ST_Point($1, $2), 4326)::geography WHERE store_id = $3")
                                .bind(lng)
                                .bind(lat)
                                .bind(target_id)
                                .execute(&mut *tx)
                                .await?;
                        }
                        if let Some(product_ids) = payload.get("product_ids").and_then(|v| v.as_array()) {
                            sqlx::query("DELETE FROM store_products WHERE store_id = $1")
                                .bind(target_id)
                                .execute(&mut *tx)
                                .await?;
                            for pid in product_ids {
                                if let Some(pid_str) = pid.as_str() {
                                    if let Ok(pid_uuid) = Uuid::parse_str(pid_str) {
                                        sqlx::query("INSERT INTO store_products (store_id, product_id) VALUES ($1, $2)")
                                            .bind(target_id)
                                            .bind(pid_uuid)
                                            .execute(&mut *tx)
                                            .await?;
                                    }
                                }
                            }
                        }

                        // Bump version
                        sqlx::query("UPDATE stores SET version = version + 1 WHERE store_id = $1")
                            .bind(target_id)
                            .execute(&mut *tx)
                            .await?;
                    }
                    "delete" => {
                        let target_id = target_store_id.unwrap();
                        sqlx::query("DELETE FROM stores WHERE store_id = $1")
                            .bind(target_id)
                            .execute(&mut *tx)
                            .await?;
                    }
                    _ => {}
                }

                // Mark approved
                sqlx::query(
                    r"
                    UPDATE store_proposals
                    SET status = 'approved', reviewed_by = $1, reviewed_at = now(), review_note = $2
                    WHERE proposal_id = $3
                    ",
                )
                .bind(auth.user_id)
                .bind(&input.note)
                .bind(input.proposal_id)
                .execute(&mut *tx)
                .await?;

                // Increment proposer trust
                sqlx::query("UPDATE users SET trust_score = trust_score + 1 WHERE user_id = $1")
                    .bind(proposer_user_id)
                    .execute(&mut *tx)
                    .await?;

                // Audit entries
                sqlx::query(
                    "INSERT INTO proposal_audit_log (proposal_id, action, actor_user_id) VALUES ($1, 'approved', $2), ($1, 'applied', $2)",
                )
                .bind(input.proposal_id)
                .bind(auth.user_id)
                .execute(&mut *tx)
                .await?;
            }
        }

        tx.commit().await?;

        // Re-fetch the final state
        let final_row = sqlx::query(
            r"
            SELECT proposal_id, kind::text, status::text, target_store_id, target_version,
                   payload, proposer_user_id, client_nonce, created_at,
                   reviewed_by, reviewed_at, review_note,
                   ST_Y(proposed_location::geometry) as proposed_lat,
                   ST_X(proposed_location::geometry) as proposed_lng
            FROM store_proposals WHERE proposal_id = $1
            ",
        )
        .bind(input.proposal_id)
        .fetch_one(pool)
        .await?;

        Ok(proposal_from_row(&final_row))
    }
}
```

- [ ] **Step 2: Register the module**

In `apps/server/src/api/commands/mod.rs`:

```rust
pub mod proposal;
pub mod store;
pub mod user;
```

- [ ] **Step 3: Verify it compiles**

Run: `cd apps/server && cargo check`
Expected: May not fully compile yet until Task 7 (user command) and Task 8 (queries + schema wiring). That's fine — proceed.

- [ ] **Step 4: Commit**

```bash
git add apps/server/src/api/commands/proposal.rs apps/server/src/api/commands/mod.rs
git commit -m "feat(server): add proposal submit, withdraw, and review mutations"
```

---

## Task 7: User Command (setUserRole)

**Files:**
- Create: `apps/server/src/api/commands/user.rs`

- [ ] **Step 1: Create the UserCommand resolver**

Create `apps/server/src/api/commands/user.rs`:

```rust
use crate::auth::AuthenticatedUser;
use crate::model::user::User;
use async_graphql::{Context, InputObject, Object};
use sqlx::{PgPool, Row};

#[derive(Default)]
pub struct UserCommand;

#[derive(InputObject)]
pub struct SetUserRoleInput {
    pub firebase_uid: String,
    pub role: String,
    pub region: Option<String>,
}

#[Object]
impl UserCommand {
    async fn set_user_role(
        &self,
        ctx: &Context<'_>,
        input: SetUserRoleInput,
    ) -> async_graphql::Result<User> {
        let auth = ctx
            .data_opt::<AuthenticatedUser>()
            .ok_or_else(|| async_graphql::Error::new("Unauthorized"))?;

        if auth.role != "admin" {
            return Err(async_graphql::Error::new("Forbidden: admin required"));
        }

        // Validate role value
        if !["contributor", "moderator", "admin"].contains(&input.role.as_str()) {
            return Err(async_graphql::Error::new(
                "Invalid role. Must be contributor, moderator, or admin",
            ));
        }

        let pool = ctx.data::<PgPool>()?;

        let row = sqlx::query(
            r"
            UPDATE users SET role = $1, region = $2, updated_at = now()
            WHERE firebase_uid = $3
            RETURNING user_id, firebase_uid, email, display_name, role, region,
                      trust_score, email_verified, created_at, updated_at
            ",
        )
        .bind(&input.role)
        .bind(&input.region)
        .bind(&input.firebase_uid)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| async_graphql::Error::new("User not found"))?;

        Ok(User {
            user_id: row.get("user_id"),
            firebase_uid: row.get("firebase_uid"),
            email: row.get("email"),
            display_name: row.get("display_name"),
            role: row.get("role"),
            region: row.get("region"),
            trust_score: row.get("trust_score"),
            email_verified: row.get("email_verified"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        })
    }
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd apps/server && cargo check`

- [ ] **Step 3: Commit**

```bash
git add apps/server/src/api/commands/user.rs
git commit -m "feat(server): add setUserRole admin mutation"
```

---

## Task 8: Proposal Queries

**Files:**
- Create: `apps/server/src/api/queries/proposal.rs`
- Modify: `apps/server/src/api/queries/mod.rs`

- [ ] **Step 1: Create the ProposalQuery resolver**

Create `apps/server/src/api/queries/proposal.rs`:

```rust
use crate::auth::AuthenticatedUser;
use crate::model::proposal::{
    ProposalKind, ProposalStatus, StoreProposal, StoreProposalConnection, StoreProposalEdge,
    proposal_from_row,
};
use async_graphql::{Context, Object};
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Default)]
pub struct ProposalQuery;

#[Object]
impl ProposalQuery {
    async fn store_proposal(
        &self,
        ctx: &Context<'_>,
        id: Uuid,
    ) -> async_graphql::Result<Option<StoreProposal>> {
        let auth = ctx
            .data_opt::<AuthenticatedUser>()
            .ok_or_else(|| async_graphql::Error::new("Unauthorized"))?;
        let pool = ctx.data::<PgPool>()?;

        let row = sqlx::query(
            r"
            SELECT proposal_id, kind::text, status::text, target_store_id, target_version,
                   payload, proposer_user_id, client_nonce, created_at,
                   reviewed_by, reviewed_at, review_note,
                   ST_Y(proposed_location::geometry) as proposed_lat,
                   ST_X(proposed_location::geometry) as proposed_lng
            FROM store_proposals
            WHERE proposal_id = $1
            ",
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        match row {
            Some(r) => {
                use sqlx::Row;
                let proposer_id: Uuid = r.get("proposer_user_id");
                // Contributors can only see their own proposals
                if auth.role == "contributor" && proposer_id != auth.user_id {
                    return Err(async_graphql::Error::new("Forbidden"));
                }
                Ok(Some(proposal_from_row(&r)))
            }
            None => Ok(None),
        }
    }

    async fn my_store_proposals(
        &self,
        ctx: &Context<'_>,
        status: Option<ProposalStatus>,
        limit: Option<i32>,
        cursor: Option<String>,
    ) -> async_graphql::Result<StoreProposalConnection> {
        let auth = ctx
            .data_opt::<AuthenticatedUser>()
            .ok_or_else(|| async_graphql::Error::new("Unauthorized"))?;
        let pool = ctx.data::<PgPool>()?;

        let limit = limit.unwrap_or(50).min(100) as i64;
        let cursor_time = cursor
            .as_deref()
            .and_then(|c| chrono::DateTime::parse_from_rfc3339(c).ok())
            .map(|dt| dt.with_timezone(&chrono::Utc));

        let rows = if let Some(status_filter) = status {
            sqlx::query(
                r"
                SELECT proposal_id, kind::text, status::text, target_store_id, target_version,
                       payload, proposer_user_id, client_nonce, created_at,
                       reviewed_by, reviewed_at, review_note,
                       ST_Y(proposed_location::geometry) as proposed_lat,
                       ST_X(proposed_location::geometry) as proposed_lng
                FROM store_proposals
                WHERE proposer_user_id = $1
                  AND status = $2::text::proposal_status
                  AND ($3::timestamptz IS NULL OR created_at < $3)
                ORDER BY created_at DESC
                LIMIT $4
                ",
            )
            .bind(auth.user_id)
            .bind(status_filter.as_db_str())
            .bind(cursor_time)
            .bind(limit + 1)
            .fetch_all(pool)
            .await?
        } else {
            sqlx::query(
                r"
                SELECT proposal_id, kind::text, status::text, target_store_id, target_version,
                       payload, proposer_user_id, client_nonce, created_at,
                       reviewed_by, reviewed_at, review_note,
                       ST_Y(proposed_location::geometry) as proposed_lat,
                       ST_X(proposed_location::geometry) as proposed_lng
                FROM store_proposals
                WHERE proposer_user_id = $1
                  AND ($2::timestamptz IS NULL OR created_at < $2)
                ORDER BY created_at DESC
                LIMIT $3
                ",
            )
            .bind(auth.user_id)
            .bind(cursor_time)
            .bind(limit + 1)
            .fetch_all(pool)
            .await?
        };

        let has_next_page = rows.len() as i64 > limit;
        let edges: Vec<StoreProposalEdge> = rows
            .into_iter()
            .take(limit as usize)
            .map(|row| {
                let proposal = proposal_from_row(&row);
                let cursor = proposal.created_at.to_rfc3339();
                StoreProposalEdge {
                    cursor,
                    node: proposal,
                }
            })
            .collect();

        Ok(StoreProposalConnection {
            edges,
            has_next_page,
        })
    }

    async fn pending_store_proposals(
        &self,
        ctx: &Context<'_>,
        region: Option<String>,
        kind: Option<ProposalKind>,
        limit: Option<i32>,
        cursor: Option<String>,
    ) -> async_graphql::Result<StoreProposalConnection> {
        let auth = ctx
            .data_opt::<AuthenticatedUser>()
            .ok_or_else(|| async_graphql::Error::new("Unauthorized"))?;

        if auth.role != "moderator" && auth.role != "admin" {
            return Err(async_graphql::Error::new("Forbidden: moderator or admin required"));
        }

        let pool = ctx.data::<PgPool>()?;
        let limit = limit.unwrap_or(50).min(100) as i64;
        let cursor_time = cursor
            .as_deref()
            .and_then(|c| chrono::DateTime::parse_from_rfc3339(c).ok())
            .map(|dt| dt.with_timezone(&chrono::Utc));

        let kind_str = kind.map(|k| k.as_db_str().to_string());

        let rows = sqlx::query(
            r"
            SELECT proposal_id, kind::text, status::text, target_store_id, target_version,
                   payload, proposer_user_id, client_nonce, created_at,
                   reviewed_by, reviewed_at, review_note,
                   ST_Y(proposed_location::geometry) as proposed_lat,
                   ST_X(proposed_location::geometry) as proposed_lng
            FROM store_proposals
            WHERE status = 'pending'
              AND ($1::text IS NULL OR kind = $1::text::proposal_kind)
              AND ($2::timestamptz IS NULL OR created_at < $2)
            ORDER BY created_at ASC
            LIMIT $3
            ",
        )
        .bind(&kind_str)
        .bind(cursor_time)
        .bind(limit + 1)
        .fetch_all(pool)
        .await?;

        let has_next_page = rows.len() as i64 > limit;
        let edges: Vec<StoreProposalEdge> = rows
            .into_iter()
            .take(limit as usize)
            .map(|row| {
                let proposal = proposal_from_row(&row);
                let cursor = proposal.created_at.to_rfc3339();
                StoreProposalEdge {
                    cursor,
                    node: proposal,
                }
            })
            .collect();

        Ok(StoreProposalConnection {
            edges,
            has_next_page,
        })
    }
}
```

- [ ] **Step 2: Register the module**

In `apps/server/src/api/queries/mod.rs`:

```rust
pub mod product;
pub mod proposal;
pub mod store;
```

- [ ] **Step 3: Verify it compiles**

Run: `cd apps/server && cargo check`

- [ ] **Step 4: Commit**

```bash
git add apps/server/src/api/queries/proposal.rs apps/server/src/api/queries/mod.rs
git commit -m "feat(server): add proposal query resolvers with cursor pagination"
```

---

## Task 9: Wire Up Schema & Gate Legacy Mutations

**Files:**
- Modify: `apps/server/src/api/mod.rs`
- Modify: `apps/server/src/api/commands/store.rs`

- [ ] **Step 1: Register new types in the MergedObject schema**

In `apps/server/src/api/mod.rs`:

```rust
pub mod commands;
pub mod export;
pub mod queries;

use async_graphql::MergedObject;
use commands::proposal::ProposalCommand;
use commands::store::StoreCommand;
use commands::user::UserCommand;
use queries::product::ProductQuery;
use queries::proposal::ProposalQuery;
use queries::store::StoreQuery;

#[derive(MergedObject, Default)]
pub struct Query(StoreQuery, ProductQuery, ProposalQuery);

#[derive(MergedObject, Default)]
pub struct Mutation(StoreCommand, ProposalCommand, UserCommand);
```

- [ ] **Step 2: Gate legacy mutations to admin-only**

In `apps/server/src/api/commands/store.rs`, update each mutation to check for admin role:

```rust
use crate::auth::{AuthenticatedUser, FirebaseUser};
```

Then in `create_store`, replace the `_user` check with:

```rust
let _user = ctx
    .data_opt::<FirebaseUser>()
    .ok_or_else(|| async_graphql::Error::new("Unauthorized"))?;

// Gate to admin only (deprecated — use submitCreateStoreProposal)
if let Some(auth) = ctx.data_opt::<AuthenticatedUser>() {
    if auth.role != "admin" {
        return Err(async_graphql::Error::new(
            "Forbidden: use submitCreateStoreProposal instead. Direct mutations are admin-only.",
        ));
    }
}
```

Apply the same pattern to `update_store` and `delete_store`.

Add `#[graphql(deprecation = "Use submitCreateStoreProposal. Kept for admin bulk imports.")]` to each method:

```rust
#[graphql(deprecation = "Use submitCreateStoreProposal. Kept for admin bulk imports.")]
async fn create_store(
```

```rust
#[graphql(deprecation = "Use submitUpdateStoreProposal. Kept for admin bulk imports.")]
async fn update_store(
```

```rust
#[graphql(deprecation = "Use submitDeleteStoreProposal. Kept for admin emergencies.")]
async fn delete_store(
```

- [ ] **Step 3: Verify it compiles**

Run: `cd apps/server && cargo check`
Expected: Compiles without errors. All backend code is now in place.

- [ ] **Step 4: Run unit tests**

Run: `cd apps/server && cargo test`
Expected: All existing unit tests pass (the `test_store_creation`, `test_product_creation`, `test_location_new` tests).

- [ ] **Step 5: Regenerate the GraphQL schema**

Run: `cd apps/server && cargo run --bin export_schema`
Expected: `schema.graphql` is updated with all new types and mutations.

- [ ] **Step 6: Commit**

```bash
git add apps/server/src/api/mod.rs apps/server/src/api/commands/store.rs \
       apps/server/schema.graphql
git commit -m "feat(server): wire up proposal schema, gate legacy mutations to admin"
```

---

## Task 10: Frontend — New GraphQL Operations

**Files:**
- Create: `apps/web/app/graphql/mutations/submit-create-proposal/index.graphql`
- Create: `apps/web/app/graphql/mutations/submit-update-proposal/index.graphql`
- Create: `apps/web/app/graphql/mutations/submit-delete-proposal/index.graphql`
- Create: `apps/web/app/graphql/mutations/withdraw-proposal/index.graphql`
- Create: `apps/web/app/graphql/queries/my-proposals/index.graphql`
- Modify: `apps/web/app/store/features/guacal-api/base.ts`
- Modify: `apps/web/app/store/features/guacal-api/enhanced.ts`

- [ ] **Step 1: Create the GraphQL documents**

Create `apps/web/app/graphql/mutations/submit-create-proposal/index.graphql`:

```graphql
mutation SubmitCreateStoreProposal($input: SubmitCreateStoreProposalInput!) {
  submitCreateStoreProposal(input: $input) {
    proposalId
    kind
    status
    proposedName
    proposedAddress
    proposedLocation {
      lat
      lng
    }
    createdAt
    possibleDuplicates {
      storeId
      name
      address
      location {
        lat
        lng
      }
    }
  }
}
```

Create `apps/web/app/graphql/mutations/submit-update-proposal/index.graphql`:

```graphql
mutation SubmitUpdateStoreProposal($input: SubmitUpdateStoreProposalInput!) {
  submitUpdateStoreProposal(input: $input) {
    proposalId
    kind
    status
    createdAt
  }
}
```

Create `apps/web/app/graphql/mutations/submit-delete-proposal/index.graphql`:

```graphql
mutation SubmitDeleteStoreProposal($input: SubmitDeleteStoreProposalInput!) {
  submitDeleteStoreProposal(input: $input) {
    proposalId
    kind
    status
    createdAt
  }
}
```

Create `apps/web/app/graphql/mutations/withdraw-proposal/index.graphql`:

```graphql
mutation WithdrawStoreProposal($proposalId: UUID!) {
  withdrawStoreProposal(proposalId: $proposalId) {
    proposalId
    status
  }
}
```

Create `apps/web/app/graphql/queries/my-proposals/index.graphql`:

```graphql
query MyStoreProposals($status: ProposalStatus, $limit: Int, $cursor: String) {
  myStoreProposals(status: $status, limit: $limit, cursor: $cursor) {
    edges {
      cursor
      node {
        proposalId
        kind
        status
        proposedName
        proposedAddress
        proposedLocation {
          lat
          lng
        }
        reason
        createdAt
        reviewedAt
        reviewNote
      }
    }
    hasNextPage
  }
}
```

- [ ] **Step 2: Add Proposal tag type to RTK base**

In `apps/web/app/store/features/guacal-api/base.ts`, add `'Proposal'` to tagTypes:

```typescript
tagTypes: ['Store', 'Proposal'],
```

- [ ] **Step 3: Run codegen**

Run: `cd apps/web && pnpm graphql-codegen --config ./config/codegen.ts`
Expected: Generates `*.generated.ts` files for each new `.graphql` document.

- [ ] **Step 4: Update enhanced endpoint cache tags**

In `apps/web/app/store/features/guacal-api/enhanced.ts`, add the new imports and endpoint config:

```typescript
import '@/graphql/mutations/submit-create-proposal/index.generated';
import '@/graphql/mutations/submit-update-proposal/index.generated';
import '@/graphql/mutations/submit-delete-proposal/index.generated';
import '@/graphql/mutations/withdraw-proposal/index.generated';
import '@/graphql/queries/my-proposals/index.generated';
```

And in the `enhanceEndpoints` call, add:

```typescript
SubmitCreateStoreProposal: { invalidatesTags: ['Proposal'] },
SubmitUpdateStoreProposal: { invalidatesTags: ['Proposal'] },
SubmitDeleteStoreProposal: { invalidatesTags: ['Proposal'] },
WithdrawStoreProposal: { invalidatesTags: ['Proposal'] },
MyStoreProposals: { providesTags: ['Proposal'] },
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/graphql/mutations/submit-create-proposal/ \
       apps/web/app/graphql/mutations/submit-update-proposal/ \
       apps/web/app/graphql/mutations/submit-delete-proposal/ \
       apps/web/app/graphql/mutations/withdraw-proposal/ \
       apps/web/app/graphql/queries/my-proposals/ \
       apps/web/app/graphql/types.ts \
       apps/web/app/store/features/guacal-api/base.ts \
       apps/web/app/store/features/guacal-api/enhanced.ts
git commit -m "feat(web): add GraphQL operations for proposal mutations and queries"
```

---

## Task 11: Frontend — Switch Store Forms to Proposal Flow

**Files:**
- Modify: `apps/web/app/routes/_locale.stores.new.tsx`
- Modify: `apps/web/app/routes/_locale.stores.edit.tsx`
- Modify: `apps/web/app/components/store/StoreForm.tsx`

- [ ] **Step 1: Add `clientNonce` generation to StoreForm**

In `apps/web/app/components/store/StoreForm.tsx`, add to the imports:

```typescript
import { useMemo } from 'react';
```

Inside the component, generate a nonce:

```typescript
const clientNonce = useMemo(() => crypto.randomUUID(), []);
```

Add `clientNonce` to the values passed to `onSubmit`. Update the `StoreFormValues` type:

```typescript
type StoreFormValues = {
  address: string;
  clientNonce: string;
  lat: number;
  lng: number;
  name: string;
  productIds: string[];
};
```

And update `defaultValues`:

```typescript
const defaultValues: StoreFormValues = initialValues || {
  address: '',
  clientNonce,
  lat: center.lat,
  lng: center.lng,
  name: '',
  productIds: [],
};
```

- [ ] **Step 2: Switch the new store route to use `submitCreateStoreProposal`**

In `apps/web/app/routes/_locale.stores.new.tsx`:

Replace the import:
```typescript
import { useSubmitCreateStoreProposalMutation } from '@/graphql/mutations/submit-create-proposal/index.generated';
```

Replace the mutation hook and handler:
```typescript
const [submitProposal] = useSubmitCreateStoreProposalMutation();
const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitted'>('idle');

const handleSubmit = async (values: {
  address: string;
  clientNonce: string;
  lat: number;
  lng: number;
  name: string;
  productIds: string[];
}) => {
  try {
    await submitProposal({
      input: {
        address: values.address,
        clientNonce: values.clientNonce,
        lat: values.lat,
        lng: values.lng,
        name: values.name,
        productIds: values.productIds,
      },
    }).unwrap();
    setSubmissionStatus('submitted');
  } catch (error) {
    console.error('Failed to submit proposal:', error);
  }
};
```

Add a confirmation view when `submissionStatus === 'submitted'`:
```tsx
if (submissionStatus === 'submitted') {
  return (
    <Page>
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>{t('proposal.submitted.title')}</h1>
        <p>{t('proposal.submitted.message')}</p>
        <button type="button" onClick={() => navigate(`/${locale}`)}>
          {t('proposal.submitted.backToMap')}
        </button>
      </div>
    </Page>
  );
}
```

- [ ] **Step 3: Switch the edit store route to use `submitUpdateStoreProposal`**

In `apps/web/app/routes/_locale.stores.edit.tsx`, apply the same pattern:

```typescript
import { useSubmitUpdateStoreProposalMutation } from '@/graphql/mutations/submit-update-proposal/index.generated';
```

Use `store.version` as `expectedVersion` in the mutation input.

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/components/store/StoreForm.tsx \
       apps/web/app/routes/_locale.stores.new.tsx \
       apps/web/app/routes/_locale.stores.edit.tsx
git commit -m "feat(web): switch store forms to proposal submission flow"
```

---

## Task 12: Frontend — My Submissions Page

**Files:**
- Create: `apps/web/app/routes/_locale.my-submissions.tsx`
- Create: `apps/web/app/components/proposal-status/index.tsx`
- Modify: `apps/web/app/routes.ts`

- [ ] **Step 1: Create the ProposalStatus badge component**

Create `apps/web/app/components/proposal-status/index.tsx`:

```tsx
import { useTranslation } from 'react-i18next';

interface ProposalStatusBadgeProps {
  status: string;
}

const ProposalStatusBadge: React.FC<ProposalStatusBadgeProps> = ({ status }) => {
  const { t } = useTranslation();

  const colorMap: Record<string, string> = {
    APPROVED: 'var(--color-success)',
    PENDING: 'var(--color-warning, #f59e0b)',
    REJECTED: 'var(--color-danger, #ef4444)',
    SUPERSEDED: 'var(--color-muted, #6b7280)',
    WITHDRAWN: 'var(--color-muted, #6b7280)',
  };

  return (
    <span
      style={{
        backgroundColor: colorMap[status] || '#6b7280',
        borderRadius: '4px',
        color: 'white',
        fontSize: '0.75rem',
        fontWeight: 600,
        padding: '2px 8px',
      }}
    >
      {t(`proposal.status.${status.toLowerCase()}`)}
    </span>
  );
};

export default ProposalStatusBadge;
```

- [ ] **Step 2: Create the My Submissions page**

Create `apps/web/app/routes/_locale.my-submissions.tsx`:

```tsx
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { type MetaFunction, useNavigate, useParams } from 'react-router';
import Page from '@/components/page';
import ProposalStatusBadge from '@/components/proposal-status';
import { useMyStoreProposalsQuery } from '@/graphql/queries/my-proposals/index.generated';
import i18n from '@/i18n/config';
import { selectAuth } from '@/store/features/auth/slice';
import { useAppSelector } from '@/store/hooks';
import { getSeoMeta } from '@/utils/seo';

export const meta: MetaFunction = ({ params }) => {
  const locale = params.locale || 'en-GB';
  return getSeoMeta({
    description: i18n.t('seo.mySubmissions.description', { lng: locale }),
    locale,
    path: `/${locale}/my-submissions`,
    title: i18n.t('seo.mySubmissions.title', { lng: locale }),
  });
};

const MySubmissionsPage = () => {
  const { locale } = useParams<{ locale: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated } = useAppSelector(selectAuth);
  const { data, isLoading } = useMyStoreProposalsQuery({});

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`/${locale}/auth`);
    }
  }, [isAuthenticated, navigate, locale]);

  if (!isAuthenticated) return null;

  return (
    <Page>
      <div style={{ margin: '0 auto', maxWidth: '800px', padding: '1rem' }}>
        <h1>{t('mySubmissions.title')}</h1>

        {isLoading && <output aria-live="polite">{t('common.loading')}</output>}

        {data?.myStoreProposals.edges.length === 0 && !isLoading && (
          <p>{t('mySubmissions.empty')}</p>
        )}

        {data?.myStoreProposals.edges.map(({ node }) => (
          <article
            key={node.proposalId}
            style={{
              borderBottom: '1px solid var(--color-border, #e5e7eb)',
              padding: '1rem 0',
            }}
          >
            <div style={{ alignItems: 'center', display: 'flex', gap: '0.5rem' }}>
              <strong>{node.proposedName || t('mySubmissions.deletion')}</strong>
              <ProposalStatusBadge status={node.status} />
              <span style={{ color: 'var(--color-muted, #6b7280)', fontSize: '0.875rem' }}>
                {t(`proposal.kind.${node.kind.toLowerCase()}`)}
              </span>
            </div>
            {node.proposedAddress && (
              <p style={{ color: 'var(--color-muted, #6b7280)', fontSize: '0.875rem', margin: '0.25rem 0' }}>
                {node.proposedAddress}
              </p>
            )}
            {node.reviewNote && node.status === 'REJECTED' && (
              <p style={{ color: 'var(--color-danger, #ef4444)', fontSize: '0.875rem', margin: '0.25rem 0' }}>
                {t('mySubmissions.moderatorNote')}: {node.reviewNote}
              </p>
            )}
            <time
              dateTime={node.createdAt}
              style={{ color: 'var(--color-muted, #6b7280)', fontSize: '0.75rem' }}
            >
              {new Date(node.createdAt).toLocaleDateString()}
            </time>
          </article>
        ))}
      </div>
    </Page>
  );
};

export default MySubmissionsPage;
```

- [ ] **Step 3: Add the route**

In `apps/web/app/routes.ts`, verify the file-based routing picks up `_locale.my-submissions.tsx` automatically (React Router v7 file routes). If routes are manually configured, add the entry.

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/components/proposal-status/ \
       apps/web/app/routes/_locale.my-submissions.tsx
git commit -m "feat(web): add My Submissions page with proposal status badges"
```

---

## Task 13: i18n — Add Proposal Copy in Both Locales

**Files:**
- Modify: `apps/web/app/i18n/translations/en-GB.json`
- Modify: `apps/web/app/i18n/translations/es-VE.json`

- [ ] **Step 1: Add English translation keys**

Add the following keys to `en-GB.json` (merge into existing structure):

```json
{
  "proposal": {
    "submitted": {
      "title": "Suggestion submitted",
      "message": "Thank you! Your suggestion has been submitted and is waiting for review. This usually takes up to 72 hours.",
      "backToMap": "Back to map"
    },
    "status": {
      "pending": "Pending review",
      "approved": "Approved",
      "rejected": "Rejected",
      "withdrawn": "Withdrawn",
      "superseded": "Superseded"
    },
    "kind": {
      "create": "New store",
      "update": "Edit",
      "delete": "Removal"
    }
  },
  "mySubmissions": {
    "title": "My submissions",
    "empty": "You haven't submitted any store suggestions yet.",
    "deletion": "Store removal request",
    "moderatorNote": "Moderator note"
  },
  "storeForm": {
    "addTitle": "Suggest a store",
    "editTitle": "Suggest an edit",
    "saveStore": "Submit suggestion",
    "banner": "Your suggestion will be reviewed by the El Guacal community before it appears on the map."
  },
  "seo": {
    "mySubmissions": {
      "title": "My submissions — El Guacal",
      "description": "View your store suggestions and their review status."
    }
  }
}
```

- [ ] **Step 2: Add Spanish translation keys**

Add the following keys to `es-VE.json`:

```json
{
  "proposal": {
    "submitted": {
      "title": "Sugerencia enviada",
      "message": "¡Gracias! Su sugerencia ha sido enviada y está en espera de revisión. Esto suele tomar hasta 72 horas.",
      "backToMap": "Volver al mapa"
    },
    "status": {
      "pending": "Pendiente de revisión",
      "approved": "Aprobada",
      "rejected": "Rechazada",
      "withdrawn": "Retirada",
      "superseded": "Reemplazada"
    },
    "kind": {
      "create": "Nueva tienda",
      "update": "Edición",
      "delete": "Eliminación"
    }
  },
  "mySubmissions": {
    "title": "Mis envíos",
    "empty": "Aún no ha enviado ninguna sugerencia de tienda.",
    "deletion": "Solicitud de eliminación",
    "moderatorNote": "Nota del moderador"
  },
  "storeForm": {
    "addTitle": "Sugerir una tienda",
    "editTitle": "Sugerir una edición",
    "saveStore": "Enviar sugerencia",
    "banner": "Su sugerencia será revisada por la comunidad de El Guacal antes de aparecer en el mapa."
  },
  "seo": {
    "mySubmissions": {
      "title": "Mis envíos — El Guacal",
      "description": "Vea sus sugerencias de tiendas y el estado de revisión."
    }
  }
}
```

Note: These keys should be **merged** into the existing JSON files, not replace them. The existing keys like `storeForm.addTitle`, `storeForm.saveStore` etc. should be **overwritten** with the new proposal-oriented copy.

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/i18n/translations/en-GB.json apps/web/app/i18n/translations/es-VE.json
git commit -m "feat(web): add proposal UX copy in en-GB and es-VE"
```

---

## Task 14: Integration Tests

**Files:**
- Modify: `apps/server/tests/api_tests.rs`

- [ ] **Step 1: Add a proposal lifecycle integration test**

Add to `apps/server/tests/api_tests.rs`:

```rust
#[tokio::test]
#[ignore = "integration tests"]
async fn test_proposal_lifecycle() {
    let config = Config::new().expect("Failed to load config");
    let pool = PgPoolOptions::new()
        .max_connections(1)
        .connect(&config.database_url)
        .await
        .expect("Failed to create pool");

    // Seed an admin user
    server::auth::seed_admin(&pool, "test-admin-uid")
        .await
        .expect("Failed to seed admin");

    // Seed a contributor user
    let contributor = server::auth::FirebaseUser {
        uid: "test-contributor-uid".to_string(),
        email: Some("contributor@test.com".to_string()),
        email_verified: true,
    };
    let (contributor_id, _) = server::auth::upsert_user(&pool, &contributor)
        .await
        .expect("Failed to upsert contributor");

    let admin = server::auth::FirebaseUser {
        uid: "test-admin-uid".to_string(),
        email: Some("admin@test.com".to_string()),
        email_verified: true,
    };
    let (admin_id, _) = server::auth::upsert_user(&pool, &admin)
        .await
        .expect("Failed to upsert admin");

    let schema = create_schema(pool.clone(), None);

    // 1. Submit a create proposal as contributor
    let product_id: uuid::Uuid = sqlx::query_scalar("SELECT product_id FROM products LIMIT 1")
        .fetch_one(&pool)
        .await
        .expect("Failed to fetch product_id");

    let submit_mutation = format!(
        r#"
        mutation {{
            submitCreateStoreProposal(input: {{
                name: "Test Proposal Store",
                address: "123 Test Street",
                lat: 51.5,
                lng: -0.1,
                productIds: ["{}"],
                clientNonce: "test-nonce-lifecycle"
            }}) {{
                proposalId
                kind
                status
            }}
        }}
    "#,
        product_id
    );

    let contributor_auth = server::auth::AuthenticatedUser {
        user_id: contributor_id,
        role: "contributor".to_string(),
    };

    let request = async_graphql::Request::new(submit_mutation)
        .data(contributor.clone())
        .data(contributor_auth.clone());
    let response = schema.execute(request).await;
    assert!(response.errors.is_empty(), "Submit errors: {:?}", response.errors);

    let data = response.data.into_json().unwrap();
    let proposal_id = data["submitCreateStoreProposal"]["proposalId"]
        .as_str()
        .unwrap()
        .to_string();
    assert_eq!(data["submitCreateStoreProposal"]["status"], "PENDING");

    // 2. Approve as admin
    let review_mutation = format!(
        r#"
        mutation {{
            reviewStoreProposal(input: {{
                proposalId: "{}",
                decision: APPROVE,
                note: "Looks good"
            }}) {{
                status
                targetStoreId
            }}
        }}
    "#,
        proposal_id
    );

    let admin_auth = server::auth::AuthenticatedUser {
        user_id: admin_id,
        role: "admin".to_string(),
    };

    let request = async_graphql::Request::new(review_mutation)
        .data(admin.clone())
        .data(admin_auth);
    let response = schema.execute(request).await;
    assert!(response.errors.is_empty(), "Review errors: {:?}", response.errors);

    let data = response.data.into_json().unwrap();
    assert_eq!(data["reviewStoreProposal"]["status"], "APPROVED");

    // 3. Verify the store was actually created
    let target_store_id = data["reviewStoreProposal"]["targetStoreId"]
        .as_str()
        .unwrap();

    let check_query = format!(
        r#"
        query {{
            getStoreById(id: "{}") {{
                name
            }}
        }}
    "#,
        target_store_id
    );

    let response = schema.execute(check_query).await;
    assert!(response.errors.is_empty());
    let data = response.data.into_json().unwrap();
    assert_eq!(data["getStoreById"]["name"], "Test Proposal Store");

    // Cleanup
    let delete_mutation = format!(
        r#"mutation {{ deleteStore(id: "{}") }}"#,
        target_store_id
    );
    schema
        .execute(
            async_graphql::Request::new(delete_mutation)
                .data(admin)
                .data(server::auth::AuthenticatedUser {
                    user_id: admin_id,
                    role: "admin".to_string(),
                }),
        )
        .await;

    // Clean up users and proposals
    sqlx::query("DELETE FROM proposal_audit_log WHERE proposal_id IN (SELECT proposal_id FROM store_proposals WHERE client_nonce LIKE 'test-nonce%')")
        .execute(&pool)
        .await
        .ok();
    sqlx::query("DELETE FROM store_proposals WHERE client_nonce LIKE 'test-nonce%'")
        .execute(&pool)
        .await
        .ok();
    sqlx::query("DELETE FROM users WHERE firebase_uid LIKE 'test-%'")
        .execute(&pool)
        .await
        .ok();
}
```

- [ ] **Step 2: Run the tests**

Run: `cd apps/server && cargo test`
Expected: Unit tests pass.

Run: `cd apps/server && cargo test -- --include-ignored` (requires a running Postgres instance)
Expected: All integration tests pass including the new proposal lifecycle test.

- [ ] **Step 3: Commit**

```bash
git add apps/server/tests/api_tests.rs
git commit -m "test(server): add proposal lifecycle integration test"
```

---

## Task 15: Final Verification & Schema Sync

- [ ] **Step 1: Regenerate GraphQL schema from Rust**

Run: `cd apps/server && cargo run --bin export_schema`

- [ ] **Step 2: Run frontend codegen**

Run: `cd apps/web && pnpm graphql-codegen --config ./config/codegen.ts`

- [ ] **Step 3: Run frontend build**

Run: `cd apps/web && pnpm build`
Expected: Build succeeds.

- [ ] **Step 4: Run all backend tests**

Run: `cd apps/server && cargo test`
Expected: All unit tests pass.

Run: `cd apps/server && cargo clippy -- -D warnings`
Expected: No clippy warnings.

- [ ] **Step 5: Run frontend tests**

Run: `cd apps/web && pnpm vitest --config ./config/vitest.config.ts --run`
Expected: All frontend tests pass.

- [ ] **Step 6: Commit any remaining generated files**

```bash
git add -A
git commit -m "chore: regenerate schema and codegen artifacts"
```
