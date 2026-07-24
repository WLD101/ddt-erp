# WhatsQuery Vapi Call Tracking Delivery Report

Date: 2026-07-23

## Executive result

The repository now contains the core production architecture requested:

```text
Vapi
-> authenticated fast webhook
-> encrypted/redacted immutable event
-> deduplicated durable job
-> trusted tenant resolution
-> provider-neutral VoiceCallLog ledger
-> lifecycle, durations, costs, and outcomes
-> idempotent ERP follow-up
-> tenant metrics and admin health
<-> scheduled Vapi Calls API reconciliation
```

The code is locally validated, but it has not been deployed to the Contabo VPS, the migration has not been applied to the live self-hosted Supabase database, and controlled Vapi calls have not been run. Production readiness is therefore conditional.

## Vapi connection

```text
API connection verified: No - no Vapi key exists in the local environment
Connected organization/account verified: No - run production diagnostic
Assistants discovered: Not run
Phone numbers discovered: Not run
Mapped assistants: Not live-counted
Mapped numbers: Not live-counted
Unresolved mappings: Not live-counted
Webhook endpoint verified: Code/build yes; remote Vapi configuration not verified
```

Redacted production diagnostic:

```bash
cd /var/www/whatsquery
npm run voice:diagnose-vapi
```

## Pipeline status

| Component | Before | After | Tests | Production ready |
| --- | --- | --- | --- | --- |
| Raw webhook storage | stored late and plaintext | stored first, redacted plus encrypted replay | security unit test | Conditional on encryption key and migration |
| Deduplication | none | unique event key and duplicate counter | deterministic identity test | Conditional on migration |
| Tenant resolution | assistant/phone OR query | phone ID, inbound number, assistant ID, existing call | type/build verified | Needs live mapping diagnostic |
| Call ledger | non-unique provider ID | unique `vapi:<call-id>` identity | lifecycle/reconciliation tests | Conditional on migration |
| Lifecycle mapping | ended often completed | provider-neutral multidimensional state | matrix tests | Needs controlled calls |
| Duration tracking | one duration | ring, conversation, total, billable | duration test | Needs provider comparison |
| Cost tracking | mixed webhook estimate | provider actual/estimate, customer snapshot, currency | idempotent code path/typecheck | Needs provider comparison |
| Reconciliation | one-call cost lookup | paginated window service, worker, CLI | mismatch tests | Needs production API diagnostic |
| ERP outcomes | retry could duplicate | tool-call outcome keys and missed-call callback | integration suite plus typecheck | Dedicated industry outcomes remain partial |
| Dashboard metrics | total/missed and mixed usage | multidimensional tenant metrics plus Vapi Health | type/build verified | Full filters/detail UI remain partial |

## Call comparison

No live calls were placed, so no match is claimed.

| Test call | Vapi dashboard | Vapi API | WhatsQuery ledger | WhatsQuery dashboard | Match |
| --- | --- | --- | --- | --- | --- |
| Inbound answered | Not run | Not run | Not run | Not run | Not run |
| Inbound no-answer | Not run | Not run | Not run | Not run | Not run |
| Inbound provider failure | Not run | Not run | Not run | Not run | Not run |
| Outbound answered | Not run | Not run | Not run | Not run | Not run |
| Transfer | Not run | Not run | Not run | Not run | Not run |
| ERP tool action | Not run | Not run | Not run | Not run | Not run |

## Live discrepancies

```text
Provider-only calls: Not measured
WhatsQuery-only calls: Not measured
Duplicate calls: Not measured
Missing end events: Not measured
Status mismatches: Not measured
Duration mismatches: Not measured
Cost mismatches: Not measured
Unresolved tenant calls: Not measured
Missing analysis: Not measured
```

Use a dry run after deployment:

```bash
npm run voice:reconcile-vapi -- --from="$(date -u -d '6 hours ago' +%FT%TZ)" --to="$(date -u +%FT%TZ)"
```

## Verification performed

```text
Prisma schema validation: Passed
Prisma client generation: Passed
TypeScript project check: Passed
Focused Vapi lint: Passed, zero warnings
Vapi deterministic tests: 10/10 passed
Complete telecom tests: 33/33 passed
Integration tests: 27/27 passed
Production Next.js build: Passed
Migration destructive-operation scan: Passed; no DROP, DELETE, or TRUNCATE
```

The build logged an unreachable stale Supabase Cloud URL from the Windows `.env`. This did not fail the build. Production database verification must use the self-hosted Contabo environment described in the database runbooks.

## Completion percentages

```text
Vapi account verification: 20%
Webhook reliability: 85%
Call ledger: 90%
Lifecycle accuracy: 85%
Tenant resolution: 75%
Duration and cost accuracy: 80%
Vapi API reconciliation: 80%
ERP outcome creation: 65%
Dashboard accuracy: 65%
Live call testing: 10%
Vapi integration overall: 68%
ERP AI receptionist operational readiness: 60%
```

These percentages are deliberately conservative. Code completion is higher than operational readiness because no live account, database migration, or controlled-call comparison has been verified.

## Release blockers

1. Back up the self-hosted Contabo PostgreSQL database.
2. Review and apply migration `202607230001_vapi_call_tracking`.
3. Configure `VAPI_EVENT_ENCRYPTION_KEY` and the other required production secrets.
4. Run `npm run voice:diagnose-vapi` inside the production application environment.
5. Correct unknown assistant, phone-number, or server-URL mappings.
6. Confirm the trusted worker scheduler.
7. Run the dry reconciliation and review every discrepancy.
8. Complete the controlled live-call matrix before declaring production ready.
