import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

export interface AuthTokenPayload {
  sub: string;
  email: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/** Requires a valid `Authorization: Bearer <token>` header and attaches req.userId. */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header('Authorization');
  if (!header?.startsWith('Bearer ')) {
    next(ApiError.unauthorized());
    return;
  }

  const token = header.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, env.jwtSecret) as AuthTokenPayload;
    req.userId = payload.sub;
    next();
  } catch {
    next(ApiError.unauthorized('Invalid or expired token'));
  }
}

export function signToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as jwt.SignOptions);
}
