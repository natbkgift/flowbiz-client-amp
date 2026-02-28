FROM python:3.11-slim AS base

WORKDIR /app

COPY pyproject.toml ./

COPY apps/ ./apps/
COPY packages/ ./packages/
COPY scripts/ ./scripts/
COPY data/ ./data/
COPY alembic.ini ./
COPY alembic/ ./alembic/

RUN pip install --no-cache-dir .

ARG GIT_SHA=local
ENV GIT_SHA=${GIT_SHA}

RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

CMD ["uvicorn", "apps.api.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips", "*"]
