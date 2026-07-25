#!/usr/bin/env bash
set -euo pipefail
umask 027

DB_CONTAINER="${WHATSQUERY_DB_CONTAINER:-}"
APP_DIR="${WHATSQUERY_APP_DIR:-/var/www/whatsquery}"
ENV_FILE="${WHATSQUERY_ENV_FILE:-${APP_DIR}/.env}"
BACKUP_ROOT="${WHATSQUERY_BACKUP_ROOT:-/var/backups/whatsquery/postgres}"
BACKUP_GROUP="${WHATSQUERY_BACKUP_GROUP:-whatsquery}"
TIMESTAMP="$(date -u +'%Y-%m-%dT%H-%M-%SZ')"
RESTORE_DB="whatsquery_restore_${TIMESTAMP//[-:TZ]/}"
BACKUP_FILE="${BACKUP_ROOT}/whatsquery_${TIMESTAMP}.dump"
CHECKSUM_FILE="${BACKUP_FILE}.sha256"
CONTAINER_ARCHIVE="/tmp/$(basename "${BACKUP_FILE}")"
RESTORE_CREATED=false

if [[ -z "${DB_CONTAINER}" ]]; then
  echo "Set WHATSQUERY_DB_CONTAINER to the PostgreSQL container name reported by contabo-db-topology.sh."
  exit 1
fi

if ! docker inspect "${DB_CONTAINER}" >/dev/null 2>&1; then
  echo "PostgreSQL container not found: ${DB_CONTAINER}"
  exit 1
fi
if [[ ! -d "${APP_DIR}" || ! -f "${APP_DIR}/prisma/schema.prisma" ]]; then
  echo "Application directory or Prisma schema not found: ${APP_DIR}"
  exit 1
fi
if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Production environment file not found: ${ENV_FILE}"
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a
if [[ -z "${DIRECT_URL:-}" ]]; then
  echo "DIRECT_URL is required for isolated Prisma restore verification."
  exit 1
fi

mkdir -p "${BACKUP_ROOT}"

DB_USER="$(
  docker exec "${DB_CONTAINER}" sh -c 'printf "%s" "${POSTGRES_USER:-postgres}"'
)"
DB_NAME="$(
  docker exec "${DB_CONTAINER}" sh -c 'printf "%s" "${POSTGRES_DB:-postgres}"'
)"

cleanup() {
  docker exec "${DB_CONTAINER}" dropdb --if-exists -U "${DB_USER}" "${RESTORE_DB}" >/dev/null 2>&1 || true
  docker exec "${DB_CONTAINER}" rm -f "${CONTAINER_ARCHIVE}" >/dev/null 2>&1 || true
  if [[ "${RESTORE_CREATED}" == "true" ]]; then
    echo "Restore cleanup completed: ${RESTORE_DB}"
  fi
}
trap cleanup EXIT

echo "Creating a custom-format PostgreSQL backup from the self-hosted database container."
docker exec "${DB_CONTAINER}" \
  pg_dump \
  --format=custom \
  --no-owner \
  --no-acl \
  -U "${DB_USER}" \
  -d "${DB_NAME}" >"${BACKUP_FILE}"

if [[ ! -s "${BACKUP_FILE}" ]]; then
  echo "Backup failed: archive is empty."
  exit 1
fi

sha256sum "${BACKUP_FILE}" >"${CHECKSUM_FILE}"
(
  cd "${BACKUP_ROOT}"
  sha256sum --check "$(basename "${CHECKSUM_FILE}")"
)
docker cp "${BACKUP_FILE}" "${DB_CONTAINER}:${CONTAINER_ARCHIVE}" >/dev/null
docker exec "${DB_CONTAINER}" pg_restore --list "${CONTAINER_ARCHIVE}" >/dev/null

echo "Verifying the archive with a temporary restore database."
docker exec "${DB_CONTAINER}" createdb -U "${DB_USER}" "${RESTORE_DB}"
RESTORE_CREATED=true
docker exec "${DB_CONTAINER}" \
  pg_restore \
  --exit-on-error \
  --no-owner \
  --no-acl \
  -U "${DB_USER}" \
  -d "${RESTORE_DB}" \
  "${CONTAINER_ARCHIVE}" >/dev/null

TABLE_COUNT="$(
  docker exec "${DB_CONTAINER}" \
    psql -U "${DB_USER}" -d "${RESTORE_DB}" -Atc \
    "SELECT count(*) FROM pg_tables WHERE schemaname = 'public';"
)"

if [[ ! "${TABLE_COUNT}" =~ ^[0-9]+$ ]] || (( TABLE_COUNT < 1 )); then
  echo "Backup verification failed: the restored database has no public tables."
  exit 1
fi

for table_name in Organization VoiceCallLog VoiceWebhookEvent; do
  EXISTS="$(
    docker exec "${DB_CONTAINER}" \
      psql -U "${DB_USER}" -d "${RESTORE_DB}" -Atc \
      "SELECT to_regclass('public.\"${table_name}\"') IS NOT NULL;"
  )"
  if [[ "${EXISTS}" == "t" ]]; then
    ROW_COUNT="$(
      docker exec "${DB_CONTAINER}" \
        psql -U "${DB_USER}" -d "${RESTORE_DB}" -Atc \
        "SELECT count(*) FROM \"${table_name}\";"
    )"
    echo "Restored table count ${table_name}: ${ROW_COUNT}"
  else
    echo "Restored table missing ${table_name}: yes"
  fi
done

MIGRATION_TABLE_EXISTS="$(
  docker exec "${DB_CONTAINER}" \
    psql -U "${DB_USER}" -d "${RESTORE_DB}" -Atc \
    "SELECT to_regclass('public._prisma_migrations') IS NOT NULL;"
)"
if [[ "${MIGRATION_TABLE_EXISTS}" == "t" ]]; then
  MIGRATION_COUNT="$(
    docker exec "${DB_CONTAINER}" \
      psql -U "${DB_USER}" -d "${RESTORE_DB}" -Atc \
      'SELECT count(*) FROM "_prisma_migrations";'
  )"
else
  MIGRATION_COUNT=0
fi
echo "Restored Prisma migration records: ${MIGRATION_COUNT}"

RESTORE_URL="$(
  DIRECT_URL="${DIRECT_URL}" RESTORE_DB="${RESTORE_DB}" node <<'NODE'
const url = new URL(process.env.DIRECT_URL);
url.pathname = `/${process.env.RESTORE_DB}`;
process.stdout.write(url.toString());
NODE
)"
(
  cd "${APP_DIR}"
  printf 'SELECT 1;\n' |
    DATABASE_URL="${RESTORE_URL}" DIRECT_URL="${RESTORE_URL}" \
      npx prisma db execute --stdin --schema prisma/schema.prisma >/dev/null
)
echo "Prisma restore-database connectivity: passed"

if getent group "${BACKUP_GROUP}" >/dev/null 2>&1; then
  chgrp "${BACKUP_GROUP}" "${BACKUP_FILE}" "${CHECKSUM_FILE}"
  chmod 0640 "${BACKUP_FILE}" "${CHECKSUM_FILE}"
fi

ln -sfn "${BACKUP_FILE}" "${BACKUP_ROOT}/latest.dump"
ln -sfn "${CHECKSUM_FILE}" "${BACKUP_ROOT}/latest.dump.sha256"

echo "Backup verified: ${BACKUP_FILE}"
echo "Backup bytes: $(stat -c '%s' "${BACKUP_FILE}")"
echo "Checksum file: ${CHECKSUM_FILE}"
echo "Restored public tables: ${TABLE_COUNT}"
