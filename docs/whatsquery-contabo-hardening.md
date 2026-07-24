# WhatsQuery Contabo Hardening

Last reviewed: 2026-07-23

Do not change SSH/firewall remotely until key login and the Contabo console
fallback are tested. This document is an operator checklist, not evidence that the
VPS is already hardened.

## Safe evidence collection

```bash
cd /var/www/whatsquery
bash scripts/contabo-db-topology.sh
```

Retain redacted output for release review. The script reports Docker Compose
services, database/pooler containers, networks, published ports, firewall
PostgreSQL rules, Nginx upstreams, and app runtime without credentials.

## Required controls

- Install current OS and kernel security updates.
- Use a named sudo operator; disable direct root SSH only after verified fallback.
- Disable SSH password login only after two independent key sessions succeed.
- Permit only required inbound ports, normally 22 from admin IPs and 80/443 public.
- Keep PostgreSQL, Redis, Supavisor/PgBouncer admin, Studio, and Docker daemon private.
- Bind host-run app/database ports to loopback.
- Do not mount `/var/run/docker.sock` into application containers.
- Run the app as its non-root image user with no extra Linux capabilities.
- Keep environment files root/app readable only (`0600`) and outside Git.
- Validate Nginx TLS 1.2/1.3, HSTS, request limits, hidden files, and proxy headers.
- Verify automatic certificate renewal with a dry run and alert before expiry.
- Enable Fail2ban or equivalent SSH abuse controls.
- Enable unattended security upgrades with a controlled reboot policy.
- Configure log rotation, disk/inode thresholds, memory/CPU alerts, and time sync.
- Back up database and essential configuration off-server.

## Docker review

The hardened standalone alternative uses pinned major images, a non-root app
image, read-only app/worker filesystems, no-new-privileges, dropped capabilities,
loopback app/database publishing, health checks, and resource/PID limits.

It is not the authoritative Supabase Compose stack. Apply equivalent controls to
the actual stack after inspecting service dependencies. Avoid broad changes to
Supabase-owned containers without a tested staging copy.

## Production evidence fields

```text
OS/security update status:
SSH root login:
SSH password login:
Firewall required ports only:
Docker API/socket private:
PostgreSQL private:
Redis private:
Studio/admin APIs restricted:
Application user non-root:
Environment file permissions:
TLS certificate expiry/renewal:
Fail2ban status:
Log rotation:
Disk/memory monitoring:
```

