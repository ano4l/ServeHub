-- ============================================================
-- V2: Add all missing tables, columns, and indexes
-- ============================================================

-- 1. Add timestamps to existing tables
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url varchar(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts integer NOT NULL DEFAULT 0;

ALTER TABLE providers ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE providers ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE providers ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS longitude double precision;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS average_rating numeric(3,2) NOT NULL DEFAULT 0.00;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS review_count integer NOT NULL DEFAULT 0;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS completion_rate numeric(5,2) NOT NULL DEFAULT 0.00;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS response_time_minutes integer;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS profile_image_url varchar(500);

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_reason varchar(500);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 0;

ALTER TABLE provider_services ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE provider_services ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE provider_services ADD COLUMN IF NOT EXISTS description varchar(1000);
ALTER TABLE provider_services ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

-- 2. Payments table (entity exists but DDL was missing)
CREATE TABLE IF NOT EXISTS payments (
    id bigserial PRIMARY KEY,
    booking_id bigint NOT NULL REFERENCES bookings(id),
    status varchar(24) NOT NULL,
    gross_amount numeric(12,2) NOT NULL,
    commission_amount numeric(12,2) NOT NULL,
    provider_net_amount numeric(12,2) NOT NULL,
    reference varchar(80) NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now(),
    version integer NOT NULL DEFAULT 0
);

-- 3. Categories table
CREATE TABLE IF NOT EXISTS categories (
    id bigserial PRIMARY KEY,
    name varchar(120) NOT NULL UNIQUE,
    slug varchar(120) NOT NULL UNIQUE,
    icon varchar(60),
    display_order integer NOT NULL DEFAULT 0,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed default categories
INSERT INTO categories (name, slug, icon, display_order) VALUES
    ('Plumbing', 'plumbing', 'Droplets', 1),
    ('Electrical', 'electrical', 'Zap', 2),
    ('Cleaning', 'cleaning', 'Sparkles', 3),
    ('Gardening', 'gardening', 'Leaf', 4),
    ('Painting', 'painting', 'PaintBucket', 5),
    ('Carpentry', 'carpentry', 'Hammer', 6),
    ('HVAC', 'hvac', 'Wind', 7),
    ('Security', 'security', 'Shield', 8),
    ('Moving', 'moving', 'Truck', 9),
    ('Appliances', 'appliances', 'Settings', 10)
ON CONFLICT (slug) DO NOTHING;

-- 4. Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id bigserial PRIMARY KEY,
    booking_id bigint NOT NULL UNIQUE REFERENCES bookings(id),
    customer_id bigint NOT NULL REFERENCES users(id),
    provider_id bigint NOT NULL REFERENCES providers(id),
    rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
    quality_rating integer CHECK (quality_rating BETWEEN 1 AND 5),
    punctuality_rating integer CHECK (punctuality_rating BETWEEN 1 AND 5),
    professionalism_rating integer CHECK (professionalism_rating BETWEEN 1 AND 5),
    comment varchar(2000),
    provider_response varchar(2000),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Disputes table
CREATE TABLE IF NOT EXISTS disputes (
    id bigserial PRIMARY KEY,
    booking_id bigint NOT NULL REFERENCES bookings(id),
    opened_by bigint NOT NULL REFERENCES users(id),
    reason varchar(2000) NOT NULL,
    status varchar(24) NOT NULL DEFAULT 'OPEN',
    resolution_type varchar(40),
    resolution_notes varchar(2000),
    resolved_by bigint REFERENCES users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Wallet transactions table
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id bigserial PRIMARY KEY,
    user_id bigint NOT NULL REFERENCES users(id),
    type varchar(40) NOT NULL,
    amount numeric(12,2) NOT NULL,
    reference varchar(120),
    description varchar(500),
    balance_after numeric(12,2) NOT NULL,
    related_booking_id bigint REFERENCES bookings(id),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id bigserial PRIMARY KEY,
    user_id bigint NOT NULL REFERENCES users(id),
    type varchar(60) NOT NULL,
    title varchar(200) NOT NULL,
    message varchar(1000) NOT NULL,
    read boolean NOT NULL DEFAULT false,
    link varchar(500),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id bigserial PRIMARY KEY,
    user_id bigint NOT NULL UNIQUE REFERENCES users(id),
    email_enabled boolean NOT NULL DEFAULT true,
    push_enabled boolean NOT NULL DEFAULT true,
    sms_enabled boolean NOT NULL DEFAULT false,
    booking_updates boolean NOT NULL DEFAULT true,
    messages boolean NOT NULL DEFAULT true,
    promotions boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 9. Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id bigserial PRIMARY KEY,
    actor_id bigint REFERENCES users(id),
    action varchar(100) NOT NULL,
    entity_type varchar(60) NOT NULL,
    entity_id bigint,
    detail varchar(2000),
    ip_address varchar(45),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 10. Chat messages table (persist WebSocket messages)
CREATE TABLE IF NOT EXISTS chat_messages (
    id bigserial PRIMARY KEY,
    booking_id bigint NOT NULL REFERENCES bookings(id),
    sender_id bigint NOT NULL REFERENCES users(id),
    content varchar(4000) NOT NULL,
    sent_at timestamptz NOT NULL DEFAULT now()
);

-- 11. Provider availability table
CREATE TABLE IF NOT EXISTS provider_availability (
    id bigserial PRIMARY KEY,
    provider_id bigint NOT NULL REFERENCES providers(id),
    day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time time NOT NULL,
    end_time time NOT NULL,
    enabled boolean NOT NULL DEFAULT true,
    UNIQUE (provider_id, day_of_week)
);

-- 12. Provider documents table
CREATE TABLE IF NOT EXISTS provider_documents (
    id bigserial PRIMARY KEY,
    provider_id bigint NOT NULL REFERENCES providers(id),
    document_type varchar(60) NOT NULL,
    file_url varchar(500) NOT NULL,
    status varchar(24) NOT NULL DEFAULT 'PENDING',
    reviewed_by bigint REFERENCES users(id),
    review_notes varchar(500),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 13. Password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id bigserial PRIMARY KEY,
    user_id bigint NOT NULL REFERENCES users(id),
    token varchar(255) NOT NULL UNIQUE,
    expires_at timestamptz NOT NULL,
    used boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 14. Email verification tokens table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id bigserial PRIMARY KEY,
    user_id bigint NOT NULL REFERENCES users(id),
    token varchar(255) NOT NULL UNIQUE,
    expires_at timestamptz NOT NULL,
    used boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 15. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider_id ON bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_for ON bookings(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_reviews_provider_id ON reviews(provider_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer_id ON reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_provider_services_category ON provider_services(category);
CREATE INDEX IF NOT EXISTS idx_provider_services_provider_id ON provider_services(provider_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created ON wallet_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_booking ON chat_messages(booking_id, sent_at);
CREATE INDEX IF NOT EXISTS idx_disputes_booking ON disputes(booking_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_providers_location ON providers(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_providers_verification ON providers(verification_status);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_provider_documents_provider ON provider_documents(provider_id);
