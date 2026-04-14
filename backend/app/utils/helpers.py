"""
utils/helpers.py — Shared utility functions.
"""

import re
from datetime import datetime
from typing import Any, Dict


def sanitize_filename(filename: str) -> str:
    """
    Remove path traversal characters and restrict filename to safe characters.

    Args:
        filename: Original uploaded filename.

    Returns:
        Sanitized filename string.
    """
    filename = filename.replace("..", "").replace("/", "").replace("\\", "")
    return re.sub(r"[^\w\s\-.]", "", filename)


def format_score(score: float) -> str:
    """Format a 0–100 score as a percentage string."""
    return f"{score:.1f}%"


def utcnow() -> datetime:
    """Return current UTC datetime (timezone-aware)."""
    from datetime import timezone
    return datetime.now(timezone.utc)


def clean_text(text: str) -> str:
    """
    Clean raw extracted text: collapse whitespace, remove null bytes.

    Args:
        text: Raw text from PDF/DOCX extraction.

    Returns:
        Cleaned text string.
    """
    text = text.replace("\x00", "")               # remove null bytes
    text = re.sub(r"\n{3,}", "\n\n", text)         # collapse multiple newlines
    text = re.sub(r"[ \t]{2,}", " ", text)         # collapse multiple spaces
    return text.strip()


def paginate(items: list, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
    """
    Simple in-memory pagination helper.

    Args:
        items: Full list of items.
        page: 1-indexed page number.
        page_size: Items per page.

    Returns:
        Dict with 'items', 'total', 'page', 'pages' keys.
    """
    total = len(items)
    start = (page - 1) * page_size
    end = start + page_size
    return {
        "items": items[start:end],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": max(1, -(-total // page_size)),  # ceiling division
    }
