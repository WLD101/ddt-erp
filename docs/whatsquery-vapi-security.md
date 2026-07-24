# WhatsQuery Vapi Security

Last reviewed: 2026-07-23

## Authentication

Production defaults to HMAC mode. Required deployment values:

```env
VAPI_WEBHOOK_AUTH_MODE=hmac
VAPI_WEBHOOK_REQUIRE_TIMESTAMP=true
VAPI_WEBHOOK_TIMESTAMP_HEADER=x-vapi-timestamp
VAPI_WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS=300
```

The HMAC input is `<timestamp>.<raw-body>`. Signature comparison is constant-time.
Requests with stale or malformed timestamps, bad signatures, oversized payloads,
or disallowed source CIDRs are rejected.

Legacy Bearer and `X-Vapi-Secret` support remains available only when the
operator explicitly selects a non-HMAC mode. It is not approved for the release
gate.

Vapi documents Custom Credentials including HMAC, Bearer, and custom-header
authentication, and recommends HMAC when maximum security is required:
https://docs.vapi.ai/server-url/server-authentication

## Replay and durability

- Webhook body limit: 2 MB.
- Event/payload hashes and deduplication keys are persistent.
- Duplicate events update duplicate counts and do not create duplicate outcomes.
- Durable event persistence occurs before business processing.
- Jobs have attempts, leases, retry scheduling, and dead-letter fields.
- Unknown events can be safely ignored after persistence.
- Reconciliation compares local and provider call records.

## Tenant resolution

Only trusted assistant, phone-number, inbound-number, or existing-call mappings
can resolve a tenant. A tenant identifier in the payload/model arguments is not
authoritative. Ambiguous or unresolved mapping fails closed and is visible to
operations.

## Secrets and data

- Private Vapi keys remain server-only.
- Raw replay events use authenticated encryption.
- Redacted payloads mask transcripts, phone numbers, emails, and secret fields.
- Recording access is protected through a tenant endpoint and production host
  allowlist.
- Vapi payloads and recordings are removed by retention policy.

## Production verification still required

1. Confirm the Custom Credential header names and HMAC template in the Vapi dashboard.
2. Send valid, invalid, stale, duplicate, unknown, and oversized events.
3. Confirm one durable event and one operational outcome for duplicates.
4. Confirm unresolved metadata cannot select a tenant.
5. Confirm dashboard/client bundles contain no Vapi private key.
6. Run reconciliation against a bounded pilot window.

