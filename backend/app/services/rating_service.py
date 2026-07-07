"""CRUD for Rating."""
from sqlalchemy.orm import Session
from app.models.rating import Rating
from app.schemas.rating import RatingCreate, RatingUpdate
from app.services.country_flag import flag_url


def _to_response(r: Rating) -> dict:
    return {
        "id": r.id,
        "service_id": r.service_id,
        "name": r.name,
        "designation": r.designation,
        "company": r.company,
        "country": r.country,
        "avatar_url": r.avatar_url,
        "comment": r.comment,
        "rating_stars": r.rating_stars,
        "is_approved": r.is_approved,
        "sort_order": r.sort_order,
    }


def list_ratings(db: Session, only_approved: bool = False) -> list[dict]:
    q = db.query(Rating)
    if only_approved:
        q = q.filter(Rating.is_approved == True)
    rows = q.order_by(Rating.sort_order.asc(), Rating.id.desc()).all()
    return [_to_response(r) for r in rows]


def _resolve_avatar(data: RatingCreate) -> str:
    """Return the avatar URL to use. If caller supplied one, keep it.
    Otherwise derive one from the country flag (flagcdn.com).
    Falls back to an empty string if country is unknown.
    """
    if data.avatar_url and data.avatar_url.strip():
        return data.avatar_url.strip()
    if data.country and data.country.strip():
        url = flag_url(data.country)
        if url:
            return url
    return ""


def create_rating(db: Session, data: RatingCreate) -> dict:
    r = Rating(
        service_id=data.service_id,
        name=data.name,
        designation=data.designation,
        company=data.company,
        country=data.country,
        avatar_url=_resolve_avatar(data),
        comment=data.comment,
        rating_stars=data.rating_stars,
        is_approved=data.is_approved,
        sort_order=data.sort_order,
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    return _to_response(r)


def update_rating(db: Session, rating_id: int, data: RatingUpdate) -> dict | None:
    r = db.query(Rating).filter(Rating.id == rating_id).first()
    if not r:
        return None
    for field in (
        "service_id", "name", "designation", "company", "country",
        "avatar_url", "comment", "rating_stars", "is_approved", "sort_order",
    ):
        val = getattr(data, field, None)
        if val is not None:
            setattr(r, field, val)
    db.commit()
    db.refresh(r)
    return _to_response(r)


def delete_rating(db: Session, rating_id: int) -> bool:
    r = db.query(Rating).filter(Rating.id == rating_id).first()
    if not r:
        return False
    db.delete(r)
    db.commit()
    return True
