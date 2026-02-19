from typing import Optional

from packages.core.schemas.base import BaseResponse


class HealthResponse(BaseResponse):
    """Health check response model."""

    status: str
    service: str
    version: str
    db: Optional[str] = None


class MetaResponse(BaseResponse):
    """Service metadata response model."""

    service: str
    environment: str
    version: str
    build_sha: str
