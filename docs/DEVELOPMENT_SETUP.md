# Development Setup

This document covers how to setup the repository from a fresh clone.

## Prerequisites
- Node.js >= 20
- npm >= 10
- PostgreSQL >= 15 (Locally or via Docker)
- Redis >= 7 (Locally or via Docker)

## Step-by-Step Setup

1. **Clone the Repository**
   ```bash
   git clone <repository_url>
   cd whatsquery
   ```

2. **Configure Environment Variables**
   The project requires a `.env` file to function.
   ```bash
   cp .env.example .env
   ```
   **Important:** Open `.env` and configure `DATABASE_URL` and `DIRECT_URL` to point to your PostgreSQL instance. 
   See [Environment Variables](ENVIRONMENT_VARIABLES.md) for details on all required keys.

3. **Install Dependencies**
   ```bash
   npm ci
   ```

4. **Verify Environment**
   Run the environment check script to ensure your `.env` file is properly configured before running Prisma.
   ```bash
   npm run check:env
   ```

5. **Generate Prisma Client & Validate Database**
   ```bash
   npm run prisma:generate
   npm run prisma:validate
   ```
   *Note: If you have not migrated your database yet, run `npx prisma db push` or `npx prisma migrate dev`.*

6. **Run the Development Server**
   ```bash
   npm run dev
   ```

## Next Steps
Read the [Local Development Guide](LOCAL_DEVELOPMENT.md) for workflows like running tests, using Turbopack, and more.
