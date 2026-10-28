---
paths:
  - "packages/shared/**/*.ts"
---

# Shared contract rules (`packages/shared` → `@rme/shared`)

- This package is the single source of truth for the web↔api contract (`api.ts`) and the domain types (`rick-morty.ts`). Both `apps/web` and `apps/api` import it, so every change here is a change to both apps.
- Keep it **types-first** with no runtime dependencies. Add runtime values (e.g. `export const CHARACTER_STATUSES = ['Alive', 'Dead', 'unknown'] as const`) only when both apps need the same list at runtime, and derive the type from the value.
- Domain types mirror the public Rick & Morty GraphQL schema with camelCase names (`airDate`, not `air_date`). Mapping from upstream shapes happens in `apps/api/src/services`, not here.
- Error bodies are always `ApiError`, and paginated lists are always `Paginated<T>`. Reuse them instead of inventing new envelopes.
- Consumers import the **built** `dist/`. After editing, rebuild with `npm run build -w @rme/shared` (Turbo's `^build` does it for `dev`, `build`, `typecheck` and `test`). A stale `dist` shows up as "type not found" errors in the apps.
- Make breaking changes (renames, removed or narrowed fields) in the same change as the updates to both consumers. Make additive fields optional unless both sides set them.
- Every export goes through `src/index.ts`.
