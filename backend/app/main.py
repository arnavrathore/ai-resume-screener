"""
main.py — FastAPI application entry point.

Registers:
  - CORS middleware
  - All routers (auth, jobs, candidates, rankings)
  - Startup event: create DB tables + uploads directory
  - Health check endpoint
"""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.database import init_db
from app.routers import auth, jobs, candidates, rankings

settings = get_settings()


# ── Lifespan (startup + shutdown) ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize the database and ensure the upload dir exists on startup."""
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    await init_db()
    print(f"[{settings.APP_NAME}] Database initialized. Upload dir: {settings.UPLOAD_DIR}")
    yield
    print(f"[{settings.APP_NAME}] Shutting down.")


# ── FastAPI App ────────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "AI-powered resume screening system. "
        "HR users can post jobs, candidates upload resumes, "
        "and the NLP engine ranks candidates automatically."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(jobs.router)
app.include_router(candidates.router)
app.include_router(rankings.router)


# ── Health Check ───────────────────────────────────────────────────────────────
@app.get("/health", tags=["System"])
async def health_check():
    """Simple health check endpoint."""
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}


# ── Root ───────────────────────────────────────────────────────────────────────
@app.get("/", tags=["System"])
async def root():
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "docs": "/docs",
        "version": settings.APP_VERSION,
    }
