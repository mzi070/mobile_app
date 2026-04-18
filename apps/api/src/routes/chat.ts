import { Router, Request, Response, NextFunction } from 'express';
import OpenAI from 'openai';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { checkJwt, resolveUser } from '../middleware/auth';

export const chatRouter = Router();
chatRouter.use(checkJwt, resolveUser);

// ─── OpenAI client (lazy — only used when API key is set) ──────────────────────
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const SYSTEM_PROMPT = `You are LifeFlow AI, a personal productivity and wellness assistant embedded in the LifeFlow app.
You help users manage tasks, track habits, log moods, plan their calendar, and improve their overall wellbeing.
Be concise, warm, and actionable. Keep replies under 200 words unless a detailed explanation is requested.
When relevant, you may suggest actions the user can take inside the app by ending your response with a JSON block:
<actions>
[{"label": "Log Mood", "action": "navigate", "screen": "Wellness"}, ...]
</actions>
Valid actions: navigate (with screen: Home/Tasks/Calendar/Wellness/Chat/Profile), or remind (with message and time).
Only include actions when they naturally fit the conversation.`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
type ActionCard = { label: string; action: string; [key: string]: unknown };

function parseActionsFromContent(raw: string): { text: string; actions: ActionCard[] | null } {
  const match = raw.match(/<actions>\s*([\s\S]*?)\s*<\/actions>/);
  if (!match) return { text: raw.trim(), actions: null };
  const text = raw.replace(match[0], '').trim();
  try {
    const actions = JSON.parse(match[1]) as ActionCard[];
    return { text, actions };
  } catch {
    return { text, actions: null };
  }
}

async function getAIResponse(
  userId: string,
  userContent: string,
): Promise<{ text: string; actions: ActionCard[] | null }> {
  if (!openai) {
    // Graceful fallback when no API key is configured
    const fallbacks = [
      "I'm here to help you stay productive and well! Set your `OPENAI_API_KEY` environment variable to enable full AI responses.",
      "Great question! Once the AI is configured, I can give you personalized advice on tasks, habits, and wellness.",
      "I can see you're reaching out. Connect an OpenAI key to unlock real AI-powered coaching.",
    ];
    return { text: fallbacks[Math.floor(Math.random() * fallbacks.length)], actions: null };
  }

  // Fetch recent conversation history for context
  const history = await prisma.chatMessage.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history
      .reverse()
      .map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    { role: 'user', content: userContent },
  ];

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    max_tokens: 400,
    temperature: 0.7,
  });

  const raw = completion.choices[0]?.message?.content ?? "I'm not sure how to respond to that.";
  return parseActionsFromContent(raw);
}

// ─── GET /api/chat — history ──────────────────────────────────────────────────
chatRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const messages = await prisma.chatMessage.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
    res.json(messages);
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/chat — send message ───────────────────────────────────────────
const sendSchema = z.object({
  content: z.string().min(1).max(2000),
});

chatRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content } = sendSchema.parse(req.body);

    // Save user message first
    const userMessage = await prisma.chatMessage.create({
      data: { userId: req.userId!, role: 'user', content },
    });

    // Get AI response
    const { text, actions } = await getAIResponse(req.userId!, content);

    // Save assistant reply
    const assistantMessage = await prisma.chatMessage.create({
      data: {
        userId: req.userId!,
        role: 'assistant',
        content: text,
        actions: actions ? (actions as unknown as import('@prisma/client').Prisma.InputJsonValue) : undefined,
      },
    });

    res.status(201).json({ userMessage, assistantMessage });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request', details: err.errors });
      return;
    }
    next(err);
  }
});

// ─── DELETE /api/chat — clear history ────────────────────────────────────────
chatRouter.delete('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.chatMessage.deleteMany({ where: { userId: req.userId } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
