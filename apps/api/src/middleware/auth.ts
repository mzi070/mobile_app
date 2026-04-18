import { Request, Response, NextFunction } from 'express';
import { auth } from 'express-oauth2-jwt-bearer';
import prisma from '../lib/prisma';

// Auth0 JWT validation middleware
export const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
  tokenSigningAlg: 'RS256',
});

// Extend Express Request to include user info
declare module 'express-serve-static-core' {
  interface Request {
    userId?: string;
    auth0Id?: string;
  }
}

// After JWT validation, resolve the internal user ID
export async function resolveUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const auth0Id = req.auth?.payload?.sub;
    if (!auth0Id) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { auth0Id },
      select: { id: true },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found. Complete registration first.' });
      return;
    }

    req.userId = user.id;
    req.auth0Id = auth0Id;
    next();
  } catch (error) {
    next(error);
  }
}
