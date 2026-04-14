"""
services/ranker.py — Candidate ranking service.

Computes a weighted composite score for each candidate against a job posting
and writes/updates the Ranking table.

Weights are configurable per-job or globally via RankingWeights schema.
"""

from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.candidate import Candidate
from app.models.ranking import Ranking
from app.models.job import Job
from app.schemas.candidate import RankingWeights
from app.services import nlp_engine
from app.config import get_settings

settings = get_settings()


def get_default_weights() -> RankingWeights:
    """Return default weights from application config."""
    return RankingWeights(
        weight_skills=settings.DEFAULT_WEIGHT_SKILLS,
        weight_experience=settings.DEFAULT_WEIGHT_EXPERIENCE,
        weight_education=settings.DEFAULT_WEIGHT_EDUCATION,
        weight_keywords=settings.DEFAULT_WEIGHT_KEYWORDS,
    )


def score_candidate(
    candidate: Candidate,
    job: Job,
    weights: Optional[RankingWeights] = None,
) -> dict:
    """
    Compute the full score breakdown for a single candidate against a job.

    Args:
        candidate: ORM Candidate instance with parsed fields.
        job: ORM Job instance with requirements.
        weights: Optional custom RankingWeights; uses defaults if None.

    Returns:
        Dict with keys: skill_score, experience_score, education_score,
                        keyword_score, total_score
    """
    if weights is None:
        weights = get_default_weights()

    # Parse skills from comma-separated storage
    candidate_skills = [s.strip() for s in (candidate.parsed_skills or "").split(",") if s.strip()]
    required_skills = [s.strip() for s in (job.required_skills or "").split(",") if s.strip()]

    # ── Individual Scores (each 0–100) ────────────────────────────────────
    skill_score = nlp_engine.compute_skill_score(candidate_skills, required_skills)

    experience_score = nlp_engine.compute_experience_score(
        candidate.parsed_experience or 0.0,
        job.experience_level or "",
    )

    education_score = nlp_engine.compute_education_score(
        candidate.parsed_education or "",
        job.education_requirement or "",
    )

    keyword_score = nlp_engine.compute_keyword_score(
        candidate.parsed_raw_text or "",
        job.description or "",
    )

    # ── Weighted Total ─────────────────────────────────────────────────────
    total_score = round(
        skill_score * weights.weight_skills
        + experience_score * weights.weight_experience
        + education_score * weights.weight_education
        + keyword_score * weights.weight_keywords,
        2,
    )

    return {
        "skill_score": skill_score,
        "experience_score": experience_score,
        "education_score": education_score,
        "keyword_score": keyword_score,
        "total_score": total_score,
    }


async def run_ranking_for_job(
    job_id: int,
    db: AsyncSession,
    weights: Optional[RankingWeights] = None,
) -> List[Ranking]:
    """
    Compute or recompute rankings for all candidates of a given job.

    Steps:
      1. Load the job and all its candidates from DB.
      2. Score each candidate.
      3. Upsert (create or update) Ranking rows.
      4. Return rankings sorted by total_score descending.

    Args:
        job_id: The job to rank candidates for.
        db: Async DB session.
        weights: Optional custom scoring weights.

    Returns:
        List of Ranking ORM objects, sorted highest score first.
    """
    # Fetch job
    job_result = await db.execute(select(Job).where(Job.id == job_id))
    job = job_result.scalar_one_or_none()
    if job is None:
        raise ValueError(f"Job {job_id} not found.")

    # Fetch candidates for this job
    cand_result = await db.execute(
        select(Candidate).where(Candidate.job_id == job_id)
    )
    candidates = cand_result.scalars().all()

    if not candidates:
        return []

    rankings = []
    for candidate in candidates:
        scores = score_candidate(candidate, job, weights)

        # Check if a Ranking row already exists
        rank_result = await db.execute(
            select(Ranking).where(Ranking.candidate_id == candidate.id)
        )
        ranking = rank_result.scalar_one_or_none()

        if ranking is None:
            ranking = Ranking(
                candidate_id=candidate.id,
                job_id=job_id,
                **scores,
            )
            db.add(ranking)
        else:
            # Update existing ranking (preserve HR status decision)
            ranking.skill_score = scores["skill_score"]
            ranking.experience_score = scores["experience_score"]
            ranking.education_score = scores["education_score"]
            ranking.keyword_score = scores["keyword_score"]
            ranking.total_score = scores["total_score"]

        rankings.append((ranking, scores["total_score"]))

    await db.flush()  # flush to get IDs without full commit

    # Sort by score descending
    rankings.sort(key=lambda x: x[1], reverse=True)
    return [r for r, _ in rankings]
