# WhatsQuery Contabo Migration Report

> Historical report from the 2026-07-23 integration migration pass. Current
> release evidence is in `whatsquery-controlled-pilot-release-report.md` and
> includes the subsequent Vapi and voice-privacy migrations.

Date: Thursday, July 23, 2026

## Infrastructure

```text
Supabase deployment type: Self-hosted on Contabo VPS
Prisma execution location: Prepared for Contabo VPS host; live execution pending
PostgreSQL connection method: Pending redacted VPS topology inspection
Docker database service: Pending redacted VPS topology inspection
Internal database port: Pending redacted VPS topology inspection
Published host port: Pending redacted VPS topology inspection
Pooler present: Pending redacted VPS topology inspection
Migration command environment: /var/www/whatsquery as user whatsquery
Pending migrations: Four repository candidates; live status not yet read
Applied migrations: Not claimed without live migration history
Live schema verified: No
Existing tenants verified: No
```

## Local verification

| Command | Result | Notes |
| --- | --- | --- |
| `npx prisma validate` | Pass | Schema valid |
| `npx prisma generate` | Pass | Prisma Client 6.0.0 generated |
| `npx tsc --noEmit --incremental false` | Pass | No type errors |
| Onboarding tests | Pass | 9 of 9 |
| Integration tests | Pass | 27 of 27 |
| Telecom tests | Pass | 23 of 23 |
| Security tests | Pass with skips | 21 passed; 8 live-DB tests skipped |
| `npm run build` | Pass | All routes built |
| New-file scoped ESLint | Pass | No warnings |
| Full repository ESLint | Fail | Pre-existing source and generated-output debt |
| Shell syntax | Pass | WSL `bash -n` |
| Compose syntax | Pass | Both Compose files validate |

## Migration status

| Migration | Pending before | Applied | Verified | Notes |
| --- | ---: | ---: | ---: | --- |
| `202607220001` | Unknown live | No claim | Local SQL audit | Additive |
| `202607220002` | Unknown live | No claim | Local SQL audit | Additive integration tables |
| `202607220003` | Unknown live | No claim | Local SQL audit | Conservative tenant backfill |
| `202607220004` | Unknown live | No claim | Local SQL audit | Runtime hardening; Prisma drift corrected |

## Completion

```text
Supabase connectivity diagnosis: 60%
Migration deployment path: 90%
Migration SQL audit: 100%
Backup and recovery preparation: 90%
Migrations applied: 0%
Live schema verification: 0%
Existing tenant verification: 0%
Tenant isolation against live schema: 0%
CI migration workflow: 85%
Windows/CI test path: 100%
Database deployment readiness overall: 65%
```

The remaining evidence must come from the Contabo VPS. SSH authentication was not
available to this session, so no Docker service name, port, migration history or
tenant aggregate has been guessed.
