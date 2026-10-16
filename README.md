# ClinicQ

AI-assisted clinic appointment platform.

## Problem

Small and mid-size clinics lose time and patients because patients don't know which specialist they need, phone booking causes double-booking, and doctors see patients with zero context.

ClinicQ fixes this end-to-end: conversational booking, safe slot allocation, a live queue with honest wait estimates, and a doctor view that arrives with a short summary of why the patient is there.

## Architecture

```
apps/
  api/    Express + Prisma + LangGraph.js (TypeScript, runs on Bun/Node)
  web/    Next.js 16 + shadcn/ui + Tailwind v4
packages/
  shared/ Zod schemas and shared types (optional)
```

## Setup

### Prerequisites
- [Bun](https://bun.sh) >= 1.x
- [Docker](https://docker.com) (for local Postgres with pgvector)
- Node.js >= 20 (fallback runtime for the API if needed)

### Local Development

1. **Start Postgres:**
   ```bash
   docker-compose up -d
   ```

2. **Install dependencies:**
   ```bash
   bun install
   ```

3. **Configure environment:**
   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   # Fill in values
   ```

4. **Run migrations & seed:**
   ```bash
   cd apps/api
   bun run db:migrate
   bun run db:seed
   ```

5. **Start dev servers:**
   ```bash
   # API (terminal 1)
   bun run dev:api

   # Web (terminal 2)
   bun run dev:web
   ```

## Demo Credentials

| Role        | Email                     | Password    |
|-------------|---------------------------|-------------|
| Admin       | admin@demo.clinicq.com    | Demo1234!   |
| Doctor      | doctor@demo.clinicq.com   | Demo1234!   |
| Receptionist| reception@demo.clinicq.com| Demo1234!   |
| Patient     | patient@demo.clinicq.com  | Demo1234!   |

## Environment Variables

See `apps/api/.env.example` and `apps/web/.env.example`.

## Key APIs

See `apps/api/AGENTS.md` for full API contract.

## Assistant Design

See `apps/api/AGENTS.md` — the AI booking assistant section.

## Known Limitations & Next Steps

- TBD as the project progresses.

## Deployment

- **Web:** Vercel (root directory: `apps/web`)
- **API:** Render (WebSocket capable)
- **Database:** Neon (Postgres + pgvector)
