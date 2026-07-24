# WhatsQuery Industry Profiles

Source of truth:

- `modules/onboarding/industry-profiles.ts`

## Active or beta profiles

| Profile | Status | Confidence | Operational models |
| --- | --- | --- | --- |
| `retail` | active | high | `retail_transaction` |
| `wholesale` | active | high | `quote_to_order`, `distribution_order`, `case_management` |
| `ecommerce` | active | high | `retail_transaction`, `distribution_order` |
| `distribution` | beta | medium | `distribution_order`, `case_management` |
| `manufacturing` | beta | medium | `manufacturing_order`, `quote_to_order` |
| `service_basic` | active | medium | `future_booking`, `quote_to_order`, `case_management` |
| `restaurant_voice` | beta | medium | `immediate_order`, `future_booking`, `case_management` |
| `clinic_voice` | beta | medium | `future_booking`, `case_management` |
| `textile` | planned | low | `manufacturing_order`, `quote_to_order` |

## Notes

- `textile` is intentionally kept as `planned`.
- `real estate` is not included because it was not verified.
- The registry is designed to replace shallow module-only reasoning with profile-driven behavior.
