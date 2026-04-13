-- Users table to track roles and trust
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firebase_uid VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'contributor',
    trust_score INT NOT NULL DEFAULT 0,
    region VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

CREATE TRIGGER set_updated_at_users BEFORE UPDATE ON users
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);

-- Store proposals table
CREATE TABLE store_proposals (
    proposal_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposer_user_id UUID NOT NULL REFERENCES users(user_id),
    kind VARCHAR(20) NOT NULL, -- 'create', 'update', 'delete'
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'withdrawn', 'superseded'
    target_store_id UUID REFERENCES stores(store_id),
    target_version BIGINT,
    payload JSONB NOT NULL,
    proposed_location GEOGRAPHY(Point),
    possible_duplicates JSONB DEFAULT '[]'::jsonb,
    reviewed_by UUID REFERENCES users(user_id),
    reviewed_at TIMESTAMPTZ,
    review_note TEXT,
    client_nonce VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    UNIQUE(proposer_user_id, client_nonce)
);

CREATE TRIGGER set_updated_at_store_proposals BEFORE UPDATE ON store_proposals
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE INDEX idx_store_proposals_status ON store_proposals(status);
CREATE INDEX idx_store_proposals_proposer ON store_proposals(proposer_user_id);
CREATE INDEX idx_store_proposals_location ON store_proposals USING GIST (proposed_location);

-- Audit log for proposals
CREATE TABLE proposal_audit_log (
    audit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID NOT NULL REFERENCES store_proposals(proposal_id),
    action VARCHAR(50) NOT NULL, -- 'submitted', 'withdrawn', 'approved', 'rejected', 'applied'
    actor_user_id UUID NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rate limiting quota table
CREATE TABLE submission_quota (
    key VARCHAR(255) PRIMARY KEY, -- e.g., 'uid:<firebase_uid>'
    tokens INT NOT NULL,
    capacity INT NOT NULL,
    refill_per_s FLOAT8 NOT NULL,
    refilled_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Update stores to include versioning
ALTER TABLE stores ADD COLUMN version BIGINT NOT NULL DEFAULT 1;
