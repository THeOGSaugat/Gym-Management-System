# Gym Management System

A production-style gym management application for Admins, Trainers and
Members — member management, memberships, payments, attendance, trainer
assignment, workout plans, progress tracking and analytics.

This repository is being built in phases. **Phase 0 (project foundation)**
is complete: project scaffold, database connection, base layout and
error-handling utilities. No authentication, dashboards, or domain features
exist yet — those come in later phases.

## Stack

Next.js (App Router) · TypeScript (strict) · PostgreSQL (Neon) · Prisma ·
Tailwind CSS · shadcn/ui · Zod · React Hook Form · Auth.js (coming in
Phase 1) · Vercel

## Prerequisites

- Node.js 22+ (LTS recommended for deployment; this repo was set up with
  Node 26 locally, which also works)
- A free [Neon](https://neon.tech) PostgreSQL database

## 1. Install dependencies

```bash
npm install
```

## 2. Configure the database

1. Create a free project at [neon.tech](https://neon.tech).
2. In the Neon dashboard, open your project → **Connect** → copy the
   **Prisma**-flavored connection string (it includes `?sslmode=require`).
3. Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

4. Paste your connection string into `.env` as `DATABASE_URL`.

`.env` is gitignored — it will never be committed. `.env.example` is the
committed template that documents what variables are needed.

## 3. Generate the Prisma client

```bash
npx prisma generate
```

This reads `prisma/schema.prisma` and generates a typed client into
`src/generated/prisma` (gitignored, regenerated on every install/build).
It does **not** require a live database connection.

There are no models yet — the schema is intentionally empty until Phase 1
defines `User` and related tables. Once it does, use:

```bash
npx prisma migrate dev --name <description>
```

to create and apply a migration against your Neon database.

## 4. Run the app locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- `/` — landing page
- `/login` — login screen placeholder (not wired to real auth yet)
- `/api/health` — JSON health check; confirms the app is running and can
  reach the database

## 5. Verify the database connection

With `npm run dev` running, visit
[http://localhost:3000/api/health](http://localhost:3000/api/health) or run:

```bash
curl http://localhost:3000/api/health
```

- `{"ok":true,"data":{"status":"ok","database":"connected",...}}` means the
  app reached Neon successfully.
- `{"ok":false,"error":{"code":"DATABASE_UNAVAILABLE",...}}` means
  `DATABASE_URL` in `.env` is missing, wrong, or the database is
  unreachable — double-check step 2.

## 6. Production build

```bash
npm run build
npm run start
```

`npm run build` runs Prisma client generation (via `postinstall`, see
`package.json`) and the Next.js production build, and fails loudly on type
errors since TypeScript strict mode is on.

## Project structure

```
src/
  app/              Routes (App Router). Pages and API route handlers only —
                     no business logic here.
  components/
    ui/             shadcn/ui primitives (generated, edited in place)
    layout/         Shared layout pieces (header, shell, nav)
  server/           Server-only code: Prisma client, and (from Phase 1
                     onward) the service layer where business logic lives
  lib/              Framework-agnostic helpers: error types, API response
                     helpers, validation, utils
  types/            Shared TypeScript types
  generated/prisma/ Generated Prisma client (gitignored, not hand-edited)
prisma/
  schema.prisma     Database schema (models start in Phase 1)
prisma.config.ts    Prisma CLI configuration (schema path, migrations path,
                     datasource URL)
```

## Notes on dependency versions

- **Prisma is pinned to `7.10.0`** (stable). `npm install prisma` currently
  resolves to a `8.0.0-rc` pre-release with a materially different CLI —
  intentionally avoided for stability.
- `npm audit` reports a handful of vulnerabilities in Prisma's own CLI
  tooling dependencies (a MySQL driver and a parser library used internally
  by `prisma`, neither reachable from application code since we only use
  the PostgreSQL connector). Worth revisiting on the next Prisma patch
  release, not urgent.

## Roadmap

See project planning notes for the full phase breakdown (auth & RBAC →
member/trainer management → memberships & expiry → payments → attendance →
trainer assignment & workouts → progress tracking → dashboards & analytics
→ notifications → hardening).
