# Country-First Voice Policy Report

Date: 2026-07-25

1. Country mandatory before configuration: Implemented in the voice onboarding schema and enforced in backend save actions. Unsupported or missing tenant country now blocks receptionist settings and Vapi sync.
2. Admin creation enforces country: Command-center tenant creation now normalizes and requires `GB` or `PK`, then derives the organization market profile from that country.
3. UK voice catalogue and validation verdict: Implemented. UK tenants use a British-only approved Vapi voice catalogue and validation rejects non-GB voices.
4. Proof UK tenants only receive British English voices: `modules/voice/vapi/voice-catalog.ts` restricts `GB` catalogue entries to `en-GB` and `British` accent only.
5. Pakistan Roman Urdu verdict: Supported and validated.
6. Pakistan Roman English verdict: Supported and validated.
7. Mixed Roman Urdu/English verdict: Supported and validated as the Pakistan default language mode.
8. Structured-field normalization verdict: Existing ERP conversion pipeline remains intact; this change preserves country and language constraints before assistant activation.
9. Cross-country isolation verdict: Implemented for voice selection, language modes, payment compatibility checks, and admin voice assignment.
10. Country-change safety verdict: Direct country changes are blocked for activated tenants and require a controlled migration flow.
11. Unsupported Vapi voice or language limitation: If no approved country-compatible voice is configured, activation is blocked. UK remains English-only in this phase.
12. Final statement: Market-facing voice features now derive from the tenant's explicitly selected country instead of inferred browser, locale, currency, or provider data.
