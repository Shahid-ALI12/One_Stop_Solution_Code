"""Password hashing & JWT token utilities."""
from datetime import datetime, timedelta, timezone
from typing import Any
from jose import jwt, JWTError
from passlib.context import CryptContext

from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(subject: str, expires_minutes: int | None = None) -> str:
    # Honour explicit override, otherwise fall back to settings.JWT_EXPIRES_DAYS.
    # If neither is set, default to 7 days so dev mode keeps working out of the box.
    if expires_minutes is not None:
        minutes = expires_minutes
    elif settings.JWT_EXPIRES_DAYS:
        minutes = settings.JWT_EXPIRES_DAYS * 24 * 60
    else:
        minutes = 60 * 24 * 7  # 7 days
    expire = datetime.now(timezone.utc) + timedelta(minutes=minutes)
    payload: dict[str, Any] = {"sub": subject, "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


def decode_access_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        return payload.get("sub")
    except JWTError:
        return None
