from sqlalchemy import (
    Column, Integer, String, Boolean,
    Float, Text, ForeignKey
)
from sqlalchemy.orm import relationship
from app.config.db  import Base
class Review(Base):
    __tablename__ = "reviews"

    id            = Column(Integer, primary_key=True, index=True)
    reviewer_name = Column(String,  nullable=False)   # "Alexander Thompson"
    reviewer_role = Column(String,  nullable=True)    # "CEO & Founder"
    company       = Column(String,  nullable=True)    # "Apex Digital LLC"
    country       = Column(String,  nullable=True)    # "United States"
    comment       = Column(Text,    nullable=False)
    rating        = Column(Float,   default=5.0)
    is_active     = Column(Boolean, default=True)
    service_id    = Column(Integer, ForeignKey("services.id"), nullable=False)

    # Relationships
    service = relationship("Service", back_populates="reviews")