# WhatsQuery Vapi Operations Runbook

## Deployment location

The local repository is:

```text
C:\Users\WLD10\.gemini\antigravity\scratch\ddt-erp
```

The Contabo application directory previously observed is:

```text
/var/www/whatsquery
```

Verify the VPS path before deployment:

```bash
cd /var/www/whatsquery
pwd
test -f package.json
test -f deploy.sh
```

Do not use a Windows `C:\...` path inside the Linux VPS.

## Required production environment

```env
VAPI_PRIVATE_API_KEY=
VAPI_WEBHOOK_SECRET=
VAPI_EVENT_ENCRYPTION_KEY=
VAPI_SERVER_URL=https://voice.whatsquery.com/api/webhooks/vapi
VOICE_PUBLIC_APP_URL=https://voice.whatsquery.com
VOICE_JOBS_SECRET=
VAPI_RECONCILIATION_INTERVAL_MINUTES=60
```

`VAPI_ALLOWED_CIDRS` should remain empty unless the reverse proxy's trusted client-IP handling is verified.

## Migration safety

The migration is additive. It does not delete calls or tenant records. Before applying:

```bash
cd /var/www/whatsquery
./scripts/contabo-postgres-backup.sh
npx prisma validate
npx prisma migrate status
sed -n '1,260p' prisma/migrations/202607230001_vapi_call_tracking/migration.sql
npx prisma migrate deploy
npx prisma migrate status
```

Never run:

```bash
npx prisma migrate reset
npx prisma db push
```

## Application deployment

Use the repository's existing deployment path:

```bash
cd /var/www/whatsquery
./deploy.sh
```

If the deployment script does not run migrations, apply `npx prisma migrate deploy` using the approved Contabo migration script before restarting the application.

## Post-deploy checks

```bash
npm run voice:diagnose-vapi
npx tsx --test tests/telecom/vapi-call-tracking.test.ts
npm run voice:reconcile-vapi -- --from="$(date -u -d '6 hours ago' +%FT%TZ)" --to="$(date -u +%FT%TZ)"
```

Then verify:

- `/voice/admin/vapi-health`;
- the latest authenticated webhook time;
- zero unexpected mapping failures;
- no dead-letter jobs;
- no calls stuck open beyond two hours;
- reconciliation dry-run discrepancies reviewed;
- one controlled test call appears once.

## Worker scheduling

The trusted scheduler must call:

```text
POST /api/voice/jobs/process
Authorization: Bearer <VOICE_JOBS_SECRET>
```

A 1-5 minute cadence is suitable. The endpoint schedules an idempotent recent Vapi reconciliation based on `VAPI_RECONCILIATION_INTERVAL_MINUTES`.

## Replay after mapping repair

1. Correct `VoiceAgent.vapiPhoneNumberId`, assigned number, or `vapiAssistantId`.
2. Inspect the mapping-failed event on Vapi Health.
3. Queue the immutable event again:

```bash
npm run voice:replay-vapi -- --event=<VoiceWebhookEvent ID>
```

4. Run a dry reconciliation for the affected period.
5. Apply `--only-missing --apply`.

Do not edit raw event payloads.

## Key rotation

Rotate the Vapi webhook credential and application secret together. Keep `VAPI_EVENT_ENCRYPTION_KEY` stable across webhook-secret rotation; otherwise historical encrypted raw events cannot be replayed.

## Incident rule

If ingestion is failing, keep the endpoint authenticated and return errors rather than bypassing signature verification. Reconciliation can recover calls after service restoration.
