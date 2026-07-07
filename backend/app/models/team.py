from sqlalchemy import (
    Column, Integer, String, Boolean,
    Float, Text, ForeignKey
)
from sqlalchemy.orm import relationship
from app.config.db  import Base

class TeamMember(Base):
    __tablename__ = "team_members"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String,  nullable=False)
    role        = Column(String,  nullable=False)
    experience  = Column(Integer, nullable=False)        # years
    photo       = Column(String,  nullable=True)         # image URL
    is_active   = Column(Boolean, default=True)
    added_by    = Column(Integer, ForeignKey("admins.id"), nullable=False)

    # Relationships
    admin       = relationship("Admin",             back_populates="team_members")
    services    = relationship("TeamMemberService", back_populates="team_member")
    credentials = relationship("Credential",        back_populates="team_member")