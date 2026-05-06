# WhatsQuery VPS Deployment Guide

## 1. Server Requirements

- Node.js 20+
- npm 10+
- SQLite for current default deployment
- PM2 or systemd for process management
- Nginx or Caddy as reverse proxy

## 2. Environment Setup

Create `.env` from `.env.example` and set:

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `SUPER_ADMIN_EMAILS`
- `INTEGRATION_CREDENTIAL_SECRET`
- `DEMO_MODE=false`

Recommended production additions:

- `RESEND_API_KEY`
- `EMAIL_FROM`
- `REDIS_URL`
- `DARAZ_API_BASE_URL`
- `SHOPIFY_API_VERSION`

## 3. Install and Build

```bash
npm install
npx prisma generate
npm run seed
npx tsc --noEmit
npm run build
```

## 4. Start the App

```bash
npm run dev
```

For production process management, prefer:

```bash
npm run build
npx next start -p 3000
```

## 5. Reverse Proxy

Point your domain to the Node process and ensure HTTPS is enabled.

Set:

- `NEXTAUTH_URL=https://your-domain.example`

## 6. First Admin Access

1. Add your email to `SUPER_ADMIN_EMAILS`.
2. Sign in normally.
3. Open `/wq-command-center`.

## 7. Demo Preparation

1. Run `npm run seed`.
2. Sign in with:
   - `admin@alsadiq.local`
   - `Demo123!`
3. Verify:
   - `/dashboard`
   - `/customers`
   - `/products`
   - `/inventory`
   - `/sales`
   - `/purchases`
   - `/reports`
   - `/settings/integrations`

## 8. Production Notes

- Windows Prisma workaround:
  1. Stop repo-local `node` / `next dev` processes.
  2. Delete `node_modules/.prisma`.
  3. Delete `node_modules/@prisma/client`.
  4. Run `npm install`.
  5. Run `npx prisma generate`.
- This was validated locally and resolved the Windows `EPERM rename ...query_engine-windows.dll.node.tmp` error.
- `npm run build` currently passes and runs TypeScript validation.
- `npm run test:security` currently passes.
- `npm run lint` passes with warnings that should be cleaned up after launch prep.
