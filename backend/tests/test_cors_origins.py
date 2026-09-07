from app.core.config import Settings


def test_cors_origins_strip_trailing_slashes() -> None:
    settings = Settings(
        CORS_ORIGINS="http://localhost:3000/,https://route53-ten.vercel.app/"
    )
    assert settings.cors_origins == [
        "http://localhost:3000",
        "https://route53-ten.vercel.app",
    ]


def test_cors_origins_json_list_normalized() -> None:
    settings = Settings(
        CORS_ORIGINS='["https://app.vercel.app/", "http://127.0.0.1:3000"]'
    )
    assert settings.cors_origins == [
        "https://app.vercel.app",
        "http://127.0.0.1:3000",
    ]
