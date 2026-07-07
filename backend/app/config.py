"""Application settings loaded from environment / .env file.

All settings have sensible defaults so the app runs out-of-the-box
in dev mode (SQLite, no SMTP, no WhatsApp). Override via .env for
production.

Production guards:
  - DEBUG defaults to False (must be explicitly enabled).
  - SECRET_KEY / DEFAULT_ADMIN_PASSWORD are validated when DEBUG=False
    so the app refuses to start in production with insecure defaults.
  - DATABASE_URL format is validated for clearer startup errors.
"""
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


_INSECURE_SECRET = "change-me-in-production-please-use-a-long-random-string"
_INSECURE_ADMIN_PASSWORD = "admin123"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # ── App ──────────────────────────────────────────────────
    APP_NAME:        str  = "One Stop Solution API"
    APP_VERSION:     str  = "0.1.0"
    DEBUG:           bool = False
    HOST:            str  = "0.0.0.0"
    PORT:            int  = 8000

    # ── Security ─────────────────────────────────────────────
    SECRET_KEY:      str  = _INSECURE_SECRET

    # ── Database ─────────────────────────────────────────────
    DATABASE_URL:    str  = "sqlite:///./app.db"

    # ── CORS ─────────────────────────────────────────────────
    CORS_ORIGINS:    str  = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173"

    # ── Default admin (used by /seed) ────────────────────────
    DEFAULT_ADMIN_USERNAME:      str = "admin"
    DEFAULT_ADMIN_PASSWORD:      str = _INSECURE_ADMIN_PASSWORD
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
    UPLOAD_DIR:            str  = "uploads"
    UPLOAD_MAX_BYTES:      int  = 10 * 1024 * 1024  # 10 MB
    UPLOAD_PORTFOLIO_EXT:  str  = "jpg,jpeg,png,webp,gif"
    UPLOAD_RESOURCE_EXT:   str  = "pdf,doc,docx,xls,xlsx,ppt,pptx,zip,txt"
    # Public base URL prefix for serving uploaded files. Empty = relative (same-origin)
    UPLOAD_PUBLIC_BASE:    str  = ""

    @field_validator("SECRET_KEY")
    @classmethod
    def _validate_secret_key(cls, v: str) -> str:
        # The check for "insecure default in production" is enforced in
        # `validate_production()` below (we need to know DEBUG first).
        if not v or len(v) < 16:
            raise ValueError(
                "SECRET_KEY must be at least 16 characters long. "
                "Generate one with: python -c \"import secrets; print(secrets.token_urlsafe(48))\""
            )
        return v

    @field_validator("DATABASE_URL")
    @classmethod
    def _validate_db_url(cls, v: str) -> str:
        if not v:
            raise ValueError("DATABASE_URL must not be empty")
        allowed_prefixes = ("sqlite://", "postgresql+", "mysql+", "mssql+")
        if not v.startswith(allowed_prefixes):
            raise ValueError(
                f"DATABASE_URL must start with one of {allowed_prefixes}. "
                f"Got: {v!r}. Example: 'sqlite:///./app.db' or "
                "'postgresql+psycopg2://user:pass@host/db'"
            )
        return v

    def validate_production(self) -> None:
        """Raise if any production-blocking insecure default is in use.

        Call this from the lifespan startup AFTER settings are loaded.
        Only enforced when DEBUG=False (i.e. production).
        """
        if self.DEBUG:
            return  # Dev mode — allow insecure defaults for convenience.

        problems: list[str] = []
        if self.SECRET_KEY == _INSECURE_SECRET:
            problems.append(
                "SECRET_KEY is still the insecure default. "
                "Generate one with: python -c \"import secrets; print(secrets.token_urlsafe(48))\" "
                "and set it via the SECRET_KEY env var."
            )
        if self.DEFAULT_ADMIN_PASSWORD == _INSECURE_ADMIN_PASSWORD:
            problems.append(
                "DEFAULT_ADMIN_PASSWORD is still 'admin123'. "
                "Set a strong password via the DEFAULT_ADMIN_PASSWORD env var "
                "before deploying."
            )
        if problems:
            raise RuntimeError(
                "Refusing to start in production (DEBUG=False) with insecure defaults:\n  - "
                + "\n  - ".join(problems)
            )


settings = Settings()
