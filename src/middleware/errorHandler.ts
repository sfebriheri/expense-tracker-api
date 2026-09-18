import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(422).json({
      error: 'ValidationError',
      message: 'Invalid request payload',
      details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.name, message: err.message });
    return;
  }

  // eslint-disable-next-line no-console
  console.error('Unexpected error:', err);
  res.status(500).json({ error: 'InternalServerError', message: 'Something went wrong' });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: 'NotFoundError', message: `Route ${req.originalUrl} not found` });
}
