import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { checkJwt, resolveUser } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const habitRouter = Router();
habitRouter.use(checkJwt, resolveUser);

const createHabitSchema = z.object({
  title: z.string().min(1).max(200),
  frequency: z.enum(['daily', 'weekly']).default('daily'),
  targetCount: z.number().int().positive().max(100).default(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#6366F1'),
  icon: z.string().max(50).default('star'),
  reminderTime: z.string().optional(), // HH:mm
});

const updateHabitSchema = createHabitSchema.partial();

const logHabitSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  completed: z.boolean().default(true),
  value: z.number().int().nonnegative().optional(),
});

// GET /api/habits
habitRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const habits = await prisma.habit.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'asc' },
      include: {
        logs: {
          where: {
            date: {
              gte: (() => {
                const d = new Date();
                d.setDate(d.getDate() - 30);
                return d;
              })(),
            },
          },
          orderBy: { date: 'desc' },
        },
      },
    });
    res.json({ habits });
  } catch (err) {
    next(err);
  }
});

// POST /api/habits
habitRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = createHabitSchema.parse(req.body);
    const habit = await prisma.habit.create({
      data: { userId: req.userId as string, ...body },
      include: { logs: true },
    });
    res.status(201).json({ habit });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/habits/:id
habitRouter.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.habit.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.userId) throw new AppError(404, 'Habit not found');

    const body = updateHabitSchema.parse(req.body);
    const habit = await prisma.habit.update({
      where: { id },
      data: body,
      include: { logs: true },
    });
    res.json({ habit });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/habits/:id
habitRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.habit.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.userId) throw new AppError(404, 'Habit not found');
    await prisma.habit.delete({ where: { id } });
    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
});

// POST /api/habits/:id/log — toggle a daily log
habitRouter.post('/:id/log', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const habit = await prisma.habit.findUnique({ where: { id } });
    if (!habit || habit.userId !== req.userId) throw new AppError(404, 'Habit not found');

    const { date, completed, value } = logHabitSchema.parse(req.body);
    const dateObj = new Date(date + 'T00:00:00.000Z');

    // Upsert: if log exists toggle it, otherwise create
    const existing = await prisma.habitLog.findUnique({
      where: { habitId_date: { habitId: id, date: dateObj } },
    });

    let log;
    if (existing) {
      log = await prisma.habitLog.update({
        where: { id: existing.id },
        data: { completed: !existing.completed, value },
      });
    } else {
      log = await prisma.habitLog.create({
        data: { habitId: id, userId: req.userId as string, date: dateObj, completed, value },
      });
    }

    res.json({ log });
  } catch (err) {
    next(err);
  }
});

// GET /api/habits/progress — streak + points summary
habitRouter.get('/progress', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const progress = await prisma.userProgress.findUnique({
      where: { userId: req.userId },
    });
    res.json({ progress });
  } catch (err) {
    next(err);
  }
});
