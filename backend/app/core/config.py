from functools import lru_cache
from typing import Annotated, Literal, Self

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment / `.env`."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    database_url: str = Field(
        default="sqlite:///./data/route53.db",
        alias="DATABASE_URL",
    )
    session_secret: str = Field(
        default="change-me-in-production",
        alias="SESSION_SECRET",
    )
    session_expire_minutes: int = Field(
        default=60 * 24,
        alias="SESSION_EXPIRE_MINUTES",
    )
    cors_origins: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: ["http://localhost:3000"],
        alias="CORS_ORIGINS",
    )
    environment: Literal["dev", "prod"] = Field(
        default="dev",
        alias="ENVIRONMENT",
    )
    demo_user_email: str = Field(
        default="demo@example.com",
        alias="DEMO_USER_EMAIL",
    )
    demo_user_password: str = Field(
        default="DemoPass123!",
        alias="DEMO_USER_PASSWORD",
    )
    login_rate_limit: str = Field(
        default="5/minute",
        alias="LOGIN_RATE_LIMIT",
    )
    mysql_ssl_ca: str | None = Field(
        default=None,
        alias="MYSQL_SSL_CA",
        description="Optional path to Aiven CA cert for VERIFY_CA / VERIFY_IDENTITY",
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: object) -> list[str]:
        if value is None:
            return ["http://localhost:3000"]
        if isinstance(value, list):
            return [str(origin).strip() for origin in value if str(origin).strip()]
        if isinstance(value, str):
            raw = value.strip()
            if not raw:
                return []
            if raw.startswith("["):
                import json

                parsed = json.loads(raw)
                if isinstance(parsed, list):
                    return [
                        str(origin).strip() for origin in parsed if str(origin).strip()
                    ]
                raise ValueError("CORS_ORIGINS JSON must be a list")
            return [origin.strip() for origin in raw.split(",") if origin.strip()]
        raise TypeError("CORS_ORIGINS must be a string or list")

    @model_validator(mode="after")
    def validate_prod_security(self) -> Self:
        if self.environment != "prod":
            return self
        if not self.cors_origins:
            raise ValueError("CORS_ORIGINS must be set when ENVIRONMENT=prod")
        if any(origin.strip() == "*" for origin in self.cors_origins):
            raise ValueError("CORS_ORIGINS must not include '*' when ENVIRONMENT=prod")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
