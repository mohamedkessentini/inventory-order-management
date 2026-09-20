import { NextFunction, Request, Response } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';

/** Validates req.{body,query,params} against a Zod schema, replacing req.body with the parsed value. */
export function validate(schema: AnyZodObject) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse({ body: req.body, query: req.query, params: req.params });
      req.body = parsed.body ?? req.body;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors = error.errors.map((e) => ({
          field: e.path.filter((p) => p !== 'body').join('.'),
          message: e.message,
        }));
        next(ApiError.badRequest('Validation failed', fieldErrors));
        return;
      }
      next(error);
    }
  };
}
