# Rick & Morty Explorer

A small web app for browsing the [Rick and Morty GraphQL API](https://rickandmortyapi.com/graphql) (public, no auth).

> **Status:** early. The home page lists, searches and filters characters, and each character has a profile page; favorites are still `TODO`.

## Features

- **Home page** (`/`): characters as cards with image, name, status, species, origin and last location, with infinite scroll. It streams in behind a loading skeleton and shows a retry panel if the API is unreachable.
- **Search and filters**: a name search, plus status, species (preset chips), gender and type filters. The filters sit in a side panel on large screens (`lg`, 1024px and up) and in a slide-in drawer below that. They live in the URL (`/?name=rick&status=Alive`), so a filtered view can be shared and its first page is server-rendered.
- **Caching**: results are cached per filter set in two client-side layers, so going back to a previous search is instant:
  - the Zustand explorer store, persisted to `sessionStorage` (10-minute TTL, 20 filter sets);
  - the browser HTTP cache, because `GET /api/characters` responds with `Cache-Control: private, max-age=300`.
- **Character profile** (`/characters/[id]`): opens from a card. It shows everything the API knows about the character: status, species, type, gender, portrait, when it was indexed, its origin and last known location (with type and dimension), and every episode it appears in, grouped by season, with first and last appearance. It's server-rendered, and unknown ids show a not-found page. The "Characters" breadcrumb goes back to the list as you left it (filters, loaded pages and scroll) when you came from there, and links to `/` otherwise.
- **Profile caching**: three layers, so an opened profile usually appears at once:
  - the Next client router keeps a rendered profile in browser memory for 5 minutes (`'use cache: private'` in `getCachedCharacter`), so revisits and back/forward skip the server;
  - the Zustand explorer store keeps profiles in `sessionStorage` (10-minute TTL, 50 profiles). While the server renders a profile, the page shows the stored copy, or the list card's data, instead of a skeleton;
  - hovering or focusing a card prefetches its profile into the store from `GET /api/characters/[id]`, which responds with `Cache-Control: private, max-age=300`.

## Stack

| Area            | Tech                                                                               |
| --------------- | ---------------------------------------------------------------------------------- |
| Monorepo        | [Turborepo](https://turborepo.com) + npm workspaces                                |
| Frontend        | Next.js 16 (App Router, Cache Components), React 19, TypeScript                    |
| Styling / theme | Tailwind CSS v4, "Portal Intelligence" dark theme (`apps/web/src/app/globals.css`) |
| State           | Zustand (`apps/web/src/store`), client UI state only                               |
| Analytics       | Google Analytics 4 via `@next/third-parties` (opt-in by env)                       |
| Backend         | Express 5 + TypeScript, JWT access tokens, runs in Docker                          |
| Unit tests      | Jest + React Testing Library (web), Jest + Supertest (api)                         |
| E2E tests       | Playwright (web)                                                                   |

## Layout

```
apps/
  web/        Next.js frontend + backend-for-frontend (runs on the host, port 3000)
  api/        Express API (Docker, port 4000)
packages/
  shared/     @rme/shared: domain types + API contract shared by web and api
  tsconfig/   @rme/tsconfig: shared TypeScript configs
```

## Architecture

The browser never calls the Express API or the Rick & Morty API. Every data request goes through the Next.js server:

```
browser ──▶ Next.js server ──Bearer JWT──▶ Express API ──GraphQL──▶ rickandmortyapi.com
            (proxy.ts, Server Components,   (apps/api)
             /api/characters Route Handlers)
```

1. **Token issue.** On each page request, `apps/web/src/proxy.ts` checks the `rme_session` cookie. If it's missing or the JWT expires within 60 seconds, the proxy requests a new token from `POST /auth/token` and stores it in the cookie. The cookie is `httpOnly`, `SameSite=Lax`, `Secure` in production, and a browser-session cookie with no max-age.
2. **Data fetch.** Server Components render the first page for the filters in the URL, and the profile at `/characters/[id]`. After that, the client loads later pages and other filter sets from the Next Route Handler `GET /api/characters` (`apps/web/src/app/api/characters/route.ts`), and prefetches profiles from `GET /api/characters/[id]` (`apps/web/src/app/api/characters/[id]/route.ts`). All of them call the data layer (`apps/web/src/lib/characters.ts`). It reads the cookie and calls the API through `apps/web/src/lib/api-client.ts` with `Authorization: Bearer <jwt>`. On a 401 it gets a fresh token and retries once.
3. **API.** Express verifies the JWT and its `characters:read` scope, validates the query, and queries the GraphQL API at `RICK_MORTY_GRAPHQL_URL`.

Character images load through Next's image optimizer (`/_next/image`), so the browser doesn't fetch them from `rickandmortyapi.com` either.

## Prerequisites

- Node.js 24 (`.nvmrc`) and npm 11
- Docker (for the API)

## Getting started

```bash
npm install
cp .env.example .env                    # JWT_SECRET etc. for the api (Docker and local)
cp apps/web/.env.example apps/web/.env  # API_URL (server-only), NEXT_PUBLIC_GA_ID
cp apps/api/.env.example apps/api/.env  # optional: overrides root .env for the local api

npm run dev                             # web :3000 + api :4000, both on the host
# or
npm run dev:docker                      # web :3000 on the host + api :4000 in Docker
```

Both commands run `turbo watch`, which restarts an app when its files change:

- **api**: restarts on any change in `apps/api` (except tests) or in `packages/shared`. In `dev:docker` a restart rebuilds the image and recreates the container.
- **web**: edits in `apps/web/src` use Next's hot reload. Turbo restarts `next dev` only when `packages/shared`, `package.json`, `next.config.ts`, `tsconfig.json` or `.env*` change.
- **shared**: edits in `packages/shared/src` rebuild `dist`, then both apps restart.

Both modes use port 4000. Stop the container (`npm run docker:down`) before `npm run dev`. After Ctrl+C in `dev:docker` the container can keep running; `npm run docker:down` stops it.

> **Upgrading an existing checkout:** rename `NEXT_PUBLIC_API_URL` to `API_URL` in `apps/web/.env`, and rebuild the API container with `npm run docker:up`.

## Environment variables

| Variable                 | Read by | Where to set it                | Default                               | Notes                                          |
| ------------------------ | ------- | ------------------------------ | ------------------------------------- | ---------------------------------------------- |
| `JWT_SECRET`             | api     | root `.env` or `apps/api/.env` | none, required                        | At least 32 chars, e.g. `openssl rand -hex 32` |
| `JWT_EXPIRES_IN`         | api     | root `.env` or `apps/api/.env` | `1h`                                  | Lifetime of issued tokens                      |
| `CORS_ORIGIN`            | api     | root `.env` or `apps/api/.env` | `http://localhost:3000`               |                                                |
| `RICK_MORTY_GRAPHQL_URL` | api     | root `.env` or `apps/api/.env` | `https://rickandmortyapi.com/graphql` | Upstream GraphQL endpoint                      |
| `PORT`                   | api     | `apps/api/.env`                | `4000`                                | Docker always uses 4000                        |
| `API_URL`                | web     | `apps/web/.env`                | `http://localhost:4000`               | Server-only: never exposed to the browser      |
| `NEXT_PUBLIC_GA_ID`      | web     | `apps/web/.env`                | empty (GA off)                        | Public, inlined at build time                  |

## API endpoints

| Method | Path              | Auth                            | Description                                                                                                                                |
| ------ | ----------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| GET    | `/health`         | -                               | Liveness check                                                                                                                             |
| POST   | `/auth/token`     | -                               | Issues an anonymous JWT access token (scope `characters:read`)                                                                             |
| GET    | `/characters`     | Bearer, scope `characters:read` | `Paginated<Character>`; query: `page`, `name`, `status`, `species`, `type`, `gender` (all optional)                                        |
| GET    | `/characters/:id` | Bearer, scope `characters:read` | `CharacterDetail`: every character field, origin and location with type and dimension, and all episodes; `404 not_found` for an unknown id |

Errors are always `{ "error": "<code>", "message": "..." }`:

| Status | `error`            | When                                       |
| ------ | ------------------ | ------------------------------------------ |
| 400    | `invalid_request`  | Invalid query or path params               |
| 401    | `unauthorized`     | Missing, invalid or expired token          |
| 403    | `forbidden`        | Token lacks the required scope             |
| 404    | `not_found`        | Unknown route or character                 |
| 502    | `upstream_error`   | Rick & Morty API failed or returned errors |
| 504    | `upstream_timeout` | Rick & Morty API timed out (10 s)          |
| 500    | `internal_error`   | Anything unexpected                        |

Try it:

```bash
TOKEN=$(curl -s -X POST localhost:4000/auth/token | node -pe 'JSON.parse(require("fs").readFileSync(0)).accessToken')
curl -s "localhost:4000/characters?page=1&status=Alive" -H "Authorization: Bearer $TOKEN"
```

## Scripts (root)

| Script                | What it does                                                       |
| --------------------- | ------------------------------------------------------------------ |
| `npm run dev`         | `turbo watch`: web + api on the host, restarts on changes          |
| `npm run dev:docker`  | `turbo watch`: web on the host, api in Docker, restarts on changes |
| `npm run build`       | `turbo run build` (shared → web, api)                              |
| `npm run lint`        | `turbo run lint`                                                   |
| `npm run typecheck`   | `turbo run typecheck`                                              |
| `npm run test`        | Jest unit tests in every workspace                                 |
| `npm run test:e2e`    | Playwright tests (starts the web dev server)                       |
| `npm run docker:up`   | `docker compose up --build -d` (api container)                     |
| `npm run docker:down` | Stop the containers                                                |

Run a task for a single workspace with `npx turbo run <task> --filter=@rme/web` (or `@rme/api`).

Playwright needs its browser once: `npx -w @rme/web playwright install chromium`. The e2e tests that load characters need the API running (`npm run docker:up`).

## Google Analytics

GA is disabled until `NEXT_PUBLIC_GA_ID` (e.g. `G-XXXXXXXXXX`) is set in `apps/web/.env`. Send custom events with `trackEvent()` from `apps/web/src/lib/analytics.ts`.
