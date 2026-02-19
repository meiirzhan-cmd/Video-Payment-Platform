# LearnStream — Backend

Spring Boot 4.0.2 backend (Java 21) that handles authentication, video management, payment processing, and HLS transcoding.

## Tech Stack

- **Java 21**, **Spring Boot 4.0.2**, **Gradle 9.3**
- **PostgreSQL 17** — primary database (Flyway migrations)
- **MinIO** — S3-compatible object storage (raw + processed video buckets)
- **Apache Kafka** — async transcoding pipeline
- **Stripe** — payment checkout + webhooks
- **FFmpeg** — multi-quality HLS transcoding (360p/720p/1080p)
- **JWT** — stateless auth (access + refresh tokens)

## Package Structure

```text
com.learnstream/
├── auth/           # JWT authentication, login, registration
├── user/           # User entity and repository
├── video/          # Video CRUD, upload, HLS streaming proxy
├── storage/        # MinIO (S3-compatible) storage service
├── payment/        # Stripe Checkout, webhooks, purchase tracking
├── transcoding/    # Kafka-driven FFmpeg HLS transcoding
└── config/         # Security, CORS, web configuration
```

## Running Locally

```bash
# 1. Start infrastructure
docker compose up -d postgres minio kafka

# 2. Create a .env file
cp .env.example .env  # then fill in DB_PASSWORD, JWT_SECRET, etc.

# 3. Run the app
./gradlew bootRun
```

The API starts on `http://localhost:8080`.

## API Endpoints

### Auth (`/api/auth`) — Public

| Method | Path | Description |
| ------ | ---- | ----------- |
| POST | `/api/auth/register` | Register with email + password |
| POST | `/api/auth/login` | Login, returns access + refresh tokens |
| POST | `/api/auth/refresh` | Exchange refresh token for new access token |

### Videos (`/api/videos`)

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| GET | `/api/videos` | Public | Browse catalog (only READY videos, with search) |
| GET | `/api/videos/{id}` | Public | Video detail (any status) |
| POST | `/api/videos` | Auth | Create draft video |
| PUT | `/api/videos/{id}` | Owner | Update title, description, price |
| PUT | `/api/videos/{id}/upload` | Owner | Upload raw video file (triggers transcoding) |
| DELETE | `/api/videos/{id}` | Owner | Delete video and all storage |
| GET | `/api/videos/{id}/stream` | Auth + Access | Get HLS proxy URL |
| GET | `/api/videos/{id}/hls/{*path}` | Auth + Access | Stream HLS content (m3u8/ts) from MinIO |
| PUT | `/api/videos/{id}/thumbnail` | Owner | Upload custom thumbnail |
| DELETE | `/api/videos/{id}/thumbnail` | Owner | Revert to auto-generated thumbnail |

### Creator (`/api/creator`)

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| GET | `/api/creator/videos` | Auth | List creator's own videos (all statuses) |
| GET | `/api/creator/stats` | Auth | Total videos, purchases, earnings |

### Payments (`/api/payments`)

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| POST | `/api/payments/checkout` | Auth | Create Stripe Checkout session |
| GET | `/api/purchases` | Auth | List user's completed purchases (paginated) |
| GET | `/api/videos/{id}/access` | Auth | Check if user has access to a video |

### Webhooks

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| POST | `/api/webhooks/stripe` | Stripe signature | Receive Stripe events |

## Database Schema

Managed by Flyway migrations (V1 through V6). All tables use UUID primary keys.

### users

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | UUID | PK, auto-generated |
| email | VARCHAR | Unique, not null |
| password_hash | VARCHAR | BCrypt hash |
| display_name | VARCHAR | Nullable |
| role | VARCHAR | USER, CREATOR, ADMIN |
| created_at | TIMESTAMP | Immutable |

### videos

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | UUID | PK |
| owner_id | UUID | Creator's user ID |
| title | VARCHAR(255) | Not null |
| description | TEXT | Nullable |
| price_cents | INT | 0 = free |
| status | VARCHAR | DRAFT, UPLOADING, PROCESSING, READY, FAILED |
| raw_storage_key | VARCHAR | Path in `raw-videos` bucket |
| hls_storage_key | VARCHAR | Path to master.m3u8 in `processed-videos` |
| thumbnail_url | VARCHAR | Storage key for thumbnail |
| duration_secs | INT | Set by ffprobe during transcoding |
| created_at | TIMESTAMP | Immutable |
| updated_at | TIMESTAMP | Auto-updated |

### purchases

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | UUID | PK |
| buyer_id | UUID | User who purchased |
| video_id | UUID | Video purchased |
| amount_cents | INT | 0 for free videos |
| stripe_payment_id | VARCHAR | Session ID, later updated to Payment Intent ID |
| status | VARCHAR | PENDING, COMPLETED, FAILED, REFUNDED |
| created_at | TIMESTAMP | Immutable |

Unique constraint on `(buyer_id, video_id)`.

### stripe_events

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | UUID | PK |
| stripe_event_id | VARCHAR | Unique, for idempotency |
| event_type | VARCHAR | e.g. checkout.session.completed |
| processed | BOOLEAN | Tracks completion |
| payload | JSONB | Raw event data |
| created_at | TIMESTAMP | Immutable |

### transcoding_jobs

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | UUID | PK |
| video_id | UUID | FK to videos (CASCADE delete) |
| status | VARCHAR | PENDING, IN_PROGRESS, COMPLETED, FAILED |
| error_message | TEXT | Set on failure |
| started_at | TIMESTAMP | Set when processing starts |
| completed_at | TIMESTAMP | Set on completion/failure |

## Key Services

### AuthService

- Registers users with BCrypt-hashed passwords
- Generates JWT access tokens (15 min, contains userId/email/role) and refresh tokens (7 days, userId only)
- Validates refresh tokens and issues new access tokens

### VideoService

- Validates uploads: mp4/quicktime/webm, max 2GB
- Uploads raw files to MinIO `raw-videos` bucket at `{creatorId}/{videoId}/original.{ext}`
- Returns HLS proxy URLs (not direct MinIO URLs) for secure streaming
- Streams HLS content from MinIO through the backend, enforcing access control on every segment request
- Manages custom thumbnails (jpeg/png/webp, max 5MB) alongside auto-generated ones

### PaymentService

- Creates Stripe Checkout Sessions with video metadata for webhook-based fulfillment linking
- Free videos (priceCents == 0): immediately creates COMPLETED purchase, no Stripe involved
- Validates: video must be READY, no self-purchase, no duplicate purchase
- Handles webhooks: verifies Stripe signature, idempotency check via `stripe_events` table, updates purchase status to COMPLETED
- Access check order: creator > free+READY > COMPLETED purchase > denied

### TranscodingWorker (Kafka Consumer)

Consumes `TranscodingRequestedEvent` from the `transcoding-jobs` topic:

```text
1. Download raw video from MinIO → temp directory
2. ffprobe → extract duration (seconds)
3. ffmpeg → extract thumbnail at 1s (640px wide)
4. ffmpeg → transcode to HLS:
   - 360p (640x360, 800kbps)
   - 720p (1280x720, 2500kbps)
   - 1080p (1920x1080, 5000kbps)
   - 6-second segments, master playlist
5. Upload all HLS files + thumbnail to processed-videos bucket
6. Update video: hlsStorageKey, thumbnailUrl, durationSecs, status=READY
7. Cleanup temp directory
```

On failure: marks job FAILED, sets video status to FAILED.

### StorageService

- Manages two MinIO buckets: `raw-videos` and `processed-videos`
- Auto-creates buckets on startup if missing
- Generates presigned URLs for thumbnails (60 min expiry) using a separate public endpoint
- Uses path-style access for MinIO compatibility

## Security

- **Stateless JWT** — No server-side sessions. JWT filter runs before Spring Security's auth filter.
- **`@CurrentUser` annotation** — Custom argument resolver extracts UUID from SecurityContext.
- **Public routes** — `POST /api/auth/**`, `GET /api/videos`, `GET /api/videos/{id}`, `POST /api/webhooks/stripe`.
- **All other routes** — Require valid JWT in `Authorization: Bearer` header.
- **CORS** — Allows `localhost:5173` (Vite dev) and `localhost:3000` (Docker Nginx).
- **HLS proxy** — Video content is never served directly from MinIO. Every `.m3u8` and `.ts` request goes through the backend and requires JWT + purchase verification.

## Configuration Profiles

| Profile | When | Service Hosts |
| ------- | ---- | ------------- |
| local (default) | Running outside Docker | localhost for all services |
| dev | Docker Compose | Docker service names (postgres, minio, kafka) |

Key properties in `application.yml`:

| Property | Description |
| -------- | ----------- |
| `jwt.secret` | Base64-encoded HMAC signing key |
| `jwt.access-token-expiration` | 900000 ms (15 min) |
| `jwt.refresh-token-expiration` | 604800000 ms (7 days) |
| `minio.endpoint` | Internal MinIO URL (backend to MinIO) |
| `minio.public-endpoint` | Public MinIO URL (for presigned thumbnail URLs) |
| `app.base-url` | Frontend URL for Stripe redirect after checkout |
| `stripe.secret-key` | Stripe API secret key |
| `stripe.webhook-secret` | Stripe webhook signing secret |

## Docker

Multi-stage build:

1. **Builder** — Eclipse Temurin JDK 21, Gradle wrapper, builds fat JAR (skips tests)
2. **Runtime** — Eclipse Temurin JRE 21 Alpine, FFmpeg installed, runs as non-root `appuser`

```bash
# Build and run with Docker Compose
docker compose up -d --build app
```
