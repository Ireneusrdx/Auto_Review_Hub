#!/bin/sh
# Auto Review Hub — container entrypoint.
# Prepares the Django app, then hands over to the CMD (gunicorn).
set -e

python manage.py makemigrations --noinput
python manage.py migrate --noinput
python manage.py collectstatic --noinput

# Module 1: create the Django Admin superuser non-interactively when the
# credentials are provided as environment variables. Safe to re-run:
# createsuperuser --noinput fails harmlessly if the user already exists.
if [ -n "$DJANGO_SUPERUSER_USERNAME" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ]; then
  python manage.py createsuperuser --noinput \
    --username "$DJANGO_SUPERUSER_USERNAME" \
    --email "${DJANGO_SUPERUSER_EMAIL:-admin@example.com}" || true
fi

exec "$@"
