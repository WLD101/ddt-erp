#!/usr/bin/env bash
set -euo pipefail

APP_ENV_FILE="${WHATSQUERY_ENV_FILE:-/var/www/whatsquery/.env}"
TIMESTAMP="$(date +"%Y-%m-%d_%H-%M-%S")"
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

get_config() {
  local key="$1"
  local env_value="${!key:-}"
  if [[ -n "${env_value}" ]]; then
    printf '%s' "${env_value}"
    return
  fi
  extract_env "${key}"
}

BACKUP_ROOT="$(get_config "WHATSQUERY_BACKUP_ROOT")"
BACKUP_ROOT="${BACKUP_ROOT:-/var/backups/whatsquery/postgres}"
LOG_DIR="$(get_config "WHATSQUERY_LOG_DIR")"
LOG_DIR="${LOG_DIR:-/var/log/whatsquery}"
RETENTION_DAYS="$(get_config "WHATSQUERY_BACKUP_RETENTION_DAYS")"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
OFFSITE_SYNC_COMMAND="$(get_config "WHATSQUERY_BACKUP_SYNC_COMMAND")"

mkdir -p "${BACKUP_ROOT}" "${LOG_DIR}"

LOG_FILE="${LOG_DIR}/postgres-backup.log"
BACKUP_FILE="${BACKUP_ROOT}/whatsquery_${TIMESTAMP}.sql.gz"
CHECKSUM_FILE="${BACKUP_FILE}.sha256"

send_failure_alert() {
  local message="$1"
  local alert_email resend_api_key email_from alert_webhook

  alert_email="$(get_config "WHATSQUERY_BACKUP_ALERT_EMAIL")"
  resend_api_key="$(get_config "RESEND_API_KEY")"
  email_from="$(get_config "EMAIL_FROM")"
  alert_webhook="$(get_config "WHATSQUERY_BACKUP_ALERT_WEBHOOK_URL")"

  if [[ -n "${alert_email}" && -n "${resend_api_key}" && -n "${email_from}" ]]; then
    curl -sS --fail https://api.resend.com/emails \
      -H "Authorization: Bearer ${resend_api_key}" \
      -H "Content-Type: application/json" \
      -d "$(python3 - "${alert_email}" "${email_from}" "${message}" <<'PY'
import json
import sys

to_email, from_email, body = sys.argv[1], sys.argv[2], sys.argv[3]
payload = {
    "from": f"WhatsQuery Backup Monitor <{from_email}>",
    "to": [to_email],
    "subject": "WhatsQuery PostgreSQL backup failure",
    "html": (
        "<p>The automated WhatsQuery PostgreSQL backup failed.</p>"
        f"<pre>{body}</pre>"
    ),
}
print(json.dumps(payload))
PY
)" >/dev/null || true
  fi

  if [[ -n "${alert_webhook}" ]]; then
    curl -sS --fail "${alert_webhook}" \
      -H "Content-Type: application/json" \
      -d "$(python3 - "${message}" <<'PY'
import json
import sys

print(json.dumps({"text": f"WhatsQuery PostgreSQL backup failure:\n{sys.argv[1]}"}))
PY
)" >/dev/null || true
  fi
}

handle_failure() {
  local exit_code="$1"
  local line_number="$2"
  local command="$3"
  local error_message="Backup failed at line ${line_number} while running: ${command}"
  log "ERROR: ${error_message}"
  send_failure_alert "${error_message}"
  exit "${exit_code}"
}

trap 'handle_failure "$?" "${LINENO}" "${BASH_COMMAND}"' ERR

normalize_backup_database_url() {
  python3 - "$1" <<'PY'
from sys import argv
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

parsed = urlsplit(argv[1])
query = [(key, value) for key, value in parse_qsl(parsed.query, keep_blank_values=True) if key != "schema"]
print(urlunsplit((parsed.scheme, parsed.netloc, parsed.path, urlencode(query), parsed.fragment)))
PY
}

DATABASE_URL="$(extract_env "DATABASE_URL")"
if [[ -z "${DATABASE_URL}" ]]; then
  log "ERROR: DATABASE_URL is missing from ${APP_ENV_FILE}."
  exit 1
fi

BACKUP_DATABASE_URL="$(normalize_backup_database_url "${DATABASE_URL}")"

cleanup_restore_db() {
  sudo -u postgres dropdb --if-exists "${RESTORE_DB}" >/dev/null 2>&1 || true
}

trap cleanup_restore_db EXIT

ensure_r2_dependency() {
  if ! command -v aws >/dev/null 2>&1; then
    log "ERROR: aws CLI is required for Cloudflare R2 sync."
    exit 1
  fi
}

sync_to_r2() {
  local r2_bucket r2_prefix r2_endpoint r2_region r2_key r2_secret r2_retention_days
  local backup_key checksum_key local_bytes remote_bytes

  r2_bucket="$(get_config "WHATSQUERY_BACKUP_R2_BUCKET")"
  if [[ -z "${r2_bucket}" ]]; then
    log "ERROR: WHATSQUERY_BACKUP_R2_BUCKET is required for Cloudflare R2 sync."
    exit 1
  fi

  r2_prefix="$(get_config "WHATSQUERY_BACKUP_R2_PREFIX")"
  r2_prefix="${r2_prefix%/}"

  r2_endpoint="$(get_config "WHATSQUERY_BACKUP_R2_ENDPOINT")"
  if [[ -z "${r2_endpoint}" ]]; then
    local r2_account_id
    r2_account_id="$(get_config "WHATSQUERY_BACKUP_R2_ACCOUNT_ID")"
    if [[ -z "${r2_account_id}" ]]; then
      log "ERROR: WHATSQUERY_BACKUP_R2_ENDPOINT or WHATSQUERY_BACKUP_R2_ACCOUNT_ID is required."
      exit 1
    fi
    r2_endpoint="https://${r2_account_id}.r2.cloudflarestorage.com"
  fi

  r2_region="$(get_config "WHATSQUERY_BACKUP_R2_REGION")"
  r2_region="${r2_region:-auto}"
  r2_key="$(get_config "WHATSQUERY_BACKUP_R2_ACCESS_KEY_ID")"
  r2_secret="$(get_config "WHATSQUERY_BACKUP_R2_SECRET_ACCESS_KEY")"
  if [[ -z "${r2_key}" || -z "${r2_secret}" ]]; then
    log "ERROR: WHATSQUERY_BACKUP_R2_ACCESS_KEY_ID and WHATSQUERY_BACKUP_R2_SECRET_ACCESS_KEY are required."
    exit 1
  fi

  r2_retention_days="$(get_config "WHATSQUERY_BACKUP_R2_RETENTION_DAYS")"
  r2_retention_days="${r2_retention_days:-${RETENTION_DAYS}}"

  if [[ -n "${r2_prefix}" ]]; then
    backup_key="${r2_prefix}/$(basename "${BACKUP_FILE}")"
    checksum_key="${r2_prefix}/$(basename "${CHECKSUM_FILE}")"
  else
    backup_key="$(basename "${BACKUP_FILE}")"
    checksum_key="$(basename "${CHECKSUM_FILE}")"
  fi

  ensure_r2_dependency
  log "Starting Cloudflare R2 sync to s3://${r2_bucket}/${backup_key}."

  AWS_ACCESS_KEY_ID="${r2_key}" \
  AWS_SECRET_ACCESS_KEY="${r2_secret}" \
  AWS_DEFAULT_REGION="${r2_region}" \
    aws --endpoint-url "${r2_endpoint}" s3 cp "${BACKUP_FILE}" "s3://${r2_bucket}/${backup_key}" --only-show-errors

  AWS_ACCESS_KEY_ID="${r2_key}" \
  AWS_SECRET_ACCESS_KEY="${r2_secret}" \
  AWS_DEFAULT_REGION="${r2_region}" \
    aws --endpoint-url "${r2_endpoint}" s3 cp "${CHECKSUM_FILE}" "s3://${r2_bucket}/${checksum_key}" --only-show-errors

  remote_bytes="$(
    AWS_ACCESS_KEY_ID="${r2_key}" \
    AWS_SECRET_ACCESS_KEY="${r2_secret}" \
    AWS_DEFAULT_REGION="${r2_region}" \
      aws --endpoint-url "${r2_endpoint}" s3api head-object \
      --bucket "${r2_bucket}" \
      --key "${backup_key}" \
      --query 'ContentLength' \
      --output text
  )"
  local_bytes="$(stat -c '%s' "${BACKUP_FILE}")"
  if [[ "${remote_bytes}" != "${local_bytes}" ]]; then
    log "ERROR: Remote R2 object size (${remote_bytes}) does not match local backup (${local_bytes})."
    exit 1
  fi

  AWS_ACCESS_KEY_ID="${r2_key}" \
  AWS_SECRET_ACCESS_KEY="${r2_secret}" \
  AWS_DEFAULT_REGION="${r2_region}" \
    python3 - "${r2_endpoint}" "${r2_bucket}" "${r2_prefix}" "${r2_retention_days}" <<'PY'
import json
import os
import subprocess
import sys
from datetime import datetime, timedelta, timezone

endpoint, bucket, prefix, retention_days = sys.argv[1:]
prefix = prefix.strip("/")
cutoff = datetime.now(timezone.utc) - timedelta(days=int(retention_days))
base_cmd = ["aws", "--endpoint-url", endpoint, "s3api"]
env = os.environ.copy()

list_cmd = base_cmd + ["list-objects-v2", "--bucket", bucket, "--output", "json"]
if prefix:
    list_cmd += ["--prefix", prefix + "/whatsquery_"]
else:
    list_cmd += ["--prefix", "whatsquery_"]

result = subprocess.run(list_cmd, env=env, check=True, capture_output=True, text=True)
payload = json.loads(result.stdout or "{}")
for item in payload.get("Contents", []):
    modified = datetime.fromisoformat(item["LastModified"].replace("Z", "+00:00"))
    if modified < cutoff:
        subprocess.run(
            base_cmd + ["delete-object", "--bucket", bucket, "--key", item["Key"]],
            env=env,
            check=True,
            capture_output=True,
            text=True,
        )
PY

  log "Cloudflare R2 sync verified successfully."
}

log "Starting PostgreSQL backup to ${BACKUP_FILE}."
pg_dump "${BACKUP_DATABASE_URL}" | gzip -9 > "${BACKUP_FILE}"
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
if [[ "$(get_config "WHATSQUERY_BACKUP_R2_ENABLED")" == "true" ]]; then
  sync_to_r2
elif [[ -n "${OFFSITE_SYNC_COMMAND}" ]]; then
  log "Starting off-server sync."
  if bash -lc "${OFFSITE_SYNC_COMMAND}" >>"${LOG_FILE}" 2>&1; then
    log "Off-server sync completed successfully."
  else
    log "ERROR: Off-server sync failed."
    exit 1
  fi
else
  log "Ready for off-server sync from ${BACKUP_ROOT}."
fi
