# LearnStream — Backend

Spring Boot API for a video monetization platform with Stripe payments, HLS transcoding, and Kafka-driven async processing.

## Tech Stack

- **Java 21**, **Spring Boot 4.0.2**, **Gradle 9.3**
- **PostgreSQL 17** — primary database (Flyway migrations)
- **MinIO** — S3-compatible object storage (raw + processed video buckets)
- **Apache Kafka** — async transcoding pipeline
- **Stripe** — payment checkout + webhooks
- **FFmpeg** — multi-quality HLS transcoding (360p/720p/1080p)
- **Redis** — caching layer
- **JWT** — stateless auth (access + refresh tokens)

## Architecture

```
Upload → VideoService → Kafka (transcoding-jobs topic)
                              ↓
                        TranscodingWorker (@KafkaListener)
                              ↓
                        FFmpeg → HLS → MinIO (processed bucket)
                              ↓
                        Video status → READY
```

Packages are feature-based: `auth`, `video`, `storage`, `payment`, `transcoding`, `config`.

## Running Locally

```bash
# 1. Start infrastructure
docker compose up -d postgres minio redis kafka

# 2. Create a .env file
cp .env.example .env  # then fill in DB_PASSWORD, JWT_SECRET, etc.

# 3. Run the app
./gradlew bootRun
```

The API starts on `http://localhost:8080`.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | - | Register |
| POST | `/api/auth/login` | - | Login |
| POST | `/api/auth/refresh` | - | Refresh token |
| GET | `/api/videos` | - | List/search videos |
| GET | `/api/videos/{id}` | - | Video details |
| POST | `/api/videos` | Creator | Create draft |
| PUT | `/api/videos/{id}/upload` | Creator | Upload file |
| PUT | `/api/videos/{id}` | Creator | Update metadata |
| DELETE | `/api/videos/{id}` | Creator | Delete video |
| GET | `/api/videos/{id}/stream` | Buyer | Get HLS URL |
| GET | `/api/videos/{id}/access` | User | Check access |
| GET | `/api/creator/videos` | Creator | List own videos |
| GET | `/api/creator/stats` | Creator | Dashboard stats |
| POST | `/api/payments/checkout` | User | Start Stripe checkout |
| POST | `/api/webhooks/stripe` | - | Stripe webhook |
| GET | `/api/purchases` | User | List purchases |

## Docker Compose (Full Stack)

```bash
docker compose up -d
```

Starts: PostgreSQL, MinIO, Redis, Kafka, and the Spring Boot app.
