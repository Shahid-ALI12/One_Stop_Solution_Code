"""
OneStop Online Services — FastAPI Entry Point
Run with:  uv run main.py
"""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.envConfig import settings
from app.config.db import engine, Base


Base.metadata.create_all(bind=engine)

# ── App Instance ───────────────────────────────────────────────
app = FastAPI(
    title="OneStop Online Services API",
    description="Backend API for OneStop Online Services",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS Middleware ────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # change to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers (add your routes here as you build them) ──────────
# from app.routes import admin, faq, service, team, portfolio, review
# app.include_router(admin.router,     prefix="/api/admin",     tags=["Admin"])
# app.include_router(faq.router,       prefix="/api/faq",       tags=["FAQ"])
# app.include_router(service.router,   prefix="/api/services",  tags=["Services"])
# app.include_router(team.router,      prefix="/api/team",      tags=["Team"])
# app.include_router(portfolio.router, prefix="/api/portfolio", tags=["Portfolio"])
# app.include_router(review.router,    prefix="/api/reviews",   tags=["Reviews"])




# ── Entry Point ────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )