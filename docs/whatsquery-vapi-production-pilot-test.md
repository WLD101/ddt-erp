# WhatsQuery Vapi Production Pilot Test

Evidence date: 2026-07-24

Status: **Prepared, not executed against production**

## Preconditions

- Contabo migration and live-schema checks pass.
- A dedicated pilot tenant, assistant, phone number and test callers are used.
- `VAPI_PRIVATE_API_KEY`, `VAPI_WEBHOOK_SECRET`,
  `VAPI_EVENT_ENCRYPTION_KEY`, `VAPI_SERVER_CREDENTIAL_ID` and
  `VOICE_JOBS_SECRET` are configured in the production app environment.
- Vapi sends to `https://voice.whatsquery.com/api/webhooks/vapi`.
- The Vapi server credential uses HMAC authentication.
- Recording/transcription policy is approved before any call.
- `WHATSQUERY_PILOT_LIVE_CALLS_APPROVED=true` is set only after sign-off.

Vapi's current controls used by the implementation are documented in
[server authentication](https://docs.vapi.ai/server-url/server-authentication),
[call recording](https://docs.vapi.ai/assistants/call-recording), and
[recording consent plans](https://docs.vapi.ai/security-and-privacy/recording-consent-plan).

## Authentication matrix

| Test | Expected | Status |
| --- | --- | --- |
| Valid HMAC and current timestamp | Accepted once | Not run |
| Invalid HMAC | `401` | Not run |
| Missing signature | `401` | Not run |
| Stale timestamp | Rejected | Not run |
| Exact replay | No duplicate ledger/outcome | Not run |
| Valid signature with unmapped assistant/number | Rejected/quarantined | Not run |
| Tenant outside pilot allowlist | `403` | Not run |

## Controlled call matrix

| Scenario | Provider | Webhook | Ledger | Dashboard | ERP outcome | Reconciled |
| --- | --- | --- | --- | --- | --- | --- |
| Inbound answered | Not run | Not run | Not run | Not run | N/A | Not run |
| Caller hang-up/no answer | Not run | Not run | Not run | Not run | One callback/lead | Not run |
| Provider failure | Not run | Not run | Not run | Not run | One failure outcome | Not run |
| Outbound answered | Not run | Not run | Not run | Not run | N/A | Not run |
| Transfer | Not run | Not run | Not run | Not run | One handoff | Not run |
| Approved tool action | Not run | Not run | Not run | Not run | One idempotent record | Not run |

## Commands

Run inside the production app environment:

```bash
npm run voice:diagnose-vapi
npm run test:telecom
```

For every controlled call, compare masked provider call ID, direction, status,
ring/conversation/total/billable duration, transfer result, cost, webhook count,
ledger row and resulting ERP action. Record aggregate evidence only. Do not paste
phone numbers, transcripts, recordings, keys or customer data into the report.

## Pass rule

Production Vapi verification passes only when authentication negatives reject,
replays are idempotent, assistant/number mappings are unambiguous, all controlled
calls reconcile and recording evidence follows the approved tenant policy.

