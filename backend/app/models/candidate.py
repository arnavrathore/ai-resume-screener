"""
models/candidate.py — Candidate + parsed resume data ORM model.
"""

from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)

    # ── Personal Info ──────────────────────────────────────────────────────
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, index=True)

    # ── Job Link ───────────────────────────────────────────────────────────
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)

    # ── Resume File ────────────────────────────────────────────────────────
    resume_filename = Column(String(500), nullable=False)   # original filename
    resume_path = Column(String(1000), nullable=False)       # server-side path

    # ── NLP-Parsed Fields (stored as comma-separated or plain text) ────────
    parsed_skills = Column(Text, default="")          # comma-separated extracted skills
    parsed_education = Column(Text, default="")       # e.g. "B.Tech, Computer Science"
    parsed_experience = Column(Float, default=0.0)    # years of experience (numeric)
    parsed_raw_text = Column(Text, default="")        # full extracted text (for keyword match)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # ── Relationships ──────────────────────────────────────────────────────
    job = relationship("Job", back_populates="candidates")
    ranking = relationship("Ranking", back_populates="candidate", uselist=False, cascade="all, delete-orphan")
