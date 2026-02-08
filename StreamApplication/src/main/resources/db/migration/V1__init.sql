-- users: platform accounts
CREATE TABLE users (
    id            BIGSERIAL    PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name  VARCHAR(100) NOT NULL,
    role          VARCHAR(20)  NOT NULL DEFAULT 'USER',
    created_at    TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at    TIMESTAMP    NOT NULL DEFAULT now()
);

-- videos: uploaded content
CREATE TABLE videos (
    id            BIGSERIAL    PRIMARY KEY,
    owner_id      BIGINT       NOT NULL REFERENCES users(id),
    title         VARCHAR(255) NOT NULL,
    description   TEXT,
    storage_key   VARCHAR(500) NOT NULL,
    price_cents   INTEGER      NOT NULL DEFAULT 0,
    status        VARCHAR(20)  NOT NULL DEFAULT 'PROCESSING',
    duration_secs INTEGER,
    created_at    TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at    TIMESTAMP    NOT NULL DEFAULT now()
);

-- purchases: who bought what
CREATE TABLE purchases (
    id                BIGSERIAL    PRIMARY KEY,
    buyer_id          BIGINT       NOT NULL REFERENCES users(id),
    video_id          BIGINT       NOT NULL REFERENCES videos(id),
    amount_cents      INTEGER      NOT NULL,
    stripe_payment_id VARCHAR(255) NOT NULL,
    status            VARCHAR(20)  NOT NULL DEFAULT 'COMPLETED',
    created_at        TIMESTAMP    NOT NULL DEFAULT now(),
    UNIQUE(buyer_id, video_id)
);

-- stripe_events: idempotency log for webhooks
CREATE TABLE stripe_events (
    id              BIGSERIAL    PRIMARY KEY,
    stripe_event_id VARCHAR(255) NOT NULL UNIQUE,
    event_type      VARCHAR(100) NOT NULL,
    processed       BOOLEAN      NOT NULL DEFAULT FALSE,
    payload         JSONB,
    created_at      TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE INDEX idx_videos_owner ON videos(owner_id);
CREATE INDEX idx_purchases_buyer ON purchases(buyer_id);
CREATE INDEX idx_purchases_video ON purchases(video_id);
CREATE INDEX idx_stripe_events_type ON stripe_events(event_type);
