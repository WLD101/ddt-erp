# WhatsQuery CI and Migration Process

## Verification CI

Ordinary pull requests run Prisma validation and generation, TypeScript checks,
onboarding tests, integration tests and a production build on Linux. This is the
reliable alternative to the restricted Windows `tsx` child-process environment.

## Production migrations

Production migration execution is separate from ordinary CI.

Preferred immediate method:

1. inspect topology on Contabo;
2. create and restore-test a container backup;
3. run migration preflight as `whatsquery`;
4. deploy with the verified archive path;
5. run aggregate live verification.

The optional protected workflow uses a self-hosted runner physically located on
the Contabo VPS. It must be assigned the `whatsquery-vps` label and protected by
the GitHub `production` environment. A GitHub-hosted runner must not be given
public database access merely for migrations.

Migration secrets remain environment-scoped and are never committed.
