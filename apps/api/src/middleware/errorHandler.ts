import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation error',
      details: err.flatten().fieldErrors,
    });
    return;
  }

  // Known application errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // Unexpected errors — hide details in production
  console.error('[error]', err);
  res.status(500).json({
    error: 'Internal server error',
    ...(env.NODE_ENV !== 'production' && { details: err.message }),
  });
}
