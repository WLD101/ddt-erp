# WhatsQuery Call Metric Definitions

All tenant dashboards must query `VoiceCallLog`; they must not query Vapi on page load. Calls marked `isTestCall` are excluded from tenant usage metrics.

| Metric | Definition |
| --- | --- |
| Total calls | Unique local provider call identities created in the period |
| Inbound calls | `callDirection = INBOUND` |
| Outbound calls | `callDirection = OUTBOUND` |
| Answered calls | `isAnswered = true` based on connection evidence |
| Completed calls | `isCompleted = true`; answered and terminal completed |
| Missed calls | inbound, terminal, not answered, and not voicemail |
| Failed calls | technical or provider failure, regardless of missed status |
| Abandoned calls | inbound caller ended before answer without a technical failure |
| Transferred calls | provider-confirmed `isTransferred = true` |
| Voicemail calls | `isVoicemail = true` |
| Qualified calls | validated structured outcome or lead-qualified signal |
| Resolved calls | validated resolved outcome |
| Follow-up calls | missed, callback requested, or follow-up outcome |
| Average conversation duration | total conversation seconds divided by answered calls |
| Billable minutes | sum of each call's billable seconds rounded to its billing increment |
| Provider cost | sum of provider actual cost, with legacy cost fallback |
| Customer billable amount | sum of immutable call-level customer charges |
| Human escalation rate | transferred calls divided by total calls |
| AI resolution rate | resolved calls divided by total calls |

Important overlaps:

- an inbound technical failure may count as both missed and failed;
- a transferred call may also be answered and completed;
- a voicemail is not counted as answered or missed;
- missing analysis never removes a call from totals.

Reporting time uses the stored call creation/start period consistently. Historical reports should state which timestamp and timezone were selected.
