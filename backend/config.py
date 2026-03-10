"""
StayBot AI – Configuration Classes
Loaded by the Flask app factory based on FLASK_ENV.
"""
import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()


class BaseConfig:
    """Shared configuration for all environments."""

    SECRET_KEY: str = os.environ.get("SECRET_KEY", "dev-secret-key")
    JWT_SECRET_KEY: str = os.environ.get("JWT_SECRET_KEY", "dev-jwt-key")
    JWT_ACCESS_TOKEN_EXPIRES: timedelta = timedelta(
        seconds=int(os.environ.get("JWT_ACCESS_TOKEN_EXPIRES", 86400))
    )

    SUPABASE_URL: str = os.environ.get("SUPABASE_URL", "")
    SUPABASE_SERVICE_KEY: str = os.environ.get("SUPABASE_SERVICE_KEY", "")

    GOOGLE_SERVICE_ACCOUNT_JSON: str = os.environ.get(
        "GOOGLE_SERVICE_ACCOUNT_JSON", "./credentials/google-service-account.json"
    )

    GEMINI_API_KEY: str = os.environ.get("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.environ.get("OPENAI_API_KEY", "")

    CENTRAL_BOT_TOKEN: str = os.environ.get("CENTRAL_BOT_TOKEN", "")

    ALLOWED_ORIGINS: list[str] = [
        o.strip()
        for o in os.environ.get(
            "ALLOWED_ORIGINS", "http://localhost:5173"
        ).split(",")
    ]

    RATELIMIT_DEFAULT: str = os.environ.get("RATELIMIT_DEFAULT", "100/minute")
    RATELIMIT_AUTH: str = os.environ.get("RATELIMIT_AUTH", "5/minute")


class DevelopmentConfig(BaseConfig):
    DEBUG = True
    TESTING = False


class ProductionConfig(BaseConfig):
    DEBUG = False
    TESTING = False


class TestingConfig(BaseConfig):
    DEBUG = True
    TESTING = True
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(seconds=5)


configs = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
}
