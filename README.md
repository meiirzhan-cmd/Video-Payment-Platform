# LearnStream

A mini course/video platform built as a learning project. Think simplified Udemy — creators upload videos, users purchase and stream them.

Built to practice: **video processing/streaming**, **payment integration**, and **full-stack development** with a real-world architecture.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, TypeScript, hls.js |
| Backend | Spring Boot 4, Spring Security, JWT |
| Database | PostgreSQL + Flyway migrations |
| Storage | MinIO (S3-compatible object storage) |
| Payments | Stripe Checkout + Webhooks |
| Transcoding | FFmpeg (MP4 → HLS adaptive streaming) |
| Infrastructure | Docker Compose |

## Architecture

```
┌─────────────────┐         ┌──────────────────────┐
│   React SPA     │◄───────►│   Spring Boot API    │
│   (Frontend)    │  REST   │   (Port 8080)        │
│                 │  + HLS  │                      │
└─────────────────┘         └──────┬───┬───┬───────┘
                                   │   │   │
                    ┌──────────────┘   │   └──────────────┐
                    ▼                  ▼                   ▼
          ┌─────────────────┐ ┌──────────────┐  ┌─────────────────┐
          │  Video Service  │ │ Payment Svc  │  │  User/Auth Svc  │
          │  (Transcoding + │ │ (Stripe API) │  │  (Spring Sec +  │
          │   Streaming)    │ │              │  │   JWT)          │
          └────────┬────────┘ └──────┬───────┘  └─────────────────┘
                   │                 │
                   ▼                 ▼
          ┌─────────────────┐ ┌──────────────┐
          │  MinIO (S3)     │ │  PostgreSQL  │
          │  Object Storage │ │  Database    │
          └─────────────────┘ └──────────────┘
                   ▲
                   │
          ┌─────────────────┐
          │  FFmpeg Worker  │
          │  (Transcoding)  │
          └─────────────────┘
```

## Learning Goals

| Area | What This Covers |
|------|-----------------|
| Video | HLS streaming, FFmpeg transcoding, pre-signed URLs, async job processing |
| Payments | Stripe Checkout, webhook verification, idempotent event handling |
| Security | JWT auth, pre-signed URLs with expiry, webhook signature verification |
| Architecture | Modular monolith, async processing, event-driven patterns |
| DevOps | Docker Compose orchestration, environment variables, service networking |
| Frontend | HLS video player, auth flow with tokens, redirect-based checkout |

## Status

This is a **learning project** — not production software.
