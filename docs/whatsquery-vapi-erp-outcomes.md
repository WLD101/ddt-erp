# WhatsQuery Vapi ERP Outcomes

## Idempotency

Every Vapi tool execution receives an outcome key:

```text
vapi:<call-id>:tool:<tool-call-id>
```

`VoiceLead`, `VoiceReservationRequest`, and `VoiceOrderRequest` have unique nullable `outcomeKey` fields. If a worker retries after a partial failure, the same ERP record is returned instead of creating a duplicate.

## Implemented outcomes

| Voice tool | Operational record | Confirmation policy |
| --- | --- | --- |
| `capture_lead` | `VoiceLead` | follow-up only |
| `request_appointment` | `VoiceReservationRequest` | staff review required |
| `create_order_request` | `VoiceOrderRequest` | staff review required |
| `handoff_to_staff` | callback `VoiceLead` | no automatic outbound promise |
| missed inbound terminal call | idempotent callback `VoiceLead` | staff review required |
| `summarize_call` | same `VoiceCallLog` | informational |
| `lookup_faq` | read-only knowledge lookup | no ERP write |
| `get_business_hours` | read-only settings lookup | no ERP write |
| `get_fallback_contact` | read-only settings lookup | no ERP write |

The code explicitly avoids turning a reservation request into a confirmed booking or an order request into an accepted production order.

## Post-call structured outcome

Provider structured data is stored in `VoiceCallLog.structuredDataJson`. Shared fields interpreted by the lifecycle include:

- `outcome`;
- `callOutcome`;
- `leadQualified`;
- `resolved`;
- `requestedCallback`.

Unknown industry-specific fields are retained for authorized operational use but are not automatically written into unrelated ERP tables.

## Current limitations

- Dedicated wholesale enquiry and textile buyer-enquiry models were not created because the repository does not yet have approved canonical models for those records. Structured data remains on the call and `requiresFollowUp` is set.
- Missed calls set `requiresFollowUp` and create one callback-review lead per call. Automatic SMS or WhatsApp delivery remains governed by existing tenant channel settings.
- Vapi tool calls receive a synchronous `queued` response. The assistant must not claim booking, reservation, order, or staff confirmation until the asynchronous ERP workflow completes.
- Tool success-rate reporting requires a canonical tool execution ledger. Existing `VoiceActionAuditLog` can be expanded in a later migration rather than creating another duplicate event system.

## Safe extension rule

When adding an industry outcome:

1. validate structured data;
2. resolve the trusted tenant from the call ledger;
3. use a unique call/outcome idempotency key;
4. create a request or enquiry, not a production completion;
5. link the call ID;
6. record staff-review state;
7. add a deterministic retry test.
