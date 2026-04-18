import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { checkJwt, resolveUser } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const taskRouter = Router();

// All task routes require auth
taskRouter.use(checkJwt, resolveUser);

const createTaskSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  dueDate: z.string().datetime().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  status: z.enum(['todo', 'in-progress', 'done']).default('todo'),
  category: z.string().max(100).optional(),
  recurringPattern: z.string().max(500).optional(),
});

const updateTaskSchema = createTaskSchema.partial();

const querySchema = z.object({
  status: z.enum(['todo', 'in-progress', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  category: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['dueDate', 'priority', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// GET /api/tasks
taskRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = querySchema.parse(req.query);
    const where: Record<string, unknown> = { userId: req.userId };

    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.category) where.category = query.category;

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        orderBy: { [query.sortBy]: query.sortOrder },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.task.count({ where }),
    ]);

    res.json({
      success: true,
      data: tasks,
      meta: { page: query.page, limit: query.limit, total },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/tasks/:id
taskRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const task = await prisma.task.findFirst({
      where: { id, userId: req.userId },
    });
    if (!task) throw new AppError(404, 'Task not found');
    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
});

// POST /api/tasks
taskRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = createTaskSchema.parse(req.body);
    const task = await prisma.task.create({
      data: {
        ...body,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        userId: req.userId!,
      },
    });
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/tasks/:id
taskRouter.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const body = updateTaskSchema.parse(req.body);

    const existing = await prisma.task.findFirst({
      where: { id, userId: req.userId },
    });
    if (!existing) throw new AppError(404, 'Task not found');

    const updateData: Record<string, unknown> = { ...body };
    if (body.dueDate) updateData.dueDate = new Date(body.dueDate);

    // Track completion
    if (body.status === 'done' && existing.status !== 'done') {
      updateData.completedAt = new Date();
    } else if (body.status && body.status !== 'done') {
      updateData.completedAt = null;
    }

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
    });

    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/tasks/:id
taskRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.task.findFirst({
      where: { id, userId: req.userId },
    });
    if (!existing) throw new AppError(404, 'Task not found');

    await prisma.task.delete({ where: { id } });
    res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    next(error);
  }
});
