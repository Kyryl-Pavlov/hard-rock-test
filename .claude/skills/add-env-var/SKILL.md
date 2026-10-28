---
name: add-env-var
description: Add, rename or remove an environment variable in this monorepo without missing any of the places it must be declared (api zod config, the three .env.example files, docker-compose, the Turbo env list and the README). Use whenever a change needs new configuration, a secret, a URL or a feature flag in apps/api or apps/web.
---

# Add an environment variable

First decide **where it's read**:

- **API** (`apps/api`): server-only, and may be secret.
- **Web, browser-visible**: must be named `NEXT_PUBLIC_*`. It's inlined at build time and public, so never put a secret here.
- **Web, server-only**: no prefix. It's read in Server Components, route handlers or server actions only.

Then update every row that applies:

| File | API var | Web var |
| --- | --- | --- |
| `apps/api/src/config.ts` → `envSchema` | ✔ add a zod field with a safe `.default()` or a validated requirement (`.min()`, `z.url()`, `z.coerce.number()`) | – |
| `apps/api/.env.example` | ✔ with a comment | – |
| root `.env.example` (feeds docker-compose) | ✔ if the container needs it | – |
| `docker-compose.yml` → `services.api.environment` | ✔ `NAME: ${NAME:-default}`, or `${NAME:?message}` if required | – |
| `apps/api/jest.setup.js` | ✔ if required with no default, so tests can import `config` | – |
| `apps/web/.env.example` | – | ✔ with a comment |
| `turbo.json` → `tasks.build.env` | – | ✔ only if **not** `NEXT_PUBLIC_*` (already covered by the wildcard) |
| README (getting started / relevant section) | ✔ if the user must set it | ✔ if the user must set it |

Rules:

- API code reads it only as `config.NAME`, never `process.env.NAME`.
- Web code reads `process.env.NEXT_PUBLIC_NAME` directly. It's inlined, so it can't be built dynamically as `process.env[key]`. Give it a sensible fallback or a no-op when it's empty, like `NEXT_PUBLIC_GA_ID` in `src/lib/analytics.ts`.
- Secrets get placeholder values in the examples, never real ones, and never go in a `NEXT_PUBLIC_*` var. Don't touch the real `.env` files unless the user asks.
- To rename or remove a var, search for the old name across the repo (`git grep -n NAME`) and update every hit, including the README.

Finish by listing every file you touched and noting whether the user needs to update their local `.env` files or rebuild the container (`npm run docker:up`).
