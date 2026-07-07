"""Generic site User model (for newsletter subscribers, etc.).

NOTE: This is separate from `AdminUser` (which is used for admin login
and JWT authentication). The `User` model is currently a placeholder
for future public-user features (newsletter signup, account portal,
etc.). The /users/ routes are kept for testing purposes.
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String, nullable=False)
    email       = Column(String, unique=True, index=True, nullable=False)
    password    = Column(String, nullable=True)        # set later when a password is created
    is_verified = Column(Boolean, default=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
