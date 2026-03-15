CREATE TABLE IF NOT EXISTS service_feed_reactions (
    id bigserial PRIMARY KEY,
    service_offering_id bigint NOT NULL REFERENCES provider_services(id),
    user_id bigint NOT NULL REFERENCES users(id),
    type varchar(20) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_service_feed_reaction UNIQUE (service_offering_id, user_id, type)
);

CREATE TABLE IF NOT EXISTS service_feed_comments (
    id bigserial PRIMARY KEY,
    service_offering_id bigint NOT NULL REFERENCES provider_services(id),
    user_id bigint NOT NULL REFERENCES users(id),
    content varchar(1000) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_feed_reactions_offering ON service_feed_reactions(service_offering_id, type);
CREATE INDEX IF NOT EXISTS idx_service_feed_reactions_user ON service_feed_reactions(user_id, service_offering_id);
CREATE INDEX IF NOT EXISTS idx_service_feed_comments_offering ON service_feed_comments(service_offering_id, created_at DESC);
