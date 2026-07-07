"""API routes registry."""
from app.routes import (
    health, users, auth, services, enquiries, consultations,
    ratings, resources, team_members, stats, seed,
    faqs, certifications, contact_platforms, dashboard, visits,
)

__all__ = [
    "health", "users", "auth", "services", "enquiries", "consultations",
    "ratings", "resources", "team_members", "stats", "seed",
    "faqs", "certifications", "contact_platforms", "dashboard", "visits",
]
