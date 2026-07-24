# WhatsQuery Security Release Checklist

Evidence date: 2026-07-24

## Release decision

```text
Security release classification: BLOCKED
```

Local code hardening is suitable for continued staging work. It is not approved
for a controlled pilot or general production until every blocker below is closed
with Contabo/provider evidence.

## Findings

| Severity | Open | Fixed | Accepted risk |
| --- | ---: | ---: | ---: |
| Critical | 2 | 2 | 0 |
| High | 5 | 10 | 0 |
| Medium | 5 | 4 | 0 |
| Low | 2 | 1 | 0 |

## Control status

| Control | Implemented | Tested | Production verified |
| --- | ---: | ---: | ---: |
| Authentication | Yes | Yes, code/local | No |
| Tenant isolation | Yes | Yes, deterministic; DB suite pending | No |
| Role permissions | Yes | Partial | No |
| Voice-tool controls | Yes | Yes | No |
| Vapi authentication | Yes | Yes, deterministic | No |
| OAuth security | Yes | Yes | No |
| Credential encryption | Yes | Yes | No |
| Webhook security | Yes | Yes, deterministic | No |
| Rate limiting | Yes | Yes | No live Redis evidence |
| Idempotency | Yes | Yes | No provider evidence |
| Database security | Partial | Local schema only | No |
| Contabo hardening | Checklist/scripts | No | No |
| Backup and restore | Scripts/gate | No restore | No |
| Monitoring | Partial | Local logic | No alert evidence |
| Incident response | Documented | Tabletop pending | No |

## Exact release blockers

1. Pending/applied migration state and live tenant/schema verification on Contabo are unknown.
2. No checksum-verified off-server backup plus controlled restore evidence exists.
3. PostgreSQL/Supabase/Studio/pooler/firewall/SSH/TLS exposure is not production-verified.
4. Real Vapi HMAC timestamp, stale request, replay, mapping, and reconciliation tests are pending.
5. Eight database-backed security checks are still skipped outside Contabo.
6. Recording controls are implemented locally, but disclosure/consent and
   provider-side behavior are not live-verified.

## Commands and results

| Command | Result |
| --- | --- |
| `npx prisma validate` | Pass |
| `npx prisma generate` | Pass, Prisma Client 6.0.0 |
| `npx prisma migrate status` | Fail: workstation `.env` targets unreachable Supabase Cloud, not Contabo |
| `npx tsc --noEmit` | Pass |
| Focused `npx eslint ...` | Pass, 0 errors/warnings after cleanup |
| `npm run test:security` | Pass: 45 passed, 0 failed, 8 DB-backed skipped |
| Tenant-isolation focused assertions | Pass: sensitive read/update/delete and branch cases |
| `npm run test:integrations` | Pass: 27/27 |
| `npm run test:telecom` | Pass: 33/33 |
| `npm run test:onboarding` | Pass: 9/9 |
| `npm run build` | Pass; standalone artifact created; local DB reachability warnings logged |
| `npm audit --omit=dev --json` | Pass: 0 findings |
| `npm audit --json` | Pass: 0 findings |
| `docker compose -f docker-compose.prod.yml config --quiet` | Pass with non-secret validation values |
| Current/history high-confidence secret scan | Pass; placeholder connection strings reviewed |

The 8 skipped security tests are subscription/OTP/inventory scenarios requiring a
database. They are not counted as passed and must run against an isolated
Contabo/staging database.

## Deployment gate

On Contabo:

```bash
cd /var/www/whatsquery
bash scripts/contabo-db-topology.sh
bash scripts/contabo-prisma-migrate.sh inspect
```

After reviewing topology, migration SQL, tenant aggregates, and creating a
verified off-server backup:

```bash
export WHATSQUERY_BACKUP_REFERENCE=/secure/path/to/verified-backup.sql.gz
bash scripts/contabo-prisma-migrate.sh deploy
```

Do not use the workstation cloud connection, `prisma migrate reset`, or
`prisma db push`.

## Honest completion

```text
Authentication hardening: 85%
Tenant isolation: 84%
Voice security: 83%
Vapi security: 78%
OAuth and integration security: 82%
Webhook security: 82%
Database and Contabo security: 35%
Secrets management: 75%
Rate limiting and abuse controls: 80%
Privacy and data protection: 75%
Monitoring and incident response: 65%
Backup and recovery: 40%
Security testing: 80%
Controlled-pilot readiness: 62%
General-production readiness: 40%
```

These values reflect missing production evidence and are not a security score or
a claim of complete protection.
