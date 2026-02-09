-- Convert users.id from BIGSERIAL to UUID

-- Drop foreign key constraints referencing users(id)
ALTER TABLE purchases DROP CONSTRAINT purchases_buyer_id_fkey;
ALTER TABLE videos DROP CONSTRAINT videos_owner_id_fkey;

-- Convert users.id to UUID
ALTER TABLE users
    ALTER COLUMN id DROP DEFAULT,
    ALTER COLUMN id SET DATA TYPE UUID USING gen_random_uuid(),
    ALTER COLUMN id SET DEFAULT gen_random_uuid();

DROP SEQUENCE IF EXISTS users_id_seq;

-- Convert foreign key columns to UUID
ALTER TABLE videos
    ALTER COLUMN owner_id SET DATA TYPE UUID USING gen_random_uuid();

ALTER TABLE purchases
    ALTER COLUMN buyer_id SET DATA TYPE UUID USING gen_random_uuid();

-- Restore foreign key constraints
ALTER TABLE videos
    ADD CONSTRAINT videos_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES users(id);

ALTER TABLE purchases
    ADD CONSTRAINT purchases_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES users(id);
