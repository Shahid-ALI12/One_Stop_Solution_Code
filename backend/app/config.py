"""Application settings loaded from environment / .env file.

All settings have sensible defaults so the app runs out-of-the-box
in dev mode (SQLite, no SMTP, no WhatsApp). Override via .env for
production.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # ── App ──────────────────────────────────────────────────
    APP_NAME:        str  = "One Stop Solution API"
    APP_VERSION:     str  = "0.1.0"
    DEBUG:           bool = True
    HOST:            str  = "0.0.0.0"
    PORT:            int  = 8000

    # ── Security ─────────────────────────────────────────────
    SECRET_KEY:      str  = "change-me-in-production-please-use-a-long-random-string"

    # ── Database ─────────────────────────────────────────────
    DATABASE_URL:    str  = "sqlite:///./app.db"

    # ── CORS ─────────────────────────────────────────────────
    CORS_ORIGINS:    str  = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173"

    # ── Default admin (used by /seed) ────────────────────────
    DEFAULT_ADMIN_USERNAME:      str = "admin"
    DEFAULT_ADMIN_PASSWORD:      str = "admin123"
    DEFAULT_ADMIN_DISPLAY_NAME:  str = "Site Administrator"

    # ── SMTP (admin notifications) ───────────────────────────
    SMTP_HOST:          str = ""
    SMTP_PORT:          int = 587
    SMTP_USER:          str = ""
    SMTP_PASSWORD:      str = ""
    SMTP_FROM:          str = "no-reply@onestopsolution.com"
    ADMIN_NOTIFY_EMAIL: str = ""

    # ── WhatsApp / Twilio ────────────────────────────────────
    TWILIO_ACCOUNT_SID:   str = ""
    TWILIO_AUTH_TOKEN:    str = ""
    TWILIO_WHATSAPP_FROM: str = ""
    ADMIN_WHATSAPP_TO:    str = ""

    # ── Visit tracking (IP → country) ────────────────────────
    IPAPI_TOKEN:        str = ""

    # ── JWT ──────────────────────────────────────────────────
    JWT_EXPIRES_DAYS:   int = 7

    # ── File uploads ─────────────────────────────────────────
    UPLOAD_DIR:            str = "uploads"
    UPLOAD_MAX_BYTES:      int  = 10 * 1024 * 1024  # 10 MB
    UPLOAD_PORTFOLIO_EXT:  str  = "jpg,jpeg,png,webp,gif"
    UPLOAD_RESOURCE_EXT:   str  = "pdf,doc,docx,xls,xlsx,ppt,pptx,zip,txt"
    # Public base URL prefix for serving uploaded files. Empty = relative (same-origin)
    UPLOAD_PUBLIC_BASE:    str  = ""


settings = Settings()
