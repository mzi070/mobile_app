import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { checkJwt, resolveUser } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const eventRouter = Router();

eventRouter.use(checkJwt, resolveUser);

const createEventSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  location: z.string().max(500).optional(),
  recurrenceRule: z.string().max(500).optional(),
  reminders: z.array(z.number().int().nonnegative()).default([15]),
  linkedTaskId: z.string().uuid().optional(),
});

const updateEventSchema = createEventSchema.partial();

const querySchema = z.object({
  startAfter: z.string().datetime().optional(),
  startBefore: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

// GET /api/events
eventRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = querySchema.parse(req.query);
    const where: Record<string, unknown> = { userId: req.userId };

    if (query.startAfter || query.startBefore) {
      const startTime: Record<string, Date> = {};
      if (query.startAfter) startTime.gte = new Date(query.startAfter);
      if (query.startBefore) startTime.lte = new Date(query.startBefore);
      where.startTime = startTime;
    }

    const [events, total] = await Promise.all([
      prisma.calendarEvent.findMany({
        where,
        orderBy: { startTime: 'asc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: { linkedTask: true },
      }),
      prisma.calendarEvent.count({ where }),
    ]);

    res.json({
      success: true,
      data: events,
      meta: { page: query.page, limit: query.limit, total },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/events/:id
eventRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const event = await prisma.calendarEvent.findFirst({
      where: { id, userId: req.userId },
      include: { linkedTask: true },
    });
    if (!event) throw new AppError(404, 'Event not found');
    res.json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
});

// POST /api/events
eventRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = createEventSchema.parse(req.body);

    // Validate end > start
    if (new Date(body.endTime) <= new Date(body.startTime)) {
      throw new AppError(400, 'End time must be after start time');
    }

    // Validate linked task belongs to user
    if (body.linkedTaskId) {
      const task = await prisma.task.findFirst({
        where: { id: body.linkedTaskId, userId: req.userId },
      });
      if (!task) throw new AppError(404, 'Linked task not found');
    }

    const event = await prisma.calendarEvent.create({
      data: {
        ...body,
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
        userId: req.userId!,
      },
    });

    res.status(201).json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/events/:id
eventRouter.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const body = updateEventSchema.parse(req.body);

    const existing = await prisma.calendarEvent.findFirst({
      where: { id, userId: req.userId },
    });
    if (!existing) throw new AppError(404, 'Event not found');

    const updateData: Record<string, unknown> = { ...body };
    if (body.startTime) updateData.startTime = new Date(body.startTime);
    if (body.endTime) updateData.endTime = new Date(body.endTime);

    const event = await prisma.calendarEvent.update({
      where: { id },
      data: updateData,
    });

    res.json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/events/:id
eventRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.calendarEvent.findFirst({
      where: { id, userId: req.userId },
    });
    if (!existing) throw new AppError(404, 'Event not found');

    await prisma.calendarEvent.delete({ where: { id } });
    res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    next(error);
  }
});
