from fastapi.testclient import TestClient

from app.core.config import settings
from app.core.rate_limit import login_rate_limiter
from app.main import app
from app.models.user import User

client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    assert "x-request-id" in response.headers


def test_request_id_echo() -> None:
    response = client.get("/health", headers={"X-Request-ID": "test-req-123"})
    assert response.status_code == 200
    assert response.headers["x-request-id"] == "test-req-123"


def test_login_rate_limit(client: TestClient, demo_user: User, monkeypatch) -> None:
    login_rate_limiter.reset()
    monkeypatch.setattr(settings, "login_rate_limit", "2/minute")

    for _ in range(2):
        response = client.post(
            "/api/v1/auth/login",
            json={"email": demo_user.email, "password": "wrong-password"},
        )
        assert response.status_code == 401

    limited = client.post(
        "/api/v1/auth/login",
        json={"email": demo_user.email, "password": "wrong-password"},
    )
    assert limited.status_code == 429
    assert limited.json() == {"detail": "Too many login attempts. Try again later."}
