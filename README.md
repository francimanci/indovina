# Buddy

Buddy helps foreigners living in or moving to Italy handle Italian bureaucracy.
It doesn't *explain* bureaucracy — it *produces artifacts*: pre-filled form
fields, ready-to-send emails, and appointment scripts. **The primary focus is
obtaining the Codice Fiscale**; residency and health card come next.

## Try it locally

Prerequisites: **Node 20+** and **Docker** (for local Postgres).

```bash
# 1. Install dependencies
npm install

# 2. Start Postgres (Docker)
docker compose up -d

# 3. Configure env
cp .env.example .env
#   The defaults work out of the box for local dev.
#   AI refinement is OPTIONAL — leave ANTHROPIC_API_KEY empty to use the
#   deterministic generator (no key needed to test the full flow).

# 4. Create the database schema
npm run db:migrate

# 5. Run it (client :5173 + API :3001)
npm run dev
```

Open **http://localhost:5173**.

### A 2-minute test walk-through

1. **Sign up** (any email + password, min 8 chars).
2. Complete the **intake wizard** (nationality, EU/non-EU, in Italy / abroad,
   reason, city, permesso, codice fiscale, family).
3. On **Your plan**, click **Prepare my request →** on *Get your Codice Fiscale*.
4. Fill the **Modello AA4/8** form and click **Generate my request**. You get:
   - the exact **form field values**,
   - a **ready-to-send email** (Italian + English) for the Agenzia delle Entrate
     (or the Italian consulate if you chose "abroad"),
   - a **what-to-bring / what-to-say** script,
   - a **downloadable pre-filled PDF**.
5. Back on the plan, the **Residency** and **Tessera Sanitaria** steps generate
   the same way, reusing your details.
6. **Immigration offices**: open **Offices** in the header to find the competent
   Questura / Ufficio Immigrazione for any Italian province.

### Enabling AI refinement (optional)

Set `ANTHROPIC_API_KEY` in `.env` (model `claude-sonnet-4-6` by default). The
generated kit will then show an **"AI-refined"** badge instead of "Standard".
Without a key everything still works via the deterministic generator.

## Common commands

```bash
npm run dev         # client :5173 + API :3001
npm run typecheck   # tsc --noEmit (strict)
npm run build       # build the client for production
npm start           # run the production server (serves the built client)
npm run db:generate # generate a SQL migration from the schema
npm run db:migrate  # apply migrations
```

## Notes

- No secrets or AI calls run client-side. AI is server-side only.
- Buddy is an information tool, not legal or tax advice. Always verify with
  official sources.

See `CLAUDE.md` for architecture, routes, and decisions.
