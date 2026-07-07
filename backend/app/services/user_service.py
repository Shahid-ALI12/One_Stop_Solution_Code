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


def create_user(db: Session, data: UserCreate) -> User:
    user = User(name=data.name, email=data.email)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user_id: int) -> bool:
    user = get_user_by_id(db, user_id)
    if not user:
        return False
    db.delete(user)
    db.commit()
    return True
