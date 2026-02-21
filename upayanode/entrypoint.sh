#!/bin/sh
# UpayaNode – container entrypoint: migrate, collectstatic, then run CMD
set -e
python manage.py migrate --noinput
python manage.py collectstatic --noinput --clear 2>/dev/null || true
exec "$@"
