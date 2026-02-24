#!/usr/bin/env sh
set -e

cd /var/www/html

if [ -z "${APP_KEY:-}" ]; then
  echo "APP_KEY is not set. Configure APP_KEY in .env.production before starting."
  exit 1
fi

mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
php artisan storage:link || true

if [ "${RUN_OPTIMIZE:-true}" = "true" ]; then
  php artisan optimize
fi

exec "$@"
