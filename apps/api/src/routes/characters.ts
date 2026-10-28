import { Router, type Response } from 'express';
import { z } from 'zod';
import type { ApiError, CharacterFilters, CharactersResponse, JwtPayload } from '@rme/shared';
import { requireJwt } from '../middleware/require-jwt';
import { UpstreamError, UpstreamTimeoutError } from '../services/errors';
import { fetchCharacters } from '../services/rick-morty';

const REQUIRED_SCOPE = 'characters:read';

const filtersSchema = z.object({
  name: z.string().trim().min(1).optional(),
  status: z.enum(['Alive', 'Dead', 'unknown']).optional(),
  species: z.string().trim().min(1).optional(),
  type: z.string().trim().min(1).optional(),
  gender: z.enum(['Female', 'Male', 'Genderless', 'unknown']).optional(),
  page: z.coerce.number().int().positive().optional(),
}) satisfies z.ZodType<CharacterFilters>;

export const charactersRouter = Router();

charactersRouter.use(requireJwt);

charactersRouter.get('/', async (req, res: Response<CharactersResponse | ApiError>) => {
  const auth = res.locals.auth as JwtPayload;
  if (!auth.scope.includes(REQUIRED_SCOPE)) {
    res
      .status(403)
      .json({ error: 'forbidden', message: `Token lacks the ${REQUIRED_SCOPE} scope` });
    return;
  }

  const parsed = filtersSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_request', message: z.prettifyError(parsed.error) });
    return;
  }

  try {
    res.status(200).json(await fetchCharacters(parsed.data));
  } catch (err) {
    if (err instanceof UpstreamTimeoutError) {
      res.status(504).json({ error: 'upstream_timeout', message: 'Rick & Morty API timed out' });
      return;
    }
    if (err instanceof UpstreamError) {
      res.status(502).json({ error: 'upstream_error', message: 'Rick & Morty API request failed' });
      return;
    }
    throw err;
  }
});
