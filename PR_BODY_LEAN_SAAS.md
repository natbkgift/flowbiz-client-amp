## Summary

This PR introduces a lean, production-capable SaaS core on top of the existing FastAPI application.

Implemented:

- PostgreSQL persistence (SQLAlchemy 2.x)
- Alembic migration system
- Lead model with DB persistence
- JWT authentication
- Admin API routes
- Minimal Next.js admin UI
- Docker multi-service setup
- Nginx reverse proxy routing

Public endpoint `/v1/phase1/score` preserved.
Existing scoring behavior unchanged except `lead_id` added to response.

---

## Scope

Lean architecture only:

- No background jobs
- No Redis
- No webhook system
- No scoring history
- No advanced RBAC
- No multi-tenant

---

## Database

Initial migration:

`0001_initial_leads_users.py`

Creates:

- leads table
- users table
- indexes

Verified upgrade/downgrade cycle:

`alembic upgrade head`
`alembic downgrade base`
`alembic upgrade head`

---

## Environment Variables Required

### API

- `DATABASE_URL`
- `JWT_SECRET_KEY`
- `JWT_ALGORITHM`
- `JWT_EXPIRE_MINUTES`
- `ADMIN_BOOTSTRAP_EMAIL`
- `ADMIN_BOOTSTRAP_PASSWORD`

### Admin

- `NEXT_PUBLIC_API_BASE=/api`

---

## Infrastructure

docker-compose services:

- api
- postgres
- admin-app
- nginx

Routing:

- /api → FastAPI
- /admin → Next.js

---

## Validation

- Ruff: PASS
- Pytest: PASS
- Next build: PASS

---

## Risk Surface

- Startup event deprecation warning (non-blocking)
- Bootstrap admin credentials must be rotated in production
- JWT stored in memory (intentional minimal session persistence)
- Alembic-first rollout required in production

---

## Rollback Plan

If deployment fails:

1. Roll back to previous image tag
2. Run `alembic downgrade base`
3. Restore previous docker-compose
4. Redeploy

Public API compatibility preserved, so rollback is safe.

---

## Deploy Checklist

Before merge:

- [ ] Confirm `JWT_SECRET_KEY` is non-default
- [ ] Confirm `ADMIN_BOOTSTRAP_PASSWORD` rotated
- [ ] Confirm `DATABASE_URL` correct
- [ ] Run `alembic upgrade head` in target environment
- [ ] `docker compose up -d`
- [ ] Verify:
  - `/health`
  - `/v1/phase1/score`
  - `/admin` login
  - lead persistence
