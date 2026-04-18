import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { checkJwt, resolveUser } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const moodRouter = Router();
moodRouter.use(checkJwt, resolveUser);

const createMoodSchema = z.object({
  mood: z.number().int().min(1).max(5),
  energy: z.number().int().min(1).max(5),
  notes: z.string().max(2000).optional(),
});

const querySchema = z.object({
  days: z.coerce.number().int().positive().max(365).default(7),
});

// GET /api/mood — recent entries
moodRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { days } = querySchema.parse(req.query);
    const since = new Date();
    since.setDate(since.getDate() - days);

    const entries = await prisma.moodEntry.findMany({
      where: { userId: req.userId, createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ entries });
  } catch (err) {
    next(err);
  }
});

// GET /api/mood/today — today's entry (if any)
moodRouter.get('/today', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const entry = await prisma.moodEntry.findFirst({
      where: { userId: req.userId, createdAt: { gte: startOfDay, lte: endOfDay } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ entry });
  } catch (err) {
    next(err);
  }
});

// POST /api/mood
moodRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = createMoodSchema.parse(req.body);
    const entry = await prisma.moodEntry.create({
      data: { userId: req.userId as string, ...body },
    });
    res.status(201).json({ entry });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/mood/:id
moodRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const entry = await prisma.moodEntry.findUnique({ where: { id } });
    if (!entry || entry.userId !== req.userId) throw new AppError(404, 'Entry not found');
    await prisma.moodEntry.delete({ where: { id } });
    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
});
