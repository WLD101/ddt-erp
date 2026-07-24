# WhatsQuery Telecom Operations Runbook

This runbook covers Pakistan local SIP/Asterisk routing and USA/UK Twilio-style routing. Real calling must remain disabled until provider credentials, webhooks, consent settings, and staging tests are verified.

## Enable Or Disable Providers

1. Open `voice.whatsquery.com/admin/routing`.
2. Review provider health and recent failures.
3. Use provider maintenance mode before changing production routing.
4. Keep `VOICE_TWILIO_CALLING_ENABLED=false` and `VOICE_ASTERISK_CALLING_ENABLED=false` until live calling is approved.

Emergency disable:

```env
VOICE_TWILIO_CALLING_ENABLED=false
VOICE_ASTERISK_CALLING_ENABLED=false
```

Restart the app after env changes.

## Provider Maintenance Mode

Use:

```http
POST /api/admin/providers/{providerId}/maintenance
```

Body:

```json
{ "enabled": true, "message": "Carrier outage under investigation" }
```

Maintenance mode excludes the provider from normal routing unless an emergency override is configured on a route.

## Provider Outage Response

1. Put the affected provider in maintenance.
2. Run route simulation for affected tenants/countries.
3. Confirm fallback provider is healthy.
4. Watch recent failures and fallback usage.
5. Re-enable only after health checks and provider status are stable.

## Webhook Signature Failures

- Twilio-style webhooks require valid provider signatures.
- Asterisk webhooks require `x-wq-timestamp`, `x-wq-nonce`, and `x-wq-signature`.
- Repeated failures may indicate wrong public URL, rotated secret mismatch, replay attack, or proxy URL mismatch.

Do not log full signatures or secrets.

## Replay Detection Alerts

Replay detection is stored through `TelecomWebhookNonce`.

- Replay window: 5 minutes.
- Nonce retention: keep long enough to cover replay window and operational delay.
- Cleanup: run `cleanupExpiredTelecomWebhookNonces` from a trusted worker or scheduled admin task.

## Stuck Call Reconciliation

Use `reconcileStuckCalls` from trusted maintenance code only.

The reconciler:

- Finds old non-terminal calls.
- Does not place or retry calls.
- Creates a reconciliation `CallEvent`.
- Updates `Call` and latest `CallAttempt` through the central state machine.

## Fallback Monitoring

Fallback should only occur for temporary provider failures. It must not occur for policy rejections, invalid numbers, caller-ID failures, or authentication problems.

Watch:

- temporary provider failure count
- fallback usage
- provider health status
- active call capacity
- webhook delay

## Route Simulation

Use:

```http
POST /api/admin/routing-rules/simulate
```

Simulation validates the real routing path and never places a call. It returns masked numbers, selected provider, fallback candidates, and decision trace.

## Secret Rotation

### Asterisk HMAC

1. Set `ASTERISK_WEBHOOK_SECRET_PREVIOUS` to the current secret.
2. Set `ASTERISK_WEBHOOK_SECRET` to the new secret.
3. Update the Asterisk sender.
4. Verify webhook acceptance.
5. Remove the previous secret after the overlap window.

### Twilio-Style Credentials

1. Add new credentials in secure server env or encrypted provider storage.
2. Verify webhook URL and signature validation in staging.
3. Run provider health check.
4. Enable live routing only after test calls are approved.

## Logs And Metrics

Structured telecom logs emit JSON with:

- `event`
- `callId`
- `attemptId`
- `tenantId`
- `providerId`
- `providerCallId`
- `durationMs`

Sensitive keys such as tokens, signatures, and secrets are filtered.

## Safe Rollback

1. Disable live calling flags.
2. Put affected providers in maintenance.
3. Keep migrations applied; do not drop telecom lifecycle tables.
4. Use compatibility `call_logs` and `call_routes` for reporting while lifecycle reads are repaired.
5. Re-run route simulation before re-enabling providers.

## Production Queue Recommendation

The repo has BullMQ scaffolding and a database-backed `VoiceJob` system. Telecom webhooks are intentionally synchronous in this phase for consistency. Before high call volume, move these operations to a dedicated worker:

- provider health checks
- stale call reconciliation
- nonce cleanup
- delayed fallback evaluation
- provider status polling
