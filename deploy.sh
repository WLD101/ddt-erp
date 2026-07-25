#!/usr/bin/env bash
set -euo pipefail

APP_DIR=/var/www/whatsquery
APP_USER=whatsquery

if [[ -z "${WHATSQUERY_BACKUP_REFERENCE:-}" ]]; then
  echo "Refusing deployment: set WHATSQUERY_BACKUP_REFERENCE to a verified backup archive."
  exit 1
fi
if [[ -z "${WHATSQUERY_EXPECTED_DATABASE_NAME:-}" ||
  -z "${WHATSQUERY_EXPECTED_TENANT_COUNT:-}" ]]; then
  echo "Refusing deployment: confirm the expected database name and tenant count from migration inspect mode."
  exit 1
fi

cd "${APP_DIR}"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Refusing deployment: ${APP_DIR} has uncommitted changes."
  exit 1
fi

sudo chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}/.git"
sudo chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}/.next-build" 2>/dev/null || true

sudo -u "${APP_USER}" env \
  WHATSQUERY_BACKUP_REFERENCE="${WHATSQUERY_BACKUP_REFERENCE}" \
  WHATSQUERY_EXPECTED_DATABASE_NAME="${WHATSQUERY_EXPECTED_DATABASE_NAME}" \
  WHATSQUERY_EXPECTED_TENANT_COUNT="${WHATSQUERY_EXPECTED_TENANT_COUNT}" \
  bash -lc '
set -euo pipefail
cd /var/www/whatsquery
git fetch origin main
git merge --ff-only origin/main
npm ci
npm run migration:encoding-check
set -a
source .env
set +a
npm run pilot:verify-env
npx prisma validate
npx prisma generate
bash scripts/contabo-prisma-migrate.sh deploy
npm run build
'

sudo systemctl restart whatsquery
sudo systemctl status whatsquery --no-pager
if sudo systemctl list-unit-files whatsquery-worker.service --no-legend 2>/dev/null | grep -q whatsquery-worker; then
  sudo systemctl restart whatsquery-worker
  sudo systemctl status whatsquery-worker --no-pager
fi
sudo nginx -t
