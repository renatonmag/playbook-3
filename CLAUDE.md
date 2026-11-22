# playbook-3

A smart day trading journal: a place to log trades and review trading performance.

## Rules

- **Dev server:** never start the dev server without first checking whether a server is already running on its port (3000 by default), e.g. `ss -ltnp | grep :3000` or `lsof -i :3000`. If one is running, reuse it — don't start a second one, and don't kill it without asking.
- Never commit `.env` or write secrets (database password, keys) into tracked files.

## Stack

- **Nuxt 4.6** (Vue 3.5, vue-router 5, Nitro server), TypeScript
- **Tailwind CSS 4.3** via `@tailwindcss/vite` — no `tailwind.config`; CSS entry is `app/assets/css/main.css`
- **Drizzle ORM 0.45** + **drizzle-kit 0.31**, `postgres` (postgres-js) driver
- **Supabase Postgres**, connected through the transaction pooler (port 6543) — requires `prepare: false` on the client
- **pnpm 10**, **Node 24**

## Layout

- `app/` — frontend (pages, components, assets)
- `server/api/` — API routes (e.g. `users.get.ts`)
- `server/database/schema.ts` — Drizzle schema
- `server/database/migrations/` — generated SQL migrations (don't hand-edit)
- `server/utils/db.ts` — `useDb()` and `schema`, auto-imported in server code

## Commands

```bash
pnpm dev          # dev server (check the port first — see Rules)
pnpm build        # production build
pnpm db:generate  # generate a migration from schema changes
pnpm db:migrate   # apply migrations to the database
pnpm db:push      # push schema directly (prototyping)
pnpm db:studio    # Drizzle Studio
```

## Environment

`DATABASE_URL` lives in `.env` (template in `.env.example`). Special characters in the password must be URL-encoded. `drizzle.config.ts` loads `.env` itself; Nuxt loads it at runtime.
