from sqlalchemy import (
    Column, Integer, String, Boolean,
    Float, Text, ForeignKey
)
from sqlalchemy.orm import relationship
from app.config.db  import Base


class Service(Base):
    __tablename__ = "services"

    id              = Column(Integer, primary_key=True, index=True)
    name            = Column(String,  nullable=False)
    description     = Column(Text,    nullable=False)
    portfolio_cases = Column(Integer, default=0)
    is_active       = Column(Boolean, default=True)
    added_by        = Column(Integer, ForeignKey("admins.id"), nullable=False)

    # Relationships
    admin        = relationship("Admin",              back_populates="services")
    team_members = relationship("TeamMemberService",  back_populates="service")
    portfolio    = relationship("Portfolio",           back_populates="service")
    reviews      = relationship("Review",             back_populates="service")