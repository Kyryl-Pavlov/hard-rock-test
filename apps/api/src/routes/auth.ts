import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import type { TokenResponse } from '@rme/shared';
import { signToken } from '../auth/jwt';
import { config } from '../config';

export const authRouter = Router();

// Issues an anonymous access token for the frontend.
// TODO: add rate limiting / client identification if needed.
authRouter.post('/token', (_req, res) => {
  const body: TokenResponse = {
    accessToken: signToken({ sub: randomUUID(), scope: ['characters:read'] }),
    tokenType: 'Bearer',
    expiresIn: config.JWT_EXPIRES_IN,
  };
  res.status(201).json(body);
});
