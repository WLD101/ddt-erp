# Local Development Guide

## Running the Application
Use Turbopack for faster local development:
```bash
npm run dev
```

## Running Tests
WhatsQuery includes multiple test suites:

- **Security Tests:** `npm run test:security`
- **Onboarding Tests:** `npm run test:onboarding`
- **Telecom / Voice Tests:** `npm run test:telecom`
- **Integrations:** `npm run test:integrations`
- **Database Migrations:** `npm run test:migrations`
- **All Tests:** `npm run test`

## Linting and Code Quality
We enforce strict linting to maintain a production-grade codebase.
```bash
npm run lint
```
If you encounter ESLint errors, please fix them rather than ignoring them. The configuration uses modern ESLint 9+ flat config rules.

## Prisma Workflows
Always ensure your `.env` is loaded. Scripts like `npm run prisma:validate` will pre-check your environment and fail safely if it is missing.

To create a new migration:
```bash
npx prisma migrate dev --name <migration_name>
```

To sync the schema without generating a migration (e.g. rapid prototyping):
```bash
npx prisma db push
```
