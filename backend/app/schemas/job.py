"""
schemas/job.py — Pydantic schemas for Job Postings.
"""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class JobCreate(BaseModel):
    """Schema for creating or updating a job posting."""
    title: str
    description: str
    required_skills: List[str]         # ["Python", "FastAPI", "SQL"]
    experience_level: str              # "0-1 years", "2-4 years", "5+ years"
    education_requirement: Optional[str] = None
    deadline: Optional[datetime] = None


class JobUpdate(BaseModel):
    """All fields optional for PATCH-style updates."""
    title: Optional[str] = None
    description: Optional[str] = None
    required_skills: Optional[List[str]] = None
    experience_level: Optional[str] = None
    education_requirement: Optional[str] = None
    deadline: Optional[datetime] = None
    is_active: Optional[bool] = None


class JobOut(BaseModel):
    """Full job response including metadata."""
    id: int
    title: str
    description: str
    required_skills: List[str]
    experience_level: str
    education_requirement: Optional[str]
    deadline: Optional[datetime]
    is_active: bool
    created_by: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]
    candidate_count: Optional[int] = 0  # computed field, not in DB

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_with_count(cls, job, count: int = 0):
        obj = cls.model_validate(job)
        obj.candidate_count = count
        # Parse comma-separated skills back to list
        if isinstance(obj.required_skills, str):
            obj.required_skills = [s.strip() for s in obj.required_skills.split(",") if s.strip()]
        return obj
