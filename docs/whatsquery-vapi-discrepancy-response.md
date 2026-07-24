# WhatsQuery Vapi Discrepancy Response

## Severity

| Condition | Severity | First action |
| --- | --- | --- |
| Vapi API unauthorized | Critical | verify scoped production key and rotation |
| Repeated invalid webhook authentication | High | inspect Vapi credential and reverse proxy |
| Provider-only calls | High | inspect phone/assistant mapping, then import |
| WhatsQuery-only calls | High | verify reconciliation window and provider retention |
| Tenant unresolved | High | repair trusted mapping; never assign randomly |
| Duplicate deliveries increasing | Medium | inspect provider retries and endpoint latency |
| Call missing end state | Medium | reconcile the recent six-hour window |
| Analysis missing | Medium | retry reconciliation; call remains counted |
| Duration mismatch | Medium | prefer final provider duration and record correction |
| Cost mismatch | High | suspend disputed customer adjustment and review provider detail |
| Dead-letter event | High | inspect error code, repair cause, then replay |

## Response workflow

1. Open `/voice/admin/vapi-health`.
2. Record the aggregate issue type, affected provider call IDs, and time range.
3. Run a dry reconciliation with a narrow window.
4. Verify the trusted tenant mapping.
5. Compare status, timestamps, duration, cost, and analysis without printing customer content.
6. Apply `--only-missing` for missing records.
7. Use `--repair` only after reviewing field precedence.
8. Confirm the dashboard contribution remains one call.
9. Confirm wallet and ERP outcome idempotency.
10. Close the incident with the redacted reconciliation report.

## Provider-only call

- Check phone-number ID mapping first.
- Check assigned inbound number second.
- Check assistant ID third.
- Check whether the outbound call record was created before dialing.
- Never infer a tenant from caller-supplied metadata.
- Apply a controlled import after mapping is corrected.

## WhatsQuery-only call

- Confirm the provider scan completed and did not hit `maxPages`.
- Check whether the record is a manual development log or explicit test call.
- Check Vapi retention and the connected Vapi organization.
- Do not delete the local record automatically.

## Cost mismatch

- Compare provider actual total and cost breakdown.
- Confirm billable seconds and per-call rounding.
- Confirm the tenant currency and historical rate snapshot.
- Do not overwrite historical pricing with the current plan.
- Use a reviewed adjustment workflow for customer billing; do not silently mutate wallet history.

## Missing analysis

The call remains in all lifecycle totals. Set or retain `awaiting_analysis`, retry recent reconciliation, and escalate only after the configured analysis timeout.

## Privacy

Incident reports must not contain:

- Vapi API keys or webhook secrets;
- full phone numbers;
- transcripts;
- recordings;
- tool arguments with personal data;
- full encrypted payloads.

Use provider call IDs, tenant IDs, timestamps, counts, and discrepancy codes.
