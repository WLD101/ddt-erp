#!/usr/bin/env bash
set -euo pipefail
umask 077

APP_DIR="${WHATSQUERY_APP_DIR:-/var/www/whatsquery}"
ENV_FILE="${WHATSQUERY_ENV_FILE:-${APP_DIR}/.env}"
MODE="${1:-inspect}"
BACKUP_REFERENCE="${WHATSQUERY_BACKUP_REFERENCE:-}"

usage() {
  cat <<'EOF'
Usage:
  bash scripts/contabo-prisma-migrate.sh inspect
  WHATSQUERY_EXPECTED_DATABASE_NAME="<confirmed database>" \
  WHATSQUERY_EXPECTED_TENANT_COUNT="<confirmed aggregate count>" \
  WHATSQUERY_BACKUP_REFERENCE="<verified backup archive path>" \
    bash scripts/contabo-prisma-migrate.sh deploy

The deploy mode will not run without a backup reference. The reference is
recorded in the migration output but is never interpreted as a credential.
EOF
}

if [[ "${MODE}" != "inspect" && "${MODE}" != "deploy" ]]; then
  usage
  exit 2
fi

if [[ ! -d "${APP_DIR}" ]]; then
  echo "Application directory not found: ${APP_DIR}"
  exit 1
fi

cd "${APP_DIR}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Environment file not found: ${ENV_FILE}"
  exit 1
fi

set -a
# The production environment file is trusted, root-owned deployment input.
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a

if [[ -z "${DATABASE_URL:-}" || -z "${DIRECT_URL:-}" ]]; then
  echo "DATABASE_URL and DIRECT_URL must both be configured."
  exit 1
fi
if [[ "${MODE}" == "deploy" ]] &&
  [[ -z "${WHATSQUERY_EXPECTED_DATABASE_NAME:-}" ||
    -z "${WHATSQUERY_EXPECTED_TENANT_COUNT:-}" ]]; then
  echo "Deployment blocked: confirm WHATSQUERY_EXPECTED_DATABASE_NAME and WHATSQUERY_EXPECTED_TENANT_COUNT from inspect mode."
  exit 1
fi

echo "Supabase deployment type: Self-hosted on Contabo VPS"
if [[ -f "/.dockerenv" ]]; then
  echo "Prisma execution location: application or migration container"
else
  echo "Prisma execution location: Contabo VPS host"
fi

node <<'NODE'
const direct = new URL(process.env.DIRECT_URL);
const host = direct.hostname;
const insideContainer = require("node:fs").existsSync("/.dockerenv");
const loopback = host === "127.0.0.1" || host === "localhost" || host === "::1";
const dockerService = !host.includes(".") && !host.includes(":") && !loopback;
const staleSupabaseCloud =
  /(^|\.)supabase\.(com|co)$/i.test(host) ||
  /pooler\.supabase\.com$/i.test(host);

if (insideContainer && loopback) {
  console.error("DIRECT_URL uses loopback inside a container; use the actual PostgreSQL Compose service name.");
  process.exit(1);
}
if (!insideContainer && dockerService) {
  console.error("DIRECT_URL uses a Docker service name from the VPS host; use 127.0.0.1 and the real published PostgreSQL port.");
  process.exit(1);
}
if (staleSupabaseCloud) {
  console.error("DIRECT_URL points to Supabase Cloud; this deployment must use self-hosted Contabo PostgreSQL.");
  process.exit(1);
}

console.log(`PostgreSQL connection method: ${dockerService ? "Docker network service" : loopback ? "VPS loopback" : "private network endpoint"}`);
console.log(`Docker database service: ${dockerService ? host : "determined by topology inspection"}`);
console.log(`Internal database port: ${dockerService ? direct.port || "5432" : "determined by topology inspection"}`);
console.log(`Migration database: ${direct.pathname.slice(1) || "<missing>"}`);
console.log(`SSL mode: ${direct.searchParams.get("sslmode") || "not explicitly configured"}`);
NODE

node <<'NODE'
const net = require("node:net");
const direct = new URL(process.env.DIRECT_URL);
const socket = net.createConnection({
  host: direct.hostname,
  port: Number(direct.port || 5432),
});
socket.setTimeout(5000);
socket.on("connect", () => {
  console.log("DIRECT_URL TCP reachability: passed");
  socket.destroy();
});
socket.on("timeout", () => {
  console.error("DIRECT_URL TCP reachability: timed out");
  socket.destroy();
  process.exitCode = 1;
});
socket.on("error", () => {
  console.error("DIRECT_URL TCP reachability: failed");
  process.exitCode = 1;
});
NODE

printf 'SELECT 1;\n' |
  DATABASE_URL="${DIRECT_URL}" DIRECT_URL="${DIRECT_URL}" \
    npx prisma db execute --stdin --schema prisma/schema.prisma >/dev/null
echo "DIRECT_URL Prisma connectivity: passed"

mapfile -t MIGRATIONS < <(
  find prisma/migrations \
    -mindepth 2 \
    -maxdepth 2 \
    -type f \
    -name migration.sql \
    -print |
    sort
)

if [[ "${#MIGRATIONS[@]}" -eq 0 ]]; then
  echo "Migration audit failed: no Prisma migration SQL files were found."
  exit 1
fi
echo "Migration files audited: ${#MIGRATIONS[@]}"

if grep -Eiq 'DROP[[:space:]]+(TABLE|COLUMN)|TRUNCATE[[:space:]]+TABLE|DELETE[[:space:]]+FROM' "${MIGRATIONS[@]}"; then
  echo "Migration audit failed: a destructive SQL pattern was detected."
  exit 1
fi
echo "Migration destructive-pattern audit: passed"

npm run migration:audit
npx prisma validate
npx prisma generate
node scripts/verify-pre-migration-database.mjs

echo "Migration status before deployment:"
npx prisma migrate status || true

if [[ "${MODE}" == "inspect" ]]; then
  echo "Inspect mode completed; no migration was applied."
  exit 0
fi

if [[ -z "${BACKUP_REFERENCE}" ]]; then
  echo "Deployment blocked: set WHATSQUERY_BACKUP_REFERENCE to the verified archive created by contabo-postgres-backup.sh."
  exit 1
fi

if [[ ! -s "${BACKUP_REFERENCE}" || ! -f "${BACKUP_REFERENCE}.sha256" ]]; then
  echo "Deployment blocked: the backup archive or checksum file is missing."
  exit 1
fi

(
  cd "$(dirname "${BACKUP_REFERENCE}")"
  sha256sum --check "$(basename "${BACKUP_REFERENCE}").sha256"
)

echo "Verified backup reference: ${BACKUP_REFERENCE}"
npx prisma migrate deploy
npx prisma migrate status
npx prisma generate
node scripts/verify-live-database.mjs

echo "Contabo Prisma migration deployment and live aggregate verification completed."
