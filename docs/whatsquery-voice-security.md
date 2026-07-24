# WhatsQuery Voice Security

Last reviewed: 2026-07-23

## Control path

```text
trusted call mapping
-> registered tool
-> tenant training/runtime policy
-> allowed action
-> confirmation or staff review
-> integration permission/approval
-> idempotent executor
-> provider adapter
-> redacted audit and call outcome
```

## Current controls

- Tool names are selected from a fixed registry; unknown tools return failure.
- Tenant identity is supplied by webhook mapping, not by tool arguments.
- Appointment and order tools create requests requiring staff confirmation; they
  do not directly create confirmed operational commitments.
- Integration actions enforce provider state, granted scopes, source policy,
  action permission, rate limit, approval, and persistent idempotency.
- Restricted actions default to denial or approval-required.
- Telecom activation defaults off and supports emergency stop, destination
  allowlists, spend/call caps, provider health, and fallback constraints.
- Outbound calls use a Redis-backed per-tenant rate limit that fails closed in
  production.
- Worker jobs use leases and tenant-bound records; unknown and unfinished job
  types fail closed.

## Prompt-injection posture

The model cannot receive a database client, vault key, provider SDK client,
platform-admin function, or arbitrary HTTP executor. Requests to expose prompts
or credentials have no registered capability. Refunds, price changes, deletion,
bulk messages, and manufacturing commitments are not exposed as unrestricted
voice tools.

Deterministic tests cover permission denial, approval-required decisions,
idempotency, action allowlists, telecom activation, mapping ambiguity, worker
leases, and retry safety. A dedicated conversational red-team suite covering all
prompt wordings remains recommended before general production.

## Privacy

- Durable Vapi events hold an encrypted replay copy and a redacted operator copy.
- Full transcripts are not written to ordinary logs.
- Recording redirects require tenant owner/admin access and an approved HTTPS host.
- Daily retention removes recordings, transcripts, raw events, and messaging content.
- Clinic workflows require a separate compliance review; no healthcare compliance
  certification is asserted.

## Pilot gate

Keep live calling disabled until one tenant, one mapped number, HMAC webhooks,
provider caps, recording disclosure, reconciliation, and emergency stop are
verified end-to-end.

