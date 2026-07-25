# Troubleshooting

## Prisma Validation Fails
**Symptom:** `npx prisma validate` throws errors about missing environment variables.
**Fix:** Run `npm run check:env` to verify your `.env` is setup. Ensure you have copied `.env.example` to `.env` and that both `DATABASE_URL` and `DIRECT_URL` are defined.

## Build Fails with Lint Errors
**Symptom:** `npm run build` fails during the ESLint phase.
**Fix:** We enforce strict typing and linting. Run `npm run lint` locally and fix any reported issues. The project uses ESLint 9+ flat configuration, so make sure your IDE is configured to use the flat config format.

## React Hydration Errors
**Symptom:** The page renders, but the console shows hydration mismatch errors.
**Fix:** Ensure you are not rendering browser-only APIs (like `window` or `localStorage`) on the server. Wrap those components in a dynamic import with `ssr: false` or use a `useEffect` hook.

## Dependency Security Audits
**Symptom:** `npm ci` reports vulnerabilities in upstream packages like `exceljs` or `brace-expansion`.
**Fix:** Some vulnerabilities (e.g., DoS in `brace-expansion`) are accepted risks because they are deeply nested in transitive dependencies that we only use in secure server-side environments. Refer to `DEPENDENCY_SECURITY_REPORT.md` for our current risk assessment matrix before attempting manual overrides.
