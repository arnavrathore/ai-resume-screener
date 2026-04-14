"""
models/job.py — Job Posting ORM model.
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, func
from sqlalchemy.orm import relationship
from app.database import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)

    # Stored as comma-separated string; parsed to/from list in routers/schemas
    required_skills = Column(Text, nullable=False, default="")

    experience_level = Column(String(100), nullable=False)  # e.g. "2-4 years", "Senior"
    education_requirement = Column(String(255), nullable=True)  # e.g. "B.Tech", "MBA"
    deadline = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)

    # FK to the HR user who created this posting
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    creator = relationship("User", foreign_keys=[created_by])
    candidates = relationship("Candidate", back_populates="job", cascade="all, delete-orphan")
    rankings = relationship("Ranking", back_populates="job", cascade="all, delete-orphan")
