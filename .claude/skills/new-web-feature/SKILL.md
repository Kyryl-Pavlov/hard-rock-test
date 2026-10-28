---
name: new-web-feature
description: Build a page, route or UI feature in the Next.js 16 / React 19 app (apps/web). Covers reading the version-matched Next docs, the server/client split, Cache Components and Suspense, api-client and Zustand wiring, Portal Intelligence styling and RTL/Playwright tests. Use when asked to build or change a screen, route, component or frontend feature (e.g. the characters explorer, a character profile page, filters, favorites).
---

# New web feature

Follow `.claude/rules/web-nextjs.md` and `.claude/rules/web-design.md`. They load when you open files under `apps/web/src`.

## 1. Understand the target

- Find the matching reference screen in `designs/` (`characters_explorer*`, `rick_sanchez_profile*`). Read its `screen.png` and the relevant parts of `code.html`. Note the layout regions, components and states: loading, empty, error and filtered.
- List the data the feature needs, and check it against `@rme/shared` types and the API endpoints in the README. If an endpoint is missing or still returns 501, do the backend first with the `new-api-endpoint` skill, or confirm the user wants a stub.
- Read the bundled Next docs (`node_modules/next/dist/docs/01-app/…`) for every Next API you'll use and aren't certain of in **this** version: routing files, `use cache`, `Link`, `Image`, `searchParams`, and so on.

## 2. Plan the component tree

- Sketch the route segment (`src/app/<route>/page.tsx`, plus `layout.tsx`, `loading.tsx`, `error.tsx` and `not-found.tsx` as needed).
- Mark each component as server or client. The page and its layout stay server components, and client components are the smallest interactive leaves: filter controls, the favorite toggle, search input.
- Data flow in this scaffold:
  - Data is fetched with a bearer token from `POST /auth/token`, which is held in the Zustand store. Data-loading components that use it are client components calling `src/lib/api-client.ts`.
  - Static or URL-independent UI stays on the server so it lands in the static shell.
  - Put filters in the URL (`searchParams`) when the view should be shareable or bookmarkable, and mirror them into the store only if other client components need them.
- Wrap every async or runtime-dependent subtree in `<Suspense>` with a skeleton fallback that matches the final layout.

## 3. Build

- Put reusable components in `src/components/<feature>/<component-name>.tsx` and import them with `@/components/...`.
- Use only the theme utilities (`bg-surface-container`, `text-on-surface-variant`, …). If a token is missing, add it to `@theme` in `globals.css`, not as an arbitrary value.
- Use `next/image` for character art (add `rickandmortyapi.com` to `images.remotePatterns` if it's missing) and `<Link>` for navigation.
- Implement any store actions you need in `src/store/explorer-store.ts`. Use immutable updates, and read the store with selectors.
- Fire analytics with `trackEvent('<snake_case_event>', {...})` for meaningful user actions: search, filter change, favorite, opening a profile.
- Accessibility:
  - Use semantic landmarks, one `h1` per page, and labelled inputs.
  - Give icon-only buttons an `aria-label`. Status must not rely on color alone, and keyboard focus must be visible.

## 4. Tests

- Unit tests in `src/__tests__/` cover client components and helpers:
  - Mock `@/lib/api-client`, query by role, and interact with `user-event`.
  - Cover loading, empty, error and success.
- E2E tests in `e2e/<feature>.spec.ts` cover one happy-path flow per route, using role locators.

## 5. Check

- `npx turbo run lint typecheck --filter=@rme/web` (typecheck runs `next typegen` first).
- To run tests: `npm run test -w @rme/web` and `npm run test:e2e`. The API must be running for e2e flows that hit real data.
- Report the routes and components added, what's server vs client, and any design deviations or open TODOs.
