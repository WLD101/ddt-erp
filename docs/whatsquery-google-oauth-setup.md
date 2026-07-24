# WhatsQuery Google OAuth Setup

## Required environment variables

Expected variables:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `GOOGLE_WEBHOOK_BASE_URL`
- `GOOGLE_WEBHOOK_VERIFICATION_TOKEN`

## Google Cloud requirements

Use a controlled Google Cloud project with:

- OAuth consent screen
- authorized domain matching deployment
- authorized redirect URI for backend callback only
- limited test users during sandbox rollout
- least-privilege scopes by enabled service

## Security notes

- never expose the client secret to the browser
- do not request broad scopes when narrower ones are enough
- keep Gmail send disabled until the tenant explicitly enables it
- treat OAuth callback validation as tenant-scoped and one-time-use

## Current status

The repository already has OAuth-state foundations, but a full live Google callback and token exchange flow still requires deployment-side credentials and migration-applied schema.
