import { Router } from 'express';
import { requireJwt } from '../middleware/require-jwt';

export const charactersRouter = Router();

charactersRouter.use(requireJwt);

// TODO: validate query params (CharacterFilters) and return fetchCharacters() results.
charactersRouter.get('/', (_req, res) => {
  res
    .status(501)
    .json({ error: 'not_implemented', message: 'GET /characters is not implemented yet' });
});
