# AI Resume Screener

A modern job posting and resume screening system built with:

- Backend: **FastAPI** + **SQLite** (swapable to PostgreSQL)
- Frontend: **React 18** + **Vite** + **Tailwind CSS**
- NLP: **spaCy** and a custom resume parser
- File parsing: **PyMuPDF** for PDF, **python-docx** for DOCX
- Authentication: **JWT** login for HR users

## Folder Structure

```
ai-resume-screener/
  backend/
    app/
      config.py
      database.py
      main.py
      models/
        candidate.py
        job.py
        ranking.py
        user.py
      routers/
        auth.py
        candidates.py
        jobs.py
        rankings.py
      schemas/
        candidate.py
        job.py
        user.py
      services/
        auth_service.py
        file_parser.py
        nlp_engine.py
        ranker.py
        __init__.py
    requirements.txt
    run.py
    sample_job_posting.json
    sample_resume.docx
  frontend/
    index.html
    package.json
    postcss.config.js
    tailwind.config.js
    vite.config.js
    src/
      App.jsx
      index.css
      main.jsx
      components/
      context/
      services/
```

## Database Schema

- `users`: HR users with `id`, `email`, `full_name`, `hashed_password`, `role`, and `is_active`.
- `jobs`: job postings with `title`, `description`, `required_skills`, `experience_level`, `education_requirement`, `deadline`, `is_active`, and `created_by`.
- `candidates`: uploaded resumes linked to jobs via `job_id`, storing candidate name, email, resume filename/path, parsed skills, education, experience, and raw text.
- `rankings`: score breakdown for each candidate (`skill_score`, `experience_score`, `education_score`, `keyword_score`, `total_score`) plus HR decision state.

Relationships:
- `users` → `jobs`: one HR user creates many jobs.
- `jobs` → `candidates`: one job has many candidate applications.
- `candidates` → `rankings`: one candidate has one ranking record.
- `jobs` → `rankings`: one job has many ranking records.

## Backend API Endpoints

### Authentication

- `POST /auth/register`
  - Request: `{ "email", "full_name", "password", "role" }`
  - Response: HR user data

- `POST /auth/login`
  - Request: `{ "email", "password" }`
  - Response: `{ "access_token", "token_type", "user" }`

### Job Postings

- `GET /jobs`
  - Query: `active_only`, `search`
  - Response: list of jobs with candidate counts

- `GET /jobs/{job_id}`
  - Response: single job record

- `POST /jobs`
  - HR only
  - Request: `{ "title", "description", "required_skills", "experience_level", "education_requirement", "deadline" }`

- `PUT /jobs/{job_id}`
  - HR only
  - Update job posting fields

- `DELETE /jobs/{job_id}`
  - HR only

### Candidate Uploads

- `POST /candidates/upload`
  - Public endpoint
  - Accepts form data: `name`, `email`, `job_id`, `resume` (.pdf or .docx)
  - Response: parsed skills, education, experience, match score

- `GET /candidates/job/{job_id}`
  - HR only
  - Returns candidates for a job with ranking metadata

- `GET /candidates/{candidate_id}`
  - HR only

- `DELETE /candidates/{candidate_id}`
  - HR only

### Rankings

- `POST /rankings/run/{job_id}`
  - HR only
  - Recompute ranking scores for all candidates on a job

- `GET /rankings/{job_id}`
  - HR only
  - Query options: `status_filter`, `min_score`, `skill_contains`, `min_experience`, `name_contains`, `email_contains`

- `PATCH /rankings/{ranking_id}/status`
  - HR only
  - Request: `{ "status": "shortlisted" | "rejected" | "pending" }`

- `GET /rankings/config/weights`
  - HR only

- `PUT /rankings/config/weights`
  - HR only
  - Update weights for scoring formula

## Running Locally

### Backend

```bash
cd backend
python -m pip install -r requirements.txt
python run.py
```

The backend will be available at `http://localhost:8000`.
Open `http://localhost:8000/docs` for interactive API docs.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:5173` by default.

### Seed Sample Data

To populate the database with sample HR user, job, and candidates:

```bash
cd backend
python seed.py
```

This creates:
- HR user: `hr@company.com` / `password123`
- Sample job: "Senior Backend Engineer"
- 3 sample candidates with parsed resumes and rankings

## Sample Job Posting

See `backend/sample_job_posting.json`.

## Sample Resume

See `backend/sample_resume.docx`.

## Notes

- The default database is SQLite (`resume_screener.db`).
- Uploaded resumes are stored in `backend/uploads/`.
- Weights are configurable via the rankings config endpoint and are used to tune skill, experience, education, and keyword matching.
