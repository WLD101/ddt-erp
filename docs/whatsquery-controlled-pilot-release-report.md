# WhatsQuery Controlled Pilot Release Report

Evidence date: 2026-07-24

## Release classification

```text
BLOCKED
```

Local release blockers have been materially reduced, but controlled-pilot
deployment cannot be approved without authenticated Contabo, database, restore
and Vapi production evidence.

## Blocker status

| Blocker | Before | After | Evidence | Closed |
| --- | --- | --- | --- | ---: |
| Contabo topology | Unknown | Collector expanded; live values unknown | `scripts/contabo-db-topology.sh` | No |
| Database connection | Stale Cloud URL locally | Self-hosted verifier/gates added; live target unknown | `pilot:verify-env`, migration scripts | No |
| Backup | Script only | Checksum, archive, temp restore and aggregate checks added | backup runbook/script | No |
| Restore | Not proven | Automated temp-restore path prepared | backup script | No |
| Migrations | Unknown live | 27 migrations audited; no destructive blockers | `migration:audit` | No |
| High dependencies | 3 High | 0 findings | both npm audits | Yes |
| DB security tests | 8 skipped | Still 8 skipped on stale local DB | security test output | No |
| Vapi HMAC | Local deterministic only | Credential/HMAC plan hardened; live negative tests pending | Vapi pilot plan | No |
| Live call reconciliation | Not run | Test matrix prepared | Vapi pilot plan | No |
| Recording privacy | Incomplete | Fail-closed tenant controls and tests added | privacy tests/runbook | No |

## Dependency status

```text
Critical: 0
High: 0
Moderate: 0
Accepted risks: 0
```

## Database status

```text
Supabase deployment type: Self-hosted on Contabo VPS
Prisma execution location: Not live-verified
PostgreSQL connection method: Not live-verified
Docker database service: Not live-verified
Internal database port: Not live-verified
Published host port: Not live-verified
Pooler present: Not live-verified
Migration command environment: Prepared for VPS host/app container
Backup: Not created or verified in this session
Restore test: Not executed in this session
Pending migrations: Not live-verified
Applied migrations: Not live-verified
Live schema verified: No
Existing tenants verified: No
Manual review: Static SQL audit complete; live counts pending
```

## Vapi status

```text
API verified: No
Account verified: No
Webhook verified: Deterministic local tests only
HMAC verified: Deterministic local tests only
Assistants mapped: Not live-verified
Phone numbers mapped: Not live-verified
Controlled calls completed: 0
Reconciliation result: Not run
```

## Security tests

| Test group | Passed | Failed | Skipped |
| --- | ---: | ---: | ---: |
| Combined security suite | 45 | 0 | 8 |
| Authentication/tenant/webhook/Vapi/privacy | Included above | 0 | 0 deterministic |
| Integrations | 27 | 0 | 0 |
| Telecom | 33 | 0 | 0 |
| Onboarding/market controls | 9 | 0 | 0 |
| Database-backed security | 0 | 0 | 8 |

Additional gates:

- `npx tsc --noEmit`: pass.
- Focused changed-file ESLint: pass.
- `npm run lint`: pass with 0 errors and 143 existing warnings; generated
  Remotion build output is excluded.
- `bash -n` for deployment/backup/migration/topology scripts: pass.
- `npm run migration:audit`: pass, 27 migrations, no blockers.
- `npm run build`: pass, 161 pages/routes generated.
- Production environment verifier: pass with sanitized non-secret test values.

## Deployment status

```text
Pilot deployed: No
Production URL: https://voice.whatsquery.com (existing deployment, not changed)
App service: Not live-verified
Worker service: Not live-verified
Database health: Not live-verified
Monitoring: Not live-verified
Rollback ready: Procedure prepared; live timing/service names pending
```

## Completion percentages

```text
Contabo topology verification: 25%
Dependency remediation: 100%
Backup readiness: 80%
Restore verification: 15%
Migration deployment: 25%
Live schema verification: 10%
Database-backed security tests: 35%
Vapi production authentication: 55%
Vapi live-call verification: 15%
Recording privacy controls: 75%
Monitoring and rollback: 55%
Controlled-pilot readiness: 62%
General-production readiness: 40%
```

These percentages measure evidence completion, not security quality.

## Required next execution

```bash
cd /var/www/whatsquery
sudo bash scripts/contabo-db-topology.sh
sudo -u whatsquery bash scripts/contabo-prisma-migrate.sh inspect
```

After topology review, expected database/tenant counts and an approved backup
location are configured, run the backup/restore gate and only then use
`scripts/contabo-prisma-migrate.sh deploy`. Live Vapi and privacy matrices must
pass before `VOICE_CALLING_ENABLED` is enabled.
