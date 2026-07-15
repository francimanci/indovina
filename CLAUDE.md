# Buddy — CLAUDE.md

Buddy helps foreigners living in or moving to Italy handle Italian bureaucracy.
It does not *explain* bureaucracy — it *produces artifacts*: pre-filled form
fields, ready-to-send emails, appointment scripts. **The product's primary focus
is obtaining the Codice Fiscale; everything else is secondary.**

UI is in English, with Italian as a secondary language toggle (Phase 5).

## Stack

| Layer     | Choice                                                        |
| --------- | ------------------------------------------------------------- |
| Frontend  | React + Vite + TypeScript, Tailwind, wouter, TanStack Query   |
| Backend   | Express (Node, TypeScript), zod validation                    |
| DB        | PostgreSQL + Drizzle ORM                                       |
| Auth      | email + password, argon2, server-side Postgres sessions ✅    |
| AI        | Anthropic API, `claude-sonnet-4-6`, **server-side only** ✅   |
| Payments  | Stripe Checkout + webhook (Phase 4)                           |

**Hard rules:** no secrets or AI calls client-side, ever. TypeScript strict.
Shared types live in `/shared`.

## Architecture

Single package, single repo. Vite serves the React client; Express serves the
API. Shared code (Drizzle schema + zod types) in `/shared`, imported by both
sides via TS path aliases (`@shared/*`, `@client/*`, `@server/*`).

- **Dev:** `vite` on `:5173` proxies `/api` → Express on `:3001`. Two processes
  via `concurrently` (`npm run dev`).
- **Prod:** `vite build` → `dist/client`; Express serves it statically with an
  SPA fallback. `npm start` runs the server via `tsx`.
- Path aliases resolve at runtime through `tsx` (dev/prod server) and Vite
  (client). No `tsc` emit step for the server.

```
shared/            schema.ts (Drizzle tables) · types.ts (zod + view types)
src/client/        main.tsx · App.tsx (wouter) · pages/ · components/ · lib/
src/server/        index.ts · env.ts · db/ · routes/ · lib/
drizzle/           generated SQL migrations
docker-compose.yml local Postgres 16
```

## Data model (`shared/schema.ts`)

`users` · `profiles` (1:1 user) · `plans` (1:N profile) · `plan_steps` ·
`generated_documents` · `unlocks` (unique on user_id + step_key).

All six tables exist from Phase 1 so migrations stay stable. In Phase 1
`profiles.userId` is **nullable** (no auth yet); Phase 2 links profiles to the
authenticated user.

## Commands

```bash
npm install
docker compose up -d          # local Postgres on :5432
cp .env.example .env          # fill in as phases require
npm run db:generate           # generate SQL migration from schema
npm run db:migrate            # apply migrations
npm run dev                   # client :5173 + server :3001
npm run typecheck             # tsc --noEmit (strict)
npm run build                 # build client for production
npm start                     # run production server (serves built client)
```

## Routes

Client: `/` landing · `/login` · `/signup` · `/intake` wizard* ·
`/plan/:profileId`* · `/dashboard`* (*protected — redirect to `/login?next=…`).
API:
- `POST /api/auth/signup` · `POST /api/auth/login` · `POST /api/auth/logout` ·
  `GET /api/auth/me`
- `POST /api/profile` · `GET /api/profile/:id` (auth + ownership; profile is
  1:1 per user, POST upserts)
- `GET /api/plan/:profileId` · `POST /api/plan/generate` (auth + ownership)
- `GET/POST /api/codice-fiscale/:profileId` (identity for Modello AA4/8)
- `POST /api/steps/:stepKey/generate` · `GET /api/steps/:stepKey` (the kit)
- `GET /api/dashboard` (auth) · `GET /api/health`

## Codice Fiscale request (Phase 3 — the product's core)

The primary flow: the plan's Codice Fiscale step opens a **dedicated form**
(`/codice-fiscale/:profileId`) that collects the identity data required by the
official **Modello AA4/8** (name, sex, DOB, place of birth, address, document).
`POST /api/steps/codice_fiscale/generate` then produces a **ready-to-send
request**:
- **form field values** mapped one-to-one onto Modello AA4/8;
- a **submission email** (Italian + English) to the Agenzia delle Entrate (in
  Italy) or the Italian **consulate** (abroad) — the office/consulate address is
  a marked placeholder, never invented;
- a **what-to-bring / what-to-say** appointment script.

Generated kits are persisted to `generated_documents` (keyed by user + stepKey)
and re-openable. The builder is **deterministic** (`src/server/lib/codiceFiscale.ts`)
— correct for a fixed official form and testable without a key; when
`ANTHROPIC_API_KEY` is set, the model refines the artifact content, but the
channel, form identity, and `missing` list are always computed deterministically.
System prompts live in `src/server/ai/prompts/` (editable IP).

## Auth (Phase 2)

- **argon2** password hashing; **server-side sessions** in Postgres via
  `express-session` + `connect-pg-simple` (`session` table auto-created).
- Session id in an **httpOnly, sameSite=lax** cookie (`buddy.sid`); `secure` in
  production only (requires HTTPS + `trust proxy`). No JWT in localStorage.
- `requireAuth` middleware guards `/api/profile`, `/api/plan`, `/api/dashboard`.
  Ownership is enforced in the query (`where userId = session.userId`), not just
  the UI — cross-user reads return 404.
- Client: `useAuthUser`/`useLogin`/`useSignup`/`useLogout` hooks over
  `/api/auth/*`; `<ProtectedRoute>` gates pages and redirects when logged out.

## Phase status

- **Phase 1 — Skeleton ✅**: scaffold, docker Postgres, Drizzle schema +
  migration, `.env.example`, landing page, intake wizard (persists profile),
  plan page with 3 mock steps (Codice Fiscale primary), footer disclaimer.
- **Phase 2 — Auth ✅**: signup/login/logout, argon2, Postgres sessions,
  protected wizard/plan/dashboard, profiles linked 1:1 to the user, `/dashboard`
  with empty states.
- **Phase 3 — AI generation ✅** (focused on the Codice Fiscale): dedicated
  AA4/8 form, `POST /api/steps/:stepKey/generate` + `GET`, `POST
  /api/plan/generate`, persisted kits, deterministic-first builder with an
  optional Anthropic path, prompts as files. Secondary steps show "coming next".
- Phase 4 — Stripe (next: gate "Generate my documents" per step)
- Phase 5 — Polish

## Decisions

- **Single package** over a monorepo: one `tsconfig`, real shared types, less
  ceremony. Aliases give clean imports.
- **Server run via `tsx`** (dev and prod) instead of a `tsc` build so tsconfig
  path aliases resolve at runtime without `tsc-alias`.
- **Dependencies as `stepKey` arrays** on `plan_steps`, not FK join rows — steps
  are AI-generated later and keys are the stable identifier.
- **JSONB** for `familyMembers` and AI `content` — flexible while shapes evolve.
- **Anonymous profiles in Phase 1**; the created profile id routes to the plan.
