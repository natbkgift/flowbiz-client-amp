from __future__ import annotations

import json
import logging
import os
import time
from datetime import datetime, timezone
from typing import Any

from fastapi import FastAPI
from starlette.requests import Request


def _truthy(value: str | None) -> bool:
    if value is None:
        return False
    return value.strip().lower() in {"1", "true", "yes", "on"}


def configure_observability(app: FastAPI) -> None:
    _configure_metrics(app)
    _configure_tracing(app)
    _configure_request_logging(app)


def _configure_metrics(app: FastAPI) -> None:
    # Expose /metrics for Prometheus scraping (intended for internal network).
    # This is additive and does not affect existing routes.
    try:
        from prometheus_fastapi_instrumentator import Instrumentator

        Instrumentator(should_group_status_codes=False).instrument(app).expose(
            app,
            endpoint="/metrics",
            include_in_schema=False,
        )
    except Exception:
        # Metrics are a contract requirement, but we avoid startup failure if the
        # dependency is unavailable for any reason.
        logging.getLogger("amp.observability").exception("metrics_init_failed")


def _configure_tracing(app: FastAPI) -> None:
    # Enable OpenTelemetry only when explicitly turned on.
    # Default stays off to avoid unexpected infra coupling.
    if not _truthy(os.getenv("OTEL_ENABLED")):
        return

    try:
        from opentelemetry import trace
        from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
        from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
        from opentelemetry.instrumentation.requests import RequestsInstrumentor
        from opentelemetry.sdk.resources import Resource
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export import BatchSpanProcessor

        service_name = os.getenv("OTEL_SERVICE_NAME") or os.getenv("FLOWBIZ_SERVICE_NAME") or "amp-api"
        resource = Resource.create({"service.name": service_name})
        provider = TracerProvider(resource=resource)
        trace.set_tracer_provider(provider)

        endpoint = os.getenv(
            "OTEL_EXPORTER_OTLP_ENDPOINT", "http://otel-collector:4318/v1/traces"
        )
        # OTLP HTTP exporter expects full signal path.
        if endpoint.endswith("/"):
            endpoint = endpoint[:-1]
        if not endpoint.endswith("/v1/traces"):
            endpoint = endpoint + "/v1/traces"

        exporter = OTLPSpanExporter(endpoint=endpoint)
        provider.add_span_processor(BatchSpanProcessor(exporter))

        FastAPIInstrumentor.instrument_app(app)
        RequestsInstrumentor().instrument()
    except Exception:
        logging.getLogger("amp.observability").exception("tracing_init_failed")


def _configure_request_logging(app: FastAPI) -> None:
    logger = logging.getLogger("amp.access")

    @app.middleware("http")
    async def access_log_middleware(request: Request, call_next):
        start = time.perf_counter()
        try:
            response = await call_next(request)
            error_class = None
            error_code = None
        except Exception:
            # Let FastAPI handle the exception after logging.
            response = None
            error_class = "UNKNOWN"
            error_code = None
            raise
        finally:
            duration_ms = int((time.perf_counter() - start) * 1000)
            payload: dict[str, Any] = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "service": os.getenv("FLOWBIZ_SERVICE_NAME"),
                "environment": os.getenv("APP_ENV"),
                "endpoint": str(request.url.path),
                "request_id": request.headers.get("x-request-id"),
                "session_id": request.headers.get("x-session-id"),
                "user_type": request.headers.get("x-user-type", "anonymous"),
                "status_code": getattr(response, "status_code", 500),
                "latency_ms": duration_ms,
                "error_code": error_code,
                "error_class": error_class,
                "cache_hit": None,
                "deterministic_hash": None,
                "method": request.method,
            }

            # Ensure JSON-only output.
            logger.info(json.dumps(payload, ensure_ascii=False, sort_keys=True))

        return response
