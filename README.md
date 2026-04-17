# AI-Based Resume Screening System

## Overview

AI-Based Resume Screening System is a two-portal hiring platform that empowers HR teams to post jobs, review candidate submissions, and shortlist the best matches automatically. Candidates can upload resumes in PDF or DOCX format and receive instant skill parsing and job fit ranking.

### Built By
- Arnav Rathore

## Key Features

- Automated PDF and DOCX resume parsing
- Weighted candidate ranking based on skills, experience, education, and keywords
- Dual-role portals for HR and Candidates
- Secure login and role-based route protection
- Resume upload validation and parsing with AI-friendly file extraction

## Ranking Logic

The system computes a weighted match score for each resume using four components:

- `skill_score` — how many required skills match candidate skills
- `experience_score` — how well the candidate's experience level matches the job requirement
- `education_score` — how the candidate's degree level compares to the job requirement
- `keyword_score` — how closely resume text aligns with the job description

These scores are combined into a final `total_score` using configurable weights. For example:

```text
total_score =
  skill_score * weight_skills +
  experience_score * weight_experience +
  education_score * weight_education +
  keyword_score * weight_keywords
```

The ranking engine stores both the breakdown and the final composite score, so HR can review matches transparently.

## Project Structure

```
ai-resume-screener/
  backend/
    app/
      config.py
      database.py
      main.py
      models/
      routers/
      schemas/
      services/
    requirements.txt
    run.py
    seed.py
    uploads/
    sample_job_posting.json
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
      pages/
      services/
```

## Setup Guide

### Backend

1. Install backend dependencies:

```bash
cd backend
python -m pip install -r requirements.txt
```

2. Seed initial demo data:

```bash
python seed.py
```

This creates:
- HR user: `hr@company.com` / `password123`
- Candidate user: `candidate@company.com` / `password123`
- Sample job posting and example candidate records

3. Run the backend server:

```bash
python run.py
```

4. Access the API docs at:

```text
http://localhost:8000/docs
```

### Frontend

1. Install frontend dependencies:

```bash
cd frontend
npm install
```

2. Start the frontend:

```bash
npm run dev
```

3. Open the app in your browser at:

```text
http://localhost:5173
```

## Candidate Login

Use the seeded candidate account to test resume uploads and the candidate portal:

- Email: `candidate@company.com`
- Password: `password123`

## HR Login

Use the seeded HR account to create jobs and review candidates:

- Email: `hr@company.com`
- Password: `password123`

## Notes

- Resume parsing uses `pdfplumber` for PDFs and `python-docx` for DOCX files.
- File uploads are validated via `python-multipart`.
- Ranking weights can be adjusted by HR to tune candidate match scoring.
- The backend defaults to SQLite, but SQLAlchemy enables easy migration to PostgreSQL.
