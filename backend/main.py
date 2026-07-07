"""Backend entry point.

The real app lives in `app/main.py`. This file just re-exports it so
`uvicorn main:app` (as documented in README) keeps working, and the
`if __name__ == "__main__"` block lets you run `python main.py` too.

Do NOT add routes or middleware here — they belong in `app/main.py`.
"""
import uvicorn

# Re-export so `uvicorn main:app` works
from app.main import app, create_app  # noqa: F401, E402
from app.config import settings  # noqa: F401, E402


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
