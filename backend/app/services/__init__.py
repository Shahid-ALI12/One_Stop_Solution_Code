"""Service layer for all entities. Each service file is a thin CRUD wrapper."""
from app.services import (
    user_service, auth_service, security,
    service_service, enquiry_service, consultation_service,
    rating_service, resource_service, team_member_service,
    site_stats_service, seed_service,
    faq_service, certification_service, contact_platform_service,
    dashboard_service, visit_service, upload_service, admin_user_service,
    notification_service, country_flag, tz_service, chatbot_service,
)

__all__ = [
    "user_service", "auth_service", "security",
    "service_service", "enquiry_service", "consultation_service",
    "rating_service", "resource_service", "team_member_service",
    "site_stats_service", "seed_service",
    "faq_service", "certification_service", "contact_platform_service",
    "dashboard_service", "visit_service", "upload_service", "admin_user_service",
    "notification_service", "country_flag", "tz_service", "chatbot_service",
]
