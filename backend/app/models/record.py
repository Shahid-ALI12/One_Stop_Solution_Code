"""
OneStop Online Services — SQLAlchemy ORM Models
"""

from sqlalchemy import (
    Column, Integer, String, Boolean,
    Float, Text, ForeignKey
)
from sqlalchemy.orm import relationship
from app.config.db  import Base








# class Credential(Base):
#     __tablename__ = "credentials"

#     id             = Column(Integer, primary_key=True, index=True)
#     title          = Column(String,  nullable=False)     # "Certified Internal Auditor (CIA)"
#     team_member_id = Column(Integer, ForeignKey("team_members.id"), nullable=False)

#     # Relationships
#     team_member = relationship("TeamMember", back_populates="credentials")








