FROM python:3.11-slim as base

WORKDIR /app

# Copy dependency files
COPY pyproject.toml ./

# Install Python dependencies directly
RUN pip install --no-cache-dir \
    "fastapi>=0.104.0" \
    "python-multipart>=0.0.9" \
    "uvicorn[standard]>=0.24.0" \
    "pydantic>=2.4.0" \
    "email-validator>=2.1.0" \
    "pydantic-settings>=2.0.0" \
    "prometheus-fastapi-instrumentator>=6.1.0" \
    "opentelemetry-api>=1.22.0" \
    "opentelemetry-sdk>=1.22.0" \
    "opentelemetry-exporter-otlp-proto-http>=1.22.0" \
    "opentelemetry-instrumentation-fastapi>=0.43b0" \
    "opentelemetry-instrumentation-requests>=0.43b0" \
    "sqlalchemy>=2.0.0" \
    "alembic>=1.13.0" \
    "psycopg2-binary>=2.9.0" \
    "python-jose[cryptography]>=3.3.0" \
    "PyJWT>=2.8.0" \
    "bcrypt>=5.0.0"

# Optional build metadata (used by /v1/meta when FLOWBIZ_BUILD_SHA not explicitly set)
ARG GIT_SHA=local
ENV GIT_SHA=${GIT_SHA}

# Copy application code
COPY apps/ ./apps/
COPY packages/ ./packages/
COPY alembic.ini ./
COPY alembic/ ./alembic/

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Run the application
# Use environment variables for host and port configuration
CMD uvicorn apps.api.main:app --host ${APP_HOST:-0.0.0.0} --port ${APP_PORT:-8000}
