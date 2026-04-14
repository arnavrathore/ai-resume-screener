"""
run.py — Convenience script to launch the backend with uvicorn.
Run from the `backend/` directory: python run.py
"""

import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,          # Auto-reload on code changes (dev mode)
        log_level="info",
    )
