import os
from pathlib import Path
from core.flags import runtime_value

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ['SECRET_KEY']
GRIMOIRE_SALT = os.environ['GRIMOIRE_SALT']
BUILD_TAG = runtime_value('c4a92')

DEBUG = os.environ.get('DJANGO_DEBUG', 'True') == 'True'
ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.contenttypes',
    'django.contrib.staticfiles',
    'corsheaders',
    'rest_framework',
    'core.apps.CoreConfig',
    'accounts.apps.AccountsConfig',
    'feed.apps.FeedConfig',
    'search.apps.SearchConfig',
    'layouts.apps.LayoutsConfig',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.middleware.common.CommonMiddleware',
    'core.middleware.IdentityMiddleware',
    'core.middleware.RequestLogMiddleware',
]

ROOT_URLCONF = 'grimoire.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
            ],
        },
    },
]

WSGI_APPLICATION = 'grimoire.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('POSTGRES_DB', 'grimoire'),
        'USER': os.environ.get('POSTGRES_USER', 'grimoire'),
        'PASSWORD': os.environ.get('POSTGRES_PASSWORD', 'grimoire-db-pass'),
        'HOST': os.environ.get('POSTGRES_HOST', 'postgres'),
        'PORT': '5432',
    }
}

# Shared state (deface banner + BREACHED marker) lives in a postgres-backed cache
# table so it stays consistent across gunicorn workers. No separate redis container.
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.db.DatabaseCache',
        'LOCATION': 'grimoire_cache',
    }
}

STATIC_URL = '/static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [],
    'DEFAULT_PERMISSION_CLASSES': [],
    # We use our own Identity system, not django.contrib.auth, so don't let DRF
    # fall back to AnonymousUser (which would require the auth app to be installed).
    'UNAUTHENTICATED_USER': None,
}

CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]
