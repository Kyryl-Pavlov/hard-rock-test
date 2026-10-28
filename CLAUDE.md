# Rick & Morty Explorer

Monorepo (Turborepo + npm workspaces) for a web app that browses the public [Rick and Morty GraphQL API](https://rickandmortyapi.com/graphql). It has a Next.js 16 / React 19 frontend and an Express 5 + TypeScript API, and the two share types through `@rme/shared`.

**Status: early.** The home page lists characters as cards with infinite scroll, a name search and status/species/gender/type filters (side panel on `lg`+, drawer below), with the Portal Intelligence theme. Filters live in the URL, and page 1 is server-rendered for them. Later pages and other filter sets load in the browser from the `GET /api/characters` Route Handler (`src/app/api/characters/route.ts`). Results are cached in the Zustand explorer store (persisted to sessionStorage) and in the browser HTTP cache (`private, max-age=300`). Every path goes Next.js server → `GET /characters` → GraphQL. Still `TODO`: favorites and profile pages.

**Request flow:** the browser never calls the API. `apps/web/src/proxy.ts` gets a JWT from `POST /auth/token` and keeps it in the httpOnly `rme_session` session cookie; Server Components read it and call the API with `Authorization: Bearer` (see README "Request flow").

Setup, all scripts and the API endpoint table are in [README.md](README.md).

## Map

```
apps/
  web/        @rme/web: Next.js app, port 3000, runs on the host
    src/app/                routes (App Router)
    src/components/<feature>/  reusable UI
    src/proxy.ts            issues/refreshes the API JWT in the httpOnly rme_session cookie
    src/lib/                api-client.ts (server-only way to call the API), session.ts, characters.ts (data layer), character-filters.ts (URL ⇄ filters), character-page-client.ts (browser → /api/characters), analytics.ts
    src/store/              explorer-store.ts (Zustand: filters, results cache, favorites; never the token)
    e2e/                    Playwright specs
  api/        @rme/api: Express API, port 4000, runs in Docker
    src/app.ts              createApp(): middleware, routers, 404, error handler
    src/config.ts           zod-validated env (the only reader of process.env)
    src/routes/  src/services/  src/middleware/require-jwt.ts  src/auth/jwt.ts
packages/
  shared/     @rme/shared: web↔api contract (api.ts) and domain types (rick-morty.ts); consumers import its built dist/
  tsconfig/   @rme/tsconfig: shared TS configs
designs/      Portal Intelligence spec + reference screens (gitignored: local only, may be missing)
```

## Rules: what loads when

Path-scoped rules in `.claude/rules/` load automatically when you read a file that matches their `paths:`. They hold the detailed conventions, so don't duplicate them here.

| Rule                                                   | Loads for                                                            | Covers                                                                                          |
| ------------------------------------------------------ | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| [api-express.md](.claude/rules/api-express.md)         | `apps/api/**/*.{ts,js}`, `apps/api/Dockerfile`, `docker-compose.yml` | Thin routes, services, zod validation, error codes and statuses, JWT, upstream calls, Supertest |
| [shared-contract.md](.claude/rules/shared-contract.md) | `packages/shared/**/*.ts`                                            | Types-first contract, camelCase domain types, rebuilding `dist`, breaking changes               |
| [web-nextjs.md](.claude/rules/web-nextjs.md)           | `apps/web/**/*.{ts,tsx,js,jsx,mjs}`                                  | Next 16 docs, server/client split, Cache Components, React 19, api-client, Zustand, tests       |
| [web-design.md](.claude/rules/web-design.md)           | `apps/web/src/**/*.{tsx,jsx,css}`                                    | Portal Intelligence tokens, typography, layout, component recipes                               |

If you're planning, answering a question or working across packages without opening matching files, read the relevant rule directly.

## Skills: which one for which task

| Task                                                          | Skill              |
| ------------------------------------------------------------- | ------------------ |
| Add or change a backend route or endpoint                     | `new-api-endpoint` |
| Build or change a page, route, component or UI feature        | `new-web-feature`  |
| Add, rename or remove an env var, secret, URL or feature flag | `add-env-var`      |

For a full-stack feature, work in this order: the contract in `packages/shared`, then `new-api-endpoint`, then `new-web-feature`.

## Cross-cutting invariants

- Contract changes start in `packages/shared`. Rebuild afterwards with `npm run build -w @rme/shared`, because a stale `dist` shows up as "type not found" errors in the apps.
- The API reads env only through `config`. Browser-visible web env must be `NEXT_PUBLIC_*` and never holds secrets.
- Every error body is an `ApiError`, and every list is a `Paginated<T>`.
- Next.js 16.4 differs from older versions. Read the version-matched docs in `node_modules/next/dist/docs/` before using an API you aren't sure of. `apps/web/AGENTS.md` is regenerated by `next dev`; leave it as is.
- UI uses theme utilities only: no raw hex values, arbitrary colors or Tailwind palette colors.
- Prettier everywhere: single quotes, semicolons, trailing commas, width 100.

## Commands

```bash
npm install
npm run dev                                           # turbo watch: web :3000 + api :4000 on host
npm run dev:docker                                    # same, api in Docker; both restart on changes
npx turbo run lint typecheck --filter=@rme/web        # or --filter=@rme/api
npm run test -w @rme/web                              # or -w @rme/api
npm run test:e2e                                      # Playwright
```
