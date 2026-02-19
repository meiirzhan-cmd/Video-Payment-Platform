# LearnStream — Frontend

React SPA for browsing, purchasing, and streaming video content with adaptive HLS playback.

## Tech Stack

- **React 19**, **TypeScript 5.9**, **Vite 7**
- **Tailwind CSS v4** — styling via `@tailwindcss/vite` plugin
- **react-router-dom 7** — client-side routing with route guards
- **Zustand 5** — auth state management with localStorage persistence
- **Axios** — API client with JWT interceptor + auto-refresh queue
- **HLS.js** — adaptive HLS video player with quality selector
- **React Hook Form + Zod** — form validation
- **Lucide React** — icons

## Running

```bash
npm install
npm run dev
```

Runs on `http://localhost:5173`. Set `VITE_API_URL` in `.env` to configure the backend URL:

- **Dev mode** (Vite): `VITE_API_URL=http://localhost:8080/api` — direct to backend
- **Docker** (Nginx): `VITE_API_URL=/api` — Nginx proxies to backend

## Pages

| Route | Access | Description |
| ----- | ------ | ----------- |
| `/` | Public | Video catalog with search and pagination |
| `/videos/:id` | Public | Video detail with buy/watch CTA |
| `/videos/:id/watch` | Auth + Access | HLS player with quality selector |
| `/login` | Guest only | Login form |
| `/register` | Guest only | Registration form |
| `/purchases` | Auth | Purchase history table |
| `/checkout/success` | Auth | Payment confirmation with polling |
| `/checkout/cancel` | Auth | Payment cancelled |
| `/creator/dashboard` | Creator | Stats + video management table |
| `/creator/upload` | Creator | Upload new video with thumbnail picker |
| `/creator/videos/:id/edit` | Creator | Edit metadata, re-upload, manage thumbnail |

## Project Structure

```text
src/
├── api/                # API layer
│   ├── client.ts       # Axios instance with JWT interceptor + 401 retry queue
│   ├── auth.ts         # Login, register, refresh (separate Axios instance)
│   ├── videos.ts       # Video CRUD, upload, stream, thumbnail APIs
│   └── payments.ts     # Checkout, purchases, access check, creator stats
├── auth/               # Authentication
│   ├── auth-store.ts   # Zustand store with persist + proactive token refresh
│   ├── LoginPage.tsx   # Login form with react-hook-form + zod
│   ├── RegisterPage.tsx
│   └── components/
│       ├── ProtectedRoute.tsx  # Redirects unauthenticated to /login
│       ├── CreatorRoute.tsx    # Requires CREATOR role
│       └── GuestRoute.tsx      # Redirects authenticated to /
├── videos/             # Video features
│   ├── CatalogPage.tsx         # Public grid with search + pagination
│   ├── VideoDetailPage.tsx     # Detail with buy/watch button
│   ├── WatchPage.tsx           # Player wrapper with access check
│   └── components/
│       └── VideoPlayer.tsx     # HLS.js player with quality selector
├── creator/            # Creator features
│   ├── DashboardPage.tsx       # Stats cards + video table
│   ├── UploadPage.tsx          # Two-step: metadata form → file upload
│   └── EditVideoPage.tsx       # Edit metadata, thumbnail, re-upload
├── payment/            # Payment features
│   ├── CheckoutSuccessPage.tsx # Polls /access to confirm purchase
│   └── CheckoutCancelPage.tsx
├── user/
│   └── PurchasesPage.tsx       # Paginated purchase history table
├── hooks/              # Custom hooks
│   ├── usePurchaseStatus.ts    # Checks video access for current user
│   ├── useVideoSearch.ts       # Debounced search with pagination
│   └── useDebounce.ts
├── lib/                # Utilities
│   ├── types.ts        # All TypeScript interfaces/types
│   ├── jwt.ts          # JWT decode, extractUser, isTokenExpired, getTokenTiming
│   ├── constants.ts    # API_URL, page size, debounce delay
│   ├── format.ts       # Price and date formatters
│   └── schemas.ts      # Zod validation schemas
├── shared/             # Reusable UI components
│   └── components/
│       ├── Layout.tsx          # Navbar + Outlet wrapper
│       ├── Button.tsx          # Variant-based button
│       ├── Input.tsx           # Form input with error display
│       ├── Pagination.tsx      # Page navigation
│       ├── StatusBadge.tsx     # Colored status pill
│       └── NotFoundPage.tsx    # 404 page
└── routes.tsx          # All route definitions
```

## Key Patterns

### Auth Store (Zustand + Persist)

The auth store in `auth-store.ts` handles the full JWT lifecycle:

- **Persistence** — Tokens and user data are saved to localStorage via Zustand's `persist` middleware, surviving page refreshes.
- **Hydration** — Route guards (`ProtectedRoute`, `CreatorRoute`, `GuestRoute`) wait for `_hasHydrated` before evaluating auth, preventing premature redirects.
- **Proactive refresh** — A `setTimeout` is scheduled at 80% of the access token's lifetime (12 min for a 15-min token). When it fires, the token is silently refreshed before it expires.
- **Deduplication** — A singleton `activeRefreshPromise` ensures concurrent refresh calls (from timer, interceptor, HLS error handler) share the same in-flight request.

### Axios Interceptor (401 Retry Queue)

The API client in `client.ts` handles expired tokens transparently:

1. Request interceptor attaches `Authorization: Bearer` header from the store.
2. On 401 response: queues the failed request, triggers a single `refresh()`, then retries all queued requests with the new token.
3. If refresh fails: logs the user out.

### HLS Video Player

`VideoPlayer.tsx` uses HLS.js with:

- **`xhrSetup`** — Reads the latest access token from the auth store on every segment request.
- **Quality selector** — Manual switching between Auto/360p/720p/1080p overlaid on the player.
- **Reactive error handler** — If a 401/403 occurs (e.g., tab was backgrounded and proactive refresh missed), it stops loading, refreshes the token, and resumes. This is a safety net since proactive refresh should prevent this.

### Checkout Success Polling

`CheckoutSuccessPage.tsx` polls `GET /api/videos/{id}/access` every 2 seconds (up to 10 attempts) after Stripe redirects back, waiting for the webhook to complete the purchase. Shows a spinner during polling and a success screen once access is confirmed.

## Build

```bash
npm run build
```

Output goes to `dist/`. In Docker, this is served by Nginx with:

- `/api/` proxied to the Spring Boot backend
- SPA fallback (`try_files $uri /index.html`) for client-side routing
- Static asset caching (1 year, immutable)
