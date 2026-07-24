# WhatsQuery Vapi Connection Audit

Date: 2026-07-23

Repository audited: `C:\Users\WLD10\.gemini\antigravity\scratch\ddt-erp`

## Scope and evidence

The audit covered the Vapi server routes, assistant configuration, trusted tenant mappings, `VoiceCallLog`, `VoiceWebhookEvent`, `VoiceJob`, usage billing, ERP tool handlers, dashboard queries, provider API client, deployment examples, and administrative scripts.

Official behavior was checked against:

- [Vapi server events](https://docs.vapi.ai/server-url/events)
- [Vapi server authentication](https://docs.vapi.ai/server-url/server-authentication)
- [Vapi List Calls API](https://docs.vapi.ai/api-reference/calls/list)
- [Vapi server URL precedence](https://docs.vapi.ai/server-url/setting-server-urls)

## Connection verification

The local `.env` and `.env.local` do not contain a Vapi private key. Production secrets are intentionally not in the repository, so the active production Vapi organization could not be verified from this workstation.

Run this redacted diagnostic inside the production application environment:

```bash
npm run voice:diagnose-vapi
```

It prints counts and mapping status only. It does not print API keys, phone numbers, transcripts, recordings, or customer data.

Current verified state:

| Check | Result |
| --- | --- |
| Vapi API key present locally | No |
| Production API key present | Not inspected |
| API key validity | Not live-verified |
| Organization identity | Not live-verified |
| Assistant count | Requires production diagnostic |
| Phone-number count | Requires production diagnostic |
| Production server URLs | Requires production diagnostic |
| Database mapping constraints | Verified in schema |

## Existing flow before this change

The route at `/api/voice/vapi/webhook` authenticated a static secret or HMAC, required a hard-coded Vapi CIDR in production, resolved a tenant, performed wallet and usage mutations, stored an event, and then queued a job.

Observed events handled by business code were:

- `status-update`
- `end-of-call-report`
- `tool-calls`
- `assistant-request` for capacity and balance checks

Other messages were stored only if tenant mapping succeeded. Unknown messages were not intentionally classified. Mapping failures were stored but not replayed.

## Accuracy defects found

1. A repeated `end-of-call-report` could debit the wallet and increment usage more than once.
2. `VoiceWebhookEvent` had no deduplication constraint or payload hash.
3. `VoiceCallLog` had no safe unique external-call identity.
4. The webhook mutated billing before the immutable event record existed.
5. Raw webhook JSON could contain unredacted transcripts, caller numbers, tool arguments, and recording URLs.
6. Worker jobs were selected and then updated without an atomic claim, allowing two workers to process one job.
7. Every ended event could become `COMPLETED`, even when no answered signal existed.
8. Direction defaulted to `INBOUND`, including outbound calls.
9. One duration field represented ring, conversation, total, and billable time.
10. Provider actual cost, customer billable cost, and pricing currency were not separated.
11. Usage was both incremented from the webhook and recomputed from call logs.
12. Missing webhooks were not recoverable through a paginated Calls API reconciliation.
13. A hard-coded provider CIDR could reject valid traffic after proxy or provider network changes.
14. `Authorization: Bearer` authentication was not accepted.
15. ERP tool retries could create duplicate leads, reservation requests, or order requests.
16. Test calls had no explicit reporting dimension.

## Implemented flow

```text
Vapi
-> POST /api/webhooks/vapi (legacy URL remains valid)
-> Bearer, X-Vapi-Secret, or configured HMAC authentication
-> redacted event plus encrypted replay payload
-> unique deduplication key
-> trusted phone/number/assistant/call mapping
-> idempotent VoiceJob
-> atomic worker lease
-> VoiceCallLog upsert by vapi:<call-id>
-> lifecycle, duration, cost, transfer, and outcome dimensions
-> idempotent ERP tool outcome
-> idempotent terminal billing
-> usage reconciliation
<-> scheduled Vapi Calls API reconciliation
```

The hard-coded CIDR was removed. `VAPI_ALLOWED_CIDRS` is optional and should only be configured when the deployed reverse proxy preserves a trusted client IP.

## Event policy after this change

The following documented events are tracked:

- `assistant-request`
- `status-update`
- `end-of-call-report`
- `transcript`
- `transcript[transcriptType="final"]`
- `speech-update`
- `conversation-update`
- `tool-calls`
- `transfer-update`
- `hang`

Unknown event types are authenticated, deduplicated, stored, queued, and marked `ignored`. They do not fail the webhook.

`assistant-request` remains a necessary synchronous exception because Vapi requires an answer within 7.5 seconds. It stores the raw event first, then performs the minimum trusted mapping, balance, and capacity work. Tool writes are queued; the synchronous tool response says `queued` and explicitly prevents the agent from claiming operational confirmation.

## Tenant resolution

Resolution order is:

1. unique `VoiceAgent.vapiPhoneNumberId`;
2. assigned inbound number;
3. unique `VoiceAgent.vapiAssistantId`;
4. an existing `VoiceCallLog` for the same Vapi call ID;
5. development-only tenant header behavior already present in the repository.

Caller-supplied arbitrary tenant metadata is not trusted. Unresolved events retry, dead-letter after the configured job limit, remain visible on Vapi Health, and can be replayed after correcting mappings.

## Remaining production checks

- Run the connection diagnostic on Contabo.
- Confirm every active Vapi assistant and phone number uses `https://voice.whatsquery.com/api/webhooks/vapi`.
- Confirm a custom Vapi credential sends the expected Bearer or legacy `X-Vapi-Secret`.
- Apply migration `202607230001_vapi_call_tracking`.
- Configure a stable `VAPI_EVENT_ENCRYPTION_KEY` before receiving production events.
- Configure the trusted job scheduler for `/api/voice/jobs/process`.
- Run the controlled live-call matrix in `whatsquery-vapi-live-test-report.md`.

No n8n workflow is used as a call ledger, tenant resolver, biller, or ERP source of truth.
