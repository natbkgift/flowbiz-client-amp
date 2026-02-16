from __future__ import annotations

from pathlib import Path

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


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

    # Auth
    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 120

    refresh_token_expire_days: int = 30

    # Admin bootstrap user
    admin_bootstrap_email: str = "admin@local.dev"
    admin_bootstrap_password: str = "admin123"

    # Abuse mitigation
    inquiries_rate_limit_per_minute: int = 20


settings = Settings()
