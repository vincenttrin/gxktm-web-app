# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GXKTM is a school management web app (enrollment, families, classes, payments) with a **Next.js frontend** and **FastAPI backend** in a simple monorepo. PostgreSQL via Supabase for database and auth.

## Infrastructure

- **Docker:** Frontend and backend run in **separate containers** via `docker-compose.yml` (dev) / `docker-compose.test.yml` (tests)
- **Supabase:** Hosted PostgreSQL database and authentication (not local). Connection details and auth keys are in `.env`
- **No local installs:** Dependencies (node_modules, Python venv) live inside containers. Run commands via `docker compose exec`, not directly on the host

## Commands

### Development
```bash
docker-compose up -d                          # Start backend + frontend containers
docker compose exec frontend npm run dev      # Frontend dev server (port 3000)
docker compose exec backend uvicorn main:app --reload  # Backend dev (port 8000)
```

### Testing
```bash
npm test                                      # All tests (Docker Compose)
npm run test:backend                          # Backend only
npm run test:frontend                         # Frontend only
npm run test:clean                            # Clean up test containers
docker compose exec frontend npm run test     # Vitest single run
docker compose exec frontend npm run test:watch  # Vitest watch mode
docker compose exec backend python -m pytest tests/  # Backend pytest
```

### Linting
```bash
docker compose exec frontend npx eslint .     # ESLint (run inside container)
```

## Architecture

**Stack:** Next.js 16 (App Router) + React 19 + TypeScript | FastAPI + SQLAlchemy (async) + Python 3.11 | PostgreSQL via Supabase | Supabase Auth (JWT)

### Backend (`/backend`)
- **`main.py`** — FastAPI app init, CORS config, router registration
- **`models.py`** — SQLAlchemy ORM models (Family, Student, Guardian, Class, Enrollment, Payment, AcademicYear, Program, etc.)
- **`schemas.py`** — Pydantic request/response schemas
- **`auth.py`** — JWT verification via Supabase, role-based deps (`get_current_user`, `require_admin`, `RoleChecker`)
- **`database.py`** — Async SQLAlchemy engine + session factory (asyncpg)
- **`config.py`** — Pydantic settings loader from `.env`
- **`routers/`** — 7 API routers: `families`, `classes`, `payments`, `school_years`, `enrollment_portal`, `admin_enrollments`, `admin_users`
- **`migrations/`** — SQL migration files
- **`tests/`** — pytest with AsyncClient

### Frontend (`/frontend/src`)
- **`app/`** — Next.js App Router pages
  - `(auth)/` — Login, signup, forgot/reset password (route group)
  - `dashboard/` — Admin dashboard with tab components (families, classes, payments, school years, enrollments, users)
  - `enroll/wizard/` — Public enrollment wizard with `EnrollmentContext`
- **`lib/api.ts`** — API client with 40+ functions, uses `getAuthHeaders()` for JWT injection
- **`lib/auth-context.tsx`** — React Context for auth state (`useAuth`, `useIsAdmin`, `useRequireAdmin`)
- **`lib/auth.ts`** — Server-side auth helpers (`getCurrentUser`, `getAccessToken`, `requireAdmin`)
- **`utils/supabase/`** — Supabase client instances (client-side, server-side, middleware)
- **`types/`** — TypeScript domain types (`family.ts`, `auth.ts`)
- **`middleware.ts`** — Route protection: public routes (`/login`, `/signup`, `/auth/*`), admin-only (`/dashboard/*`)

### Auth & Roles
- Two roles: `admin` (full dashboard) and `user` (enrollment wizard only, default)
- Role stored in Supabase `user_metadata.role`
- Backend validates JWT via Supabase `/auth/v1/user` endpoint
- Frontend middleware redirects unauthenticated → `/login`, non-admin dashboard access → `/unauthorized`

## Key Patterns

- **Path alias:** `@/*` maps to `./src/*` in frontend
- **API client:** All backend calls go through `lib/api.ts` with consistent error handling via `ApiError` class. All authenticated endpoints use `getAuthHeaders()`.
- **Styling:** Tailwind CSS v4 via `@tailwindcss/postcss`
- **Testing:** Frontend uses Vitest + jsdom; Backend uses pytest with async fixtures
- **Environment:** Single `.env` at root shared by both services; `NEXT_PUBLIC_*` vars are browser-safe. `SUPABASE_SERVICE_ROLE_KEY` must NOT have `NEXT_PUBLIC_` prefix (backend-only secret).
- **Docker:** Both services have Dockerfiles; `docker-compose.yml` for dev, `docker-compose.test.yml` for tests. All CLI commands (npm, pytest, eslint) must be run inside their respective containers via `docker compose exec`

## Security Patterns

- **Auth on all endpoints:** All admin API endpoints use `Depends(require_admin)`. Public enrollment endpoints use `get_current_user`.
- **SQL injection prevention:** Sort parameters use `ALLOWED_SORT_FIELDS` whitelists (see `payments.py`, `families.py`)
- **Mass assignment prevention:** Update endpoints use `UPDATABLE_FIELDS` whitelists with `setattr` loops
- **CORS:** Explicit method and header allowlists in `main.py` (no wildcards except origins in dev)
- **Error sanitization:** User-facing errors are generic; details logged server-side via `logger.error()`

## Business Rules

- **Payment calculation:** Tuition uses a tiered schedule: 1 student = $125, 2 = $250, 3 = $315, 4+ = $375. Families with 'nx' in `diocese_id` (external diocese) pay a flat $225 per student. TNTT adds a per-student surcharge: +$50 when the student is in TNTT, or +$30 when the same student is in TNTT and also enrolled in both Giao Ly and Viet Ngu. `amount_due` auto-calculates in `get_enrolled_families` but preserves manually-set values if a payment record already exists. Tuition is also displayed on the enrollment confirmation page.
- **Diocese differentiation:** Families with 'nx' in `diocese_id` are external diocese and pay different rates. They are visually marked with a purple "External Diocese" badge in the payment list and enrollment confirmation.
