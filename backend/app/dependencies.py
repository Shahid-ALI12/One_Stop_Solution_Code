"""Shared FastAPI dependencies.

Re-exports `get_db` from the database module so route files can do:
    from app.dependencies import get_db
instead of having to know which database module path to import from.
"""
from app.db.database import SessionLocal


def get_db():
    """Yield a SQLAlchemy session, close it after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
