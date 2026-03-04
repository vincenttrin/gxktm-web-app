# Deployment Plan — GXKTM Web App

## Context
The app is a Next.js + FastAPI Docker monorepo with Supabase-hosted PostgreSQL. Current Dockerfiles are dev-only (`npm run dev`, `--reload`). Need production-ready builds and a deployment strategy for ~50 concurrent users, optimized for cost and simplicity.

## Platform Recommendation: Fly.io

**Why Fly.io:** ~$5–10/month, managed platform (no server maintenance), supports Docker natively, global regions, generous free tier (3 VMs + 100GB transfer). Best balance of cost and ease for your scale.

**Alternatives considered:**
| Platform | Cost/mo | Tradeoff |
|----------|---------|----------|
| DigitalOcean Droplet | $4–6 | Cheapest, but you manage everything (SSL, updates, monitoring) |
| Coolify + Hetzner | $5.49 | Cheapest managed-ish, steep learning curve |
| DO App Platform | $10 | Simple but less flexible |
| Render | $14 | Easy but pricier |
| Railway | ~$22 | Great DX but expensive for always-on |

---

## Part 1: Pre-Deployment Action Items

### 1.1 Production Dockerfiles
Both current Dockerfiles are dev-only. Need production builds.

**`frontend/Dockerfile.prod`** (new file):
- Multi-stage build: install deps → `next build` → run with `next start`
- Use `node:22-alpine` for both stages
- Set `NODE_ENV=production`
- Add `output: 'standalone'` to next.config.ts for smaller images
- Run as non-root user
- Expose port 3000

**`backend/Dockerfile.prod`** (new file):
- Remove `--reload` flag
- Use gunicorn + uvicorn workers: `gunicorn main:app -w 2 -k uvicorn.workers.UvicornWorker`
- Run as non-root user
- Add `gunicorn` to `requirements.txt`
- Expose port 8000

### 1.2 Production Docker Compose
**`docker-compose.prod.yml`** (new file):
- Reference `Dockerfile.prod` for both services
- No volume mounts (no code syncing)
- No `WATCHPACK_POLLING` or watch options
- Add health checks for both services
- Add resource limits (512MB frontend, 256MB backend)
- Add restart policy (`unless-stopped`)

### 1.3 Next.js Production Config
**`frontend/next.config.ts`** — modifications:
- Remove `webpack.watchOptions` in production (only needed for Docker dev)
- Add security headers: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Content-Security-Policy`
- Add `output: 'standalone'` for smaller Docker images

### 1.4 Environment Variables
**`.env.example`** (new file) — document all required env vars without values:
- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ALLOWED_ORIGINS`
- `NEXT_PUBLIC_API_URL`
- `SECRET_KEY`

Update `ALLOWED_ORIGINS` to production domain(s).
Update `NEXT_PUBLIC_API_URL` to production backend URL.

### 1.5 Backend Production Hardening
**`backend/database.py`** — Ensure `?sslmode=require` on DATABASE_URL for Supabase connections.

### 1.6 Rate Limiting (optional but recommended)
**`backend/main.py`** — Add `slowapi` for basic rate limiting on auth-related endpoints. Add `slowapi` to `requirements.txt`.

---

## Part 2: Deployment Action Items (Fly.io)

### 2.1 Install Fly CLI & Authenticate
```bash
curl -L https://fly.io/install.sh | sh
fly auth login
```

### 2.2 Create Fly Apps
```bash
fly apps create gxktm-backend
fly apps create gxktm-frontend
```

### 2.3 Fly Config Files

**`backend/fly.toml`** (new file):
```toml
app = "gxktm-backend"
primary_region = "dfw"

[build]
  dockerfile = "Dockerfile.prod"

[http_service]
  internal_port = 8000
  force_https = true

[[vm]]
  memory = "256mb"
  cpu_kind = "shared"
  cpus = 1
```

**`frontend/fly.toml`** (new file):
```toml
app = "gxktm-frontend"
primary_region = "dfw"

[build]
  dockerfile = "Dockerfile.prod"

[http_service]
  internal_port = 3000
  force_https = true

[[vm]]
  memory = "512mb"
  cpu_kind = "shared"
  cpus = 1
```

### 2.4 Set Secrets
```bash
cd backend
fly secrets set DATABASE_URL="..." SUPABASE_SERVICE_ROLE_KEY="..." \
  NEXT_PUBLIC_SUPABASE_URL="..." NEXT_PUBLIC_SUPABASE_ANON_KEY="..." \
  ALLOWED_ORIGINS="https://gxktm-frontend.fly.dev" SECRET_KEY="..."

cd ../frontend
fly secrets set NEXT_PUBLIC_API_URL="https://gxktm-backend.fly.dev" \
  NEXT_PUBLIC_SUPABASE_URL="..." NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
```

### 2.5 Deploy
```bash
cd backend && fly deploy
cd ../frontend && fly deploy
```

### 2.6 Custom Domain (optional)
```bash
fly certs add yourdomain.com -a gxktm-frontend
fly certs add api.yourdomain.com -a gxktm-backend
```
Point DNS A/AAAA records to Fly's IPs. Fly handles SSL automatically.

### 2.7 CI/CD (optional, post-deploy)
Add `.github/workflows/deploy.yml` to auto-deploy on push to `main`.

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `frontend/Dockerfile.prod` | Create — production multi-stage build |
| `backend/Dockerfile.prod` | Create — production build without --reload |
| `docker-compose.prod.yml` | Create — production compose with health checks |
| `frontend/next.config.ts` | Modify — add standalone output, security headers |
| `backend/requirements.txt` | Modify — add gunicorn |
| `.env.example` | Create — document required env vars |
| `backend/fly.toml` | Create — Fly.io config |
| `frontend/fly.toml` | Create — Fly.io config |

---

## Verification
1. Build production images locally: `docker compose -f docker-compose.prod.yml build`
2. Run production images locally: `docker compose -f docker-compose.prod.yml up`
3. Test frontend at `http://localhost:3000`, backend at `http://localhost:8000/docs`
4. Deploy to Fly.io and test end-to-end (login, enrollment, payments)
5. Check Fly.io dashboard for health status and resource usage
