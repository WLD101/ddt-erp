# WhatsQuery Temporary Deployment: Vercel + Supabase

This guide keeps the app on its current architecture:

- Next.js App Router
- Prisma ORM
- PostgreSQL
- NextAuth

No Supabase SDK is required. Supabase is used only as hosted PostgreSQL.

## 1. Prisma Setup

WhatsQuery is configured for PostgreSQL in [prisma/schema.prisma](C:\Users\WLD10\.gemini\antigravity\scratch\ddt-erp\prisma\schema.prisma).

- `DATABASE_URL` is the runtime connection string
- `DIRECT_URL` is the direct connection used by Prisma CLI commands

Recommended for Supabase:

- `DATABASE_URL`: Supavisor transaction pooler, port `6543`
- `DIRECT_URL`: direct database connection, port `5432`

## 2. Required Scripts

The Vercel build script is available in [package.json](C:\Users\WLD10\.gemini\antigravity\scratch\ddt-erp\package.json):

```json
"vercel-build": "prisma generate && prisma migrate deploy && next build"
```

## 3. Environment Variables

Minimum production variables:

```env
NODE_ENV=production
APP_URL=https://yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=replace-with-long-random-secret
DATABASE_URL=postgresql://postgres.project-ref:password@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres:password@db.project-ref.supabase.co:5432/postgres
SUPER_ADMIN_EMAILS=contact@whatsquery.com
ENCRYPTION_KEY=replace-with-long-random-secret
ALLOW_OTP_BYPASS=false
ENABLE_DEBUG_ROUTES=false
SUPER_ADMIN_BOOTSTRAP_PASSWORD=replace-with-unique-temp-password
```

Optional:

```env
RESEND_API_KEY=
EMAIL_FROM=
REDIS_URL=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=
WOOCOMMERCE_CONSUMER_KEY=
WOOCOMMERCE_CONSUMER_SECRET=
DARAZ_APP_KEY=
DARAZ_APP_SECRET=
DARAZ_ACCESS_TOKEN=
```

## 4. Supabase Setup

1. Create a new Supabase project.
2. Open `Connect`.
3. Copy:
   - transaction pooler URI for serverless runtime (`6543`)
   - direct connection URI for Prisma CLI (`5432`)
4. Add them to your env as `DATABASE_URL` and `DIRECT_URL`.
5. Apply schema:

```bash
npx prisma migrate deploy
npx prisma generate
```

## 5. Vercel Setup

1. Push this repository to GitHub.
2. Import the repo into Vercel.
3. Add all production environment variables in the Vercel dashboard.
4. Set the Build Command to:

```bash
npm run vercel-build
```

5. Deploy.

Preview deployments should use a separate preview database if you want preview migrations to be safe.

## 6. Future VPS Migration

This setup is portable because Prisma remains the source of truth.

Later migration path:

1. Export the Supabase PostgreSQL database.
2. Import it into your VPS PostgreSQL instance.
3. Update `DATABASE_URL` and `DIRECT_URL`.
4. Run:

```bash
npx prisma migrate deploy
npx prisma generate
```

No application-layer rewrite should be required.

## 7. Deployment Smoke Test

After deploy:

1. Sign in as super admin
2. Open `/wq-command-center`
3. Create a tenant
4. Complete onboarding
5. Verify package and billing flow
6. Create quotation -> invoice
7. Verify inventory deduction
8. Verify tenant isolation across two businesses
