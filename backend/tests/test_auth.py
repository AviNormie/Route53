from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import SESSION_COOKIE_NAME
from app.models.session import Session as AuthSession
from app.models.user import User


def test_login_sets_httponly_cookie(
    client: TestClient, demo_user: User, db_session: Session
) -> None:
    settings = get_settings()
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": settings.demo_user_email,
            "password": settings.demo_user_password,
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["email"] == settings.demo_user_email
    assert body["id"] == demo_user.id
    assert SESSION_COOKIE_NAME in response.cookies
    cookie = response.cookies[SESSION_COOKIE_NAME]
    assert db_session.get(AuthSession, cookie) is not None


def test_me_requires_auth(client: TestClient) -> None:
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_login_me_logout_flow(client: TestClient, demo_user: User) -> None:
    settings = get_settings()
    login = client.post(
        "/api/v1/auth/login",
        json={
            "email": settings.demo_user_email,
            "password": settings.demo_user_password,
        },
    )
    assert login.status_code == 200

    me = client.get("/api/v1/auth/me")
    assert me.status_code == 200
    assert me.json()["email"] == demo_user.email

    logout = client.post("/api/v1/auth/logout")
    assert logout.status_code == 200

    me_again = client.get("/api/v1/auth/me")
    assert me_again.status_code == 401


def test_expired_session_is_rejected_and_cleaned(
    client: TestClient, demo_user: User, db_session: Session
) -> None:
    expired = AuthSession(
        id="expired-session-token",
        user_id=demo_user.id,
        expires_at=datetime.now(UTC) - timedelta(minutes=1),
    )
    db_session.add(expired)
    db_session.commit()

    client.cookies.set(SESSION_COOKIE_NAME, expired.id)
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert db_session.get(AuthSession, expired.id) is None


def test_invalid_credentials(client: TestClient, demo_user: User) -> None:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": demo_user.email, "password": "wrong-password"},
    )
    assert response.status_code == 401
