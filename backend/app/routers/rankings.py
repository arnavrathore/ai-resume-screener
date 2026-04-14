"""
routers/rankings.py — Candidate ranking endpoints.

HR only: POST /rankings/run/{job_id}  → trigger/recompute ranking
         GET  /rankings/{job_id}       → get ranked list for a job
         PATCH /rankings/{ranking_id}/status → shortlist/reject
         GET  /rankings/config         → get current weights
         PUT  /rankings/config         → update weights
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional

from app.database import get_db
from app.models.ranking import Ranking
from app.models.candidate import Candidate
from app.schemas.candidate import RankingOut, StatusUpdate, RankingWeights, CandidateStatus
from app.services.auth_service import get_current_hr_user
from app.services.ranker import run_ranking_for_job, get_default_weights
from app.models.user import User

router = APIRouter(prefix="/rankings", tags=["Rankings"])

# ── In-memory weight config (reset on server restart) ─────────────────────────
# In production, persist this in the database or a config file.
_current_weights: RankingWeights = get_default_weights()


@router.post("/run/{job_id}", status_code=status.HTTP_200_OK)
async def trigger_ranking(
    job_id: int,
    weights: Optional[RankingWeights] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_hr_user),
):
    """
    Trigger or recompute candidate ranking for a job posting.
    Optionally pass custom weights in the request body.
    """
    try:
        active_weights = weights or _current_weights
        rankings = await run_ranking_for_job(job_id, db, active_weights)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    return {
        "message": f"Ranking complete. {len(rankings)} candidates scored.",
        "job_id": job_id,
        "weights_used": active_weights.model_dump(),
        "top_score": rankings[0].total_score if rankings else 0,
    }


@router.get("/{job_id}", response_model=List[dict])
async def get_rankings(
    job_id: int,
    status_filter: Optional[CandidateStatus] = Query(None, description="Filter by status"),
    min_score: float = Query(0, description="Minimum total score to include"),
    skill_contains: Optional[str] = Query(None, description="Filter by parsed skill"),
    min_experience: Optional[float] = Query(None, description="Minimum years of experience"),
    name_contains: Optional[str] = Query(None, description="Filter candidates by name"),
    email_contains: Optional[str] = Query(None, description="Filter candidates by email"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_hr_user),
):
    """
    Get ranked list of candidates for a job, ordered by total_score descending.
    Supports filtering by status, minimum score, skill, experience, and candidate text.
    """
    query = (
        select(Ranking, Candidate)
        .join(Candidate, Ranking.candidate_id == Candidate.id)
        .where(Ranking.job_id == job_id)
        .where(Ranking.total_score >= min_score)
    )

    if status_filter:
        query = query.where(Ranking.status == status_filter.value)
    if name_contains:
        query = query.where(Candidate.name.ilike(f"%{name_contains.strip()}%"))
    if email_contains:
        query = query.where(Candidate.email.ilike(f"%{email_contains.strip()}%"))
    if skill_contains:
        query = query.where(Candidate.parsed_skills.ilike(f"%{skill_contains.strip()}%"))
    if min_experience is not None:
        query = query.where(Candidate.parsed_experience >= min_experience)

    query = query.order_by(Ranking.total_score.desc())

    result = await db.execute(query)
    rows = result.all()

    return [
        {
            "ranking_id": r.id,
            "candidate_id": c.id,
            "candidate_name": c.name,
            "candidate_email": c.email,
            "resume_filename": c.resume_filename,
            "parsed_skills": [s.strip() for s in (c.parsed_skills or "").split(",") if s.strip()],
            "parsed_education": c.parsed_education,
            "parsed_experience": c.parsed_experience,
            "skill_score": round(r.skill_score, 1),
            "experience_score": round(r.experience_score, 1),
            "education_score": round(r.education_score, 1),
            "keyword_score": round(r.keyword_score, 1),
            "total_score": round(r.total_score, 1),
            "match_percentage": round(r.total_score, 1),
            "status": r.status,
            "computed_at": r.computed_at,
        }
        for r, c in rows
    ]


@router.patch("/{ranking_id}/status")
async def update_status(
    ranking_id: int,
    payload: StatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_hr_user),
):
    """Update the HR decision (shortlist/reject/pending) for a candidate ranking."""
    result = await db.execute(select(Ranking).where(Ranking.id == ranking_id))
    ranking = result.scalar_one_or_none()
    if not ranking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ranking record not found.")

    ranking.status = payload.status.value
    await db.flush()

    return {"message": f"Candidate status updated to '{payload.status.value}'.", "ranking_id": ranking_id}


@router.get("/config/weights", response_model=RankingWeights)
async def get_weights(current_user: User = Depends(get_current_hr_user)):
    """Get the current ranking weight configuration."""
    return _current_weights


@router.put("/config/weights", response_model=RankingWeights)
async def update_weights(
    payload: RankingWeights,
    current_user: User = Depends(get_current_hr_user),
):
    """
    Update the global ranking weight configuration.
    Weights must sum to 1.0 (validated).
    """
    global _current_weights
    try:
        payload.validate_weights()
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))

    _current_weights = payload
    return _current_weights
