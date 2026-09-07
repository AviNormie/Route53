from functools import lru_cache
from typing import Annotated, Literal

from pydantic import Field, field_validator
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


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
