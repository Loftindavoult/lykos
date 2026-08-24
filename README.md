# Lykos

Lykos is the public marketing site **and** the real product: a Next.js app with a Postgres database behind it, instead of a static file alone. It includes:

- The public marketing site (`public/marketing-site.html`, served as-is at `/`) — hero, roadmap, portfolio, mission, a fully-simulated sales demo (`#/demo/...`), and a self-serve website wizard (`#/build`).
- A real staff login at `/login`.
- A real CRM pipeline at `/crm` — Lykos's own sales pipeline, run for real by Lykos's own team (dogfooding the product being sold).
- `POST /api/leads` — the public site's self-serve wizard calls this so a real submission creates a real pipeline account, not just a `mailto:`.

This is Phase 1: real Website + real CRM. GTM, Marketing, and Intelligence-layer views, plus multi-tenant customer logins, are later phases. There's no separate `lykos-app` dependency here — this is a fresh, independent build.

## Local development

```bash
npm install
# copy .env.example into .env and point DATABASE_URL at a local Postgres
npx prisma migrate dev
npm run seed
npm run dev
```

`npm run seed` creates the first staff login — defaults to `loftindavoult@gmail.com` / `changeme123` unless `SEED_STAFF_EMAIL` / `SEED_STAFF_PASSWORD` are set. Change the password (or just log in once and treat it as a placeholder) since there's no self-serve password change screen yet.

## Deploying to Railway

1. Point a Railway service's source at this repo (root directory — no subfolder).
2. Add a Postgres database to the project; reference its `DATABASE_URL`.
3. Set `SESSION_SECRET` to a long random string (e.g. `openssl rand -base64 32`).
4. Deploy. Railway runs `npm install` (which also runs `prisma generate`), then `npm run build`, then `npm start`.
5. Run migrations against the production database once (`npx prisma migrate deploy`, e.g. via `railway run`), then `npm run seed` to create the first staff login.
6. Point your domain at the service from Settings → Networking.

## Notes

- The marketing site (`public/marketing-site.html`) is served byte-for-byte unchanged via a root route handler (`app/route.js`) rather than rewritten as React components, so the existing design/copy work isn't put at risk. The sales demo inside it stays 100% client-side/simulated, clearly labeled as such.
- The self-serve wizard's final CTAs (and its persistent "request a custom build" link) call `/api/leads` in the background alongside their existing `mailto:` link — real submissions become real `Account` rows, with the wizard's answers attached as an initial activity note. The wizard collects no email/name (by design, to stay pure multiple-choice), so staff fill in contact details from the actual email reply.
