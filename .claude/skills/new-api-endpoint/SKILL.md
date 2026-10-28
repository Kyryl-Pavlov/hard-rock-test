---
name: new-api-endpoint
description: Add or change an Express endpoint in apps/api end to end. Covers the shared contract type, zod validation, route, service (Rick & Morty GraphQL), mounting, Supertest tests, the README table and the matching web api-client function. Use when asked to add, implement or change a backend route or API endpoint (e.g. implement GET /characters, add GET /episodes/:id).
---

# New API endpoint

Follow `.claude/rules/api-express.md` and `.claude/rules/shared-contract.md`. They load when you open the files below. Work through the steps in order, and skip a step only when it truly doesn't apply.

## 1. Pin down the contract

- Decide the method, path, auth (public or `requireJwt` plus scope), input (path params, query, body) and success status.
- Check `packages/shared/src/api.ts` for existing types. Add only what's missing: a `<Thing>Filters` / request type and a response type. Lists use `Paginated<T>`, and errors use `ApiError`.
- Export the new types through `packages/shared/src/index.ts`, then rebuild with `npm run build -w @rme/shared`.

## 2. Service: `apps/api/src/services/<resource>.ts`

- Keep the GraphQL document as an exported `const <NAME>_QUERY = /* GraphQL */ \`...\``. Select only the fields the shared type needs.
- Write `export async function <verb><Thing>(input): Promise<SharedType>`:
  - `fetch(config.RICK_MORTY_GRAPHQL_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ query, variables }), signal: AbortSignal.timeout(<ms>) })`.
  - Throw an upstream error on a non-2xx status or a GraphQL `errors` array. Reuse the existing `UpstreamError`-style class, or create one in `services/errors.ts` if none exists.
  - Map the upstream fields to the shared camelCase types. Return an empty `Paginated` for "no results".
- No Express types in services.

## 3. Route: `apps/api/src/routes/<resource>.ts`

- Write the zod schema for the input, pinned with `satisfies z.ZodType<SharedInputType>`.
- Make the handler `async` and use `safeParse`. On failure, return `400 { error: 'invalid_request', message: z.prettifyError(...) }`.
- Call the service and send the shared type: `res.status(200).json(body)` with `res: Response<SharedType | ApiError>`.
- Map upstream errors to 502 / 504. Let everything else fall through to the global 500 handler (Express 5 forwards rejected promises).
- For a new resource, export `<resource>Router` and mount it in `createApp()` in `src/app.ts`, before the 404 handler.

## 4. Tests: `apps/api/src/__tests__/<resource>.test.ts`

- Use Supertest against `createApp()`, and stub the upstream with `jest.spyOn(global, 'fetch').mockResolvedValue(new Response(JSON.stringify({...})))`. Restore it in `afterEach`.
- Cover:
  - The happy path, including the mapped body shape.
  - Validation failure (400).
  - Missing or invalid token (401) when protected.
  - Upstream GraphQL `errors` and a non-2xx status (502).
  - The empty result.

## 5. Docs and consumer

- Add or update the row in the README's **API endpoints** table.
- If the web app consumes the endpoint, add or implement the function in `apps/web/src/lib/api-client.ts`:
  - Signature: `(token, input) => Promise<SharedType>`. Serialise the filters to `URLSearchParams`, skipping `undefined`.
  - Send `Authorization: Bearer <token>`.
  - On a non-2xx response, throw an error that carries the `ApiError` body.

## 6. Check

- `npx turbo run typecheck lint --filter=@rme/api --filter=@rme/web`.
- To run tests: `npm run test -w @rme/api`.
- Report which files changed, the final request and response shapes, and any TODOs left.
