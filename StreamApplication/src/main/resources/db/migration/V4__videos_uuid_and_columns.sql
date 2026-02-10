-- Convert videos.id from BIGSERIAL to UUID and add storage columns

-- Drop foreign key constraints referencing videos(id)
ALTER TABLE purchases DROP CONSTRAINT IF EXISTS purchases_video_id_fkey;

-- Convert videos.id to UUID
ALTER TABLE videos
    ALTER COLUMN id DROP DEFAULT,
    ALTER COLUMN id SET DATA TYPE UUID USING gen_random_uuid(),
    ALTER COLUMN id SET DEFAULT gen_random_uuid();

DROP SEQUENCE IF EXISTS videos_id_seq;

-- Convert purchases.video_id to UUID
ALTER TABLE purchases
    ALTER COLUMN video_id SET DATA TYPE UUID USING gen_random_uuid();

-- Restore foreign key constraint
ALTER TABLE purchases
    ADD CONSTRAINT purchases_video_id_fkey FOREIGN KEY (video_id) REFERENCES videos(id);

-- Rename storage_key to raw_storage_key
ALTER TABLE videos RENAME COLUMN storage_key TO raw_storage_key;
ALTER TABLE videos ALTER COLUMN raw_storage_key DROP NOT NULL;

-- Add new columns
ALTER TABLE videos ADD COLUMN hls_storage_key VARCHAR(500);
ALTER TABLE videos ADD COLUMN thumbnail_url  VARCHAR(1000);

-- Update status values: existing 'PROCESSING' stays valid, add support for new states
-- (DRAFT, UPLOADING, PROCESSING, READY, FAILED are all handled by the app enum)
