import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ApiError, JwtPayload } from '@rme/shared';

// Mount after requireJwt, which puts the verified payload in res.locals.auth.
export function requireScope(scope: string): RequestHandler {
  return (_req: Request, res: Response<ApiError>, next: NextFunction): void => {
    const auth = res.locals.auth as JwtPayload;
    if (!auth.scope.includes(scope)) {
      res.status(403).json({ error: 'forbidden', message: `Token lacks the ${scope} scope` });
      return;
    }
    next();
  };
}
