# WhatsQuery Capability Registry

Source of truth:

- `modules/onboarding/industry-profiles.ts`

This registry defines which capabilities are:

- actually active today
- beta-only
- planned only

Examples:

- `supports_inventory`
- `supports_quotes`
- `supports_production`
- `supports_future_bookings`
- `supports_kitchen_workflow`
- `supports_quality_control`
- `supports_credit_sales`

Rules:

- capabilities are attached to industry profiles
- capabilities drive terminology, onboarding summary, and future integration recommendations
- planned profiles may contain planned capabilities, but UI should stay feature-flagged
