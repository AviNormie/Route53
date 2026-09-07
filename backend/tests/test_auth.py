from collections.abc import Generator
from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import get_settings
from app.core.security import SESSION_COOKIE_NAME, hash_password
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.session import Session as AuthSession
from app.models.user import User


@pytest.fixture()
def db_session() -> Generator[Session, None, None]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    testing_session_local = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = testing_session_local()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture()
def client(db_session: Session) -> Generator[TestClient, None, None]:
    def override_get_db() -> Generator[Session, None, None]:
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def demo_user(db_session: Session) -> User:
    settings = get_settings()
    user = User(
        email=settings.demo_user_email.lower(),
        password_hash=hash_password(settings.demo_user_password),
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


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
