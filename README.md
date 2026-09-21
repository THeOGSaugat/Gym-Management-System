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
- **Phase 3 (plans, memberships & payments)** — done: admin-managed
  membership plan catalog, assigning/renewing/cancelling memberships with
  server-computed dates and status, manual payment recording, and
  member-facing "my membership" / "my payments" views.
- **Phase 4 (attendance)** — done: member self-check-in/out with at-most-
  one-open-session enforced at both the service layer and a database
  constraint, admin "today" and searchable/date-filtered history views,
  and a QR-ready service design (no QR UI yet — see below).
- **Phase 5 (trainer management & assignment)** — done: admin CRUD over
  trainer accounts, assigning/changing/removing a member's trainer, and a
  trainer portal scoped strictly to a trainer's own assigned members
  (reduced profile, attendance, membership status — no payments, no other
  members) via a new, additive read layer that leaves Phases 2–4's
  services untouched.
- **Phase 6 (workout plans & progress tracking)** — done: a shared
  exercise library (admin- and trainer-managed), trainer-authored
  workout plans for assigned members (days, each with an ordered list of
  exercises carrying sets/reps/weight/rest/notes), a read-only member
  view of their own plans, and member-recorded progress logs (weight,
  body fat %, body measurements, or a custom metric) — all built as new,
  additive services that leave every prior phase's code untouched.
- Dashboards & analytics, notifications: not built yet.

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
npx prisma migrate dev   # creates/updates tables in Neon (users, member_profiles,
                          # membership_plans, memberships, payments, attendance,
                          # trainer_profiles, trainer_assignments, exercises,
                          # workout_plans, workout_days, workout_exercises,
                          # progress_logs, ...)
npm run db:seed          # creates test users, member fixtures, plans, a sample
                          # membership + payment, an exercise library, a sample
                          # workout plan, and sample progress logs — see below
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
| `/admin/trainers` | ADMIN only — trainer list, search, filter, pagination |
| `/admin/trainers/new`, `/admin/trainers/[id]` | ADMIN only — create/edit/(de)activate a trainer; roster |
| `/trainer/members` | TRAINER only — **own** assigned-members roster, nobody else's |
| `/trainer/members/[id]` | TRAINER only — an **assigned** member's reduced profile, attendance, membership status (no payments) |
| `/admin/plans` | ADMIN only — membership plan catalog |
| `/admin/plans/new`, `/admin/plans/[id]` | ADMIN only — create/edit/(de)activate a plan |
| `/admin/members/[id]/memberships/new` | ADMIN only — assign a membership to that member |
| `/admin/members/[id]/memberships/[membershipId]` | ADMIN only — membership detail: renew, cancel, its payments |
| `/admin/members/[id]/payments/new` | ADMIN only — record a payment for that member |
| `/admin/payments`, `/admin/payments/[id]` | ADMIN only — global payment list (search/filter/paginate) and detail |
| `/member/membership` | MEMBER only — own current status + history, nobody else's |
| `/member/payments` | MEMBER only — own payment history, nobody else's |
| `/admin/attendance` | ADMIN only — today's check-ins/check-outs, gym-wide |
| `/admin/attendance/history` | ADMIN only — full history, search + date-range filter, paginated |
| `/member/attendance` | MEMBER only — own check-in/out button, today's status, own history |
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

...and 2 additional TRAINER fixtures (password `Member123!`):
`deepak.kapoor@gym.test` (Strength & conditioning) and
`hannah.weiss@gym.test` (Yoga & mobility, deliberately left with zero
assigned members, to exercise that empty state without extra setup).

⚠️ Dev-only. There is no self-serve registration — a real gym's admin
creates member and trainer accounts through `/admin/members/new` and
`/admin/trainers/new` (ADMIN accounts still need the seed script). Never
run the seed script against a production database, and never reuse these
passwords anywhere real.

The seed script also creates three membership plans (**Monthly** $49.99/
30 days, **Quarterly** $129.99/90 days, **Annual** $449.99/365 days),
gives `member@gym.test` an active Monthly membership with a matching cash
payment, and assigns `member@gym.test` to Deepak Kapoor plus two of the
extra members to `trainer@gym.test` — so the membership/payment/trainer-
portal screens all have something to look at immediately.

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

## 8. Manually test plans, memberships & payments

1. Log in as `admin@gym.test` → `/admin/plans`. You should see Monthly,
   Quarterly and Annual, all Active.
2. Create a new plan → it appears in the list. Deactivate it → its badge
   flips to Inactive, and it **disappears from the "assign membership"
   plan dropdown** (`/admin/members/[id]/memberships/new`) while still
   showing in `/admin/plans` itself (admins can see inactive plans; the
   assignment flow can't select them).
3. Open `member@gym.test`'s detail page (`/admin/members/[id]`) — you
   should see their seeded active Monthly membership and its payment.
4. Try "Assign membership" on that same member while their Monthly
   membership is still active → rejected with "This member already has
   an active or pending membership," and no second row is created.
5. Open the active membership's detail page → click **Renew**. A *new*
   membership row is created, status PENDING, starting the day after the
   current one's end date, at the plan's *current* price — the original
   row is untouched and stays ACTIVE.
6. On a still-ACTIVE (or PENDING) membership, click **Cancel** with a
   reason → status flips to CANCELLED, the reason is shown. Try
   cancelling it again → rejected ("already cancelled"). Try cancelling
   an EXPIRED membership (if you have one) → also rejected.
7. Record a payment for a member (`/admin/members/[id]/payments/new`) →
   try a negative or zero amount → rejected with a clear message before
   anything is saved. Then record a valid one (e.g. `25.50`) → it appears
   on the member's detail page, `/admin/payments` (global list, with
   search/method/status filters), and the payment's own detail page.
8. Log in as that member → `/member/membership` shows their current
   status (or "no active membership" if none) plus full history;
   `/member/payments` shows exactly the payment you just recorded.
9. While signed in as a **different** member, try loading
   `/admin/payments`, `/admin/plans`, or another member's
   `/admin/members/[id]` directly → redirected to `/forbidden` every
   time. Log in as `trainer@gym.test` and try the same → also
   `/forbidden` — trainers get no financial access.

## 9. Manually test attendance

1. Log in as `member@gym.test` → `/member/attendance`. You should see
   "Not checked in" and a **Check in** button.
2. Click **Check in** → status flips to "Checked in — since [time]," the
   button becomes **Check out**. The check-in time shown is the server's
   clock at the moment you clicked, not anything from your browser.
3. Log in as `admin@gym.test` (a second browser/incognito window, or log
   out and back in) → `/admin/attendance` → that member shows up with
   "Checked in" and no check-out time yet.
4. Back as the member, click **Check out** → status returns to "Not
   checked in," and `/admin/attendance` now shows a check-out time for
   that row too.
5. Click **Check in** again the same day → succeeds (a second visit the
   same day is allowed — see "How attendance works" below for why this
   isn't a "once per day" rule).
6. `/admin/attendance/history` → search by the member's name, and filter
   by date range (try a future date range → "No attendance matches your
   search," the empty state, not a blank page or an error).
7. While signed in as a **different** member, try loading
   `/admin/attendance` or `/admin/attendance/history` directly →
   redirected to `/forbidden`. Log in as `trainer@gym.test` and try
   `/admin/attendance` and `/member/attendance` → both `/forbidden` —
   Phase 4 gives trainers no attendance access at all, not even their
   own (trainers aren't members and have no attendance to check in for).
8. As one member, you cannot check in *for* another member or view their
   attendance — there's no UI path to try this (the check-in button only
   ever targets your own session), and it's rejected server-side even if
   called directly (see the service tests).

## 10. Manually test trainer management & assignment

1. Log in as `admin@gym.test` → `/admin/trainers`. You should see Tara
   Trainer, Deepak Kapoor, and Hannah Weiss, all Active.
2. Create a new trainer → it appears in the list and its own detail page.
   Try the same email again → "An account with this email already
   exists," not a raw error.
3. Open `deepak.kapoor@gym.test`'s trainer detail page → "Assigned
   members" shows `member@gym.test`. Open Hannah Weiss's → "No members
   currently assigned" (the empty state).
4. Open `member@gym.test`'s member detail page (`/admin/members/[id]`) →
   the "Trainer" section shows "Currently assigned to Deepak Kapoor."
   Use the dropdown to pick a different trainer and click **Change
   trainer** → updates immediately, and Deepak's roster on his own
   detail page no longer includes this member, while the new trainer's
   does.
5. Click **Remove** on a member's Trainer section → "No trainer
   assigned." Assign a trainer again → works as a fresh assignment (not
   a "change," since there's nothing to close first).
6. Deactivate a trainer who has assigned members (**Deactivate** on
   their detail page) → their status flips to Suspended, and every
   member who was assigned to them shows "No trainer assigned" —
   deactivating auto-ends their assignments in one transaction. Try
   logging in as that (now-suspended) trainer → fails, same
   `authorize()` check Phase 1 built for members.
7. Log in as `trainer@gym.test` → `/trainer/members` shows only the
   members currently assigned to *this* trainer (two of the seeded
   extras). Click into one → you see their name, email, phone, current
   membership status, and recent attendance — but **no** address, date
   of birth, or emergency contact (deliberately excluded — see "How
   trainer management works" below).
8. While signed in as that trainer, try loading
   `/trainer/members/<member@gym.test's id>` directly (a member assigned
   to a *different* trainer) → you're correctly blocked from seeing
   their data (verify via the service tests or by inspecting the
   response for the member's name — it never appears; see the note below
   about testing this with curl vs. a real browser).
9. As that trainer, try `/admin/members`, `/admin/payments`,
   `/admin/trainers`, or another trainer's roster page directly → all
   `/forbidden`. Trainers get no member-management, no financial access,
   and no cross-trainer visibility.
10. Log in as a member → confirm `/admin/trainers` and `/trainer/members`
    are both `/forbidden`, and their own `/member/profile`,
    `/member/membership`, `/member/payments` still show only their own
    data (the Phase 2–4 regression check).

> **A testing note, not a bug**: verifying step 8 with `curl` can be
> misleading. When a Server Component's `redirect()` fires *after* its
> parent layout has already started streaming its response (as happens
> here — `trainer/layout.tsx` renders the header before the page's
> assignment check runs), Next.js can't retroactively send an HTTP 3xx
> anymore, so it embeds a client-side redirect instruction in the
> response instead — which only a real browser's JavaScript executes.
> `curl` (or any non-JS client) sees a `200` with no protected data and
> an embedded `NEXT_REDIRECT` instruction it can't follow, which can look
> like a failure if you're only checking the HTTP status code. What
> actually matters — confirmed while building this phase — is that no
> protected data is ever present in that response either way, and a real
> browser (or the service-layer tests, which don't go through HTTP at
> all) shows the block working correctly. See "How trainer management
> works" below.

## 11. Manually test workout plans & progress

1. Log in as `admin@gym.test` → `/admin/exercises`. You should see the
   seeded 6-exercise library (Bench Press, Incline Dumbbell Press, Tricep
   Pushdown, Squat, Leg Press, Walking Lunges). Create a new exercise →
   it appears in the list. Edit it → changes save. Deactivate it → it's
   flagged inactive but not deleted (workout plans that already
   reference it keep working).
2. Log in as `trainer@gym.test` (Deepak Kapoor) → `/trainer/exercises/new`
   → create a new exercise → it's immediately usable when building a
   workout plan. As that trainer, try editing an exercise created by
   *another* trainer or by admin → blocked (only admin or the original
   creator may edit — see "How workout & progress tracking works" below).
3. From `/trainer/members`, open `member@gym.test` (assigned to Deepak)
   → "Workout plans" section → the seeded "Foundations Block 1" plan is
   visible with its two days (Monday — Push, Wednesday — Legs) and each
   day's exercises with sets/reps/weight/rest.
4. Create a new workout plan for that member → name, description, start
   date, optional end date → it's created with `status: ACTIVE` and
   `trainerId` set to the logged-in trainer automatically (never
   client-supplied). Add a workout day (e.g. "Friday — Pull") → add an
   exercise to it with sets/reps/weight/rest/notes → both appear on the
   plan detail page immediately. Try adding an exercise with a
   non-existent `exerciseId` (e.g. by tampering with the form) → rejected
   with a validation/not-found error, not a broken row.
5. As Deepak, try opening `/trainer/members/<a member NOT assigned to
   Deepak>/workout-plans/new` or `/trainer/workout-plans/<a plan
   belonging to another trainer's member>` directly → blocked (verify via
   the service tests or by confirming the member's name/plan data never
   appears in the response body — see the streaming-redirect testing note
   under "Manually test trainer management & assignment" above; the same
   caveat applies here).
6. Log in as `member@gym.test` → `/member/workout-plans` → see
   "Foundations Block 1," read-only (no edit controls anywhere on this
   page). Open it → both days and every exercise's sets/reps/weight/rest
   are visible. Try `/member/workout-plans/<another member's plan id>`
   directly → blocked, no plan data leaks.
7. As `member@gym.test`, go to `/member/progress` → see the two seeded
   `WEIGHT_KG` entries and one `BODY_FAT_PERCENT` entry. Log a new entry
   → pick "Custom metric" without filling in the custom label → rejected
   ("a custom label is required for a custom metric"). Fill in the label
   → succeeds. Log a `BODY_FAT_PERCENT` value over 100 → rejected. Log a
   normal `WEIGHT_KG` value → appears at the top of the history
   immediately, newest first.
8. As `trainer@gym.test`, confirm there is no UI or route for recording
   progress on a member's behalf — progress is member-self-only (see
   "How workout & progress tracking works" below). As admin, open
   `/admin/members/[id]` for a member with logged progress → the read-only
   "Progress" section shows their history; there's no admin edit control
   there either.

## 12. Run the test suite

```bash
npm run test
```

Runs Vitest against the service layer (`member.service.ts`,
`plan.service.ts`, `membership.service.ts`, `payment.service.ts`,
`attendance.service.ts`, `trainer.service.ts`, `assignment.service.ts`,
`trainer-portal.service.ts`, `exercise.service.ts`, `workout.service.ts`,
`progress.service.ts`), the pure date/status logic (`lib/membership.ts`,
`lib/date.ts`), the authorization policies (`policies.ts`), and every Zod
validation schema — 348 tests, using a mocked Prisma client, no database
connection needed. See "How trainer management works," "How workout &
progress tracking works," "How attendance works," and "How plans,
memberships & payments work" below for what these tests do and don't
cover.

## 13. Production build

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

## How plans, memberships & payments work

- **A membership snapshots its plan's terms at purchase time**
  (`planNameSnapshot`, `priceMinorSnapshot`, `currencySnapshot`). If an
  admin later changes the Monthly plan's price, every *existing*
  membership still shows what was actually charged — the UI never joins
  to the live plan for historical display, only for picking a plan when
  assigning a *new* membership.
- **"Is this membership active" is always computed, never just read off
  the stored `status` column** (`src/lib/membership.ts`,
  `computeEffectiveStatus`/`isMembershipCurrentlyActive`) — the same
  "derive, don't trust a stale flag" rule the rest of this codebase
  applies to account status. There's no cron job; instead, every read
  path (`getMembership`, `listMembershipsForMember`, and before any
  lifecycle action) self-heals a stale row — an ACTIVE membership past
  its `endDate` flips to EXPIRED, a PENDING one whose `startDate` has
  arrived flips to ACTIVE — and persists the correction. An admin
  "Sweep" utility (`sweepMembershipStatuses`) exists for peace of mind
  but nothing depends on it having been run recently.
- **Renewal always creates a new row**, never edits the old one's end
  date, so renewal/pricing history survives. The new start date is the
  day after the current membership's end date (if renewing before
  expiry — the member keeps every day they paid for) or today (if it's
  already expired — no back-dated free coverage). Durations are always
  "add N days," never "add a month," which sidesteps the class of bug
  where a plan starting Jan 31 lands on a nonexistent date.
- **Only one ACTIVE-or-PENDING membership per member at a time.**
  Assigning a second one while the first is still open is rejected — use
  Renew instead, which is the one path allowed to legitimately queue up
  a second (future-dated) row against an existing one.
- **"Do not trust client-provided prices" is enforced structurally for
  memberships**: the assign-membership form has no price/amount field at
  all — `createMembership`'s input type doesn't accept one. The price is
  always read from the `MembershipPlan` row found by `planId`,
  server-side. There is nothing for a tampered request to override,
  because the field doesn't exist on the API surface in the first place
  (same trick as Phase 2's `updateOwnProfile` having no target-user
  parameter).
- **Payment amounts, by contrast, genuinely are admin-entered** — a
  payment is the manual bookkeeping of a real-world cash/transfer
  transaction, not a price read from an automated checkout, so there's
  no "live source of truth" to derive it from instead. What's enforced:
  admin-only, a positive integer amount within a sane cap (see
  `lib/validations/payment.ts`), and — if a membership is specified —
  that it actually belongs to the member the payment is being recorded
  against.
- **Payments are append-only.** There is no edit or delete endpoint
  anywhere in the codebase for a `Payment` row. `PaymentStatus` (
  `SUCCEEDED`/`PENDING`/`FAILED`/`REFUNDED`) is set once at creation, not
  transitioned afterward — a correction (a bounced cheque, a refund) is
  meant to be recorded as its own new payment row, not an edit to the
  original. There's no refund-linkage tooling yet (see known
  limitations) — for now a correction is just a new row with its own
  notes explaining why.
- **Authorization mirrors the member-management pattern exactly**:
  `canManageFinancialRecords` (ADMIN only — create/edit plans, assign/
  renew/cancel memberships, record payments) and
  `canViewFinancialRecordsFor` (ADMIN or the member themself — view
  memberships/payments), both in `lib/auth/policies.ts`, both re-checked
  inside every service function regardless of what called it. A trainer
  gets none of this automatically, matching the instruction that trainer
  ↔ member assignment (a future phase) is a narrower, separate
  permission from full member-management access.

## How attendance works

- **"No duplicate check-in" means no duplicate *open* session, not "once
  per day."** A member can check in, check out, and check in again later
  the same day — what's actually disallowed is two simultaneously open
  (checked-in-but-not-checked-out) sessions for the same member. This
  reads directly from the instruction's own wording ("cannot check in
  twice while already checked in"), and it's a deliberate, narrower rule
  than the daily-unique-index design sketched in the original
  architecture notes — worth knowing if you expected a hard one-visit-
  per-day cap and don't see one.
- **Enforced twice**, the same defense-in-depth pattern as everywhere
  else in this codebase: a service-layer pre-check
  (`findFirst({ checkOutAt: null })`) for a clean error message, plus a
  partial unique index — `CREATE UNIQUE INDEX ... ON attendance
  (memberId) WHERE checkOutAt IS NULL` — as the real guarantee against a
  race between two concurrent check-in requests. Prisma's schema DSL has
  no declarative syntax for a partial/filtered unique index, so this one
  was hand-added to the migration's SQL (`prisma migrate dev
  --create-only`, then edited before applying) rather than expressed in
  `schema.prisma` directly.
- **A real bug was caught testing that DB-level path against live Neon,
  not just the mocked tests**: the error Prisma actually throws for a
  P2002 raised through `@prisma/adapter-pg` nests the constraint name at
  `meta.driverAdapterError.cause.constraint.index`, not the conventional
  `meta.target` this codebase's error-mapping helper
  (`isUniqueConstraintError`, used by member/membership/payment/
  attendance services alike) originally checked. Confirmed by hand —
  attempting a real duplicate open-session insert against Neon — the
  helper now checks every shape actually observed (flat array, plain
  string, and this nested driver-adapter form) rather than assuming one.
- **Server time only.** `checkIn()`/`checkOut()` in
  `attendance.service.ts` have no timestamp parameter in their input
  types at all — `checkInAt`/`checkOutAt`/`attendanceDate` are always the
  server's own `new Date()` at the moment the function runs. There is no
  way for a client to submit a check-in time, past or future, because
  the API surface doesn't accept one — the same "safe by construction"
  pattern as a membership's price having no field on its create input.
- **QR-readiness is a function signature, not a stub UI.**
  `checkIn(actor, memberId, method)` already takes a `method`
  (`MANUAL` | `QR`), and every authorization/duplicate/timestamp rule
  lives inside that one function regardless of which value is passed. A
  future QR flow is: decode a scanned code to a `memberId`, then call
  `checkIn(actor, memberId, "QR")` — no changes to this file. Nothing
  about QR generation, scanning, or a kiosk UI exists yet; building that
  without the actual hardware/UX requirements to design against would be
  exactly the "unnecessarily complicated" system the instructions said
  to avoid.
- **Authorization mirrors the rest of the app**: `canRecordAttendanceFor`
  (self only, in Phase 4 — no admin-assisted or front-desk check-in
  exists yet, matching the instructions' explicit "ADMIN can: View..."
  vs. "MEMBER can: ... Check in/out" split) and `canViewAttendanceFor`
  (admin or self), both in `lib/auth/policies.ts`, both re-checked inside
  every service function independent of page-level gating. Relaxing
  `canRecordAttendanceFor` later to let an admin check a member in at
  the front desk is a one-line policy change — `checkIn`'s signature
  already accepts any `actor` + target `memberId`, it just isn't wired
  to a UI for that today.

## How trainer management works

- **"Active status" for a trainer reuses `User.status`** (`ACTIVE`/
  `SUSPENDED`), not a second flag on `TrainerProfile` — the exact same
  activate/deactivate mechanism Phase 2 built for members. Name and
  phone likewise stay on `User`, not duplicated onto the profile table;
  `TrainerProfile` only holds what's genuinely trainer-specific (bio,
  specialization, years of experience).
- **Assignment is a time-bounded relationship, not a foreign key on
  either `User`.** Ending an assignment (removing it, or replacing it
  with a different trainer) never deletes the row — it closes it
  (`status: ENDED`, `endDate` set) — so "who trained this member, and
  when" survives. `assignMemberToTrainer` is the *only* write function
  for this relationship: called with no prior assignment, it's a fresh
  assign; called while one already exists, it closes the old row and
  opens a new one in the same transaction. "Assign" and "change trainer"
  are the same operation from the data model's point of view — there's
  no separate `changeTrainer` function to keep in sync with it.
  `removeAssignment` is the one genuinely different operation: close
  with no replacement.
- **At most one ACTIVE assignment per member**, enforced the same way as
  Phase 4's "at most one open attendance session": a service-layer
  pre-check for a clean error message, plus a hand-written partial
  unique index (`CREATE UNIQUE INDEX ... WHERE status = 'ACTIVE'`) as
  defense-in-depth against a race between two concurrent assign
  requests — Prisma's schema DSL still has no declarative syntax for a
  partial unique index, so this is hand-added to the migration's SQL,
  same as before.
- **Deactivating a trainer auto-ends their active assignments**, in the
  same database transaction as the status change. A suspended trainer
  who can't log in shouldn't keep an "active" client roster — that would
  be a dangling, confusing state (a member's page would claim they have
  a trainer who can never respond). Reactivating does *not* restore
  those assignments; an admin reassigns explicitly.
- **The trainer portal is new, additive code — not changes to Phases
  2–4.** Rather than teaching `member.service.ts` / `attendance.service.ts`
  / `membership.service.ts` a new "trainer of an assigned member" access
  path, `trainer-portal.service.ts` is a separate service that
  independently checks the assignment and reads the data directly. This
  was a deliberate choice matching the instruction to build trainer
  management "without breaking existing functionality": every function
  those three services exported before Phase 5 behaves identically after
  it, verified by their existing test suites still passing unmodified.
- **The trainer portal's member view is deliberately reduced.** It
  returns name, email, phone, member number, and join date — never date
  of birth, address, or emergency contact. Those fields have an
  admin-and-the-member-themself access boundary throughout this codebase
  (see `member.service.ts`) and Phase 5 doesn't relax that for trainers,
  even for their own assigned members, since nothing in the requirements
  asked for it and it's meaningfully more sensitive data than a coaching
  relationship needs.
- **No payment access for trainers, anywhere, full stop.** There is no
  function in this codebase — not in `trainer-portal.service.ts`, not
  anywhere — that lets a `TRAINER` actor read a `Payment` row for any
  member, assigned or not. `canViewFinancialRecordsFor` (which gates all
  payment access) was not modified in Phase 5 and never will be for this
  purpose; a trainer's membership-*status* visibility is a completely
  separate, narrower check that only ever reads plan name and dates, not
  price. This is tested directly (`trainer-portal.service.test.ts`
  asserts `listPaymentsForMember` rejects a `TRAINER` actor) as a
  regression guard, not just described in this paragraph.
- **`canTrainerAccessMember` is the one policy function in
  `lib/auth/policies.ts` that isn't pure ID comparison.** "Is this
  member currently assigned to this trainer" requires a database lookup,
  which would break every other function in that file being a
  framework-free pure function testable with plain objects. The lookup
  itself lives in `trainer-portal.service.ts` (which fetches the
  assignment); only the already-known boolean answer is passed into the
  policy function. This is the smallest change that could preserve
  "policies.ts has zero framework/DB dependencies" while still letting
  one rule genuinely depend on data.

## How workout & progress tracking works

- **The exercise library is shared, not per-trainer.** `Exercise` rows
  are global (name, muscle group, description, instructions, active
  flag) and any active exercise can be added to any workout day by any
  trainer, regardless of who created it. `createdByUserId` exists only
  to gate *editing* (`canEditExercise`: admin, or the original creator —
  a trainer can't silently rewrite another trainer's exercise
  definition), not to scope who can *use* it in a plan.
- **A workout plan's `trainerId` is always the acting trainer, never
  client-supplied.** `createWorkoutPlan` is `TRAINER`-only — deliberately
  not usable by `ADMIN` — because a plan's trainer field represents a
  real coaching relationship, and an admin has no trainer identity of
  their own to put there. Creating a plan also requires an active
  assignment to that member (reusing the same
  `isMemberAssignedToTrainer` check Phase 5 built, not a new one), so a
  trainer can never author a plan for a member who isn't theirs.
- **Days and exercises are owned by the plan, not independently
  authorizable.** Adding/editing/removing a `WorkoutDay` or
  `WorkoutExercise` re-derives its parent plan's member and trainer and
  runs the exact same `canManageWorkoutPlanFor` check the plan itself
  uses — there's no separate, weaker check for "just adding one exercise
  to an existing plan."
- **Adding an exercise to a day validates the `exerciseId` server-side**
  before writing the row, rejecting a nonexistent or tampered id with a
  clear error rather than leaving an orphaned foreign key or letting
  Prisma throw a raw constraint error up to the UI.
- **`WorkoutExercise.weightKg` is intentionally a `Float`, not an integer
  minor-unit column like every money field elsewhere in this codebase.**
  It's a physical measurement (kilograms), not currency — the
  integer-minor-units rule in this README exists specifically to avoid
  floating-point rounding in financial arithmetic, which doesn't apply
  here; a small amount of float imprecision in a displayed "60.5 kg" is
  harmless.
- **Progress logs are member-self-only, both to write and (for a member)
  to read.** `recordProgress` takes no target-member parameter beyond the
  acting member's own id — there's no code path, admin or trainer,
  that can write a progress entry on a member's behalf. `ADMIN` and an
  assigned `TRAINER` can *view* a member's progress history
  (`canViewProgressFor`) for coaching/oversight purposes, matching the
  same reduced-visibility pattern trainers get elsewhere, but neither can
  edit or delete an entry.
- **Deliberately minimal health data.** `ProgressMetric` is a fixed enum
  (body weight, body fat %, four body measurements, or `CUSTOM` with a
  short free-text label) — no blood pressure, heart rate, medical
  history, or other clinical data is collected anywhere in this phase,
  per the explicit "do not collect unnecessary health information"
  instruction. `BODY_FAT_PERCENT` is capped at 100 at the validation
  layer as a basic sanity bound, not a medical-grade constraint.
- **No workout/progress data crosses into the payment or attendance
  services**, and vice versa — `workout.service.ts` and
  `progress.service.ts` are new, additive files that only read
  `assignment.service.ts`'s shared `isMemberAssignedToTrainer` helper;
  every prior phase's service kept its existing tests passing
  unmodified.

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
- **No payment gateway integration** (Stripe, Razorpay, etc.) — by
  design for this phase. All payments are manually recorded by an admin
  (cash, bank transfer, or "other"). The `Payment` model's shape
  (amount, method, status, reference, notes) is deliberately generic
  enough that a gateway could write into it later without a schema
  change, but no gateway code exists.
- **No refund workflow.** `PaymentStatus` includes `REFUNDED` as a value
  an admin can select, but nothing automates issuing one, links it back
  to the original payment, or adjusts a membership's dates/status as a
  side effect. A "refund" today is just: record a new payment row noting
  what happened.
- **No membership expiry notifications.** Memberships do expire
  correctly (see above), but nobody gets told — no "expiring in 3 days"
  email/reminder. That's Phase 9 (notifications) territory.
- **Single currency assumption in the UI.** The schema stores a
  `currency` string per plan/membership/payment (not hardcoded), but
  `formatMinorUnits()` and the forms assume USD throughout. Multi-
  currency display would need UI work, not a data model change.
- **The membership "Sweep" utility has no scheduled trigger** — there's
  no cron/background-job infrastructure (deliberately, per the "no
  unnecessary infra" instruction). It's only reachable by calling
  `sweepMembershipStatuses()` directly today; every real read path
  already self-heals on its own, so this is a convenience, not a gap in
  correctness.
- **No admin-assisted or front-desk check-in.** Only a member can check
  themself in/out (see "How attendance works"). A gym's actual front
  desk workflow — staff checking a member in by name/card/QR — isn't
  built; that's a policy-function change plus a small UI once it's
  actually needed, not a redesign.
- **No QR code check-in.** The service is shaped to support it
  (`checkIn`'s `method` parameter) but no scanning, code generation, or
  kiosk UI exists — deliberately, since a real QR flow needs actual
  hardware/UX requirements to design against, and a half-built one would
  be worse than none.
- **Attendance has no admin edit/delete.** A check-in/out record can't
  be corrected by an admin if a member forgets to check out or checks in
  by mistake — there's no UI or service function for it yet. Today
  that's just a stale "still checked in" row until the member checks out
  (or checks in again elsewhere, which the one-open-session rule would
  then correctly block until they do).
- **No timezone setting.** "Today" and `attendanceDate` are computed in
  UTC (see `lib/date.ts`'s `startOfDay`), same as membership date math.
  For a gym far from UTC, the boundary between "yesterday" and "today"
  in the UI won't match the front desk's wall clock. A per-gym timezone
  setting would fix this without changing the attendance logic itself —
  just what `now` gets normalized against.
- **No member-facing "my trainer" page.** A member currently has no way
  to see who their own assigned trainer is from `/member/*` — only the
  admin and the trainer themself can see the assignment. Nothing in
  Phase 5's requirements asked for a member-facing view; adding one
  later would need a new, narrow policy check (a member reading their
  own `TrainerAssignment` row), not a change to any existing one.
- **No admin-assisted or front-desk trainer changes beyond the admin
  UI** — there's no bulk-reassign tool (e.g. "move all of this
  deactivated trainer's members to a new trainer at once"); each
  reassignment is one member at a time via that member's detail page.
- **A trainer's reduced member view has no edit capability at all** —
  it's read-only by design (view assigned members' info, attendance,
  membership status), matching the requirement that a trainer's access
  be scoped narrowly. There's no trainer-initiated check-in/out or
  membership action either, even for an assigned member — those remain
  member-self-service (attendance) or admin-only (memberships/payments).
- **No exercise categories/tags beyond a single muscle-group field**, no
  exercise images/videos, and no set-by-set actual-vs-planned tracking
  (a `WorkoutExercise` row is the *prescription* — sets/reps/weight/rest
  a trainer assigned — not a per-session log of what was actually done).
  A "workout session log" distinct from the plan itself isn't built;
  that's a natural extension of `ProgressLog` rather than a schema
  change, if it's ever needed.
- **No admin- or trainer-initiated progress entries.** Progress is
  strictly member-self-reported (see "How workout & progress tracking
  works"); there's no "record this member's weigh-in for them" flow even
  for an assigned trainer, matching the instruction to avoid collecting
  more health data/oversight than necessary.
- **No workout plan templates or duplication.** Every plan is built from
  scratch, day by day, exercise by exercise; there's no "copy this plan
  for another member" or reusable template library yet.
- **A workout plan has no admin-facing create/edit UI** — admins can view
  a member's plans and progress (read-only, from the member detail page)
  but plan authorship stays trainer-only, matching the "a plan's
  trainerId must genuinely be a trainer" rule above.
- **No progress charts/trends** — `/member/progress` is a plain
  chronological list. Visualizing a metric over time is a UI-only
  addition later, not a data model change (`ProgressLog` already has
  everything a chart would need: metric, date, value).

## Project structure

```
src/
  app/
    login/            Login page, form, server action
    admin/             layout.tsx (requireRole ADMIN) + dashboard/
      members/           list (search/filter/paginate), actions.ts
        new/                create-member page
        [id]/                member detail: profile, trainer, memberships, payments
          assignment/           actions.ts (assign/change/remove trainer)
          memberships/         actions.ts (assign/renew/cancel)
            new/                    assign-membership page
            [membershipId]/         membership detail: renew, cancel, its payments
          payments/             actions.ts (record)
            new/                    record-payment page
      plans/              list, actions.ts (create/edit/activate/deactivate)
        new/, [id]/           create / detail+edit+toggle
      payments/           global list (search/filter/paginate) + [id] detail
      attendance/         today's attendance
        history/            search + date-range filter, paginated
      trainers/           list, actions.ts (create/edit/activate/deactivate)
        new/, [id]/           create / detail+edit+toggle+assigned-members roster
      exercises/          global exercise library: list, actions.ts, new/, [id]/
    trainer/            layout.tsx (requireRole TRAINER) + dashboard/
      members/             own assigned-members roster (canViewTrainerRoster: self only)
        [id]/                  an assigned member's reduced profile/attendance/membership
          workout-plans/         new/ (create a plan for this assigned member)
      exercises/            new/ (add a library exercise)
      workout-plans/          [id]/ (plan detail: edit, status, days, exercises)
    member/              layout.tsx (requireRole MEMBER) + dashboard/
      profile/             self-service profile: view/edit own data only
      membership/           own current status + history, nobody else's
      payments/             own payment history, nobody else's
      attendance/            check-in/out button, today's status, own history
      workout-plans/          own plans, read-only: list + [id] detail
      progress/               own progress log: history + record-new form
    dashboard/            role router — redirects to the right area
    forbidden/             shown on a role mismatch
    api/
      health/                DB connectivity check
      auth/[...nextauth]/     Auth.js route handlers (GET/POST)
  components/
    ui/                shadcn/ui primitives
    layout/            SiteHeader (public), AppHeader (signed-in areas)
    members/           MemberForm (admin create/edit), SelfProfileForm
    plans/             PlanForm (admin create/edit)
    memberships/       AssignMembershipForm, CancelMembershipForm
    payments/          RecordPaymentForm
    attendance/        CheckInOutButton
    trainers/          TrainerForm (admin create/edit), AssignTrainerForm
    exercises/         ExerciseForm (admin/trainer create/edit)
    workouts/          WorkoutPlanForm, AddWorkoutDayForm, AddWorkoutExerciseForm
    progress/          ProgressLogForm (member self-record)
  server/
    db.ts              Prisma client singleton
    prisma-errors.ts   isUniqueConstraintError() helper
    services/
      member.service.ts      Member business logic + authorization
      plan.service.ts         Plan catalog CRUD + authorization
      membership.service.ts    Assign/renew/cancel/sweep + authorization
      payment.service.ts        Record/list/view + authorization
      attendance.service.ts      Check in/out, today's status, history + authorization
      trainer.service.ts          Trainer roster CRUD + authorization
      assignment.service.ts        Assign/change/remove trainer <-> member + authorization
      trainer-portal.service.ts     New, additive: trainer's reduced read access to an
                                    *assigned* member (profile/attendance/membership
                                    status, never payments) — see "How trainer
                                    management works"
      exercise.service.ts           Exercise library CRUD + authorization
                                    (canEditExercise: admin or original creator)
      workout.service.ts            Workout plan/day/exercise CRUD + authorization
                                    (trainer-only creation, assignment-checked)
      progress.service.ts           Member-self progress recording + admin/trainer
                                    read access — see "How workout & progress
                                    tracking works"
  lib/
    auth/              config.ts (edge-safe) / auth.ts (Node, full config)
                       / session.ts (requireUser, requireRole)
                       / policies.ts (canManageMembers, canManageFinancialRecords,
                                      canRecordAttendanceFor, canManageTrainers,
                                      canTrainerAccessMember, canManageWorkoutPlanFor,
                                      canViewWorkoutPlanFor, canRecordProgressFor,
                                      canViewProgressFor, ...)
                       / password.ts / actions.ts (logout)
    validations/       Zod schemas (auth.ts, member.ts, plan.ts, membership.ts,
                       payment.ts, trainer.ts, assignment.ts, exercise.ts,
                       workout.ts, progress.ts) + shared.ts (the one place the
                       FormData-null-vs-empty-string normalization lives — see
                       "Notes on dependency versions" for why that matters)
    service-error.ts    maps thrown domain errors -> notFound()/redirect()
    rate-limit.ts       in-memory login rate limiter
    date.ts             toDateInputValue(), startOfDay() (UTC day boundary,
                        used by both membership and attendance date math)
    membership.ts        pure date/status logic: computeEffectiveStatus,
                         isMembershipCurrentlyActive, computeRenewalStartDate, addDays
    money.ts             parseMinorUnits/formatMinorUnits/toDecimalString —
                         the only places money crosses the decimal-string boundary
    errors.ts / api-response.ts
  types/               next-auth.d.ts (session/JWT type augmentation)
  test/                prisma-mock.ts, setup.ts (Vitest + mocked Prisma)
  generated/prisma/    Generated Prisma client (gitignored)
  proxy.ts             Route protection (Next.js 16's "Proxy", formerly
                       "middleware")
prisma/
  schema.prisma        User, MemberProfile, MembershipPlan, Membership,
                       Payment, Attendance, TrainerProfile,
                       TrainerAssignment, Exercise, WorkoutPlan, WorkoutDay,
                       WorkoutExercise, ProgressLog models; Role/UserStatus/
                       MembershipStatus/PaymentMethod/PaymentStatus/
                       AttendanceMethod/AssignmentStatus/WorkoutPlanStatus/
                       ProgressMetric enums
  seed.ts              Core test users + 22 member fixtures + 2 trainer
                       fixtures + 3 plans + a sample membership/payment +
                       sample trainer assignments + a 6-exercise library +
                       a sample workout plan + sample progress logs
  migrations/           ...including hand-written partial unique indexes
                        for Attendance and TrainerAssignment (see "How
                        attendance works" / "How trainer management works")
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
- **`@prisma/adapter-pg`'s P2002 error shape isn't the conventional one.**
  A unique-constraint violation raised through this driver adapter nests
  the constraint name at `meta.driverAdapterError.cause.constraint.index`
  rather than the commonly-documented flat `meta.target`. Found in Phase
  4 by testing a real duplicate-check-in race against Neon (not just the
  mocked unit tests) — `src/server/prisma-errors.ts`'s
  `isUniqueConstraintError()` now checks every shape actually observed.
  Worth knowing if a future Prisma/adapter upgrade changes this again.
- **A validation bug from Phase 2 got silently re-introduced in Phase 5**,
  in a brand-new file, by copy-pasting the *pre-fix* version of the same
  helper instead of reusing the fixed one — caught by a failing test,
  not by inspection. Every `lib/validations/*.ts` file's "treat an empty
  form field as unset" logic now imports from one shared module,
  `lib/validations/shared.ts`, specifically so this can't happen a third
  time. Worth remembering for any *new* validation schema in a later
  phase: import `isBlank`/`optionalTrimmedString`/`optionalDate` from
  `./shared` rather than writing a local version, however small it looks.
- **Next.js's `redirect()` doesn't always produce an HTTP 3xx.** Called
  from a Server Component after its parent layout has already started
  streaming the response, it degrades to a client-side redirect
  instruction embedded in the response instead (documented Next.js
  behavior, not a bug) — `curl` can't follow that, a real browser does.
  Found while testing Phase 5's trainer-portal pages; see the note under
  "Manually test trainer management & assignment" above for what this
  means for testing this app with a non-JS HTTP client.

## Roadmap

Dashboards & analytics → notifications → hardening.
