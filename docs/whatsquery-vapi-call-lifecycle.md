# WhatsQuery Vapi Call Lifecycle

## Source of truth

`VoiceCallLog` remains the provider-neutral call ledger. No second Vapi call table was created. New Vapi calls use:

```text
provider = vapi
externalCallKey = vapi:<Vapi call ID>
```

The unique `externalCallKey` prevents duplicate local records even when the webhook and API reconciliation race.

## Normalized states

| State | Primary signal |
| --- | --- |
| `CREATED` | Vapi `scheduled` or `created` |
| `QUEUED` | Vapi `queued` |
| `RINGING` | Vapi `ringing` |
| `ANSWERED` | explicit answered signal |
| `IN_PROGRESS` | Vapi `in-progress` |
| `TRANSFERRING` | Vapi `forwarding` or `transferring` |
| `TRANSFERRED` | provider-confirmed transfer |
| `COMPLETED` | terminal and previously answered |
| `FAILED` | non-provider technical failure |
| `BUSY` | busy status or ended reason |
| `NO_ANSWER` | no-answer, rejected, or setup timeout without provider error |
| `CANCELLED` | cancelled status or reason |
| `VOICEMAIL` | voicemail status or reason |
| `PROVIDER_ERROR` | Vapi/provider error ended reason |
| `UNKNOWN` | insufficient evidence |

An `ended` status does not by itself mean the call was answered. Answer evidence is an in-progress/answered signal, an explicit answer timestamp, retained prior answered state, or a conversation artifact.

Terminal states never regress to ringing or in-progress when delayed events arrive.

## Independent outcome dimensions

The ledger stores separate flags for:

- answered;
- completed;
- missed;
- failed;
- abandoned;
- voicemail;
- transfer requested;
- transfer connected;
- transfer failed;
- transferred;
- qualified;
- resolved;
- follow-up required.

An inbound provider failure before connection is correctly both missed and failed.

## Duration precedence

The ledger stores:

- `totalDurationSeconds`: call start to call end;
- `ringDurationSeconds`: call start to answer;
- `conversationDurationSeconds`: answer to end;
- `billableDurationSeconds`: provider-reported billing duration, then conversation, then total as fallback.

Explicit provider values win over timestamp inference. The legacy `durationSeconds` remains populated with total duration for compatibility.

## Cost precedence

The ledger separates:

- `providerActualCostUsd`;
- `providerEstimatedCostUsd`;
- `customerBillableCost`;
- `billingCurrency`;
- the provider cost breakdown JSON.

The customer amount is snapshotted once per call from the tenant rate and billable seconds. The wallet charge is guarded by `walletChargedAt`, so retrying terminal processing cannot charge twice.

## Analysis lifecycle

`analysisStatus` is one of:

- `pending`;
- `awaiting_analysis`;
- `ready`;
- `not_available`.

A call is counted independently of summary availability. Reconciliation can update the same call when analysis becomes available later.

## Transfer rule

`transfer-update` proves a transfer was requested. It only becomes connected when a provider success/connected/completed signal exists. A failed status sets `transferFailed` without setting `isTransferred`.
