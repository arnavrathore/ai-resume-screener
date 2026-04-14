"""
routers/jobs.py — Job Posting CRUD endpoints.

Public:  GET /jobs, GET /jobs/{id}
HR only: POST /jobs, PUT /jobs/{id}, DELETE /jobs/{id}
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional

from app.database import get_db
from app.models.job import Job
from app.models.candidate import Candidate
from app.schemas.job import JobCreate, JobUpdate, JobOut
from app.services.auth_service import get_current_hr_user
from app.models.user import User

router = APIRouter(prefix="/jobs", tags=["Job Postings"])


def _skills_to_str(skills: list) -> str:
    """Convert list of skills to comma-separated string for DB storage."""
    return ", ".join(s.strip() for s in skills if s.strip())


def _str_to_skills(skills_str: str) -> list:
    """Parse comma-separated skills string back to list."""
    return [s.strip() for s in skills_str.split(",") if s.strip()]


def _job_out(job: Job, count: int = 0) -> dict:
    """Serialize a Job ORM object to response dict."""
    return {
        "id": job.id,
        "title": job.title,
        "description": job.description,
        "required_skills": _str_to_skills(job.required_skills or ""),
        "experience_level": job.experience_level,
        "education_requirement": job.education_requirement,
        "deadline": job.deadline,
        "is_active": job.is_active,
        "created_by": job.created_by,
        "created_at": job.created_at,
        "updated_at": job.updated_at,
        "candidate_count": count,
    }


@router.get("", response_model=List[JobOut])
async def list_jobs(
    active_only: bool = Query(True, description="Filter to only active job postings"),
    search: Optional[str] = Query(None, description="Search job title or description"),
    db: AsyncSession = Depends(get_db),
):
    """
    List all job postings. Publicly accessible.
    Includes candidate count for each job.
    """
    query = select(Job)
    if active_only:
        query = query.where(Job.is_active == True)  # noqa: E712
    if search:
        pattern = f"%{search.strip()}%"
        query = query.where(
            Job.title.ilike(pattern) | Job.description.ilike(pattern)
        )
    query = query.order_by(Job.created_at.desc())

    result = await db.execute(query)
    jobs = result.scalars().all()

    # Count candidates per job efficiently
    count_result = await db.execute(
        select(Candidate.job_id, func.count(Candidate.id).label("cnt"))
        .group_by(Candidate.job_id)
    )
    count_map = {row.job_id: row.cnt for row in count_result}

    return [_job_out(j, count_map.get(j.id, 0)) for j in jobs]


@router.get("/{job_id}", response_model=JobOut)
async def get_job(job_id: int, db: AsyncSession = Depends(get_db)):
    """Get a single job posting by ID. Publicly accessible."""
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job posting not found.")

    count_result = await db.execute(
        select(func.count(Candidate.id)).where(Candidate.job_id == job_id)
    )
    count = count_result.scalar() or 0
    return _job_out(job, count)


@router.post("", response_model=JobOut, status_code=status.HTTP_201_CREATED)
async def create_job(
    payload: JobCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_hr_user),
):
    """Create a new job posting. Requires HR authentication."""
    new_job = Job(
        title=payload.title,
        description=payload.description,
        required_skills=_skills_to_str(payload.required_skills),
        experience_level=payload.experience_level,
        education_requirement=payload.education_requirement,
        deadline=payload.deadline,
        created_by=current_user.id,
        is_active=True,
    )
    db.add(new_job)
    await db.flush()
    return _job_out(new_job, 0)


@router.put("/{job_id}", response_model=JobOut)
async def update_job(
    job_id: int,
    payload: JobUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_hr_user),
):
    """Update an existing job posting. Requires HR authentication."""
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job posting not found.")

    # Only update provided fields
    if payload.title is not None:
        job.title = payload.title
    if payload.description is not None:
        job.description = payload.description
    if payload.required_skills is not None:
        job.required_skills = _skills_to_str(payload.required_skills)
    if payload.experience_level is not None:
        job.experience_level = payload.experience_level
    if payload.education_requirement is not None:
        job.education_requirement = payload.education_requirement
    if payload.deadline is not None:
        job.deadline = payload.deadline
    if payload.is_active is not None:
        job.is_active = payload.is_active

    await db.flush()

    count_result = await db.execute(
        select(func.count(Candidate.id)).where(Candidate.job_id == job_id)
    )
    count = count_result.scalar() or 0
    return _job_out(job, count)


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(
    job_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_hr_user),
):
    """
    Delete a job posting and all associated candidates/rankings (cascade).
    Requires HR authentication.
    """
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job posting not found.")

    await db.delete(job)
