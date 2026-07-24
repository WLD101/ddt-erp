# WhatsQuery Vapi Live Test Report

Date: 2026-07-23

Status: Not executed against production.

No Vapi private key is available in the local repository environment, and no controlled Vapi calls were placed from this workstation. This report intentionally does not claim a live pass.

## Pre-test requirements

- Migration `202607230001_vapi_call_tracking` applied on the self-hosted Contabo database.
- `VAPI_PRIVATE_API_KEY`, `VAPI_WEBHOOK_SECRET`, `VAPI_EVENT_ENCRYPTION_KEY`, and `VOICE_JOBS_SECRET` configured in the application container.
- Active assistant and phone number mapped to a dedicated test tenant.
- Vapi server URL set to `https://voice.whatsquery.com/api/webhooks/vapi`.
- Worker scheduler invoking `/api/voice/jobs/process`.
- Test numbers and test customer data only.

## Connection diagnostic

Run inside the production application environment:

```bash
npm run voice:diagnose-vapi
```

Expected report fields:

```text
Vapi API reachable
Connected account identity verified
Assistants discovered
Phone numbers discovered
Server URLs verified
Unknown assistants
Unknown phone numbers
Duplicate tenant mappings
```

## Controlled call matrix

| Test | Vapi dashboard | Vapi API | Raw event | Ledger | Dashboard | ERP outcome | Match |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Inbound answered | Not run | Not run | Not run | Not run | Not run | N/A | Not run |
| Inbound caller hang-up | Not run | Not run | Not run | Not run | Not run | Callback expected | Not run |
| Rejected/provider failure | Not run | Not run | Not run | Not run | Not run | Callback expected | Not run |
| Outbound answered | Not run | Not run | Not run | Not run | Not run | N/A | Not run |
| Transfer attempt | Not run | Not run | Not run | Not run | Not run | Handoff expected | Not run |
| Tool action | Not run | Not run | Not run | Not run | Not run | One record expected | Not run |
| Follow-up request | Not run | Not run | Not run | Not run | Not run | One lead expected | Not run |

## Deterministic tests completed

Automated tests cover:

- inbound answered;
- inbound no-answer;
- inbound provider failure before answer;
- outbound answered;
- outbound failed;
- successful transfer;
- failed transfer;
- duplicate webhook identity;
- delayed analysis on the same call;
- separate duration fields;
- encrypted replay and redacted diagnostics;
- reconciliation mismatch detection.

Command:

```bash
npx tsx --test tests/telecom/vapi-call-tracking.test.ts
```

Result on 2026-07-23: 10 passed, 0 failed.

## Required evidence after live execution

Record only aggregate counts and masked identifiers. Do not paste transcripts, recordings, API keys, caller phone numbers, or real customer data into this document.
