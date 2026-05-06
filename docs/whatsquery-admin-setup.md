# WhatsQuery Admin Setup Guide

## Required Environment Variables

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `SUPER_ADMIN_EMAILS`
- `INTEGRATION_CREDENTIAL_SECRET`
- `DEMO_MODE`

Optional but recommended:

- `RESEND_API_KEY`
- `EMAIL_FROM`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`
- `REDIS_URL`
- `DARAZ_API_BASE_URL`
- `SHOPIFY_API_VERSION`

## Create a Platform Admin

1. Create a normal user through signup or seed data.
2. Add that user email to `SUPER_ADMIN_EMAILS`.
3. Restart the app.
4. Sign in and open `/wq-command-center`.

## Demo Admin

Current seeded demo admin:

- `admin@alsadiq.local`
- `Demo123!`

## Command Center

Primary hidden route:

- `/wq-command-center`

Use it to:

- assign packages
- approve manual payments
- extend subscriptions
- suspend or reactivate organizations
- override country and currency

## Manual Payment Flow

1. Tenant signs up and completes onboarding.
2. Tenant selects a package.
3. Organization enters `payment_pending`.
4. Platform admin opens `/wq-command-center`.
5. Admin approves payment.
6. Tenant access becomes `active`.

## Demo Mode

Set:

- `DEMO_MODE=true`

Effects:

- destructive actions are blocked where guarded
- user-facing message shows: `Disabled in demo mode`
- integrations can fall back to mock behavior

## Subscription Testing

### Test payment pending

1. Create a new tenant.
2. Select a package.
3. Do not approve payment.
4. Confirm access stays gated.

### Test active subscription

1. Approve payment in `/wq-command-center`.
2. Confirm dashboard access opens.

### Test grace period

1. Set `currentPeriodEnd` in the past for a paid tenant.
2. Load tenant app.
3. Confirm grace warning appears and access continues for 15 days.

### Test blocked / expired

1. Change access status in `/wq-command-center` to `blocked` or `expired`.
2. Confirm tenant is redirected to billing instead of dashboard.

## Tenant Isolation Checks

Verify:

- one tenant cannot access another tenant’s customers/products/invoices
- branch-restricted staff cannot force another branch through cookies
- platform admins do not resolve tenant context automatically
