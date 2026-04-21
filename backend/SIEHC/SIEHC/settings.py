"""
Django settings for SIEHC project.
"""

from pathlib import Path
from dotenv import load_dotenv
import os

# ─── Rutas ────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent

# ─── Variables de entorno ─────────────────────────────────────────────────────
load_dotenv(BASE_DIR / '.env')

SECRET_KEY = os.getenv('SECRET_KEY', 'clave-local-insegura')
DEBUG       = os.getenv('DEBUG', 'True') == 'True'
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# ─── Apps ─────────────────────────────────────────────────────────────────────
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Terceros
    'rest_framework',
    'corsheaders',
    # SIEHC
    'usuarios',
    'historial',
    'citas',
    'medicamentos',
    'hospitales',
    'facturacion',
    'soporte',
]

# ─── Middleware ───────────────────────────────────────────────────────────────
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',          # ← CORS (debe ir aquí)
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'SIEHC.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'SIEHC.wsgi.application'

# ─── Base de datos ────────────────────────────────────────────────────────────
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# ─── Usuario personalizado ────────────────────────────────────────────────────
AUTH_USER_MODEL = 'usuarios.Usuario'   # ← le dice a Django cuál es tu user

# ─── Django REST Framework ────────────────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

# ─── JWT ──────────────────────────────────────────────────────────────────────
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME':  timedelta(hours=8),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# ─── CORS (permite que React en localhost:5173 llame a Django) ────────────────
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]

# ─── Validación de contraseñas ────────────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ─── Internacionalización ─────────────────────────────────────────────────────
LANGUAGE_CODE = 'es-pe'
TIME_ZONE     = 'America/Lima'
USE_I18N      = True
USE_TZ        = True

# ─── Archivos estáticos y media ───────────────────────────────────────────────
STATIC_URL  = 'static/'
MEDIA_URL   = '/media/'
MEDIA_ROOT  = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'