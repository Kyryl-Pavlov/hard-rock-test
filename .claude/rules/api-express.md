---
paths:
  - "apps/api/**/*.{ts,js}"
  - "apps/api/Dockerfile"
  - "docker-compose.yml"
---

# API rules: Express 5 + TypeScript (`apps/api`)

## Shape of the app

```
src/
  index.ts          listen + graceful shutdown only
  app.ts            createApp(): middleware, router mounting, 404, error handler
  config.ts         zod-validated env → typed `config` (the only place that reads process.env)
  auth/             JWT sign/verify
  middleware/       Express middleware (requireJwt, …)
  routes/<name>.ts  one Router per resource: parse input → call service → send typed response
  services/<name>.ts  upstream I/O and mapping (Rick & Morty GraphQL); no Express types here
  __tests__/        Jest + Supertest
```

- **Routes stay thin.** They validate input, call a service, and map the result or error to HTTP. Business logic and `fetch` calls live in `services/`.
- Export routers as `export const <name>Router = Router()`, and mount them in `createApp()` before the 404 handler.
- `createApp()` must stay side-effect free (no `listen`) so tests can build fresh apps.

## Express 5 specifics

- A rejected promise from an `async` handler goes to the error handler automatically. Don't wrap handlers in try/catch just to call `next(err)`. Catch only errors you turn into a specific response.
- `req.query` is read-only, and its values are `string | string[] | undefined`. Parse it with zod; don't mutate or cast it.
- Path syntax changed in Express 5 (e.g. wildcards must be named, `/*splat`). Check before writing non-trivial paths.

## Contract and responses

- Request and response types come from `@rme/shared` (`CharacterFilters`, `CharactersResponse`, `TokenResponse`, `ApiError`, `JwtPayload`). Type handlers as `Response<CharactersResponse | ApiError>` so the body is checked. If a shape must change, change `packages/shared` first.
- Every error body is an `ApiError`: `{ error: '<snake_case_code>', message: '<human readable>' }`.

| Situation | Status | `error` |
| --- | --- | --- |
| Invalid query/body | 400 | `invalid_request` (message: `z.prettifyError(result.error)`) |
| Missing/invalid token | 401 | `unauthorized` (handled by `requireJwt`) |
| Token lacks scope | 403 | `forbidden` |
| Unknown route / entity | 404 | `not_found` |
| Upstream API failed or returned errors | 502 | `upstream_error` |
| Upstream timeout | 504 | `upstream_timeout` |
| Anything unexpected | 500 | `internal_error` (global handler; never leak stack or err.message) |

- Map "no results" from the Rick & Morty API to an empty `Paginated` result (`count: 0`, `results: []`), not a 404, unless the route fetches a single entity by id.

## Validation

- Validate every input at the route boundary with **zod v4** using `safeParse`. Use `z.coerce.number().int().positive()` for numeric query params, and mirror shared unions with `z.enum([...])`.
- Pin the schema to the shared type so drift fails typecheck: `const schema = z.object({...}) satisfies z.ZodType<CharacterFilters>`.
- Strip unknown keys (zod's default). Never forward raw `req.query` to the upstream API.

## Auth

- Protected routers call `router.use(requireJwt)`. The verified payload is in `res.locals.auth` (a `JwtPayload`), and scope checks read `res.locals.auth.scope`.
- Never log tokens or `JWT_SECRET`, and never put secrets in responses.

## Config and env

- Read env only through `config` from `config.ts`. To add a variable, use the `add-env-var` skill, which touches the schema, all `.env.example` files and `docker-compose.yml`.

## Upstream calls (services)

- Use the global `fetch` (Node 24) with `AbortSignal.timeout(...)`. Send GraphQL as `POST { query, variables }` to `config.RICK_MORTY_GRAPHQL_URL`.
- Treat a GraphQL `errors` array or a non-2xx status as an upstream failure. Throw a typed error class (e.g. `UpstreamError`) that the route or error handler maps to 502/504.
- Map the upstream shapes to the shared domain types inside the service. Rename `air_date` to `airDate`, and turn the upstream `info.next`/`info.prev` into the shared `PageInfo`.

## Style

- CommonJS output with `NodeNext` resolution. Match the existing extensionless relative imports and `node:` prefixes for built-ins.
- Strict TS with `noUncheckedIndexedAccess`. No `any`; narrow `unknown` instead.
- Prettier: single quotes, semicolons, trailing commas, width 100.

## Tests

- Use Jest + Supertest against `createApp()`, one file per router or service in `src/__tests__/`. `jest.setup.js` provides `JWT_SECRET`.
- Never hit the network. Stub upstream calls with `jest.spyOn(global, 'fetch')`, and restore mocks in `afterEach`.
- For protected routes, get a token from `signToken(...)` (or `POST /auth/token`). Cover 200, 400, 401 and the upstream-failure path.
- Commands: `npx turbo run typecheck --filter=@rme/api`, `npm run test -w @rme/api`. Run the container with `npm run docker:up`.
