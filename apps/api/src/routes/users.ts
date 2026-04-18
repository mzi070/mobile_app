import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { checkJwt } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const userRouter = Router();

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  avatarUrl: z.string().url().optional(),
  preferences: z
    .object({
      theme: z.enum(['light', 'dark', 'system']).default('system'),
      focusMode: z.enum(['work', 'personal', 'both']).default('both'),
      workHoursStart: z.string().default('09:00'),
      workHoursEnd: z.string().default('17:00'),
      wellnessGoals: z.array(z.string()).default([]),
      notificationsEnabled: z.boolean().default(true),
      quietHoursStart: z.string().optional(),
      quietHoursEnd: z.string().optional(),
    })
    .default({}),
});

const updatePreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  focusMode: z.enum(['work', 'personal', 'both']).optional(),
  workHoursStart: z.string().optional(),
  workHoursEnd: z.string().optional(),
  wellnessGoals: z.array(z.string()).optional(),
  notificationsEnabled: z.boolean().optional(),
  quietHoursStart: z.string().optional(),
  quietHoursEnd: z.string().optional(),
});

// POST /api/users/register — Create user after Auth0 login
userRouter.post(
  '/register',
  checkJwt,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth0Id = req.auth?.payload?.sub;
      if (!auth0Id) {
        throw new AppError(401, 'Unauthorized');
      }

      const body = registerSchema.parse(req.body);

      const existing = await prisma.user.findUnique({ where: { auth0Id } });
      if (existing) {
        res.json({ success: true, data: existing });
        return;
      }

      const user = await prisma.user.create({
        data: {
          auth0Id,
          email: body.email,
          name: body.name,
          avatarUrl: body.avatarUrl,
          preferences: body.preferences,
        },
      });

      // Initialize user progress
      await prisma.userProgress.create({
        data: { userId: user.id },
      });

      res.status(201).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },
);

// GET /api/users/me — Get current user profile
userRouter.get(
  '/me',
  checkJwt,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth0Id = req.auth?.payload?.sub;
      if (!auth0Id) throw new AppError(401, 'Unauthorized');

      const user = await prisma.user.findUnique({
        where: { auth0Id },
        include: { progress: true },
      });

      if (!user) throw new AppError(404, 'User not found');

      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },
);

// PATCH /api/users/me/preferences — Update preferences
userRouter.patch(
  '/me/preferences',
  checkJwt,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth0Id = req.auth?.payload?.sub;
      if (!auth0Id) throw new AppError(401, 'Unauthorized');

      const updates = updatePreferencesSchema.parse(req.body);

      const user = await prisma.user.findUnique({ where: { auth0Id } });
      if (!user) throw new AppError(404, 'User not found');

      const currentPrefs =
        typeof user.preferences === 'object' && user.preferences !== null
          ? user.preferences
          : {};
      const merged = { ...currentPrefs, ...updates };

      const updated = await prisma.user.update({
        where: { auth0Id },
        data: { preferences: merged },
      });

      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  },
);
