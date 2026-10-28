# Rick & Morty Explorer

A small web app for browsing the [Rick and Morty GraphQL API](https://rickandmortyapi.com/graphql) (public, no auth).

> **Status:** boilerplate only. Features are stubbed with `TODO`s.

## Stack

| Area            | Tech                                                         |
| --------------- | ------------------------------------------------------------ |
| Monorepo        | [Turborepo](https://turborepo.com) + npm workspaces          |
| Frontend        | Next.js 16 (App Router), React 19, TypeScript                |
| Styling / theme | Tailwind CSS v4 (tokens in `apps/web/src/app/globals.css`)   |
| State           | Zustand (`apps/web/src/store`)                               |
| Analytics       | Google Analytics 4 via `@next/third-parties` (opt-in by env) |
| Backend         | Express 5 + TypeScript, JWT access tokens, runs in Docker    |
| Unit tests      | Jest + React Testing Library (web), Jest + Supertest (api)   |
| E2E tests       | Playwright (web)                                             |

## Layout

```
apps/
  web/        Next.js frontend (runs standalone on the host, port 3000)
  api/        Express API (Docker, port 4000)
packages/
  shared/     @rme/shared: domain types + API contract shared by web and api
  tsconfig/   @rme/tsconfig: shared TypeScript configs
```

## Prerequisites

- Node.js 24 (`.nvmrc`) and npm 11
- Docker (for the API)

## Getting started

```bash
npm install
cp .env.example .env                    # JWT_SECRET etc. for the api container
cp apps/web/.env.example apps/web/.env  # NEXT_PUBLIC_API_URL, NEXT_PUBLIC_GA_ID
cp apps/api/.env.example apps/api/.env  # only needed to run the api outside Docker

npm run docker:up                       # build + start the API on http://localhost:4000
npm run dev -w @rme/web                 # start the frontend on http://localhost:3000
```

`npm run dev` (without `-w`) starts **both** web and api locally through Turbo, with no Docker.

### API endpoints

| Method | Path          | Auth   | Description                                  |
| ------ | ------------- | ------ | -------------------------------------------- |
| GET    | `/health`     | -      | Liveness check                               |
| POST   | `/auth/token` | -      | Issues an anonymous JWT access token         |
| GET    | `/characters` | Bearer | Character search (not implemented yet → 501) |

## Scripts (root)

| Script                | What it does                                   |
| --------------------- | ---------------------------------------------- |
| `npm run dev`         | `turbo run dev` (all apps, watch mode)         |
| `npm run build`       | `turbo run build` (shared → web, api)          |
| `npm run lint`        | `turbo run lint`                               |
| `npm run typecheck`   | `turbo run typecheck`                          |
| `npm run test`        | Jest unit tests in every workspace             |
| `npm run test:e2e`    | Playwright tests (starts the web dev server)   |
| `npm run docker:up`   | `docker compose up --build -d` (api container) |
| `npm run docker:down` | Stop the containers                            |

Run a task for a single workspace with `npx turbo run <task> --filter=@rme/web` (or `@rme/api`).

Playwright needs its browser once: `npx -w @rme/web playwright install chromium`.

## Google Analytics

GA is disabled until `NEXT_PUBLIC_GA_ID` (e.g. `G-XXXXXXXXXX`) is set in `apps/web/.env`. Send custom events with `trackEvent()` from `apps/web/src/lib/analytics.ts`.
