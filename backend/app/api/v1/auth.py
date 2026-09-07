from fastapi import APIRouter, HTTPException, Request, Response, status

from app.api.deps import CurrentUser, DbDep, SettingsDep
from app.core.security import SESSION_COOKIE_NAME
from app.schemas.auth import LoginRequest, MessageOut, UserOut
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


def _set_session_cookie(
    response: Response,
    session_id: str,
    *,
    max_age_seconds: int,
    secure: bool,
) -> None:
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=session_id,
        httponly=True,
        secure=secure,
        samesite="lax",
        max_age=max_age_seconds,
        path="/",
    )


def _clear_session_cookie(response: Response, *, secure: bool) -> None:
    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        path="/",
        httponly=True,
        secure=secure,
        samesite="lax",
    )


@router.post("/login", response_model=UserOut)
def login(
    payload: LoginRequest,
    response: Response,
    db: DbDep,
    settings: SettingsDep,
) -> UserOut:
    try:
        user, auth_session = auth_service.login(
            db,
            email=str(payload.email),
            password=payload.password,
        )
    except auth_service.AuthError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc

    _set_session_cookie(
        response,
        auth_session.id,
        max_age_seconds=settings.session_expire_minutes * 60,
        secure=settings.environment == "prod",
    )
    return UserOut.model_validate(user)


@router.post("/logout", response_model=MessageOut)
def logout(
    request: Request,
    response: Response,
    db: DbDep,
    settings: SettingsDep,
) -> MessageOut:
    session_id = request.cookies.get(SESSION_COOKIE_NAME)
    auth_service.delete_session(db, session_id)
    _clear_session_cookie(response, secure=settings.environment == "prod")
    return MessageOut(message="Logged out")


@router.get("/me", response_model=UserOut)
def me(current_user: CurrentUser) -> UserOut:
    return UserOut.model_validate(current_user)
