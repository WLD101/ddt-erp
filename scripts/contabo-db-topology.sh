#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${WHATSQUERY_APP_DIR:-/var/www/whatsquery}"
ENV_FILE="${WHATSQUERY_ENV_FILE:-${APP_DIR}/.env}"

section() {
  printf '\n[%s]\n' "$1"
}

section "operating system and capacity"
uname -a
if [[ -f /etc/os-release ]]; then
  grep -E '^(PRETTY_NAME|NAME|VERSION_ID)=' /etc/os-release || true
fi
df -h
if command -v free >/dev/null 2>&1; then
  free -h
fi

section "execution"
if [[ -f "/.dockerenv" ]]; then
  echo "Prisma execution location: container"
else
  echo "Prisma execution location: VPS host"
fi
echo "Application directory: ${APP_DIR}"
echo "Environment file present: $([[ -f "${ENV_FILE}" ]] && echo yes || echo no)"
if [[ -f "${ENV_FILE}" ]]; then
  stat -c 'Environment file permissions: %a owner=%U group=%G' "${ENV_FILE}"
fi
if git -C "${APP_DIR}" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Git branch: $(git -C "${APP_DIR}" branch --show-current 2>/dev/null || echo unknown)"
  echo "Git commit: $(git -C "${APP_DIR}" rev-parse HEAD 2>/dev/null || echo unknown)"
  echo "Git dirty paths: $(git -C "${APP_DIR}" status --porcelain 2>/dev/null | wc -l | tr -d ' ')"
else
  echo "Git deployment state: application directory is not a Git worktree"
fi

section "database environment metadata"
ENV_FILE="${ENV_FILE}" node <<'NODE'
const fs = require("node:fs");

const envFile = process.env.ENV_FILE;
if (envFile && fs.existsSync(envFile)) {
  const content = fs.readFileSync(envFile, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    if (!/^[A-Z0-9_]+$/.test(key)) continue;
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

for (const key of ["DATABASE_URL", "DIRECT_URL"]) {
  const value = process.env[key];
  if (!value) {
    console.log(`${key}: missing`);
    continue;
  }

  try {
    const url = new URL(value);
    const host = url.hostname;
    const isLoopback = host === "127.0.0.1" || host === "localhost" || host === "::1";
    const isDockerService = !host.includes(".") && !host.includes(":") && !isLoopback;
    const hostKind = isLoopback
      ? "loopback"
      : isDockerService
        ? "docker-service"
        : "network-address";
    const safeHost = isLoopback || isDockerService ? host : "<redacted>";
    const staleCloud =
      /(^|\.)supabase\.(com|co)$/i.test(host) ||
      /pooler\.supabase\.com$/i.test(host);
    console.log(
      `${key}: host_kind=${hostKind} host=${safeHost} port=${url.port || "5432"} ` +
        `database=${url.pathname.slice(1) || "<missing>"} sslmode=${url.searchParams.get("sslmode") || "unset"} ` +
        `stale_supabase_cloud_host=${staleCloud ? "yes" : "no"}`,
    );
  } catch {
    console.log(`${key}: malformed`);
  }
}

const requiredKeys = [
  "AUTH_SECRET",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "ENCRYPTION_KEY",
  "INTEGRATION_CREDENTIAL_SECRET",
  "INTEGRATION_WEBHOOK_SIGNING_KEY",
  "VAPI_PRIVATE_API_KEY",
  "VAPI_WEBHOOK_SECRET",
  "VAPI_SERVER_CREDENTIAL_ID",
  "VAPI_EVENT_ENCRYPTION_KEY",
  "VOICE_JOBS_SECRET",
  "VOICE_WHATSAPP_APP_SECRET",
  "VOICE_WHATSAPP_WEBHOOK_VERIFY_TOKEN",
  "REDIS_URL",
];
for (const key of requiredKeys) {
  const value = process.env[key];
  const placeholder =
    typeof value === "string" &&
    /replace|placeholder|change-me|your[-_]|example/i.test(value);
  console.log(
    `${key}: ${value ? "configured" : "missing"}${placeholder ? " placeholder_detected" : ""}`,
  );
}
NODE

section "running containers"
if command -v docker >/dev/null 2>&1; then
  docker ps --format 'name={{.Names}} image={{.Image}} status={{.Status}} networks={{.Networks}} ports={{.Ports}}'
else
  echo "Docker: unavailable"
fi

section "docker database and pooler containers"
if command -v docker >/dev/null 2>&1; then
  docker ps --format '{{.ID}}|{{.Names}}|{{.Image}}' |
    while IFS='|' read -r id name image; do
      if [[ "${name} ${image}" =~ [Pp]ostgres|[Ss]upabase|[Ss]upavisor|[Pp]gbouncer ]]; then
        service="$(docker inspect --format '{{index .Config.Labels "com.docker.compose.service"}}' "${id}" 2>/dev/null || true)"
        project="$(docker inspect --format '{{index .Config.Labels "com.docker.compose.project"}}' "${id}" 2>/dev/null || true)"
        networks="$(docker inspect --format '{{range $name, $_ := .NetworkSettings.Networks}}{{$name}} {{end}}' "${id}" 2>/dev/null || true)"
        ports="$(docker port "${id}" 2>/dev/null | tr '\n' ' ' || true)"
        printf 'container=%s image=%s compose_project=%s compose_service=%s networks=%s published_ports=%s\n' \
          "${name}" "${image}" "${project:-unknown}" "${service:-unknown}" "${networks:-unknown}" "${ports:-none}"
      fi
    done
else
  echo "Docker: unavailable"
fi

section "docker networks and persistent mounts"
if command -v docker >/dev/null 2>&1; then
  docker network ls --format 'network={{.Name}} driver={{.Driver}} scope={{.Scope}}'
  docker ps -q |
    while read -r id; do
      name="$(docker inspect --format '{{.Name}}' "${id}" | sed 's#^/##')"
      user="$(docker inspect --format '{{if .Config.User}}{{.Config.User}}{{else}}root-or-image-default{{end}}' "${id}")"
      echo "container=${name} runtime_user=${user}"
      docker inspect --format '{{range .Mounts}}  mount_type={{.Type}} source={{.Source}} destination={{.Destination}} readonly={{not .RW}}{{"\n"}}{{end}}' "${id}"
    done
else
  echo "Docker: unavailable"
fi

section "compose files"
if command -v find >/dev/null 2>&1; then
  find /opt /srv /var/www /root \
    -maxdepth 5 \
    -type f \
    \( -name 'docker-compose.yml' -o -name 'docker-compose.yaml' -o -name 'compose.yml' -o -name 'compose.yaml' \) \
    2>/dev/null |
    sort |
    while read -r compose_file; do
      echo "compose_file=${compose_file}"
      if command -v docker >/dev/null 2>&1; then
        docker compose -f "${compose_file}" config --services 2>/dev/null |
          sed 's/^/  service=/' || true
      fi
    done
fi

section "application runtime"
if command -v systemctl >/dev/null 2>&1; then
  printf 'systemd_whatsquery=%s\n' "$(systemctl is-active whatsquery 2>/dev/null || true)"
  printf 'systemd_whatsquery_worker=%s\n' "$(systemctl is-active whatsquery-worker 2>/dev/null || true)"
  systemctl show whatsquery -p User -p Group -p FragmentPath 2>/dev/null || true
  systemctl show whatsquery-worker -p User -p Group -p FragmentPath 2>/dev/null || true
fi
if command -v docker >/dev/null 2>&1; then
  docker ps --format 'container={{.Names}} image={{.Image}} networks={{.Networks}} ports={{.Ports}}' |
    grep -Ei 'whatsquery|erp-app|next' || true
fi
if command -v pm2 >/dev/null 2>&1; then
  echo "PM2 present: yes"
  pm2 status || true
else
  echo "PM2 present: no"
fi

section "pooler"
if command -v docker >/dev/null 2>&1 &&
  docker ps --format '{{.Names}} {{.Image}}' | grep -Eqi 'supavisor|pgbouncer|pooler'; then
  echo "Pooler present: yes"
else
  echo "Pooler present: not detected"
fi

section "redis"
if command -v docker >/dev/null 2>&1; then
  docker ps --format 'container={{.Names}} image={{.Image}} networks={{.Networks}} ports={{.Ports}}' |
    grep -Ei 'redis|keydb|valkey' || echo "Redis container: not detected"
fi
if command -v systemctl >/dev/null 2>&1; then
  printf 'systemd_redis=%s\n' "$(systemctl is-active redis 2>/dev/null || true)"
fi

section "listening ports"
if command -v ss >/dev/null 2>&1; then
  ss -tulpn
else
  echo "ss: unavailable"
fi

section "firewall postgres exposure"
if command -v ufw >/dev/null 2>&1; then
  ufw status verbose 2>/dev/null || true
elif command -v nft >/dev/null 2>&1; then
  nft list ruleset 2>/dev/null | grep -E 'hook input|policy|22|80|443|5432|6543' || true
else
  echo "Firewall tooling not detected"
fi

section "ssh policy"
if command -v sshd >/dev/null 2>&1; then
  sshd -T 2>/dev/null |
    grep -E '^(permitrootlogin|passwordauthentication|pubkeyauthentication) ' || true
else
  echo "sshd: unavailable"
fi

section "reverse proxy"
if command -v nginx >/dev/null 2>&1; then
  nginx -t || true
  nginx -T 2>/dev/null |
    grep -E '^[[:space:]]*(server_name|proxy_pass|ssl_certificate|ssl_certificate_key)[[:space:]]' |
    sed -E 's#(ssl_certificate_key)[[:space:]]+[^;]+#\1 <configured>#' || true
else
  echo "Nginx: unavailable"
fi

section "tls certificates"
if command -v openssl >/dev/null 2>&1; then
  find /etc/letsencrypt/live -maxdepth 2 -name fullchain.pem 2>/dev/null |
    while read -r certificate; do
      echo "certificate=${certificate}"
      openssl x509 -in "${certificate}" -noout -subject -issuer -dates || true
    done
fi
if command -v systemctl >/dev/null 2>&1; then
  printf 'certbot_timer=%s\n' "$(systemctl is-enabled certbot.timer 2>/dev/null || true)"
fi

section "docker socket exposure"
if command -v docker >/dev/null 2>&1; then
  if docker inspect $(docker ps -q) 2>/dev/null |
    grep -q '"/var/run/docker.sock"'; then
    echo "Docker socket mounted into a running container: yes"
  else
    echo "Docker socket mounted into a running container: no"
  fi
fi

section "backup and operations"
for backup_dir in /var/backups/whatsquery /var/backups/whatsquery/postgres; do
  if [[ -d "${backup_dir}" ]]; then
    echo "backup_directory=${backup_dir}"
    find "${backup_dir}" -maxdepth 1 -type f -printf '  file=%f size_bytes=%s modified=%TY-%Tm-%TdT%TH:%TM:%TS%TZ\n' |
      sort |
      tail -n 20
  fi
done
if command -v systemctl >/dev/null 2>&1; then
  systemctl list-timers --all --no-pager 2>/dev/null |
    grep -Ei 'whatsquery|backup|certbot' || true
fi
if [[ -d /etc/logrotate.d ]]; then
  find /etc/logrotate.d -maxdepth 1 -type f -iname '*whatsquery*' -print
fi

section "safety conclusion"
echo "No credentials or full connection strings were printed."
echo "Use a Docker service host only when Prisma runs on the same Docker network."
echo "Use 127.0.0.1 and the real published port when Prisma runs on the VPS host."
echo "This collector is read-only and does not classify the release as pilot-ready."
