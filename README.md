# WhatsQuery ERP

WhatsQuery is a monolithic Next.js enterprise ERP tailored for local SME and enterprise operations.

## Architecture & Foundation
* **Framework:** Next.js (App Router, Turbopack)
* **Database:** Prisma with PostgreSQL
* **Styling:** Tailwind CSS + Radix UI + Framer Motion
* **Queues & Background Jobs:** BullMQ + Redis
* **Voice Integration:** Vapi + Twilio
* **Testing:** Node.js native test runner

## Getting Started

Please refer to the detailed documentation for local development setup:
- [Development Setup](docs/DEVELOPMENT_SETUP.md)
- [Environment Variables](docs/ENVIRONMENT_VARIABLES.md)
- [Local Development Guide](docs/LOCAL_DEVELOPMENT.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

## Current Status
This repository is currently in the **Phase 1: Repository Stabilization** stage.
It is structured to be reproducible on both Windows and Linux without manual hacks.
