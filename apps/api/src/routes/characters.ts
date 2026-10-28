import { Router, type Response } from 'express';
import { z } from 'zod';
import type {
  ApiError,
  CharacterFilters,
  CharacterResponse,
  CharactersResponse,
} from '@rme/shared';
import { requireJwt } from '../middleware/require-jwt';
import { requireScope } from '../middleware/require-scope';
import { UpstreamError, UpstreamTimeoutError } from '../services/errors';
import { fetchCharacter, fetchCharacters } from '../services/rick-morty';

const filtersSchema = z.object({
  name: z.string().trim().min(1).optional(),
  status: z.enum(['Alive', 'Dead', 'unknown']).optional(),
  species: z.string().trim().min(1).optional(),
  type: z.string().trim().min(1).optional(),
  gender: z.enum(['Female', 'Male', 'Genderless', 'unknown']).optional(),
  page: z.coerce.number().int().positive().optional(),
}) satisfies z.ZodType<CharacterFilters>;

const paramsSchema = z.object({
  id: z.string().regex(/^[1-9]\d*$/, 'id must be a positive integer'),
});

// Sends the 502/504 for an upstream failure. Returns false for any other error, which the caller
// rethrows to the global 500 handler.
function sendUpstreamError(res: Response<ApiError>, err: unknown): boolean {
  if (err instanceof UpstreamTimeoutError) {
    res.status(504).json({ error: 'upstream_timeout', message: 'Rick & Morty API timed out' });
    return true;
  }
  if (err instanceof UpstreamError) {
    res.status(502).json({ error: 'upstream_error', message: 'Rick & Morty API request failed' });
    return true;
  }
  return false;
}

export const charactersRouter = Router();

charactersRouter.use(requireJwt, requireScope('characters:read'));

charactersRouter.get('/', async (req, res: Response<CharactersResponse | ApiError>) => {
  const parsed = filtersSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_request', message: z.prettifyError(parsed.error) });
    return;
  }

  try {
    res.status(200).json(await fetchCharacters(parsed.data));
  } catch (err) {
    if (!sendUpstreamError(res, err)) throw err;
  }
});

charactersRouter.get('/:id', async (req, res: Response<CharacterResponse | ApiError>) => {
  const parsed = paramsSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_request', message: z.prettifyError(parsed.error) });
    return;
  }

  try {
    const character = await fetchCharacter(parsed.data.id);
    if (!character) {
      res
        .status(404)
        .json({ error: 'not_found', message: `Character ${parsed.data.id} not found` });
      return;
    }
    res.status(200).json(character);
  } catch (err) {
    if (!sendUpstreamError(res, err)) throw err;
  }
});
