# WhatsQuery Operational Models

Source of truth:

- `modules/onboarding/industry-profiles.ts`

Verified model keys:

- `immediate_order`
- `retail_transaction`
- `future_booking`
- `quote_to_order`
- `manufacturing_order`
- `distribution_order`
- `case_management`

Not currently verified as production tenant models:

- recurring service
- subscription fulfilment
- job/site fulfilment

## Why this matters

The platform must not map restaurant order requests, wholesale account orders, and production work orders into one generic lifecycle. The profile registry keeps operational models explicit so onboarding, terminology, integrations, and voice permissions can branch safely.
