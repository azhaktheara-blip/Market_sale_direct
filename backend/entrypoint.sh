#!/bin/sh
set -e

echo "Waiting for postgres..."
while ! nc -z $DB_HOST $DB_PORT; do
  sleep 0.1
done
echo "PostgreSQL started"

python manage.py migrate --noinput
python manage.py collectstatic --noinput

exec "$@"

