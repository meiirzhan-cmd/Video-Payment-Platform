-- Convert purchases.id from BIGSERIAL to UUID
ALTER TABLE purchases
    ALTER COLUMN id DROP DEFAULT,
    ALTER COLUMN id SET DATA TYPE UUID USING gen_random_uuid(),
    ALTER COLUMN id SET DEFAULT gen_random_uuid();

DROP SEQUENCE IF EXISTS purchases_id_seq;

-- Convert stripe_events.id from BIGSERIAL to UUID
ALTER TABLE stripe_events
    ALTER COLUMN id DROP DEFAULT,
    ALTER COLUMN id SET DATA TYPE UUID USING gen_random_uuid(),
    ALTER COLUMN id SET DEFAULT gen_random_uuid();

DROP SEQUENCE IF EXISTS stripe_events_id_seq;

-- Make stripe_payment_id nullable (PENDING purchases won't have it yet)
ALTER TABLE purchases ALTER COLUMN stripe_payment_id DROP NOT NULL;
