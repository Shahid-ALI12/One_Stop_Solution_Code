from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate


def get_all_users(db: Session) -> list[User]:
    # User model has `is_verified`, not `is_active`. We return all users
    # since the public list-users endpoint should show everyone; the
    # `is_verified` flag is exposed in UserResponse for callers to filter.
    return db.query(User).all()


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> User | None:
    """Pre-check helper used by create_user to detect duplicate emails
    BEFORE the commit (so we can return a clean 409 instead of relying
    on IntegrityError catch)."""
    if not email:
        return None
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, data: UserCreate) -> User:
    # Pre-check (race-window-safe via the IntegrityError catch below).
    if get_user_by_email(db, data.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A user with email '{data.email}' already exists.",
        )
    user = User(name=data.name, email=data.email)
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        # Race-window: another request inserted the same email between
        # our pre-check and commit. Rollback and return 409.
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A user with email '{data.email}' already exists.",
        )
    db.refresh(user)
    return user


def delete_user(db: Session, user_id: int) -> bool:
    user = get_user_by_id(db, user_id)
    if not user:
        return False
    db.delete(user)
    db.commit()
    return True
