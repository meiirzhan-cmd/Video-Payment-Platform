CREATE TABLE transcoding_jobs (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id        UUID        NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    error_message   TEXT,
    started_at      TIMESTAMP,
    completed_at    TIMESTAMP,
    created_at      TIMESTAMP   NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP   NOT NULL DEFAULT now()
);

CREATE INDEX idx_transcoding_jobs_status ON transcoding_jobs(status);
CREATE INDEX idx_transcoding_jobs_video ON transcoding_jobs(video_id);
