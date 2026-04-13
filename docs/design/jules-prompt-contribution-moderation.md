# Task: Implement Contribution & Moderation Pipeline

## Context

This is a Rust monorepo (`moon` task runner, `pnpm` workspaces) for **El Guacal** — a platform that helps the Venezuelan diaspora find stores selling Venezuelan products worldwide. The backend is Rust/Axum/`async-graphql`/`sqlx` with PostgreSQL + PostGIS. Firebase Auth handles authentication. The frontend is React Router v7 with Redux Toolkit (out of scope for this task).

### Key files to understand before starting

- `apps/server/src/main.rs` — Axum app setup, middleware, GraphQL schema wiring
- `apps/server/src/lib.rs` — module declarations
- `apps/server/src/auth/mod.rs` — `FirebaseVerifier` and `FirebaseUser` struct (has `uid: String`, `email: Option<String>`)
- `apps/server/src/api/mod.rs` — GraphQL schema assembly (`Query`, `Mutation`)
- `apps/server/src/api/commands/store.rs` — current `createStore`, `updateStore`, `deleteStore` mutations
- `apps/server/src/api/queries/store.rs` — `storesNear`, `getStoreById`
- `apps/server/src/api/queries/product.rs` — `allProducts`
- `apps/server/src/model/store.rs` — `Store` struct
- `apps/server/src/model/product.rs` — `Product` struct
- `apps/server/src/model/location.rs` — `Location` struct
- `apps/server/src/config.rs` — app config from env vars
- `apps/server/schema.graphql` — generated schema (re-generated via `apps/server/src/bin/export_schema.rs`)
- `apps/server/migrations/20251102000000_initial_schema.sql` — existing tables: `stores`, `products`, `store_products`
- `apps/server/Cargo.toml` — dependencies (Rust 2024 edition)

### Current state of writes

All three mutations in `apps/server/src/api/commands/store.rs` do this:

```rust
let _user = ctx
    .data_opt::<FirebaseUser>()
    .ok_or_else(|| async_graphql::Error::new("Unauthorized"))?;
```

They check that a `FirebaseUser` exists in the GraphQL context but **never use it** — no author tracking, no role check. They write directly to the canonical `stores` table. There is no `users` table in Postgres. There is no `version` column on `stores`. There is no moderation queue.

### What needs to change

Replace direct writes with a proposal-based moderation pipeline. The read path (`storesNear`, `getStoreById`, `allProducts`) must remain completely untouched.

---

## Step 1: Database Migration

Create `apps/server/migrations/20260413000000_contribution_moderation.sql` with the following content exactly:

```sql
-- 1. Users table — mirrors Firebase uid with app-level roles
CREATE TABLE users (
  user_id        uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  firebase_uid   text UNIQUE NOT NULL,
  email          text,
  display_name   text,
  role           text NOT NULL DEFAULT 'contributor'
                 CHECK (role IN ('contributor', 'moderator', 'admin')),
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

-- 3. Proposal types
CREATE TYPE proposal_kind   AS ENUM ('create', 'update', 'delete');
CREATE TYPE proposal_status AS ENUM ('pending', 'approved', 'rejected', 'withdrawn', 'superseded');

-- 4. Proposals table
CREATE TABLE store_proposals (
  proposal_id        uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  kind               proposal_kind NOT NULL,
  status             proposal_status NOT NULL DEFAULT 'pending',
  target_store_id    uuid REFERENCES stores(store_id) ON DELETE SET NULL,
  target_version     bigint,
  payload            jsonb NOT NULL,
  proposed_location  geography(Point),
  proposer_user_id   uuid NOT NULL REFERENCES users(user_id) ON DELETE SET NULL,
  client_nonce       text NOT NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  reviewed_by        uuid REFERENCES users(user_id) ON DELETE SET NULL,
  reviewed_at        timestamptz,
  review_note        text,
  CONSTRAINT unique_pending_nonce UNIQUE (proposer_user_id, client_nonce)
);

CREATE INDEX idx_proposals_pending   ON store_proposals (status, created_at) WHERE status = 'pending';
CREATE INDEX idx_proposals_target    ON store_proposals (target_store_id) WHERE target_store_id IS NOT NULL;
CREATE INDEX idx_proposals_proposer  ON store_proposals (proposer_user_id);
CREATE INDEX idx_proposals_location  ON store_proposals USING GIST (proposed_location);

-- 5. Audit log (append-only)
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

**Important**: the existing `set_updated_at()` function and trigger pattern already exist in `20251102000000_initial_schema.sql`. Reuse the function; do not recreate it. The `stores` table's existing rows will get `version = 1` from the `DEFAULT`.

---

## Step 2: Add `SEED_ADMIN_FIREBASE_UID` config

In `apps/server/src/config.rs`, add an optional field `seed_admin_firebase_uid: Option<String>` read from the environment variable `SEED_ADMIN_FIREBASE_UID`.

On server startup (in `main.rs`, after the database pool is created and migrations have run), if `seed_admin_firebase_uid` is set, upsert that uid into the `users` table with `role = 'admin'`:

```sql
INSERT INTO users (firebase_uid, role)
VALUES ($1, 'admin')
ON CONFLICT (firebase_uid)
DO UPDATE SET role = 'admin', updated_at = now()
```

This is a one-time bootstrap. It runs every startup but the upsert is idempotent.

---

## Step 3: User resolution middleware

Create `apps/server/src/model/user.rs` with a `User` struct:

```rust
#[derive(Debug, Clone, sqlx::FromRow)]
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
```

Register it in `apps/server/src/model/mod.rs`.

Modify the request handling so that when a `FirebaseUser` is present in the GraphQL context, we also upsert and resolve the corresponding `User` row:

```sql
INSERT INTO users (firebase_uid, email, email_verified)
VALUES ($1, $2, $3)
ON CONFLICT (firebase_uid)
DO UPDATE SET email = COALESCE($2, users.email),
              email_verified = $3,
              updated_at = now()
RETURNING *
```

The `email_verified` field should be extracted from the Firebase JWT claims (the `email_verified` claim). You will need to add this field to the `Claims` struct in `apps/server/src/auth/mod.rs` and propagate it through `FirebaseUser`.

Insert the resolved `User` into the GraphQL context data alongside the existing `FirebaseUser`, so resolvers can access it via `ctx.data_opt::<User>()`.

---

## Step 4: Rust models for proposals and audit log

Create `apps/server/src/model/proposal.rs`:

```rust
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

use crate::model::location::Location;

#[derive(Debug, Clone, sqlx::Type)]
#[sqlx(type_name = "proposal_kind", rename_all = "lowercase")]
pub enum ProposalKind {
    Create,
    Update,
    Delete,
}

#[derive(Debug, Clone, sqlx::Type)]
#[sqlx(type_name = "proposal_status", rename_all = "lowercase")]
pub enum ProposalStatus {
    Pending,
    Approved,
    Rejected,
    Withdrawn,
    Superseded,
}

/// The jsonb payload for create and update proposals.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoreProposalPayload {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub address: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub lat: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub lng: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub product_ids: Option<Vec<Uuid>>,
    /// Only used for delete proposals.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
}

#[derive(Debug, Clone, FromRow)]
pub struct StoreProposal {
    pub proposal_id: Uuid,
    pub kind: ProposalKind,
    pub status: ProposalStatus,
    pub target_store_id: Option<Uuid>,
    pub target_version: Option<i64>,
    pub payload: sqlx::types::Json<StoreProposalPayload>,
    pub proposer_user_id: Uuid,
    pub client_nonce: String,
    pub created_at: DateTime<Utc>,
    pub reviewed_by: Option<Uuid>,
    pub reviewed_at: Option<DateTime<Utc>>,
    pub review_note: Option<String>,
}
```

Register it in `apps/server/src/model/mod.rs`.

---

## Step 5: GraphQL types for proposals

Create `apps/server/src/api/queries/proposal.rs` and `apps/server/src/api/commands/proposal.rs`.

### New GraphQL enums and types

```rust
// In the queries module:

#[derive(async_graphql::Enum, Copy, Clone, Eq, PartialEq)]
pub enum ProposalKindGql {
    Create,
    Update,
    Delete,
}

#[derive(async_graphql::Enum, Copy, Clone, Eq, PartialEq)]
pub enum ProposalStatusGql {
    Pending,
    Approved,
    Rejected,
    Withdrawn,
    Superseded,
}

#[derive(async_graphql::Enum, Copy, Clone, Eq, PartialEq)]
pub enum ReviewDecision {
    Approve,
    Reject,
}

#[derive(async_graphql::SimpleObject)]
pub struct StoreDiff {
    pub field: String,
    pub before: Option<String>,
    pub after: Option<String>,
}
```

### New GraphQL output type: `StoreProposalGql`

Implement as an `#[Object]` with resolvers that:
- Deserialise the `payload` jsonb into `proposed_name`, `proposed_address`, `proposed_location`, `proposed_product_ids`, `reason`
- Resolve `proposer` and `reviewed_by` by loading `User` rows
- Compute `diff_against_current` by loading the target store's current state and diffing it field-by-field against the payload (only for `update` kind)
- Compute `possible_duplicates` by running the PostGIS `ST_DWithin` query (only populated on the submit response, not on subsequent fetches — use a flag or field on the struct)

### Cursor-based pagination

Implement `StoreProposalConnection` and `StoreProposalEdge` types for cursor-based pagination. Use `created_at` as the cursor (base64-encoded ISO timestamp). This applies to `myStoreProposals` and `pendingStoreProposals`.

---

## Step 6: New mutations

All in `apps/server/src/api/commands/proposal.rs`.

### Authorization rules

**All mutations require Firebase Auth** (no anonymous access). Extract the `User` from GraphQL context. If absent, return `"Unauthorized"`.

| Mutation | Contributor | Moderator | Admin |
|---|---|---|---|
| `submitCreateStoreProposal` | yes | yes | yes |
| `submitUpdateStoreProposal` | yes | yes | yes |
| `submitDeleteStoreProposal` | only if `trust_score >= 3` | yes | yes |
| `withdrawStoreProposal` | only own proposals | yes | yes |
| `reviewStoreProposal` | no | yes | yes |
| `setUserRole` | no | no | yes |

### `submitCreateStoreProposal`

Input:
```graphql
input SubmitCreateStoreProposalInput {
  name: String!
  address: String!
  lat: Float!
  lng: Float!
  productIds: [UUID!]!
  clientNonce: String!
  notADuplicate: Boolean
}
```

Logic:
1. Check rate limit (see Step 7).
2. If `not_a_duplicate` is not `true`, run duplicate detection:
   ```sql
   SELECT store_id, name, address, ST_Distance(location, $point) AS metres
     FROM stores
    WHERE ST_DWithin(location, $point, 100)
    ORDER BY metres LIMIT 5;
   ```
   Also check pending proposals:
   ```sql
   SELECT proposal_id FROM store_proposals
    WHERE status = 'pending'
      AND ST_DWithin(proposed_location, $point, 100)
    LIMIT 5;
   ```
   If duplicates found, return the proposal with `possible_duplicates` populated and let the client re-submit with `notADuplicate: true`.
3. Build `StoreProposalPayload` with all fields set.
4. Insert into `store_proposals` with `kind = 'create'`, `proposed_location = ST_SetSRID(ST_Point(lng, lat), 4326)::geography`.
5. Insert into `proposal_audit_log` with `action = 'submitted'`.
6. Return the created `StoreProposal`.

The `client_nonce` + `proposer_user_id` unique constraint handles idempotency. If the insert conflicts, return the existing proposal instead of erroring.

### `submitUpdateStoreProposal`

Input:
```graphql
input SubmitUpdateStoreProposalInput {
  targetStoreId: UUID!
  expectedVersion: Int!
  name: String
  address: String
  lat: Float
  lng: Float
  productIds: [UUID!]
  clientNonce: String!
}
```

Logic:
1. Check rate limit.
2. Verify the target store exists and its `version` matches `expected_version`. If not, return error `"Store has been modified since you loaded it. Please refresh and try again."`.
3. At least one optional field must be set. Return error if all are `None`.
4. Insert into `store_proposals` with `kind = 'update'`, `target_store_id`, `target_version = expected_version`.
5. If `lat`/`lng` provided, set `proposed_location`.
6. Audit log entry.
7. Return the proposal.

### `submitDeleteStoreProposal`

Input:
```graphql
input SubmitDeleteStoreProposalInput {
  targetStoreId: UUID!
  expectedVersion: Int!
  reason: String!
  clientNonce: String!
}
```

Logic:
1. Check rate limit.
2. Check `trust_score >= 3` for contributors. Moderators/admins bypass.
3. Verify target store exists and version matches.
4. Insert with `kind = 'delete'`, payload = `{ "reason": "..." }`.
5. Audit log, return proposal.

### `withdrawStoreProposal`

1. Load proposal, verify `proposer_user_id` matches caller (or caller is moderator/admin).
2. Guard: only `pending` proposals can be withdrawn.
3. Update `status = 'withdrawn'`.
4. Audit log.

### `reviewStoreProposal`

Input:
```graphql
input ReviewProposalInput {
  proposalId: UUID!
  decision: ReviewDecision!
  note: String
}
```

This is the critical path. It must run inside a single `sqlx` transaction:

**If decision is APPROVE:**

```
BEGIN;
  -- Lock the proposal
  SELECT * FROM store_proposals WHERE proposal_id = $1 FOR UPDATE;
  -- Guard: status must be 'pending'

  -- For update/delete: lock the target store and check version
  SELECT version FROM stores WHERE store_id = $target FOR UPDATE;
  -- If version != target_version: mark proposal 'superseded', audit, commit, return

  -- Apply the change based on kind:
  --   create: INSERT INTO stores (...) RETURNING store_id
  --           then INSERT INTO store_products for each product_id in payload
  --   update: UPDATE stores SET name=..., address=..., location=..., version=version+1
  --           then DELETE FROM store_products WHERE store_id = $target
  --           then INSERT INTO store_products for new product_ids
  --   delete: DELETE FROM stores WHERE store_id = $target
  --           (store_products cascade-deletes via FK)

  -- Mark proposal approved
  UPDATE store_proposals SET status='approved', reviewed_by=$mod, reviewed_at=now(), review_note=$note;

  -- Audit entries (both 'approved' and 'applied')
  INSERT INTO proposal_audit_log ...;

  -- Bump proposer trust
  UPDATE users SET trust_score = trust_score + 1 WHERE user_id = proposer_user_id;
COMMIT;
```

**If decision is REJECT:**

```
BEGIN;
  SELECT * FROM store_proposals WHERE proposal_id = $1 FOR UPDATE;
  -- Guard: status must be 'pending'

  UPDATE store_proposals SET status='rejected', reviewed_by=$mod, reviewed_at=now(), review_note=$note;
  INSERT INTO proposal_audit_log (proposal_id, action, actor_user_id) VALUES ($1, 'rejected', $mod);

  -- Optionally decrement trust (only if moderator flags as spam/bad faith — for now, always decrement by 1)
  UPDATE users SET trust_score = trust_score - 1 WHERE user_id = proposer_user_id;
COMMIT;
```

### `setUserRole`

Input:
```graphql
input SetUserRoleInput {
  firebaseUid: String!
  role: String!
  region: String
}
```

Logic:
1. Verify caller is `admin`.
2. Validate `role` is one of `contributor`, `moderator`, `admin`.
3. Upsert:
   ```sql
   INSERT INTO users (firebase_uid, role, region)
   VALUES ($1, $2, $3)
   ON CONFLICT (firebase_uid)
   DO UPDATE SET role = $2, region = $3, updated_at = now()
   RETURNING *
   ```
4. Return the `User`.

---

## Step 7: Rate limiting

Create `apps/server/src/rate_limit.rs`.

Implement a Postgres-backed token bucket. On each submission mutation, before any other logic:

```sql
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
RETURNING tokens;
```

If `tokens < 0`, return a GraphQL error: `"Rate limit exceeded. Please try again later."`.

Rate limit tiers (keyed by `uid:<firebase_uid>`):

| Role | Capacity | Refill rate |
|---|---|---|
| Contributor | 20 | 1 per 15 min (0.00111/s) |
| Trusted contributor (trust >= 10) | 100 | 1 per 3 min (0.00556/s) |
| Moderator | 500 | 1 per second |

---

## Step 8: New queries

In `apps/server/src/api/queries/proposal.rs`:

### `storeProposal(id: UUID!): StoreProposal`

Fetch a single proposal. Any authenticated user can view their own proposals. Moderators/admins can view any proposal.

### `myStoreProposals(status: ProposalStatus, limit: Int = 50, cursor: String): StoreProposalConnection`

Fetch the caller's own proposals, filtered by optional status. Cursor-based pagination on `created_at DESC`.

### `pendingStoreProposals(region: String, kind: ProposalKind, limit: Int = 50, cursor: String): StoreProposalConnection`

Moderator/admin only. Fetch pending proposals ordered by `created_at ASC` (oldest first). Optional filters by region (match against the proposer's country, derived from `proposed_location` — for v1, just filter by proximity or skip the region filter) and kind.

---

## Step 9: Deprecate old mutations

In `apps/server/src/api/commands/store.rs`, modify `createStore`, `updateStore`, and `deleteStore`:

1. Replace the `FirebaseUser` check with a `User` check that requires `role = 'admin'`.
2. Add `#[graphql(deprecation = "Use submitCreateStoreProposal. Kept for admin bulk imports.")]` (and equivalent for update/delete).
3. **Do not change anything else about these mutations.** They must continue to work exactly as before for admin users.

---

## Step 10: Update the `stores` model

The `Store` struct and its queries need to account for the new `version` column. Add `version: i64` to the `Store` struct. Update all `SELECT` queries for stores to include `version` in the column list. Expose it in the GraphQL type so the frontend can pass it back as `expectedVersion` in update/delete proposals.

---

## Step 11: Wire it all together

In `apps/server/src/api/mod.rs`:

1. Add `ProposalQuery` to the merged `Query` type.
2. Add `ProposalCommand` to the merged `Mutation` type.
3. Ensure `User` (from the middleware) and `PgPool` are available in the GraphQL context.

---

## Step 12: Update schema export

Run the schema export binary (`apps/server/src/bin/export_schema.rs`) to regenerate `apps/server/schema.graphql`. This binary already exists — just make sure it picks up the new query and mutation types.

---

## Step 13: Tests

Add integration tests in `apps/server/tests/` covering:

1. **Submit create proposal** — happy path, returns proposal with `status = pending`.
2. **Duplicate detection** — submit a create proposal near an existing store, verify `possible_duplicates` is populated.
3. **Submit update proposal** — happy path with `expected_version` matching.
4. **Submit update proposal with stale version** — should error.
5. **Submit delete proposal** — requires `trust_score >= 3`, verify it fails for new users.
6. **Review: approve create** — verify the store appears in `stores` table.
7. **Review: approve update** — verify the store is updated and `version` is incremented.
8. **Review: approve delete** — verify the store is removed.
9. **Review: reject** — verify canonical tables are untouched and proposer trust is decremented.
10. **Review: superseded** — modify the target store between submission and review, verify the proposal is marked `superseded`.
11. **Withdraw proposal** — only own, only pending.
12. **Rate limiting** — exhaust the bucket, verify the next submission is rejected.
13. **setUserRole** — admin can promote, contributor cannot.
14. **Authorization** — verify non-moderators cannot call `reviewStoreProposal` or `pendingStoreProposals`.

Follow the existing test patterns in `apps/server/tests/api_tests.rs`. Use `sqlx::PgPool` test fixtures.

---

## Constraints

- **Rust edition 2024** — the project uses `edition = "2024"` in `Cargo.toml`. Use current Rust idioms.
- **Clippy lints**: `pedantic` and `nursery` are set to `warn`. Code must pass `cargo clippy` cleanly.
- **`unsafe` is forbidden** — see `[lints.rust]` in `Cargo.toml`.
- **Do not modify read queries** — `storesNear`, `getStoreById`, `allProducts` must remain untouched.
- **Do not add new crate dependencies** unless absolutely necessary. Everything needed (`sqlx`, `async-graphql`, `serde`, `serde_json`, `uuid`, `chrono`, `axum`, `tracing`) is already in `Cargo.toml`.
- **Do not modify existing migrations.** Only add a new one.
- **Do not touch the frontend** (`apps/web`). This task is backend only.
- **All SQL queries must use parameterised binds** (`$1`, `$2`, etc.). No string interpolation in SQL.

---

## Summary of new files to create

1. `apps/server/migrations/20260413000000_contribution_moderation.sql`
2. `apps/server/src/model/user.rs`
3. `apps/server/src/model/proposal.rs`
4. `apps/server/src/api/queries/proposal.rs`
5. `apps/server/src/api/commands/proposal.rs`
6. `apps/server/src/rate_limit.rs`

## Files to modify

1. `apps/server/src/config.rs` — add `seed_admin_firebase_uid`
2. `apps/server/src/main.rs` — seed admin on startup, user resolution middleware
3. `apps/server/src/auth/mod.rs` — add `email_verified` to `Claims` and `FirebaseUser`
4. `apps/server/src/model/mod.rs` — register `user` and `proposal` modules
5. `apps/server/src/model/store.rs` — add `version: i64` field
6. `apps/server/src/api/mod.rs` — wire new query/mutation types into the schema
7. `apps/server/src/api/queries/mod.rs` — register proposal queries
8. `apps/server/src/api/queries/store.rs` — include `version` in SELECT columns
9. `apps/server/src/api/commands/mod.rs` — register proposal commands
10. `apps/server/src/api/commands/store.rs` — gate old mutations on `role = 'admin'`, add deprecation
11. `apps/server/tests/api_tests.rs` — add moderation integration tests
