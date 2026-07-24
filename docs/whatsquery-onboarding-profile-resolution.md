# WhatsQuery Onboarding Profile Resolution

Implemented in:

- `modules/onboarding/industry-profiles.ts`
- `modules/onboarding/service.ts`
- `app/onboarding/steps/IndustryStep.tsx`

## Inputs captured

- business type
- fulfilment mode
- offering type
- quote requirement
- inventory requirement
- raw-material requirement
- preparation/manufacturing requirement
- delivery/collection mode
- payment pattern
- resource assignment
- recurring need
- existing software list

## Resolution behavior

- owners choose an initial industry
- operational answers are scored against the verified profiles
- the UI shows the resolved profile, models, capabilities, and top integration recommendations
- the selected modules remain editable

## Persistence

New fields added:

- `Organization.industryProfileKey`
- `OnboardingState.operationalAnswersJson`
- `OnboardingState.recommendedProfileKey`

Legacy tenants still resolve from `industry` if the new key is empty.
