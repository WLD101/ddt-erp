# WhatsQuery Controlled Pilot Rollback

Evidence date: 2026-07-24

Status: **Prepared; live service names and restore timing not verified**

## Immediate containment

Disable call creation and unfinished providers first:

```bash
cd /var/www/whatsquery
sudoedit .env.production
# Set VOICE_CALLING_ENABLED=false and leave integration/telecom provider flags false.
sudo systemctl restart whatsquery.service
sudo systemctl restart whatsquery-worker.service
sudo nginx -t
```

If the worker unit has a different name, use the topology report rather than
guessing. Keep `WHATSQUERY_CONTROLLED_PILOT=true`; do not expand the tenant
allowlist during an incident.

## Application rollback

1. Capture current revision, service state, health output and redacted logs.
2. Select the previously approved Git revision.
3. Confirm the checkout is clean.
4. Check out/deploy that immutable revision using the server's approved release
   mechanism.
5. Run `npm ci --ignore-scripts`, `prisma generate`, `npm run build`.
6. Restart app and worker, then verify Nginx and health endpoints.
7. Keep live calling disabled until ledger/provider reconciliation finishes.

Do not use `git reset --hard` in the operator procedure.

## Database recovery

Prisma migrations are forward-only. Do not run `prisma migrate reset`,
`prisma db push`, or ad-hoc reverse SQL.

- Prefer a reviewed forward fix when data integrity is intact.
- For destructive corruption, declare an incident, stop writes, preserve
  evidence and restore the checksum-verified backup into an isolated database.
- Compare tenant/migration aggregates before switching any production endpoint.
- A production restore requires explicit incident-command approval.

## Smoke checks

```bash
curl -fsS https://voice.whatsquery.com/health
curl -fsS -o /dev/null https://voice.whatsquery.com/
curl -fsS -o /dev/null https://voice.whatsquery.com/docs
sudo systemctl --no-pager --full status whatsquery.service
sudo systemctl --no-pager --full status whatsquery-worker.service
sudo nginx -t
```

Also verify no new Vapi events are accepted outside the approved tenant and no
duplicate ERP outcomes were created during rollback.

## Evidence still required

- Actual app/worker unit names.
- Last known-good revision and artifact.
- Measured application rollback time.
- Measured database restore RTO/RPO.
- Monitoring alert delivery and on-call acknowledgement.

