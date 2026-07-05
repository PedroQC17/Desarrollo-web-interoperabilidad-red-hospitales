from pathlib import Path
from datetime import timedelta
import httpx
import os

BASE_DIR = Path(__file__).resolve().parent.parent

# ── Config Server ────────────────────────────────────────────────
CONFIG_SERVER = os.getenv("CONFIG_SERVER", "http://localhost:8888")
config = {}

try:
    resp = httpx.get(f"{CONFIG_SERVER}/auth/default", timeout=3)
    if resp.status_code == 200:
        config = resp.json()
except Exception:
    pass

# ── Security ─────────────────────────────────────────────────────
SECRET_KEY = config.get("jwt", {}).get("secret", "django-insecure-dev-key-change-in-production")
DEBUG = os.getenv("DEBUG", "True") == "True"
ALLOWED_HOSTS = ["*"]

# ── Apps ─────────────────────────────────────────────────────────
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third party
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    # Local
    "usuarios",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "auth_service.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "auth_service.wsgi.application"

# ── Database ─────────────────────────────────────────────────────
USE_SQLITE = os.getenv("USE_SQLITE", "True") == "True"

if USE_SQLITE:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }
else:
    db = config.get("database", {})
    DATABASES = {
        "default": {
            "ENGINE": db.get("engine", "django.db.backends.postgresql"),
            "NAME": db.get("name", "db_auth"),
            "USER": db.get("user", "postgres"),
            "PASSWORD": db.get("password", "postgres"),
            "HOST": db.get("host", "localhost"),
            "PORT": db.get("port", 5432),
        }
    }

# ── Auth ─────────────────────────────────────────────────────────
AUTH_USER_MODEL = "usuarios.Usuario"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ── DRF + JWT ────────────────────────────────────────────────────
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(
        minutes=config.get("jwt", {}).get("expiration_minutes", 60)
    ),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    "AUTH_HEADER_TYPES": ("Bearer",),
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
}

# ── CORS ─────────────────────────────────────────────────────────
CORS_ALLOW_ALL_ORIGINS = True

# ── Internationalization ─────────────────────────────────────────
LANGUAGE_CODE = "es-pe"
TIME_ZONE = "America/Lima"
USE_I18N = True
USE_TZ = True

# ── Static files ─────────────────────────────────────────────────
STATIC_URL = "static/"

# ── Server ───────────────────────────────────────────────────────
PORT = config.get("server", {}).get("port", 8001)
