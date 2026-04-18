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

    // Async progress sync — don't block the response
    syncUserProgress(req.userId as string).catch(() => {});

    res.json({ log });
  } catch (err) {
    next(err);
  }
});

// GET /api/habits/progress — computed streak + points + achievements
habitRouter.get('/progress', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const progress = await syncUserProgress(req.userId as string);
    res.json({ progress });
  } catch (err) {
    next(err);
  }
});

// ─── Progress computation ─────────────────────────────────────────────────────
async function syncUserProgress(userId: string) {
  // ── Counts ──────────────────────────────────────────────────────────────────
  const [habitLogCount, doneTaskCount, moodCount, chatCount, habitCount] =
    await Promise.all([
      prisma.habitLog.count({ where: { userId, completed: true } }),
      prisma.task.count({ where: { userId, status: 'done' } }),
      prisma.moodEntry.count({ where: { userId } }),
      prisma.chatMessage.count({ where: { userId, role: 'user' } }),
      prisma.habit.count({ where: { userId } }),
    ]);

  // ── Habit streak (consecutive days with ≥1 completed log) ───────────────────
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const recentLogs = await prisma.habitLog.findMany({
    where: { userId, completed: true },
    select: { date: true },
    distinct: ['date'],
    orderBy: { date: 'desc' },
    take: 60,
  });

  let streakDays = 0;
  let expectedTs = today.getTime();
  for (const { date } of recentLogs) {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    if (d.getTime() === expectedTs) {
      streakDays++;
      expectedTs -= 86_400_000;
    } else {
      break;
    }
  }

  // ── Mood streak (consecutive days with ≥1 mood entry) ───────────────────────
  const cutoff = new Date(today.getTime() - 60 * 86_400_000);
  const moodEntries = await prisma.moodEntry.findMany({
    where: { userId, createdAt: { gte: cutoff } },
    select: { createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  const moodDateSet = new Set<number>(
    moodEntries.map(({ createdAt }) => {
      const d = new Date(createdAt);
      d.setUTCHours(0, 0, 0, 0);
      return d.getTime();
    }),
  );
  let moodStreak = 0;
  let moodExpectedTs = today.getTime();
  for (let i = 0; i < 60; i++) {
    if (moodDateSet.has(moodExpectedTs)) {
      moodStreak++;
      moodExpectedTs -= 86_400_000;
    } else {
      break;
    }
  }

  // ── Perfect day check (all habits completed today) ───────────────────────────
  const todayLogsCount = habitCount > 0
    ? await prisma.habitLog.count({ where: { userId, completed: true, date: today } })
    : 0;
  const perfectDay = habitCount > 0 && todayLogsCount >= habitCount;

  // ── Points & Level ───────────────────────────────────────────────────────────
  const points = habitLogCount * 5 + doneTaskCount * 3 + moodCount * 2 + chatCount;
  const level = Math.floor(points / 100) + 1;

  // ── Achievements ─────────────────────────────────────────────────────────────
  const achievements: string[] = [];
  if (habitLogCount >= 1) achievements.push('habit_logged_1');
  if (streakDays >= 3)    achievements.push('habit_streak_3');
  if (streakDays >= 7)    achievements.push('habit_streak_7');
  if (streakDays >= 30)   achievements.push('habit_streak_30');
  if (perfectDay)         achievements.push('perfect_day');
  if (moodCount >= 1)     achievements.push('mood_logged_1');
  if (moodStreak >= 7)    achievements.push('mood_streak_7');
  if (doneTaskCount >= 1)  achievements.push('task_done_1');
  if (doneTaskCount >= 10) achievements.push('task_done_10');
  if (chatCount >= 1)     achievements.push('ai_chat_1');
  if (level >= 5)         achievements.push('level_5');
  if (level >= 10)        achievements.push('level_10');

  return prisma.userProgress.upsert({
    where: { userId },
    update: { points, level, streakDays, achievements },
    create: { userId, points, level, streakDays, achievements },
  });
}
