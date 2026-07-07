from sqlalchemy import (
    Column, Integer, String, Boolean,
    Float, Text, ForeignKey
)
from sqlalchemy.orm import relationship
from app.config.db import Base

class Portfolio(Base):
    __tablename__ = "portfolio"

    id           = Column(Integer, primary_key=True, index=True)
    status_badge = Column(String,  nullable=False)   # "TASK RECONCILED"
    title        = Column(String,  nullable=False)   # "3-Year Financial Backlog Cleanup"
    description  = Column(Text,    nullable=True)
    tag_1        = Column(String,  nullable=True)    # "99.8% Accuracy"
    tag_2        = Column(String,  nullable=True)    # "QBO Certified"
    is_active    = Column(Boolean, default=True)
    service_id   = Column(Integer, ForeignKey("services.id"), nullable=False)
    added_by     = Column(Integer, ForeignKey("admins.id"),   nullable=False)

    # Relationships
    service = relationship("Service", back_populates="portfolio")
    admin   = relationship("Admin",   back_populates="portfolio")