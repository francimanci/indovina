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
| Auth      | email + password, argon2, server-side sessions (Phase 2)      |
| AI        | Anthropic API, `claude-sonnet-4-6`, **server-side only** (P3) |
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

Client: `/` landing · `/intake` wizard · `/plan/:profileId` plan.
API: `POST /api/profile` · `GET /api/profile/:id` · `GET /api/plan/:profileId`
(mock data in Phase 1) · `GET /api/health`.

## Phase status

- **Phase 1 — Skeleton ✅**: scaffold, docker Postgres, Drizzle schema +
  migration, `.env.example`, landing page, intake wizard (persists profile),
  plan page with 3 mock steps (Codice Fiscale primary), footer disclaimer.
- Phase 2 — Auth (next)
- Phase 3 — AI generation
- Phase 4 — Stripe
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
