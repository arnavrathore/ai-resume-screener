"""
routers/candidates.py — Resume upload and candidate management.

Public:  POST /candidates/upload  (candidate submits resume)
HR only: GET /candidates/job/{job_id}, GET /candidates/{id}
"""

import os
import uuid
import shutil
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from werkzeug.utils import secure_filename

from app.database import get_db
from app.models.candidate import Candidate
from app.models.job import Job
from app.models.ranking import Ranking
from app.schemas.candidate import CandidateOut
from app.services.auth_service import get_current_hr_user
from app.services.file_parser import extract_text
from app.services.nlp_engine import parse_resume
from app.services.ranker import score_candidate
from app.config import get_settings
from app.models.user import User

settings = get_settings()
router = APIRouter(prefix="/candidates", tags=["Candidates"])

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_resume(
    name: str = Form(..., description="Candidate full name"),
    email: str = Form(..., description="Candidate email address"),
    job_id: int = Form(..., description="ID of the job being applied to"),
    resume: UploadFile = File(..., description="Resume file (.pdf or .docx)"),
    db: AsyncSession = Depends(get_db),
):
    """
    Public endpoint: candidates upload their resume for a specific job.

    Steps:
      1. Validate file extension and size.
      2. Save file to uploads directory with a unique name.
      3. Extract text via file_parser service.
      4. Run NLP pipeline to extract skills, education, experience.
      5. Save candidate + auto-compute and store initial ranking.
    """
    # ── Validate job exists ────────────────────────────────────────────────
    job_result = await db.execute(select(Job).where(Job.id == job_id, Job.is_active == True))  # noqa
    job = job_result.scalar_one_or_none()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job posting not found or is no longer active.",
        )

    # ── Validate file type ─────────────────────────────────────────────────
    original_filename = resume.filename or "resume"
    _, ext = os.path.splitext(original_filename)
    ext = ext.lower()
    
    # Server-side extension check: only allow .pdf and .docx files
    allowed_extensions = [".pdf", ".docx"]
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Please upload a PDF or DOCX file.",
        )

    # Filename sanitization: use secure_filename to prevent directory traversal attacks
    secure_name = secure_filename(original_filename)
    if not secure_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid filename. Please use a valid filename.",
        )

    # ── Validate file size ─────────────────────────────────────────────────
    content = await resume.read()
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum allowed size is {settings.MAX_UPLOAD_SIZE_MB} MB.",
        )

    # ── Save file to disk ──────────────────────────────────────────────────
    unique_name = f"{uuid.uuid4().hex}_{secure_name}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_name)
    with open(file_path, "wb") as f:
        f.write(content)

    # ── Extract text & run NLP ─────────────────────────────────────────────
    # Use pdfplumber for PDF files and python-docx for DOCX files to extract raw text
    try:
        raw_text = extract_text(file_path)
        parsed = parse_resume(raw_text)
    except HTTPException:
        # Clean up if parsing fails
        os.remove(file_path)
        raise
    except Exception as e:
        os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Resume processing failed: {str(e)}",
        )

    # ── Save Candidate ─────────────────────────────────────────────────────
    candidate = Candidate(
        name=name,
        email=email,
        job_id=job_id,
        resume_filename=original_filename,
        resume_path=file_path,
        parsed_skills=", ".join(parsed["skills"]),
        parsed_education=parsed["education"],
        parsed_experience=parsed["experience_years"],
        parsed_raw_text=raw_text[:50000],  # cap stored text
    )
    db.add(candidate)
    await db.flush()  # get candidate.id

    # ── Auto-compute initial ranking ───────────────────────────────────────
    # Calculate match score against job's required_skills stored in database
    scores = score_candidate(candidate, job)
    ranking = Ranking(
        candidate_id=candidate.id,
        job_id=job_id,
        **scores,
    )
    db.add(ranking)
    await db.flush()

    return {
        "message": "Resume uploaded and processed successfully!",
        "candidate_id": candidate.id,
        "parsed_skills": parsed["skills"],
        "parsed_education": parsed["education"],
        "parsed_experience_years": parsed["experience_years"],
        "match_score": scores["total_score"],
    }


@router.get("")
async def list_all_candidates(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_hr_user),
):
    """List all candidates across all jobs with job title and match score. HR only."""
    result = await db.execute(
        select(Candidate, Job, Ranking)
        .join(Job, Candidate.job_id == Job.id)
        .outerjoin(Ranking, Ranking.candidate_id == Candidate.id)
        .order_by(Candidate.created_at.desc())
    )
    rows = result.all()

    return [
        {
            "id": candidate.id,
            "name": candidate.name,
            "email": candidate.email,
            "job_id": job.id,
            "job_title": job.title,
            "resume_filename": candidate.resume_filename,
            "parsed_skills": [s.strip() for s in (candidate.parsed_skills or "").split(",") if s.strip()],
            "parsed_education": candidate.parsed_education,
            "parsed_experience": candidate.parsed_experience,
            "created_at": candidate.created_at,
            "status": ranking.status if ranking else "pending",
            "total_score": ranking.total_score if ranking else 0.0,
        }
        for candidate, job, ranking in rows
    ]


@router.get("/job/{job_id}")
async def list_candidates_for_job(
    job_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_hr_user),
):
    """List all candidates who applied for a specific job. HR only."""
    result = await db.execute(
        select(Candidate, Ranking)
        .outerjoin(Ranking, Ranking.candidate_id == Candidate.id)
        .where(Candidate.job_id == job_id)
        .order_by(Candidate.created_at.desc())
    )
    rows = result.all()

    return [
        {
            "id": candidate.id,
            "name": candidate.name,
            "email": candidate.email,
            "job_id": candidate.job_id,
            "resume_filename": candidate.resume_filename,
            "parsed_skills": [s.strip() for s in (candidate.parsed_skills or "").split(",") if s.strip()],
            "parsed_education": candidate.parsed_education,
            "parsed_experience": candidate.parsed_experience,
            "created_at": candidate.created_at,
            "status": ranking.status if ranking else "pending",
            "total_score": ranking.total_score if ranking else None,
            "skill_score": ranking.skill_score if ranking else None,
            "experience_score": ranking.experience_score if ranking else None,
            "education_score": ranking.education_score if ranking else None,
            "keyword_score": ranking.keyword_score if ranking else None,
        }
        for candidate, ranking in rows
    ]


@router.get("/{candidate_id}")
async def get_candidate(
    candidate_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_hr_user),
):
    """Get detailed info for a single candidate. HR only."""
    result = await db.execute(select(Candidate).where(Candidate.id == candidate_id))
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found.")

    return {
        "id": c.id,
        "name": c.name,
        "email": c.email,
        "job_id": c.job_id,
        "resume_filename": c.resume_filename,
        "parsed_skills": [s.strip() for s in (c.parsed_skills or "").split(",") if s.strip()],
        "parsed_education": c.parsed_education,
        "parsed_experience": c.parsed_experience,
        "created_at": c.created_at,
    }


@router.delete("/{candidate_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_candidate(
    candidate_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_hr_user),
):
    """Delete a candidate and their uploaded resume file. HR only."""
    result = await db.execute(select(Candidate).where(Candidate.id == candidate_id))
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found.")

    # Delete file from disk
    if os.path.exists(c.resume_path):
        os.remove(c.resume_path)

    await db.delete(c)
