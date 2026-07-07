"""File upload service.

Saves uploaded files to a local directory and returns a public URL.
Files are written to a sub-folder per category (`portfolio/`, `resource/`)
so the disk layout stays organized and is easy to mirror to S3 later.

This service does NOT touch the database — callers (routes) are
responsible for storing the returned URL into the appropriate model
column (e.g. PortfolioItem.media_url, ResourceItem.title).
"""
import os
import uuid
from pathlib import Path

from fastapi import UploadFile, HTTPException, status

from app.config import settings


# Allowed extensions per category, lowercased, no leading dot.
_PORTFOLIO_EXT = {e.strip().lower().lstrip(".") for e in settings.UPLOAD_PORTFOLIO_EXT.split(",") if e.strip()}
_RESOURCE_EXT  = {e.strip().lower().lstrip(".") for e in settings.UPLOAD_RESOURCE_EXT.split(",") if e.strip()}

# Map of category -> allowed extensions
_ALLOWED: dict[str, set[str]] = {
    "portfolio": _PORTFOLIO_EXT,
    "resource":  _RESOURCE_EXT,
}

# Sanity-check the upload root exists; create lazily on first save.
_UPLOAD_ROOT = Path(settings.UPLOAD_DIR).resolve()


def _ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def _ext(filename: str) -> str:
    """Return lowercase extension without the leading dot."""
    return Path(filename).suffix.lower().lstrip(".")


def _validate(file: UploadFile, category: str) -> str:
    """Validate size + extension. Returns the lowercased extension."""
    if category not in _ALLOWED:
        raise HTTPException(status_code=400, detail=f"Unknown upload category: {category}")

    ext = _ext(file.filename or "")
    if ext not in _ALLOWED[category]:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '.{ext}' for {category}. "
                   f"Allowed: {', '.join(sorted(_ALLOWED[category]))}",
        )
    return ext


async def save_upload(file: UploadFile, category: str) -> dict:
    """Save an uploaded file to disk under `<UPLOAD_DIR>/<category>/<uuid>.<ext>`.

    Returns: {url, filename, size, content_type}
    """
    ext = _validate(file, category)

    # Read content with size check (avoid loading >max bytes into memory indefinitely)
    _ensure_dir(_UPLOAD_ROOT / category)
    content = await file.read()
    size = len(content)
    if size == 0:
        raise HTTPException(status_code=400, detail="Empty file")
    if size > settings.UPLOAD_MAX_BYTES:
        max_mb = settings.UPLOAD_MAX_BYTES / (1024 * 1024)
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({size} bytes). Max allowed: {max_mb:.1f} MB",
        )

    # Generate a unique, URL-safe filename. Preserve original extension.
    safe_name = f"{uuid.uuid4().hex}.{ext}"
    rel_path = f"{category}/{safe_name}"
    abs_path = _UPLOAD_ROOT / category / safe_name
    abs_path.write_bytes(content)

    # Build public URL. If UPLOAD_PUBLIC_BASE is set, prepend it; otherwise serve
    # from the same origin (the /uploads static mount in main.py).
    base = settings.UPLOAD_PUBLIC_BASE.rstrip("/")
    url = f"{base}/uploads/{rel_path}" if base else f"/uploads/{rel_path}"

    return {
        "url": url,
        "filename": rel_path,
        "size": size,
        "content_type": file.content_type or "application/octet-stream",
    }
