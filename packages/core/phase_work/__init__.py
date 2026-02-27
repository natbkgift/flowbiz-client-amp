"""Concrete, idempotent phase executors.

These are called by the production runtime loop via `docker compose exec api python -c ...`.
They must be safe to rerun and must raise SystemExit(1) on failure.
"""
