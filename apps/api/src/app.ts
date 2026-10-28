import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import helmet from 'helmet';
import type { ApiError } from '@rme/shared';
import { config } from './config';
import { authRouter } from './routes/auth';
import { charactersRouter } from './routes/characters';
import { healthRouter } from './routes/health';

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  const body: ApiError = { error: 'internal_error', message: 'Something went wrong' };
  res.status(500).json(body);
};

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: config.CORS_ORIGIN }));
  app.use(express.json());

  app.use('/health', healthRouter);
  app.use('/auth', authRouter);
  app.use('/characters', charactersRouter);

  app.use((_req, res) => {
    const body: ApiError = { error: 'not_found', message: 'Route not found' };
    res.status(404).json(body);
  });
  app.use(errorHandler);

  return app;
}
