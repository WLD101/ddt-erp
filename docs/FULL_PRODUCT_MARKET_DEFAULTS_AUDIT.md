# Full Product Market Defaults Audit

Audit date: July 25, 2026
Repository slice: WhatsQuery voice and ERP review workflow
Scope: market defaults, hardcoded country cues, payment references, currency display, timezone assumptions, and pilot-facing voice pages

## Summary

This slice is now safer for tenant-scoped UK and Pakistan behavior in the Vapi-to-ERP approval path, but the repository still contains several market-specific constants outside the approval workflow.

The new review workflow uses tenant-derived market, currency, timezone, phone normalization, and country-scoped voice catalogue rules. No approval path in this slice trusts Vapi-provided tenant, market, pricing, or payment settlement data.

## Classified occurrences

### Valid

- `modules/voice/vapi/voice-catalog.ts`
  Classification: `valid`
  Reason: country-scoped approved voice catalogue with explicit `en-GB` and `en-PK` locales.

- `modules/voice/training/prompt-builder.ts`
  Classification: `valid`
  Reason: explicit UK/Pakistan prompt separation, including blocked cross-market terminology.

- `modules/voice/pricing-profiles.ts`
  Classification: `valid`
  Reason: supports localized display pricing profiles for UK and Pakistan; does not drive tenant ERP accounting.

- `components/voice/smart-voice-onboarding-form.tsx`
  Classification: `valid`
  Reason: explicit country selector for `GB` and `PK` is required by the country-first onboarding policy.

### Test-only

- `tests/integrations/country-first-voice-policy.test.ts`
  Classification: `test-only`
  Reason: hardcoded `+44`, `+92`, `GBP`, `PKR`, `VAT`, `JazzCash`, `FBR`, `NTN`, and `STRN` are deliberate assertions.

- `tests/integrations/voice-market-isolation.test.ts`
  Classification: `test-only`
  Reason: direct market-specific strings validate isolation rules and are not runtime defaults.

- `tests/acceptance/voice-to-erp-review-workflow.test.ts`
  Classification: `test-only`
  Reason: four explicit tenant fixtures are intentional acceptance coverage.

- `tests/integrations/voice-erp-pakistan-language-fixtures.test.ts`
  Classification: `test-only`
  Reason: Roman Urdu and mixed-language examples are deliberate fixture coverage.

### Mock-only

- `components/voice/voice-training-center.tsx`
  Classification: `mock-only`
  Reason: PKR demo menu content is placeholder onboarding/training content, not tenant runtime pricing.

- `app/(voice)/voice/dashboard/numbers/page.tsx`
  Classification: `mock-only`
  Reason: country/provider rows are static preview data and should eventually become tenant-driven.

- `app/(voice)/voice/admin/routing/RoutingSimulatorClient.tsx`
  Classification: `mock-only`
  Reason: `+923001234567` is simulator seed data, not production routing logic.

### Unsafe production default

- `app/(voice)/voice/dashboard/orders/[id]/receipt/page.tsx`
  Classification: `unsafe production default`
  Reason: hardcoded `Rs.` and `en-PK` formatting make every receipt Pakistan-specific.
  Action: requires tenant-derived currency and locale before this page is trusted for UK tenants.

- `app/(voice)/voice/admin/tenants/page.tsx`
  Classification: `unsafe production default`
  Reason: wallet balances shown as `PKR` for every tenant.
  Action: requires tenant-derived display currency.

- `app/(voice)/voice/admin/tenants/[id]/page.tsx`
  Classification: `unsafe production default`
  Reason: wallet and MRR panels hardcode `PKR`.
  Action: requires tenant-derived display currency.

### Requires UI fix

- `components/voice/voice-localized-pricing.tsx`
  Classification: `requires UI fix`
  Reason: fallback order prefers `PKR` then `GBP`; display works for localization but the fallback should be tied to detected visitor locale or explicit tenant/country routing.

- `components/voice/voice-landing-page-client.tsx`
  Classification: `requires UI fix`
  Reason: multiple currencies are embedded in pricing cards. This is acceptable for public comparison, but the primary CTA flow should present a clearer tenant-country-first default.

- `app/(voice)/voice/docs/page.tsx`
  Classification: `requires UI fix`
  Reason: docs examples embed multi-currency pricing examples. Safe for documentation, but they should label localized display prices more explicitly.

### Requires backend fix

- `modules/voice/actions.ts`
  Classification: `requires backend fix`
  Reason: fallback menu parsing examples still reference `PKR` and `USD` directly. Acceptable for import guidance, but the final persistence layer should derive currency guidance from tenant market where possible.

- `app/(voice)/voice/dashboard/orders/[id]/receipt/page.tsx`
  Classification: `requires backend fix`
  Reason: receipt generation currently formats as Pakistan-only and is not yet market-derived server-side.

### Requires migration

- None identified in the broader repository outside the new `VoiceReviewItem`, `VoiceReviewTransition`, `VoiceOutcomeLink`, and `VoiceBooking` workflow tables added in this slice.

## Safe fixes completed in this slice

- Added tenant-scoped review workflow states and transition history.
- Added idempotent outcome linking for customer, order draft, and booking conversions.
- Enforced tenant and branch scoping on approval actions.
- Enforced backend-owned order pricing in the approval path.
- Added country-scoped British and Pakistan voice catalogue coverage.
- Added Pakistan mixed-language fixture normalization coverage.

## Remaining unsafe defaults

- Pakistan-only receipt formatting in `app/(voice)/voice/dashboard/orders/[id]/receipt/page.tsx`
- PKR-only admin wallet displays in:
  - `app/(voice)/voice/admin/tenants/page.tsx`
  - `app/(voice)/voice/admin/tenants/[id]/page.tsx`
- Static simulator/demo numbers in:
  - `app/(voice)/voice/dashboard/numbers/page.tsx`
  - `app/(voice)/voice/admin/routing/RoutingSimulatorClient.tsx`

## Recommendation

Treat the Vapi-to-ERP approval slice as market-safe for pilot approval workflows only.

Do not classify the entire voice UI or admin area as fully market-safe until receipt formatting, wallet currency display, and simulator defaults are made tenant-derived.
