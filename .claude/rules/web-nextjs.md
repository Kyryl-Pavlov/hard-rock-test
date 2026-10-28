---
paths:
  - "apps/web/**/*.{ts,tsx,js,jsx,mjs}"
---

# Web app rules: Next.js 16 + React 19 (`apps/web`)

## Read the bundled docs first

This is Next.js **16.4** with **Cache Components** and **Partial Prefetching** on (`next.config.ts`). Many APIs differ from older versions. Before using a Next.js API you are not certain about, read its version-matched page in `node_modules/next/dist/docs/01-app/` (hoisted to the repo root `node_modules`):

| Topic | File |
| --- | --- |
| Server vs client components | `01-getting-started/05-server-and-client-components.md` |
| Fetching data / caching / revalidating | `01-getting-started/06-fetching-data.md`, `08-caching.md`, `09-revalidating.md` |
| Errors, loading, not-found | `01-getting-started/10-error-handling.md` |
| Images, fonts, metadata | `01-getting-started/12-images.md`, `13-fonts.md`, `14-metadata-and-og-images.md` |
| Prefetching and `<Link>` | `02-guides/adopting-partial-prefetching.md`, `02-guides/prefetching.md` |
| Directives / functions | `03-api-reference/01-directives/`, `03-api-reference/04-functions/` |
| Testing | `02-guides/testing/jest.md`, `02-guides/testing/playwright.md` |

Heed deprecation notices and dev-overlay insights; they name the fix.

## Rendering and caching

- Components are **Server Components by default**. Add `'use client'` only to the smallest leaf that needs state, effects, event handlers, browser APIs or Zustand. Never put it on `layout.tsx` or `page.tsx` to "make things work".
- Cache Components model:
  - To cache a value, use `'use cache'` together with `cacheLife(...)`, at either the data-function or component level.
  - Uncached async work and runtime APIs (`cookies()`, `headers()`, `searchParams`, `connection()`) must sit inside a `<Suspense fallback>`.
  - A "blocking-route" insight means one of those rules was broken.
- Don't use the old route-segment config (`export const dynamic`, `revalidate`, `fetchCache`) or `unstable_cache`. They belong to the previous caching model.
- Use the global `PageProps<'/route'>` and `LayoutProps<'/route'>` helpers for route props, with no import. `params` and `searchParams` are Promises, so await them. `npm run typecheck` runs `next typegen` first, which keeps these types current.
- Every route segment that can fail or load gets an `error.tsx` (must be `'use client'`), a `loading.tsx` or a `<Suspense>`, and a `not-found.tsx` where it applies.
- Use `<Link>` for internal navigation and `next/image` for images. Character images come from `rickandmortyapi.com`, which needs an `images.remotePatterns` entry in `next.config.ts`. Set page titles through `metadata` / `generateMetadata`.

## React 19

- `ref` is a regular prop, so there's no `forwardRef`. Use `use()` to read promises and context. Use form actions and `useActionState` / `useOptimistic` for mutations.
- The React Compiler is **not** enabled. Add `useMemo` / `useCallback` / `memo` only for a measured problem or to keep a dependency stable, not by default.
- Derive values during render instead of syncing them with `useEffect`. Effects are for synchronising with external systems.
- Keys come from stable ids (`character.id`), never array indexes, for dynamic lists.

## Project conventions

- **Types**: import domain and API types from `@rme/shared` (`Character`, `CharacterFilters`, `CharactersResponse`, `ApiError`, …). Never redeclare them locally. If the contract must change, change `packages/shared`.
- **API calls** go only through `src/lib/api-client.ts`, using `API_URL` from `NEXT_PUBLIC_API_URL`.
  - The API needs a bearer token from `POST /auth/token`; the token lives in the Zustand store.
  - Non-2xx responses carry an `ApiError` body. Surface `message`, and fetch a fresh token on a 401.
- **Client state**: use Zustand (`src/store/explorer-store.ts`) only for client-side state such as filters, favorites and the token.
  - Read it with selectors, e.g. `useExplorerStore((s) => s.filters)`. Use `useShallow` when you select several fields.
  - Server Components never read the store, because it's per-browser state.
- **Analytics**: call `trackEvent()` from `src/lib/analytics.ts` and never `sendGAEvent` directly. It's a no-op without `NEXT_PUBLIC_GA_ID`.
- **Env**: only `NEXT_PUBLIC_*` vars reach the browser, and they're inlined at build time. To add one, use the `add-env-var` skill.
- **Imports**: use `@/…` for anything under `src/`. Relative imports are only for siblings.
- **Files**:
  - Routes go in `src/app/`. Reusable UI goes in `src/components/<feature>/` (kebab-case files, PascalCase exports, one component per file).
  - Helpers go in `src/lib/` and stores in `src/store/`.
- **Style**: Prettier (single quotes, semicolons, trailing commas, width 100). ESLint uses `next/core-web-vitals` + `next/typescript`, and unused args need a `_` prefix.
- Styling and visual decisions follow `.claude/rules/web-design.md`.

## Tests

- Unit tests (Jest + React Testing Library, jsdom) go in `src/__tests__/` or next to the file as `*.test.tsx`.
  - Query by role and accessible name, not test ids or classes, and drive interactions with `@testing-library/user-event`.
  - Async Server Components can't be rendered by RTL; test their data helpers or cover them with e2e instead.
- E2E tests (Playwright) go in `e2e/*.spec.ts` and run against the dev server. Use role-based locators and web-first `expect` assertions.
- Mock the network at the `api-client` boundary in unit tests. Never call the real API.
- Commands: `npx turbo run lint typecheck --filter=@rme/web`, `npm run test -w @rme/web`, `npm run test:e2e`.
