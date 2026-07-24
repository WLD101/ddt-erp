# WhatsQuery Market-Aware Onboarding

## What changed

The onboarding flow now includes an explicit market step before industry selection:

```text
Welcome
-> Market
-> Industry
-> Business info
-> Remaining setup
```

## Behavior

When the customer selects a market:

- default currency is applied
- locale is applied
- time zone is applied
- default country code is applied
- pricing profile is assigned
- compliance profile is assigned
- `marketRequiresReview` is cleared for that tenant

## Industry filtering

Industry choices are now filtered by market profile instead of showing a flat global list.

Examples:

- UK emphasizes service, restaurant, clinic, retail, ecommerce, wholesale, and distribution
- Pakistan emphasizes restaurant, retail, wholesale, distribution, manufacturing, textile, ecommerce, and service

## Recommendation flow

The recommendation layer now combines:

- selected market
- selected industry
- operational answers

This produces:

- localized integration suggestions
- localized voice locale options
- market-aware defaults for business profile setup

## Current limitation

The onboarding flow now stores and reads market selections in code, but the production database must still receive the market-profile migration before this becomes fully durable for all tenants.
