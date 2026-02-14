# LearnStream — Frontend

React SPA for browsing, purchasing, and streaming video content with HLS playback.

## Tech Stack

- **React 19**, **TypeScript 5.9**, **Vite 7**
- **Tailwind CSS v4** — styling via `@tailwindcss/vite` plugin
- **react-router-dom** — client-side routing with route guards
- **zustand** — auth state management (in-memory JWT tokens)
- **axios** — API client with JWT interceptor + auto-refresh
- **hls.js** — adaptive HLS video player with quality selector
- **react-hook-form + zod** — form validation
- **lucide-react** — icons

## Running

```bash
npm install
npm run dev
```

Runs on `http://localhost:5173`. API requests proxy to `http://localhost:8080`.

## Pages

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Video catalog with search |
| `/videos/:id` | Public | Video detail + buy/watch CTA |
| `/videos/:id/watch` | Auth | HLS player with quality selector |
| `/login` | Guest | Login form |
| `/register` | Guest | Register form |
| `/purchases` | Auth | Purchase history |
| `/checkout/success` | Auth | Payment confirmation |
| `/checkout/cancel` | Auth | Payment cancelled |
| `/creator/dashboard` | Creator | Stats + video management |
| `/creator/upload` | Creator | Upload new video |
| `/creator/videos/:id/edit` | Creator | Edit/re-upload/delete video |

## Project Structure

```
src/
├── api/          # Axios clients (auth, videos, payments)
├── auth/         # Auth store, login/register pages, route guards
├── videos/       # Catalog, detail, watch pages, VideoPlayer component
├── creator/      # Dashboard, upload, edit pages
├── payment/      # Checkout success/cancel pages
├── user/         # Purchases page
├── shared/       # Button, Input, Modal, Navbar, Layout, Toast, etc.
├── hooks/        # useDebounce, useVideoSearch, usePurchaseStatus
├── lib/          # Types, schemas, constants, formatters, JWT utils
└── routes.tsx    # All route definitions
```

## Build

```bash
npm run build
```

Output goes to `dist/`.
