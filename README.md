# WhatsQuery - Multi-Tenant SaaS Platform

A high-performance WhatsQuery optimized for VPS deployment.

## 🚀 Local Development (Docker)

Use the optimized local environment for fast preview and hot-reloading.

### Commands:
```bash
# 1. Start the stack (Fast Preview)
docker-compose -f docker-compose.local.yml up -d --build

# 2. View logs
docker-compose -f docker-compose.local.yml logs -f app

# 3. Apply migrations (if needed)
docker-compose -f docker-compose.local.yml exec app npx prisma migrate deploy

# 4. Stop containers
docker-compose -f docker-compose.local.yml down

# 5. Clean Rebuild (if context is still slow)
docker system prune -f
docker-compose -f docker-compose.local.yml build --no-cache
```

## 🛠️ Infrastructure Hardening
- **Multi-Tenancy**: Strict server-side organization isolation.
- **Dockerization**: Optimized build context (< 50MB) via `.dockerignore`.
- **Worker**: Background processing via BullMQ.
- **Security**: Redis rate limiting, Turnstile bot protection, and Secure Headers.

## 📁 Key Folders
- `app/`: Next.js App Router (Frontend + API)
- `modules/`: Industry-specific logic (Textile, Manufacturing, Retail)
- `lib/`: Core utilities (Auth, Security, Database)
- `prisma/`: Database schema and migrations

## 🧭 AI-First ERP Roadmap
- Architecture review: [docs/AI_FIRST_ERP_ARCHITECTURE_REVIEW.md](./docs/AI_FIRST_ERP_ARCHITECTURE_REVIEW.md)
- Delivery roadmap: [docs/AI_FIRST_ERP_ROADMAP.md](./docs/AI_FIRST_ERP_ROADMAP.md)
- Release playbook: [docs/AI_FIRST_ERP_DELIVERY_PLAYBOOK.md](./docs/AI_FIRST_ERP_DELIVERY_PLAYBOOK.md)

## 🛡️ Security
Check the [Security Checklist](./security_checklist.md) for VPS hardening steps.
