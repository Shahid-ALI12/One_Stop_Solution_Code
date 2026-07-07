"""CRUD for Consultation."""
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from app.models.consultation import Consultation
from app.schemas.consultation import ConsultationCreate, ConsultationUpdate
from app.services import notification_service
from app.services import tz_service


def _to_response(c: Consultation) -> dict:
    return {
        "id": c.id,
        "name": c.name,
        "email": c.email,
        "country": c.country,
        "selected_date_time": c.selected_date_time,
        "timezone": c.timezone,
        "pkt_time": c.pkt_time,
        "is_answered": c.is_answered,
        "timestamp": c.created_at.isoformat() if c.created_at else "",
    }


def list_consultations(db: Session) -> list[dict]:
    rows = db.query(Consultation).order_by(desc(Consultation.created_at)).all()
    return [_to_response(c) for c in rows]


def create_consultation(db: Session, data: ConsultationCreate) -> dict:
    """Create a new consultation request.

    Validates the requested slot via tz_service.validate_slot:
      - Parses selected_date_time (many formats supported).
      - Converts to PKT for storage in `pkt_time`.
      - Rejects past / too-soon / too-far slots.
      - Detects double-bookings (same email + same slot already booked).
      - Returns warnings for out-of-business-hours slots (still allowed).

    Raises tz_service.SlotValidationError on hard rejects. The route
    layer catches this and returns a 400 with the public message.
    """
    # Fetch existing consultations for this email to detect double-bookings.
    # Use case-insensitive match (func.lower) so 'User@X.com' matches 'user@x.com'
    # stored in DB. SQLite's default `==` is case-sensitive for non-ASCII.
    norm_email = data.email.strip().lower() if data.email else ""
    existing = (
        db.query(Consultation)
        .filter(func.lower(Consultation.email) == norm_email)
        .all()
        if norm_email
        else []
    )

    _aware_dt, pkt_time_str, _warnings = tz_service.validate_slot(
        selected_date_time=data.selected_date_time,
        timezone_name=data.timezone or None,
        email=data.email,
        existing=existing,
    )

    # Use the server-computed pkt_time (authoritative) — overrides any
    # client-supplied pkt_time so clients can't spoof it.
    c = Consultation(
        name=data.name,
        email=data.email,
        country=data.country,
        selected_date_time=data.selected_date_time,
        timezone=data.timezone,
        pkt_time=pkt_time_str,
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    # Fire admin notifications (email + WhatsApp) — best-effort
    try:
        notification_service.notify_new_consultation(_to_response(c))
    except Exception:
        pass
    return _to_response(c)


def update_consultation(db: Session, consultation_id: int, data: ConsultationUpdate) -> dict | None:
    c = db.query(Consultation).filter(Consultation.id == consultation_id).first()
    if not c:
        return None
    for field in (
        "name", "email", "country", "selected_date_time", "timezone", "pkt_time", "is_answered",
    ):
        val = getattr(data, field, None)
        if val is not None:
            setattr(c, field, val)
    db.commit()
    db.refresh(c)
    return _to_response(c)


def delete_consultation(db: Session, consultation_id: int) -> bool:
    c = db.query(Consultation).filter(Consultation.id == consultation_id).first()
    if not c:
        return False
    db.delete(c)
    db.commit()
    return True
