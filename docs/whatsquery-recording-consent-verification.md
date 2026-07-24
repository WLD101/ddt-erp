# WhatsQuery Recording Consent Verification

Evidence date: 2026-07-24

Status: **Code complete; provider and legal verification pending**

## Implemented controls

- Recording and transcription default to disabled.
- Tenant policy includes disclosure type/text, playback/access controls and
  separate recording/transcript retention windows.
- The Vapi assistant payload uses artifact and recording-consent plans.
- Provider consent evidence is read from
  `compliance.recordingConsent.grantedAt`.
- Webhook artifacts are stripped before encrypted persistence when policy or
  consent does not permit them.
- Recording/transcript access is tenant-scoped; clinical-industry playback is
  owner-only.
- Owner-only deletion APIs record deletion timestamps.
- Retention removes artifacts using each tenant's configured policy.

## Required market verification

| Check | UK | Pakistan |
| --- | --- | --- |
| Approved legal basis and disclosure wording | Pending counsel | Pending counsel |
| Inbound disclosure heard before recording | Not run | Not run |
| Outbound disclosure heard before recording | Not run | Not run |
| Consent evidence received from Vapi | Not run | Not run |
| Declined/no consent produces no stored artifact | Not run | Not run |
| Playback authorization enforced | Local code only | Local code only |
| Deletion and retention confirmed | Local code only | Local code only |

This document is an engineering verification plan, not legal advice. Recording
must remain disabled until the applicable policy owner approves the wording and
the live negative/positive call tests pass.

## Evidence procedure

1. Use a dedicated pilot tenant and consenting test callers.
2. Confirm policy values in the database without exposing private content.
3. Place one consented and one declined/no-consent call per approved market.
4. Confirm Vapi artifact settings and consent timestamp.
5. Confirm the declined call stores no recording/transcript URL or content.
6. Test allowed and denied playback roles.
7. Delete the test artifact and verify deletion timestamps.
8. Run the retention job with an expired test artifact and verify removal.

## Automated evidence

`tests/security/voice-privacy.test.ts` verifies stripping without consent,
permitted artifact retention with consent, transcription denial, and assistant
artifact/consent configuration.

