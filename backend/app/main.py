from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db.database import create_tables, SessionLocal
from app.routes import (
    health, users, auth, services, enquiries, consultations,
    ratings, resources, team_members, stats, seed,
    faqs, certifications, contact_platforms, dashboard, visits,
)
from app.services import seed_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create DB tables on startup
    create_tables()
    # Auto-seed if DB is empty (idempotent)
    db = SessionLocal()
    try:
        seed_service.run_seed(db, force=False)
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
        allow_methods=["*"],
        allow_headers=["*"],
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
            ],
        }

    return app


app = create_app()
