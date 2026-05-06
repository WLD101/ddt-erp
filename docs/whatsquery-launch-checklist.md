# WhatsQuery Launch Checklist

## Local Test Checklist

- `npm install`
- `npx prisma generate`
- `npm run seed`
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run test:security`
- Start the app with `npm run dev`
- Verify `/`, `/pricing`, `/auth/signin`, `/auth/signup`
- Verify `/dashboard`, `/customers`, `/suppliers`, `/products`, `/inventory`, `/sales`, `/purchases`, `/reports`
- Verify `/settings`, `/settings/integrations`, `/wq-command-center`

## Production Deploy Checklist

- Set `NEXTAUTH_URL` to the production origin
- Set `NEXTAUTH_SECRET` and `INTEGRATION_CREDENTIAL_SECRET`
- Set `SUPER_ADMIN_EMAILS`
- Review outgoing email sender configuration
- Replace example ecommerce/demo values with real credentials only on the server
- Confirm demo mode is disabled in production unless intentionally needed
- Verify export download routes and admin-only routes after deploy
- Confirm the secret admin route `/wq-command-center` is not linked publicly

## Environment Checklist

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `SUPER_ADMIN_EMAILS`
- `INTEGRATION_CREDENTIAL_SECRET`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`
- Optional: `REDIS_URL`, `DARAZ_API_BASE_URL`, `SHOPIFY_API_VERSION`, `DEMO_MODE`

## Demo Presentation Checklist

- Use the seeded Al Sadiq Traders workspace
- Sign in with the demo admin before the meeting
- Start from `/dashboard`
- Walk through customers, suppliers, products, inventory, sales, purchases, reports
- Open `/settings/integrations` for channel overview
- Use `/wq-command-center` for hidden operator controls only
- Use `/dashboard/demo-script` only for internal prep
- Avoid unfinished or low-priority routes unless the client specifically asks

## Features Ready

- Multi-tenant auth and tenant resolution
- Demo seed with populated SME data
- Dashboard with business and ecommerce widgets
- Customers, suppliers, products, inventory, sales, purchases
- Reports and billing/package surfaces
- Daraz, Shopify, WooCommerce, and CSV import architecture
- Platform admin overview, tenants, packages, exports

## Features Not Fully Ready

- Full production-grade package limit enforcement everywhere
- Full live ecommerce endpoint coverage for every provider
- Broad content polish across every marketing/industry page
- Comprehensive middleware-based redirect UX
- Deep cleanup of older `@ts-nocheck` modules

## Bugs Still Remaining

- Mixed route grouping between `/dashboard/*` and top-level tenant routes raises long-term maintenance risk
- Some pages still contain old tone or placeholder business copy that should be cleaned up before launch
- Partner and marketing flows need another content QA pass
- Tenant safety is strong but still depends on consistent use of scoped server actions and Prisma helpers
- `npx prisma generate` can still hit a Windows Prisma engine file-lock issue if another local process is holding the client binary

## Recommended Next Steps

1. Finish the remaining WhatsQuery branding sweep on all marketing/industry pages.
2. Normalize tenant route structure to reduce redirect complexity.
3. Remove `@ts-nocheck` from auth/service and other core modules.
4. Add stronger automated route smoke tests for dashboard, onboarding, and platform flows.
5. Review every export, invoice, and PDF output with final business branding.
