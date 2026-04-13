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
