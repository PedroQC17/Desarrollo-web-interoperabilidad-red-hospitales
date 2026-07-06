from pathlib import Path
import httpx
import os

BASE_DIR = Path(__file__).resolve().parent.parent

CONFIG_SERVER = os.getenv("CONFIG_SERVER", "http://localhost:8888")
config = {}

try:
    resp = httpx.get(f"{CONFIG_SERVER}/facturacion/default", timeout=3)
    if resp.status_code == 200:
        config = resp.json()
except Exception:
    pass

SECRET_KEY = os.getenv("SECRET_KEY", "django-insecure-dev-key-facturacion")
DEBUG = os.getenv("DEBUG", "True") == "True"
ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "facturacion",
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

ROOT_URLCONF = "facturacion_service.urls"

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

WSGI_APPLICATION = "facturacion_service.wsgi.application"

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
            "ENGINE": db.get("engine", "django.db.backends.mysql"),
            "NAME": db.get("name", "db_facturacion"),
            "USER": db.get("user", "root"),
            "PASSWORD": db.get("password", "root"),
            "HOST": db.get("host", "localhost"),
            "PORT": db.get("port", 3307),
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "facturacion.auth.GatewayUserAuth",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
}

CORS_ALLOW_ALL_ORIGINS = True

LANGUAGE_CODE = "es-pe"
TIME_ZONE = "America/Lima"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"

PORT = config.get("server", {}).get("port", 8006)
