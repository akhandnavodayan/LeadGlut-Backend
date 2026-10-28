import type { NextFunction, Request, Response } from 'express';
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  auth?: {
    userId?: string;
    claims?: {
      sub?: string;
      [key: string]: unknown;
    };
    sessionClaims?: {
      sub?: string;
      [key: string]: unknown;
    };
  };
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const requireAuth = ClerkExpressRequireAuth();

    await new Promise<void>((resolve, reject) => {
      requireAuth(req as any, res as any, (error?: unknown) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });

    const userId =
      req.auth?.userId ??
      req.auth?.claims?.sub ??
      req.auth?.sessionClaims?.sub;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    req.userId = userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
}
