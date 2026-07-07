from sqlalchemy import (
    Column, Integer, String, Boolean,
    Float, Text, ForeignKey
)
from sqlalchemy.orm import relationship
from app.config.db  import Base
class FAQ(Base):
    __tablename__ = "faqs"

    id         = Column(Integer, primary_key=True, index=True)
    question   = Column(String,  nullable=False)
    answer     = Column(Text,    nullable=False)
    is_active  = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("admins.id"), nullable=False)

    # Relationships
    admin = relationship("Admin", back_populates="faqs")