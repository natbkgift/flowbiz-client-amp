from pydantic_settings import BaseSettings, SettingsConfigDict


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
    flowbiz_version: str = "0.1.0"
    flowbiz_build_sha: str = "local"

    # Database
    database_url: str = "sqlite:///./flowbiz.db"

    # Auth
    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 120

    # Admin bootstrap user
    admin_bootstrap_email: str = "admin@local.dev"
    admin_bootstrap_password: str = "admin123"


settings = Settings()
