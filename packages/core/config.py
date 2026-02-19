from __future__ import annotations

import logging
from pathlib import Path

from pydantic import AliasChoices, Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_logger = logging.getLogger(__name__)


def _read_pyproject_version(default: str = "0.1.0") -> str:
    try:
        pyproject_path = Path(__file__).resolve().parents[2] / "pyproject.toml"
        if not pyproject_path.exists():
            return default

        import tomllib

        data = tomllib.loads(pyproject_path.read_text(encoding="utf-8"))
        return str(data.get("project", {}).get("version") or default)
    except Exception:
        return default


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Runtime Configuration (APP_*)
    app_env: str = "dev"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    app_log_level: str = "info"

    # Metadata (FLOWBIZ_*)
    flowbiz_service_name: str = "flowbiz-template-service"
    flowbiz_version: str = Field(
        default=_read_pyproject_version(),
        validation_alias=AliasChoices("FLOWBIZ_VERSION", "VERSION"),
    )
    flowbiz_build_sha: str = Field(
        default="local",
        validation_alias=AliasChoices("FLOWBIZ_BUILD_SHA", "BUILD_SHA", "GIT_SHA", "GITHUB_SHA"),
    )

    # Database
    database_url: str = "sqlite:///./flowbiz.db"
    db_pool_size: int = 10
    db_max_overflow: int = 20
    db_pool_recycle: int = 1800
    db_pool_timeout: int = 30

    # Auth
    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 120

    refresh_token_expire_days: int = 30

    # PII hashing (for duplicate detection). Safe default keeps behavior unchanged.
    pii_hash_pepper: str = Field(default="", validation_alias=AliasChoices("PII_HASH_PEPPER"))

    # CRM behavior toggles
    crm_auto_assign_enabled: bool = Field(
        default=False,
        validation_alias=AliasChoices("CRM_AUTO_ASSIGN_ENABLED"),
    )

    # Admin bootstrap user
    admin_bootstrap_email: str = "admin@local.dev"
    admin_bootstrap_password: str = "admin123"

    # CORS
    cors_allowed_origins: str = Field(
        default="http://localhost:3000,http://localhost:3001",
        validation_alias=AliasChoices("CORS_ALLOWED_ORIGINS"),
    )

    # Abuse mitigation
    inquiries_rate_limit_per_minute: int = 20
    events_rate_limit_per_minute: int = 120
    events_max_payload_bytes: int = 8192

    @model_validator(mode="after")
    def _check_production_secrets(self) -> "Settings":
        """Refuse to start with dangerous defaults outside dev/test."""
        if self.app_env not in ("dev", "test"):
            if self.jwt_secret_key == "change-me-in-production":
                raise ValueError(
                    "CRITICAL: JWT_SECRET_KEY must be set to a secure value in "
                    f"'{self.app_env}' environment. Refusing to start with default."
                )
            if self.admin_bootstrap_password == "admin123":
                _logger.warning(
                    "SECURITY: ADMIN_BOOTSTRAP_PASSWORD is using the default value. "
                    "Set a strong password via ADMIN_BOOTSTRAP_PASSWORD env var."
                )
            if not self.pii_hash_pepper:
                _logger.warning(
                    "SECURITY: PII_HASH_PEPPER is empty. "
                    "PII dedup hashing has zero additional entropy."
                )
        return self


settings = Settings()
