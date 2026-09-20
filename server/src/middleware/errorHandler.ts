import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(ApiError.notFound('Route', req.originalUrl));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ApiError) {
    if (err.statusCode >= 500) {
      logger.error(`${req.method} ${req.originalUrl} -> ${err.statusCode}`, err);
    } else {
      logger.warn(`${req.method} ${req.originalUrl} -> ${err.statusCode}: ${err.message}`);
    }
    res.status(err.statusCode).json({
      timestamp: new Date().toISOString(),
      status: err.statusCode,
      message: err.message,
      path: req.originalUrl,
      fieldErrors: err.fieldErrors,
    });
    return;
  }

  logger.error(`${req.method} ${req.originalUrl} -> 500 (unexpected)`, err);
  res.status(500).json({
    timestamp: new Date().toISOString(),
    status: 500,
    message: 'An unexpected error occurred',
    path: req.originalUrl,
  });
}
