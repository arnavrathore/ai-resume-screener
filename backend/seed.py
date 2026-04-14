"""
seed.py — Seed the database with sample data for testing.

Run: python -m seed
"""

import asyncio
from app.database import init_db, AsyncSessionLocal
from app.models.user import User
from app.models.job import Job
from app.models.candidate import Candidate
from app.models.ranking import Ranking
from app.services.auth_service import hash_password
from app.services.nlp_engine import parse_resume
from app.services.ranker import score_candidate
from app.config import get_settings
import os

settings = get_settings()


async def seed_db():
    """Create sample HR user, job, and candidates for testing."""
    async with AsyncSessionLocal() as session:
        try:
            # ── Create HR User ──────────────────────────────────────────────────
            hr_user = User(
                email="hr@company.com",
                full_name="HR Manager",
                hashed_password=hash_password("password123"),
                role="hr",
            )
            session.add(hr_user)
            await session.flush()

            # ── Create Sample Job ───────────────────────────────────────────────
            job = Job(
                title="Senior Backend Engineer",
                description="We are looking for a Senior Backend Engineer to build scalable REST APIs, design database models, and lead architecture reviews. Experience with Python, FastAPI, and PostgreSQL is required.",
                required_skills="Python, FastAPI, PostgreSQL, Docker, AWS",
                experience_level="5+ years",
                education_requirement="Bachelor of Technology",
                created_by=hr_user.id,
                is_active=True,
            )
            session.add(job)
            await session.flush()

            # ── Create Sample Candidates ─────────────────────────────────────────
            candidates_data = [
                {
                    "name": "Alice Johnson",
                    "email": "alice@example.com",
                    "resume_text": """
                    Alice Johnson
                    Senior Backend Engineer with 7 years of experience.
                    Skills: Python, FastAPI, Django, PostgreSQL, Docker, Kubernetes, AWS, CI/CD.
                    Experience: 5 years at TechCorp building APIs, 2 years at StartupX leading backend team.
                    Education: Bachelor of Technology in Computer Science.
                    """,
                },
                {
                    "name": "Bob Smith",
                    "email": "bob@example.com",
                    "resume_text": """
                    Bob Smith
                    Software Engineer with 3 years of experience.
                    Skills: Python, Flask, MySQL, Git, Linux.
                    Experience: 3 years at DevShop building web apps.
                    Education: Bachelor of Science in Computer Science.
                    """,
                },
                {
                    "name": "Charlie Brown",
                    "email": "charlie@example.com",
                    "resume_text": """
                    Charlie Brown
                    Junior Developer with 1 year of experience.
                    Skills: JavaScript, React, Node.js, MongoDB.
                    Experience: 1 year at WebAgency building frontends.
                    Education: Associate Degree in IT.
                    """,
                },
            ]

            for cand_data in candidates_data:
                # Simulate parsed resume
                parsed = parse_resume(cand_data["resume_text"])

                candidate = Candidate(
                    name=cand_data["name"],
                    email=cand_data["email"],
                    job_id=job.id,
                    resume_filename=f"{cand_data['name'].replace(' ', '_')}.pdf",
                    resume_path="/fake/path",  # Not a real file for seeding
                    parsed_skills=", ".join(parsed["skills"]),
                    parsed_education=parsed["education"],
                    parsed_experience=parsed["experience_years"],
                    parsed_raw_text=cand_data["resume_text"][:50000],
                )
                session.add(candidate)
                await session.flush()

                # Compute and save ranking
                scores = score_candidate(candidate, job)
                ranking = Ranking(
                    candidate_id=candidate.id,
                    job_id=job.id,
                    **scores,
                )
                session.add(ranking)

            await session.commit()
            print("✅ Database seeded with sample data!")
            print("   HR Login: hr@company.com / password123")
            print("   Job: Senior Backend Engineer")
            print("   Candidates: 3 sample applicants")

        except Exception as e:
            await session.rollback()
            print(f"❌ Seeding failed: {e}")


if __name__ == "__main__":
    asyncio.run(init_db())
    asyncio.run(seed_db())