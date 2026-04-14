"""
config.py — Application configuration using Pydantic Settings.
All environment variables can be overridden via a .env file.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    # ── App ──────────────────────────────────────────────────────────────
    APP_NAME: str = "AI Resume Screener"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # ── Database ─────────────────────────────────────────────────────────
    # SQLite by default; swap to postgresql+asyncpg://... for Postgres
    DATABASE_URL: str = "sqlite+aiosqlite:///./resume_screener.db"

    # ── JWT ──────────────────────────────────────────────────────────────
    SECRET_KEY: str = "change-me-in-production-use-a-long-random-string"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 8  # 8 hours

    # ── File Storage ─────────────────────────────────────────────────────
    UPLOAD_DIR: str = os.path.join(os.path.dirname(__file__), "..", "uploads")
    MAX_UPLOAD_SIZE_MB: int = 10
    ALLOWED_EXTENSIONS: list[str] = [".pdf", ".docx"]

    # ── Ranking Weights (must sum to 1.0) ────────────────────────────────
    DEFAULT_WEIGHT_SKILLS: float = 0.40
    DEFAULT_WEIGHT_EXPERIENCE: float = 0.30
    DEFAULT_WEIGHT_EDUCATION: float = 0.15
    DEFAULT_WEIGHT_KEYWORDS: float = 0.15

    # ── CORS ─────────────────────────────────────────────────────────────
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",
    ]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Return cached settings singleton."""
    return Settings()
