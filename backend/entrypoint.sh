#!/bin/sh
set -e

echo "Waiting for postgres..."
until nc -z "${POSTGRES_HOST:-postgres}" 5432; do
  sleep 1
done
echo "Postgres is up."

export DJANGO_SETTINGS_MODULE="${DJANGO_SETTINGS_MODULE:-grimoire.settings_runtime}"

python manage.py makemigrations core accounts feed search layouts
python manage.py migrate
python manage.py createcachetable
python manage.py seed_ctf

exec gunicorn grimoire.wsgi -b 0.0.0.0:8000 -w 3 --timeout 60
