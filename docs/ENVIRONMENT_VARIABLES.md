# Environment Variables

This project relies on environment variables defined in a `.env` file at the root directory.
Never commit your `.env` file to version control.

## Required Variables

### Database Connection
- `DATABASE_URL`: The primary PostgreSQL connection string. Must include `?schema=public` or similar. Used by Prisma Client for application queries.
- `DIRECT_URL`: The direct connection to PostgreSQL used by Prisma for migrations (`prisma migrate`). Essential for Supabase or pooled connections.

## Optional / Integration Variables

### Voice & Telecom
- `VOICE_APP_HOST`: Public subdomain hostname for the voice app.
- `VOICE_PRODUCT_ENABLED`: Set to `true` to enable the voice features.
- `VOICE_VAPI_API_KEY`: API key for Vapi.
- `VOICE_TWILIO_ACCOUNT_SID`: Twilio SID.
- `VOICE_TWILIO_AUTH_TOKEN`: Twilio Auth Token.

### Security
- `NEXTAUTH_SECRET`: Secret used to encrypt NextAuth.js tokens.
- `ENCRYPTION_KEY`: Secret used for encrypting sensitive tenant information.

### Third-Party Services
- `RESEND_API_KEY`: For email delivery.
- `STRIPE_SECRET_KEY`: For billing.

See `.env.example` for a comprehensive list of all variables and their descriptions.
