#!/usr/bin/env bash
set -euo pipefail

APP_ENV_FILE="${WHATSQUERY_ENV_FILE:-/var/www/whatsquery/.env}"
BACKUP_ROOT="${WHATSQUERY_BACKUP_ROOT:-/var/backups/whatsquery/postgres}"
LOG_DIR="${WHATSQUERY_LOG_DIR:-/var/log/whatsquery}"
RETENTION_DAYS="${WHATSQUERY_BACKUP_RETENTION_DAYS:-14}"

mkdir -p "${BACKUP_ROOT}" "${LOG_DIR}"

LOG_FILE="${LOG_DIR}/postgres-backup.log"
TIMESTAMP="$(date +"%Y-%m-%d_%H-%M-%S")"
BACKUP_FILE="${BACKUP_ROOT}/whatsquery_${TIMESTAMP}.sql.gz"
CHECKSUM_FILE="${BACKUP_FILE}.sha256"
RESTORE_DB="whatsquery_restore_check_${TIMESTAMP//[-_]/}"

log() {
  printf '[%s] %s\n' "$(date --iso-8601=seconds)" "$*" | tee -a "${LOG_FILE}"
}

extract_env() {
  local key="$1"
  local value
  value="$(grep -E "^${key}=" "${APP_ENV_FILE}" | tail -n 1 | cut -d= -f2- || true)"
  value="${value%\"}"
  value="${value#\"}"
  printf '%s' "${value}"
}

DATABASE_URL="$(extract_env "DATABASE_URL")"
if [[ -z "${DATABASE_URL}" ]]; then
  log "ERROR: DATABASE_URL is missing from ${APP_ENV_FILE}."
  exit 1
fi

cleanup_restore_db() {
  sudo -u postgres dropdb --if-exists "${RESTORE_DB}" >/dev/null 2>&1 || true
}

trap cleanup_restore_db EXIT

log "Starting PostgreSQL backup to ${BACKUP_FILE}."
pg_dump "${DATABASE_URL}" | gzip -9 > "${BACKUP_FILE}"
sha256sum "${BACKUP_FILE}" > "${CHECKSUM_FILE}"
gzip -t "${BACKUP_FILE}"

log "Backup archive created. Starting restore verification in temporary database ${RESTORE_DB}."
cleanup_restore_db
sudo -u postgres createdb "${RESTORE_DB}"
gunzip -c "${BACKUP_FILE}" | sudo -u postgres psql --single-transaction --set ON_ERROR_STOP=1 "${RESTORE_DB}" >/dev/null

RESTORED_TABLE_COUNT="$(sudo -u postgres psql -d "${RESTORE_DB}" -Atc "SELECT count(*) FROM pg_tables WHERE schemaname = 'public';")"
if [[ "${RESTORED_TABLE_COUNT}" -le 0 ]]; then
  log "ERROR: Restore verification loaded zero public tables."
  exit 1
fi

cleanup_restore_db

ln -sfn "${BACKUP_FILE}" "${BACKUP_ROOT}/latest.sql.gz"
ln -sfn "${CHECKSUM_FILE}" "${BACKUP_ROOT}/latest.sql.gz.sha256"

find "${BACKUP_ROOT}" -maxdepth 1 -type f -name 'whatsquery_*.sql.gz' -mtime +"${RETENTION_DAYS}" -delete
find "${BACKUP_ROOT}" -maxdepth 1 -type f -name 'whatsquery_*.sql.gz.sha256' -mtime +"${RETENTION_DAYS}" -delete

log "Backup verified successfully. Public tables restored: ${RESTORED_TABLE_COUNT}."
log "Latest backup symlink updated at ${BACKUP_ROOT}/latest.sql.gz."
log "Ready for off-server sync from ${BACKUP_ROOT}."
