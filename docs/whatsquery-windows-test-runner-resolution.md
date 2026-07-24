# WhatsQuery Windows Test Runner Resolution

## Observed failure

The restricted Windows session returns `spawn EPERM` when `tsx` starts the
esbuild child process. This occurs before test assertions execute.

## Chosen reliable path

Run the TypeScript test suites on Linux CI or on the Contabo VPS application
checkout:

```bash
npx tsx --test tests/onboarding/*.test.ts
npx tsx --test tests/integrations/*.test.ts
npx tsx --test tests/telecom/*.test.ts
```

This avoids weakening Windows Defender, antivirus or Controlled Folder Access.
The Windows failure must not be reported as a test assertion failure.

## Local alternatives

- use WSL in an approved development directory;
- use an elevated approved development shell;
- precompile tests and use Node's native test runner;
- verify that the installed esbuild binary is allowed to execute.

Do not disable workstation security globally.
