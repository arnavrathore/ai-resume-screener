"""
schemas/candidate.py — Pydantic schemas for Candidates and Rankings.
"""

from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List
from enum import Enum


class CandidateStatus(str, Enum):
    pending = "pending"
    shortlisted = "shortlisted"
    rejected = "rejected"


class CandidateOut(BaseModel):
    """Candidate info returned from API."""
    id: int
    name: str
    email: EmailStr
    job_id: int
    resume_filename: str
    parsed_skills: List[str]
    parsed_education: str
    parsed_experience: float
    created_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def model_validate(cls, obj, **kwargs):
        instance = super().model_validate(obj, **kwargs)
        # Convert comma-separated string to list
        if isinstance(instance.parsed_skills, str):
            instance.parsed_skills = [s.strip() for s in instance.parsed_skills.split(",") if s.strip()]
        return instance


class RankingOut(BaseModel):
    """Ranking score breakdown for a candidate."""
    id: int
    candidate_id: int
    job_id: int
    skill_score: float
    experience_score: float
    education_score: float
    keyword_score: float
    total_score: float
    status: CandidateStatus
    computed_at: datetime
    candidate: CandidateOut

    model_config = {"from_attributes": True}


class StatusUpdate(BaseModel):
    """Schema for updating HR decision on a candidate."""
    status: CandidateStatus


class RankingWeights(BaseModel):
    """Configurable scoring weights (must sum to 1.0)."""
    weight_skills: float = 0.40
    weight_experience: float = 0.30
    weight_education: float = 0.15
    weight_keywords: float = 0.15

    def validate_weights(self):
        total = self.weight_skills + self.weight_experience + self.weight_education + self.weight_keywords
        if abs(total - 1.0) > 0.01:
            raise ValueError(f"Weights must sum to 1.0, got {total:.2f}")
        return self
