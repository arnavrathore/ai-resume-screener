"""
models/ranking.py — Candidate ranking/scoring ORM model.
"""

from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class Ranking(Base):
    __tablename__ = "rankings"

    id = Column(Integer, primary_key=True, index=True)

    # ── Foreign Keys ───────────────────────────────────────────────────────
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, unique=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)

    # ── Score Breakdown ────────────────────────────────────────────────────
    skill_score = Column(Float, default=0.0)        # 0–100
    experience_score = Column(Float, default=0.0)   # 0–100
    education_score = Column(Float, default=0.0)    # 0–100
    keyword_score = Column(Float, default=0.0)      # 0–100
    total_score = Column(Float, default=0.0)        # weighted composite 0–100

    # ── HR Decision ────────────────────────────────────────────────────────
    # pending | shortlisted | rejected
    status = Column(String(50), default="pending", nullable=False)

    computed_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # ── Relationships ──────────────────────────────────────────────────────
    candidate = relationship("Candidate", back_populates="ranking")
    job = relationship("Job", back_populates="rankings")
