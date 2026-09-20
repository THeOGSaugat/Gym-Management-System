# Gym Management System

A production-style gym management application for Admins, Trainers and
Members — member management, memberships, payments, attendance, trainer
assignment, workout plans, progress tracking and analytics.

This repository is being built in phases.

- **Phase 0 (project foundation)** — done: project scaffold, database
  connection, base layout, error-handling utilities.
- **Phase 1 (authentication & RBAC)** — done: real login/logout, sessions,
  and server-enforced role separation for ADMIN, TRAINER and MEMBER.
- Member/trainer management, memberships, payments, attendance, workout
  plans, dashboards, notifications: not built yet.

## Stack

Next.js (App Router) · TypeScript (strict) · PostgreSQL (Neon) · Prisma ·
Tailwind CSS · shadcn/ui · Zod · Auth.js v5 (JWT sessions) · bcryptjs ·
Vercel

## Prerequisites

- Node.js 22+ (LTS recommended for deployment; this repo was set up with
  Node 26 locally, which also works)
- A free [Neon](https://neon.tech) PostgreSQL database

## 1. Install dependencies

```bash
npm install
```

## 2. Configure environment variables

1. Create a free project at [neon.tech](https://neon.tech).
2. In the Neon dashboard, open your project → **Connect** → copy the
   **Prisma**-flavored connection string (it includes `?sslmode=require`).
3. Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

4. Paste your connection string into `.env` as `DATABASE_URL`.
5. Generate a session-signing secret and set it as `AUTH_SECRET`:

   ```bash
   npx auth secret
   # or: openssl rand -base64 33
   ```

`.env` is gitignored — it will never be committed. `.env.example` is the
committed template that documents what variables are needed. Use a
**different** `AUTH_SECRET` per environment — never reuse the dev value in
production.

## 3. Set up the database

```bash
npx prisma generate      # generates the typed client into src/generated/prisma
npx prisma migrate dev   # creates the users table (and future tables) in Neon
npm run db:seed          # creates one test user per role — see below
```

## 4. Run the app locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Route | Access |
|---|---|
| `/` | public landing page |
| `/login` | public login form |
| `/dashboard` | any signed-in user — redirects to their role's dashboard |
| `/admin/dashboard` | ADMIN only |
| `/trainer/dashboard` | TRAINER only |
| `/member/dashboard` | MEMBER only |
| `/forbidden` | shown when a signed-in user's role doesn't match the area |
| `/api/health` | JSON health check (app + database) |

## 5. Test accounts (development only)

`npm run db:seed` creates:

| Role | Email | Password |
|---|---|---|
| ADMIN | `admin@gym.test` | `Admin123!` |
| TRAINER | `trainer@gym.test` | `Trainer123!` |
| MEMBER | `member@gym.test` | `Member123!` |

⚠️ Dev-only. There is no self-serve registration yet (a real gym's admin
creates accounts — that lands in Phase 2's member/trainer management).
Never run the seed script against a production database, and never reuse
these passwords anywhere real.

## 6. Manually test the auth flow

1. Go to `/login`, sign in as `member@gym.test`. You should land on
   `/member/dashboard`, showing your name and role in the header.
2. While signed in as the member, try visiting `/admin/dashboard` directly
   in the address bar → you should be bounced to `/forbidden`, not shown
   admin content.
3. Log out (button in the header). Try `/member/dashboard` again → you
   should be redirected to `/login`.
4. Try logging in with a wrong password → generic "Invalid email or
   password" message (it never reveals whether the account exists).
5. Try 6+ wrong-password attempts in a row for the same account within 15
   minutes → further attempts are blocked, even with the correct password,
   until the window passes. (Resets on server restart — see the note on
   rate limiting below.)
6. Repeat steps 1–2 for `trainer@gym.test` and `admin@gym.test` to confirm
   each role can only reach its own area.

## 7. Production build

```bash
npm run build
npm run start
```

`npm run build` runs Prisma client generation and the Next.js production
build, and fails loudly on type errors since TypeScript strict mode is on.

## How authentication & authorization work

- **Login** is a Credentials-based Auth.js v5 flow: a server action
  (`src/app/login/actions.ts`) validates input with Zod, calls
  `signIn("credentials", ...)`, which runs `authorize()` in
  `src/lib/auth/auth.ts` — looks up the user, checks `status === "ACTIVE"`,
  verifies the password with bcrypt (cost factor 12). Passwords are never
  stored or logged in plain text.
- **Sessions** are JWTs in an httpOnly cookie (`session: { strategy: "jwt" }`),
  valid 8 hours, rolling forward on activity. The JWT carries `id` and
  `role`, set once at login in the `jwt` callback.
- **Authorization is enforced server-side in two layers**, not by hiding UI:
  1. **`src/proxy.ts`** (Next.js's middleware-equivalent, renamed to
     "Proxy" in Next.js 16) — a fast, database-free check: decodes the JWT
     and checks the request path's prefix (`/admin`, `/trainer`, `/member`)
     against the user's role. Unauthenticated → redirect to `/login`.
     Wrong role → redirect to `/forbidden`.
  2. **Each area's `layout.tsx`** (`src/app/admin/layout.tsx` etc.) calls
     `requireRole()` server-side on every request. This is the real
     boundary — it runs regardless of what the proxy did or didn't catch,
     and cannot be bypassed by disabling JavaScript or hitting the route
     directly.
- Auth.js's own config is split into an edge-safe half
  (`src/lib/auth/config.ts` — callbacks only) and a Node-only half
  (`src/lib/auth/auth.ts` — adds the Credentials provider, which touches
  Prisma and bcrypt and cannot run outside Node). This is Auth.js's own
  documented pattern for database-backed credentials + middleware/proxy.

## Known simplifications (intentional, for a learning project)

- **No self-serve registration.** Only the seed script creates users right
  now. Admin-driven account creation arrives with Phase 2 member/trainer
  management.
- **Rate limiting is in-memory** (`src/lib/rate-limit.ts`), not
  Redis-backed. It resets on every server restart and isn't shared across
  multiple server instances. Fine for dev and a single-instance deploy;
  swap for a durable store (e.g. Upstash Redis) if the app ever runs on
  multiple instances.
- **No instant session revocation.** Sessions are stateless JWTs valid up
  to 8 hours. If an admin ever suspends a user (a Phase 2+ feature — there's
  no admin UI for it yet), that user's *existing* session stays valid until
  it naturally expires; only new login attempts are blocked immediately
  (`authorize()` checks `status === "ACTIVE"` on every login). Instant
  revocation would need a `tokenVersion`-style check on every request,
  which isn't worth the complexity until there's a real feature that needs
  it.
- **No password reset flow yet** — needs transactional email, which isn't
  wired up. Coming with Phase 9 (notifications) or sooner if needed earlier.

## Project structure

```
src/
  app/
    login/            Login page, form, server action
    admin/             layout.tsx (requireRole ADMIN) + dashboard/
    trainer/            layout.tsx (requireRole TRAINER) + dashboard/
    member/              layout.tsx (requireRole MEMBER) + dashboard/
    dashboard/            role router — redirects to the right area
    forbidden/             shown on a role mismatch
    api/
      health/                DB connectivity check
      auth/[...nextauth]/     Auth.js route handlers (GET/POST)
  components/
    ui/                shadcn/ui primitives
    layout/            SiteHeader (public), AppHeader (signed-in areas)
  server/              Server-only code: Prisma client (db.ts)
  lib/
    auth/              config.ts (edge-safe) / auth.ts (Node, full config)
                       / session.ts (requireUser, requireRole)
                       / password.ts / actions.ts (logout)
    validations/       Zod schemas
    rate-limit.ts       in-memory login rate limiter
    errors.ts / api-response.ts
  types/               next-auth.d.ts (session/JWT type augmentation)
  generated/prisma/    Generated Prisma client (gitignored)
  proxy.ts             Route protection (Next.js 16's "Proxy", formerly
                       "middleware")
prisma/
  schema.prisma        User model, Role/UserStatus enums
  seed.ts              Creates 1 test user per role
prisma.config.ts       Prisma CLI configuration
```

## Notes on dependency versions

- **Prisma is pinned to `7.10.0`** (stable). `npm install prisma` currently
  resolves to a `8.0.0-rc` pre-release with a materially different CLI —
  intentionally avoided for stability.
- **Next.js 16** renamed the `middleware.ts` file convention to `proxy.ts`
  (this repo already uses the new name). Proxy now defaults to the Node.js
  runtime rather than Edge, though this app still keeps its proxy
  database-free by design (see "How authentication & authorization work").
- **Auth.js v5 is still in beta** (`next-auth@5.0.0-beta.32`) — there is no
  stable v5 release yet. The API used here (`NextAuth()`, `auth()`,
  `signIn`/`signOut`, the `authorized` callback) has been stable across
  recent betas, but expect to check the changelog before upgrading.
- `npm audit` reports a handful of vulnerabilities in Prisma's own CLI
  tooling dependencies (a MySQL driver and a parser library used internally
  by `prisma`, neither reachable from application code since we only use
  the PostgreSQL connector). Worth revisiting on the next Prisma patch
  release, not urgent.

## Roadmap

Phase 2 (member & trainer management) → memberships & expiry → payments →
attendance → trainer assignment & workouts → progress tracking →
dashboards & analytics → notifications → hardening.
