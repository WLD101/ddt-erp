# WhatsQuery Webhook Security

Last reviewed: 2026-07-23

| Endpoint | Authentication | Freshness/replay | Size | Durability/idempotency |
| --- | --- | --- | ---: | --- |
| Vapi | HMAC production default; optional CIDR | Timestamp tolerance and persistent dedup | 2 MB | Event before worker, retries/dead letter |
| Meta WhatsApp | `X-Hub-Signature-256` HMAC | Provider message uniqueness | 512 KB | Tenant message records and jobs |
| Twilio | Official `X-Twilio-Signature` URL/form validation | Provider event ID/deterministic dedup | 256 KB | Telecom job queue |
| Asterisk | HMAC method/path/body | Timestamp, nonce, nonce persistence | 256 KB | Telecom job queue |
| Stripe | Stripe SDK signature | Stripe event ID persistence | 1 MB | Status and duplicate handling |
| Internal voice jobs | Bearer worker secret | Idempotent recurring buckets and leases | N/A | Persistent queue |

Twilio requires validating the exact externally visible URL and all received form
parameters. The implementation constructs that URL from configured
`VOICE_PUBLIC_APP_URL`/`NEXTAUTH_URL`, matching Twilio's official guidance:
https://www.twilio.com/docs/usage/webhooks/webhooks-security

## Common controls

- Raw bodies are read before signature verification where required.
- Payload limits reject based on declared and actual UTF-8 size.
- Provider routes return safe error codes without stack traces.
- Cookie-origin checks do not replace provider signatures; provider callbacks are
  narrowly exempt from CSRF and independently authenticated.
- Slow processing is moved to persistent jobs where implemented.
- Logs avoid full request bodies and authorization values.

## Open verification

- Real Vapi HMAC header/timestamp delivery.
- Meta app-secret signature in production.
- Twilio external URL behavior through the live reverse proxy.
- Stripe live-mode endpoint secret separation.
- Alerting thresholds for repeated signature failures and webhook silence.

