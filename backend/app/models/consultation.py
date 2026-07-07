"""Consultation model for scheduled consultations."""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, UniqueConstraint
from sqlalchemy.sql import func
from app.db.database import Base


class Consultation(Base):
    __tablename__ = "consultations"
    __table_args__ = (
        # DB-level uniqueness backstop for the in-process double-booking
        # guard. Even if two concurrent requests race past the SELECT-then-
        # INSERT window in consultation_service.create_consultation, the
        # DB will reject the second INSERT with IntegrityError. The service
        # catches that and converts to a 409 response.
        # We use (email, selected_date_time) rather than (email, utc_slot)
        # because selected_date_time is the user-supplied wall-clock string
        # and is what the client sees / can re-book with. Two bookings for
        # the same email at the same wall-clock time are obviously duplicates.
        UniqueConstraint("email", "selected_date_time", name="uq_consultation_email_slot"),
    )

    id                  = Column(Integer, primary_key=True, index=True)
    name                = Column(String, nullable=False)
    email               = Column(String, nullable=False)
    country             = Column(String, default="")
    selected_date_time  = Column(String, nullable=False)
    timezone            = Column(String, default="")
    pkt_time            = Column(String, default="")
    is_answered         = Column(Boolean, default=False)
    created_at          = Column(DateTime(timezone=True), server_default=func.now())
    updated_at          = Column(DateTime(timezone=True), onupdate=func.now())
