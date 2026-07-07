"""Authentication service."""
import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.admin_user import AdminUser
from app.services.security import verify_password, create_access_token
from app.schemas.auth import LoginRequest, LoginResponse


logger = logging.getLogger(__name__)


def authenticate(db: Session, payload: LoginRequest) -> LoginResponse | None:
    user = db.query(AdminUser).filter(AdminUser.username == payload.username).first()
    if not user or not user.is_active:
        return None
    if not verify_password(payload.password, user.password_hash):
        return None
    # Update last_login_at — best-effort. If the DB is read-only or the
    # commit fails for any reason, the user should still get a valid token
    # (their password was correct). Failure to record login time is an
    # admin-telemetry concern, not an auth failure.
    try:
        user.last_login_at = datetime.now(timezone.utc)
        db.commit()
    except Exception:
        logger.warning("Failed to update last_login_at for %s — auth still succeeds.",
                       user.username, exc_info=True)
        db.rollback()
    token = create_access_token(subject=user.username)
    return LoginResponse(
        token=token,
        username=user.username,
        display_name=user.display_name,
    )
