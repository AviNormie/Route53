from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient
from sqlalchemy import select
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


def test_signup_creates_user_and_session(
    client: TestClient, db_session: Session
) -> None:
    response = client.post(
        "/api/v1/auth/signup",
        json={"email": "new.user@example.com", "password": "SecurePass1"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "new.user@example.com"
    assert SESSION_COOKIE_NAME in response.cookies

    user = db_session.scalar(select(User).where(User.email == "new.user@example.com"))
    assert user is not None
    assert db_session.get(AuthSession, response.cookies[SESSION_COOKIE_NAME]) is not None

    me = client.get("/api/v1/auth/me")
    assert me.status_code == 200
    assert me.json()["email"] == "new.user@example.com"


def test_signup_rejects_duplicate_email(
    client: TestClient, demo_user: User
) -> None:
    response = client.post(
        "/api/v1/auth/signup",
        json={"email": demo_user.email, "password": "SecurePass1"},
    )
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"].lower()


def test_signup_rejects_short_password(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/signup",
        json={"email": "short@example.com", "password": "short"},
    )
    assert response.status_code == 422
