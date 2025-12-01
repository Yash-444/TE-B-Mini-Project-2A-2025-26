import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = os.getenv("SESSION_COOKIE_SECURE", "0") == "1"

    # Database
    DATABASE_URL = os.getenv("DATABASE_URL")  # e.g. mysql+mysqlconnector://user:pass@host/dbname
    SQLITE_FALLBACK = os.getenv("SQLITE_FALLBACK", "1") == "1"
    SQLITE_PATH = os.getenv("SQLITE_PATH", "instance/app.db")
    FORCE_DB = os.getenv("FORCE_DB", "0") == "1"

    # Redis / RQ
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    RQ_DEFAULT_QUEUE = "rag-jobs"

    # AI
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    GOOGLE_AI_API_KEY = os.getenv("GOOGLE_AI_API_KEY", "")
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "models/gemini-2.5-flash")

    # File uploads
    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "uploads")
    MAX_CONTENT_LENGTH = 25 * 1024 * 1024  # 25MB

    # Email Configuration
    MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT = int(os.getenv("MAIL_PORT", "587"))
    MAIL_USE_TLS = os.getenv("MAIL_USE_TLS", "1") == "1"
    MAIL_USE_SSL = os.getenv("MAIL_USE_SSL", "0") == "1"
    MAIL_USERNAME = os.getenv("MAIL_USERNAME", "")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "")  # App password for Gmail
    MAIL_DEFAULT_SENDER = os.getenv("MAIL_DEFAULT_SENDER", "noreply@sphere-ai.com")
    
    # Email Features
    SEND_EMAIL_NOTIFICATIONS = os.getenv("SEND_EMAIL_NOTIFICATIONS", "1") == "1"
    EMAIL_ASYNC = os.getenv("EMAIL_ASYNC", "1") == "1"
