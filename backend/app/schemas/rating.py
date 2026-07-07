from pydantic import BaseModel, Field


class RatingCreate(BaseModel):
    service_id: str = ""
    name: str
    designation: str = ""
    company: str = ""
    country: str = ""
    avatar_url: str = ""
    comment: str = ""
    # Star rating must be 1..5 inclusive. Default is 5 (max).
    rating_stars: int = Field(default=5, ge=1, le=5)
    is_approved: bool = False
    sort_order: int = 0


class RatingUpdate(BaseModel):
    service_id: str | None = None
    name: str | None = None
    designation: str | None = None
    company: str | None = None
    country: str | None = None
    avatar_url: str | None = None
    comment: str | None = None
    # Star rating must be 1..5 inclusive when provided.
    rating_stars: int | None = Field(default=None, ge=1, le=5)
    is_approved: bool | None = None
    sort_order: int | None = None


class RatingResponse(BaseModel):
    id: int
    service_id: str
    name: str
    designation: str
    company: str
    country: str
    avatar_url: str
    comment: str
    rating_stars: int
    is_approved: bool
    sort_order: int = 0

    model_config = {"from_attributes": True}
