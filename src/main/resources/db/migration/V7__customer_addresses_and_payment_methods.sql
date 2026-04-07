-- ============================================================
-- V7: Add customer_addresses and saved_payment_methods tables
-- These JPA entities exist but had no matching DDL.
-- ============================================================

CREATE TABLE IF NOT EXISTS customer_addresses (
    id bigserial PRIMARY KEY,
    user_id bigint NOT NULL REFERENCES users(id),
    label varchar(80) NOT NULL,
    value varchar(255) NOT NULL,
    note varchar(255),
    default_address boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_addresses_user ON customer_addresses(user_id);

CREATE TABLE IF NOT EXISTS saved_payment_methods (
    id bigserial PRIMARY KEY,
    user_id bigint NOT NULL REFERENCES users(id),
    brand varchar(40) NOT NULL,
    last4 varchar(4) NOT NULL,
    holder_name varchar(120) NOT NULL,
    expiry varchar(10) NOT NULL,
    default_method boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_payment_methods_user ON saved_payment_methods(user_id);
