# WhatsQuery Contabo Live Topology

Evidence date: 2026-07-24

Status: **Live inspection blocked by SSH authentication**

The database deployment is self-hosted Supabase/PostgreSQL on the Contabo VPS.
It is not Supabase Cloud. An SSH connection to `62.169.20.120` was attempted
using non-interactive authentication and was rejected. No service name, port,
network, container, or firewall value below has been guessed.

## Required outcome

```text
Supabase deployment type: Self-hosted on Contabo VPS
Prisma execution location: Not verified
PostgreSQL connection method: Not verified
Docker database service: Not verified
Internal database port: Not verified
Published host port: Not verified
Pooler present: Not verified
Migration command environment: Prepared for Contabo VPS host or app container
Pending migrations: Not verified
Applied migrations: Not verified
Live schema verified: No
Existing tenants verified: No
```

## Read-only collection

Run after the current repository revision is present on the VPS:

```bash
ssh root@62.169.20.120
cd /var/www/whatsquery
sudo bash scripts/contabo-db-topology.sh \
  | tee "/root/whatsquery-topology-$(date -u +%Y%m%dT%H%M%SZ).log"
```

The script reports redacted URL metadata, Compose services, containers,
networks, mounts, listening ports, firewall status, Nginx/TLS, systemd/PM2,
Redis, database/pooler candidates, backup schedules, Git state and environment
key presence. It does not print passwords or full connection strings.

## Connection decision

- Prisma in the app container: use the actual PostgreSQL Compose service name
  and internal port on the shared Docker network.
- Prisma on the VPS host: use `127.0.0.1` and the actual loopback-published port.
- Prisma on Windows: do not expose PostgreSQL publicly. Prefer VPS execution or
  an SSH tunnel bound only to localhost.
- Pooler URLs may serve runtime traffic, but migration DDL must use the direct
  PostgreSQL endpoint in `DIRECT_URL`.

## Stop conditions

- A production URL still points to `*.supabase.com` or
  `*.pooler.supabase.com`.
- PostgreSQL, Studio, admin APIs, or a pooler is unnecessarily public.
- The app and database do not share the expected protected network.
- Prisma's execution location does not match the host encoded in `DIRECT_URL`.
- The checkout is dirty or does not match the approved release revision.

