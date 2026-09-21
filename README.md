# Gym Management System

A production-style gym management application for Admins, Trainers and
Members — member management, memberships, payments, attendance, trainer
assignment, workout plans, progress tracking and analytics.

This repository is being built in phases.

- **Phase 0 (project foundation)** — done: project scaffold, database
  connection, base layout, error-handling utilities.
- **Phase 1 (authentication & RBAC)** — done: real login/logout, sessions,
  and server-enforced role separation for ADMIN, TRAINER and MEMBER.
- **Phase 2 (member management)** — done: admin CRUD over member accounts
  (list/search/filter/create/edit/deactivate), a member self-service
  profile page, and a Vitest suite covering the service layer.
- Trainer management, memberships, payments, attendance, workout plans,
  dashboards, notifications: not built yet.

## Stack

Next.js (App Router) · TypeScript (strict) · PostgreSQL (Neon) · Prisma ·
Tailwind CSS · shadcn/ui · Zod · Auth.js v5 (JWT sessions) · bcryptjs ·
Vitest · Vercel

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
npx prisma migrate dev   # creates/updates tables in Neon (users, member_profiles, ...)
npm run db:seed          # creates test users + member fixtures — see below
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
| `/admin/members` | ADMIN only — member list, search, filter, pagination |
| `/admin/members/new` | ADMIN only — create a member |
| `/admin/members/[id]` | ADMIN only — view/edit a member, deactivate/reactivate |
| `/trainer/dashboard` | TRAINER only |
| `/member/dashboard` | MEMBER only |
| `/member/profile` | MEMBER only — view/edit **own** profile, nobody else's |
| `/forbidden` | shown when a signed-in user's role doesn't match the area |
| `/api/health` | JSON health check (app + database) |

## 5. Test accounts (development only)

`npm run db:seed` creates:

| Role | Email | Password |
|---|---|---|
| ADMIN | `admin@gym.test` | `Admin123!` |
| TRAINER | `trainer@gym.test` | `Trainer123!` |
| MEMBER | `member@gym.test` | `Member123!` |

...plus 22 additional MEMBER fixtures (password `Member123!` for all of
them, e.g. `priya.sharma@gym.test`) so the admin member list has enough
rows to actually exercise search, filtering, and pagination (page size is
20). One of them (`tomas.alves@gym.test`) is seeded as `SUSPENDED` to test
the status filter.

⚠️ Dev-only. There is no self-serve registration — a real gym's admin
creates member accounts through `/admin/members/new` (ADMIN/TRAINER
accounts still need the seed script, or a future admin UI). Never run the
seed script against a production database, and never reuse these
passwords anywhere real.

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

## 7. Manually test member management

1. Log in as `admin@gym.test` → `/admin/members`. You should see 23
   members, searchable and filterable, paginated 20/page.
2. Search `priya` → only Priya Sharma should show. Clear it, filter status
   to "Suspended" → only Tomás Alves should show.
3. Click a member → their detail page shows full info and an edit form.
   Change their phone number and save → redirects back to the detail page
   with the new value shown.
4. Click "Add member" → fill in the form with a **new** email → creates
   the member and redirects to their detail page.
5. Try creating another member with an **email that already exists** →
   you should see "An account with this email already exists," not a
   raw error, and no duplicate row gets created.
6. On a member's detail page, click "Deactivate" → status badge flips to
   Suspended. Try logging in as that member (if you know their password,
   e.g. one of the seeded ones) → login should now fail, because Phase 1's
   `authorize()` checks `status === "ACTIVE"`. Click "Reactivate" to undo.
7. Log in as `member@gym.test` → `/member/profile` → edit your phone/
   address/emergency contact → save → changes persist. Note there's no
   email or date-of-birth field here (admin-only, by design).
8. While signed in as that member, try opening
   `http://localhost:3000/admin/members/<any-other-member-id>` directly →
   redirected to `/forbidden`, not shown that member's data.
9. Log in as `trainer@gym.test` → try `/admin/members` → redirected to
   `/forbidden`. Trainers don't get member-management access automatically.

## 8. Run the test suite

```bash
npm run test
```

Runs Vitest against the service layer (`member.service.ts`), the
authorization policies (`policies.ts`), and the Zod validation schemas,
using a mocked Prisma client — no database connection needed. See "How
member management works" below for what these tests do and don't cover.

## 9. Production build

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

## How member management works

- **`MemberProfile` is 1:1 with `User`**, holding only member-specific
  fields (date of birth, address, emergency contact, join date, a
  human-friendly `memberNumber`). Shared contact info (`phone`) stays on
  `User` rather than being duplicated per role-profile table. Account
  status (active/suspended) also stays on `User` — there's no separate
  "membership status" yet, since no `Membership`/`MembershipPlan` model
  exists until Phase 3. The member detail/profile pages say this
  explicitly rather than implying more exists than does.
- **The invariant "a MEMBER has exactly one MemberProfile" is enforced in
  the service layer** (`createMember` always creates both rows together,
  in one Prisma call), not by the database schema — Prisma can't express
  "this relation is required only when a sibling column equals X."
- **Authorization is checked twice, deliberately:**
  1. Pages call `requireRole()` (Layer 1/2, gates navigation — e.g. only
     an ADMIN session can render `/admin/members` at all).
  2. Every function in `src/server/services/member.service.ts` re-checks
     via `src/lib/auth/policies.ts` and throws `ForbiddenError` if it
     fails — independent of whatever called it. `getMember`, for
     instance, refuses a MEMBER actor viewing any id but their own, and
     this is checked *before* the database is even queried.
  A page-level check alone would only protect that one URL. The service
  check protects the operation, however it's invoked — directly, from a
  different future page, or from a Server Action bypassing the page's
  layout tree entirely.
- **Server Actions independently call `requireRole()` too** (see
  `src/app/admin/members/actions.ts`), not just the pages whose forms
  submit to them — a Server Action is its own POST endpoint and doesn't
  inherit a page's access checks for free.
- **`updateOwnProfile` has no target-user parameter at all** — it always
  writes to `actor.id`. That's not an authorization check that could be
  forgotten; the function is simply incapable of touching another user's
  row, by its signature.
- **Mass assignment is avoided structurally**: Server Actions read only
  the specific named fields off `FormData` (e.g.
  `formData.get("fullName")`) and pass them through a Zod schema before
  they ever reach Prisma. Nothing ever spreads raw form/request data into
  a `db.user.update()` call, so a self-service request can't smuggle in
  `role` or `status` even if a client crafted one by hand.
- **Duplicate email handling is two-layered**: an explicit `findUnique`
  pre-check (for a clean "An account with this email already exists"
  message) plus a catch on Prisma's `P2002` unique-constraint error code
  (`src/server/prisma-errors.ts`) as defense-in-depth against the race
  where two requests pass the pre-check simultaneously.
- **Tests use a mocked Prisma client**
  (`src/test/prisma-mock.ts`, via `vitest-mock-extended`), not a live
  database — they verify business logic (who's allowed to do what, what
  gets sent to Prisma, how errors map) fast and without needing a second
  database. This means they do **not** verify the real unique-index
  constraint itself, real cascade-delete behavior, or real query
  correctness against Postgres — those were checked by hand against Neon
  during Phase 2 development (see the manual testing steps above). A
  future phase could add integration tests against a real (branched or
  local) database if that gap starts to matter.

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
- **Admin sets a member's initial password directly** when creating their
  account (no invite-by-email flow, since there's no email infra yet).
  There's no forced password-change-on-first-login either — the member is
  simply expected to be told to change it.
- **Only MEMBER accounts have an admin-facing creation UI.** ADMIN and
  TRAINER accounts still only come from the seed script — building
  trainer management is explicitly out of scope for Phase 2.
- **No hard delete for members**, only deactivate (status → SUSPENDED).
  This matches the architecture doc's stance that financial/activity
  history must survive — appropriate even before that history exists.

## Project structure

```
src/
  app/
    login/            Login page, form, server action
    admin/             layout.tsx (requireRole ADMIN) + dashboard/
      members/           list (search/filter/paginate), actions.ts
        new/                create-member page
        [id]/                member detail: view, edit, deactivate
    trainer/            layout.tsx (requireRole TRAINER) + dashboard/
    member/              layout.tsx (requireRole MEMBER) + dashboard/
      profile/             self-service profile: view/edit own data only
    dashboard/            role router — redirects to the right area
    forbidden/             shown on a role mismatch
    api/
      health/                DB connectivity check
      auth/[...nextauth]/     Auth.js route handlers (GET/POST)
  components/
    ui/                shadcn/ui primitives
    layout/            SiteHeader (public), AppHeader (signed-in areas)
    members/           MemberForm (admin create/edit), SelfProfileForm
  server/
    db.ts              Prisma client singleton
    prisma-errors.ts   isUniqueConstraintError() helper
    services/
      member.service.ts  All member business logic + authorization
  lib/
    auth/              config.ts (edge-safe) / auth.ts (Node, full config)
                       / session.ts (requireUser, requireRole)
                       / policies.ts (canManageMembers, canViewMember, ...)
                       / password.ts / actions.ts (logout)
    validations/       Zod schemas (auth.ts, member.ts)
    service-error.ts    maps thrown domain errors -> notFound()/redirect()
    rate-limit.ts       in-memory login rate limiter
    date.ts             toDateInputValue() for <input type="date">
    errors.ts / api-response.ts
  types/               next-auth.d.ts (session/JWT type augmentation)
  test/                prisma-mock.ts, setup.ts (Vitest + mocked Prisma)
  generated/prisma/    Generated Prisma client (gitignored)
  proxy.ts             Route protection (Next.js 16's "Proxy", formerly
                       "middleware")
prisma/
  schema.prisma        User, MemberProfile models; Role/UserStatus enums
  seed.ts              Core test users + 22 member fixtures
prisma.config.ts       Prisma CLI configuration
vitest.config.mts      Vitest configuration
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
- **`@types/node` was bumped from `^20` to `^22`** in Phase 2 — Vitest 5
  requires `@types/node@^22 || >=24`, and `^22` is also the correct match
  for this repo's actual Node 22 LTS deploy target (`^20` was already a
  mismatch, just one nothing had surfaced yet).

## Roadmap

Trainer management → memberships & expiry → payments → attendance →
trainer assignment & workouts → progress tracking → dashboards &
analytics → notifications → hardening.
