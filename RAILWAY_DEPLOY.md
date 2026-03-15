# Railway Deployment

Two services from one GitHub repo:

| Service | Root Directory |
|---------|---------------|
| `backend` | `/` |
| `frontend` | `/frontend` |

---

## 1  Backend service

**Healthcheck Path:** `/readyz`  
**Start command:** leave Railway auto-detect on (uses the root `Dockerfile`)

### Required environment variables

| Variable | Value |
|----------|-------|
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `JWT_SECRET` | generate with `openssl rand -hex 64` |
| `CORS_ALLOWED_ORIGINS` | `https://<frontend-domain>` |
| `SPRING_CACHE_TYPE` | `simple` (skip Redis for first deploy) |

### PostgreSQL — add a Railway Postgres service and reference these variables into the backend

`PGHOST` · `PGPORT` · `PGUSER` · `PGPASSWORD` · `PGDATABASE`

Railway injects them automatically when you click **"Add Reference"** on each variable.  
Flyway runs all migrations and seeds (V1–V5) on first boot — no manual DB setup needed.

### Optional email variables

`SMTP_HOST` · `SMTP_PORT` · `SMTP_USERNAME` · `SMTP_PASSWORD`

---

## 2  Frontend service

**Root Directory:** `/frontend`  
Railway will detect Next.js and use the `frontend/Dockerfile` (standalone build).

### Required environment variables

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://<backend-domain>/api/v1` |
| `NEXT_PUBLIC_WS_URL` | `https://<backend-domain>/api/v1/ws` |

---

## 3  First deploy — step by step

1. Create a new Railway project and connect the GitHub repo.
2. **Add service → GitHub Repo** → Root: `/` → name it `backend`.
3. **Add service → GitHub Repo** (same repo) → Root: `/frontend` → name it `frontend`.
4. **Add service → Database → PostgreSQL** → name it `postgres`.
5. On the `backend` service, add variable references for the five `PG*` vars from `postgres`.
6. Set `SPRING_PROFILES_ACTIVE=prod`, `JWT_SECRET=<random>`, `SPRING_CACHE_TYPE=simple`.
7. Generate a public domain for `backend` → copy the URL.
8. On the `frontend` service, set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL` using that URL.
9. Set `CORS_ALLOWED_ORIGINS` on `backend` to the frontend public domain.
10. Generate a public domain for `frontend`.
11. Deploy both services. Backend will run Flyway and seed the DB automatically.

---

## 4  Showcase — demo accounts seeded by V5 migration

All accounts share the same hashed password seeded in V1. The password for the V1
hash (`$2a$10$dXJ3SW6G7P50...`) matches the one originally used when the V1 migration
was authored. If you need to reset it, register a new account via `/register` or the
`POST /api/v1/auth/register` endpoint and update the row directly via Railway's
Postgres console.

| Role | Email | Notes |
|------|-------|-------|
| ADMIN | `admin@servehub.dev` | Admin panel at `/admin` |
| CUSTOMER | `customer@servehub.dev` | Pre-loaded bookings and notifications |
| CUSTOMER | `showcase@servehub.dev` | Clean account for live registration demo |
| PROVIDER | `sarah@servehub.dev` | Cleaning · Verified · Cape Town |
| PROVIDER | `nina@servehub.dev` | Hair · Verified · Pretoria |
| PROVIDER | `lebo@servehub.dev` | Makeup · Verified · Sandton |
| PROVIDER | `paws@servehub.dev` | Dog Washing · Verified · Durban |
| PROVIDER | `bluewater@servehub.dev` | Pool Cleaning · Verified · Midrand |
| PROVIDER | `happytails@servehub.dev` | Dog Walking · Verified · Pretoria |

### What is pre-seeded for a full showcase run

- 15 service categories (including Hair, Makeup, Dog Washing, Pool Cleaning, Dog Walking)
- 6 verified providers with realistic bios, ratings, and review counts
- 15 service offerings across those providers
- 3 bookings for `customer@servehub.dev` in states IN_PROGRESS, ACCEPTED, COMPLETED
- Chat messages on the active booking
- 2 unread notifications for the customer

### Showcase walkthrough routes

| Route | What it shows |
|-------|--------------|
| `/` | Full mobile-style customer shell (home, explore, bookings, profile) |
| `/browse` | Social feed — live data from the backend with likes, comments, reposts |
| `/login` | Sign in with any seeded account |
| `/register` | Live registration flow |
| `/dashboard` | Customer dashboard with real bookings |
| `/provider` | Provider dashboard (sign in as any `@servehub.dev` provider) |
| `/admin` | Admin panel (sign in as `admin@servehub.dev`) |

---

## 5  Notes

- `next.config.ts` has `output: "standalone"` so the frontend Dockerfile produces a minimal image.
- The backend supports Railway's injected `PORT` and `PG*` variables — no extra config needed.
- `SPRING_CACHE_TYPE=simple` removes the Redis requirement for a basic deploy. Add Redis and flip to `redis` when you need production caching.
- Health checks use `/readyz`, which Spring Boot exposes on the main server port when readiness/liveness probes are enabled with additional paths.
- The WebSocket endpoint is at `/api/v1/ws` — set `NEXT_PUBLIC_WS_URL` to the full backend URL including that path.
- If Flyway fails to start, check for duplicate migration version files under `src/main/resources/db/migration/`. Each `V<n>__*.sql` version must be unique.
