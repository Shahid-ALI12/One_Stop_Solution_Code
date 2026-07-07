import logging
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from app.config import settings
from app.db.database import create_tables, SessionLocal
from app.routes import (
    health, users, auth, services, enquiries, consultations,
    ratings, resources, team_members, stats, seed,
    faqs, certifications, contact_platforms, dashboard, visits,
    uploads, admin_users, chatbot,
)
from app.services import seed_service


logger = logging.getLogger("app")
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Production guards — refuse to start with insecure defaults.
    settings.validate_production()

    # Create DB tables on startup
    create_tables()
    # Ensure the uploads directory exists so StaticFiles can mount safely
    Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
    # Auto-seed if DB is empty (idempotent). Wrap in try/except so a seed
    # failure (e.g. partial prior seed, schema mismatch) doesn't prevent
    # the app from starting — the admin can re-trigger via POST /seed/?force=true.
    db = SessionLocal()
    try:
        seed_service.run_seed(db, force=False)
    except Exception:
        logger.exception("Auto-seed failed; continuing startup. "
                         "Run POST /seed/?force=true to retry.")
    finally:
        db.close()
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        debug=settings.DEBUG,
        lifespan=lifespan,
    )

    # CORS — allow the frontend dev server
    origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allow_headers=["Authorization", "Content-Type", "Accept", "X-Requested-With"],
    )

    # Register routers
    app.include_router(health.router)
    app.include_router(auth.router)
    app.include_router(users.router)
    app.include_router(services.router)
    app.include_router(enquiries.router)
    app.include_router(consultations.router)
    app.include_router(ratings.router)
    app.include_router(resources.router)
    app.include_router(team_members.router)
    app.include_router(stats.router)
    app.include_router(seed.router)
    # New P1 routers
    app.include_router(faqs.router)
    app.include_router(certifications.router)
    app.include_router(contact_platforms.router)
    app.include_router(dashboard.router)
    app.include_router(visits.router)
    # P2 routers
    app.include_router(uploads.router)
    app.include_router(admin_users.router)
    # P4 routers
    app.include_router(chatbot.router)

    # Serve uploaded files at /uploads/{category}/{filename}
    upload_path = Path(settings.UPLOAD_DIR).resolve()
    upload_path.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=str(upload_path)), name="uploads")

    # ── Global exception handler ─────────────────────────────────
    # Never leak stack traces to clients, even in DEBUG mode (DEBUG just
    # controls FastAPI's own error pages for HTTPException-derived errors).
    @app.exception_handler(Exception)
    async def _unhandled_exception_handler(request: Request, exc: Exception):
        # HTTPException is FastAPI's own — let its handler take over so the
        # `detail` field is preserved verbatim.
        if isinstance(exc, HTTPException):
            return JSONResponse(
                status_code=exc.status_code,
                content={"detail": exc.detail},
                headers=getattr(exc, "headers", None),
            )
        logger.exception("Unhandled error on %s %s", request.method, request.url.path)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
        )

    @app.get("/", tags=["Root"])
    def root():
        return {
            "app": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "docs": "/docs",
            "endpoints": [
                "/auth/login", "/auth/me",
                "/services/", "/enquiries/", "/consultations/",
                "/ratings/", "/resources/", "/team/", "/stats/",
                "/seed/", "/seed/status",
                "/faqs/", "/certifications/", "/contact-platforms/",
                "/stats/dashboard", "/visits/", "/visits/by-country",
                "/uploads/portfolio", "/uploads/resource",
                "/admin-users/", "/admin-users/me",
                "/chatbot/", "/chatbot/suggestions",
            ],
        }

    return app


app = create_app()
