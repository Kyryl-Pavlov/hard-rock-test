import type { NextFunction, Request, Response } from 'express';
import type { ApiError } from '@rme/shared';
import { verifyToken } from '../auth/jwt';

export function requireJwt(req: Request, res: Response<ApiError>, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;

  if (!token) {
    res.status(401).json({ error: 'unauthorized', message: 'Missing bearer token' });
    return;
  }

  try {
    res.locals.auth = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'unauthorized', message: 'Invalid or expired token' });
  }
}
