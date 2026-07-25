# Voice Market Isolation Report

Date: 2026-07-25
Scope: UK and Pakistan tenant behavior separation for voice prompt generation and Vapi-to-ERP preparation
Status: foundation implemented and locally verified

## 1. UK workflow verdict

Pass for the implemented foundation layer.

Evidence:
- UK tenant market context resolves to `GBP`, `en-GB`, `Europe/London`, VAT wording, and UK-only payment methods in `modules/markets/tenant-market.ts`.
- UK isolation test passes in `tests/integrations/voice-market-isolation.test.ts`.
- Voice prompt generation now emits UK-specific language and excludes Pakistan behavior in `modules/voice/training/prompt-builder.ts`.

## 2. Pakistan workflow verdict

Pass for the implemented foundation layer.

Evidence:
- Pakistan tenant market context resolves to `PKR`, `en-PK`/`ur-PK`, `Asia/Karachi`, sales-tax wording, and Pakistan-only payment methods in `modules/markets/tenant-market.ts`.
- Pakistan isolation test passes in `tests/integrations/voice-market-isolation.test.ts`.
- Voice prompt generation now emits Pakistan-specific language and excludes UK-only terminology in `modules/voice/training/prompt-builder.ts`.

## 3. UK receipt/invoice evidence

Foundation evidence only.

- UK document labels resolve to `VAT invoice`, `Receipt`, `Amount paid`, `Balance due`, and `VAT breakdown` in `modules/markets/tenant-market.ts`.
- This is validated by the UK market-isolation test in `tests/integrations/voice-market-isolation.test.ts`.

## 4. Pakistan receipt/invoice evidence

Foundation evidence only.

- Pakistan document labels resolve to `Sales invoice`, `Receipt`, `Amount paid`, `Balance due`, and `Sales-tax breakdown` in `modules/markets/tenant-market.ts`.
- This is validated by the Pakistan market-isolation test in `tests/integrations/voice-market-isolation.test.ts`.

## 5. UK ledger/report evidence

Foundation evidence only.

- UK report labels resolve to `VAT summary` and UK payment grouping labels in `modules/markets/tenant-market.ts`.
- UK mixed-currency journal rejection is covered by the shared journal guard test in `tests/integrations/voice-market-isolation.test.ts`.

## 6. Pakistan ledger/report evidence

Foundation evidence only.

- Pakistan report labels resolve to `Sales-tax summary` and Pakistan payment grouping labels in `modules/markets/tenant-market.ts`.
- Pakistan market-specific payment isolation is covered in `tests/integrations/voice-market-isolation.test.ts`.

## 7. Market-isolation test results

Verified locally:

- `npx tsx --test tests/integrations/voice-erp-*.test.ts tests/integrations/voice-market-isolation.test.ts`
  Result: 23 passed, 0 failed
- `npx tsc --noEmit`
  Result: passed

Assertions covered:

- UK tenant never receives Pakistan payment methods in market context and payment conversion
- Pakistan tenant never receives UK-only payment methods
- prompts use correct market terminology
- phone normalization respects `+44` and `+92`
- tenant market override is rejected
- mixed-currency journal payloads are rejected
- missing or invalid tenant market stays in review mode

## 8. Hardcoded country assumptions found

Fixed in this pass:

- `modules/voice/training/prompt-builder.ts`
  Previously lacked explicit tenant-market enforcement in prompt construction.
- `lib/voice/prompt-builder.ts`
  Previously hardcoded Pakistan-oriented greeting and language behavior.
- `modules/voice/erp/payment-conversion.ts`
  Previously accepted a market-agnostic payment method list.
- `modules/voice/erp/customer-resolution.ts`
  Previously normalized phones without tenant market as the primary hint.
- `app/onboarding/steps/MarketStep.tsx`
  Previously defaulted to `pk` when no explicit market was present.
- `app/onboarding/steps/IndustryStep.tsx`
  Previously defaulted to `pk` when no explicit market was present.

Still present outside this focused foundation slice:

- Some broader UI/admin/reporting files still contain explicit Pakistan-oriented demo or display defaults and need a wider market-separation sweep.

## 9. Mixed-market risks

Remaining risks:

- Full invoice, receipt, journal, and reporting generation paths are not yet fully routed through the new tenant market context layer.
- Some non-voice UI and mock integration areas still contain hardcoded country or currency defaults.
- Onboarding state resolution in backend service code still contains inference logic for suggested markets; voice/ERP execution paths now block unsafe activation when market review is required, but the broader onboarding flow still needs a stricter end-to-end cleanup.

## 10. Final statement

For the implemented voice prompt and Vapi-to-ERP preparation foundation, UK and Pakistan tenants now receive separated market behavior enforced by backend market validation, market-specific payment filtering, market-aware prompt rules, and market-isolation tests.

This is not yet a full-system guarantee for every invoice, receipt, ledger, and report screen in the product. A broader follow-up pass is still required to route every financial and document generation path through the same market context layer.
