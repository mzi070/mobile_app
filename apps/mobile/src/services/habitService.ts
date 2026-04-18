import { api } from './api';

export type HabitFrequency = 'daily' | 'weekly';

export interface HabitLog {
  id: string;
  habitId: string;
  userId: string;
  date: string;
  completed: boolean;
  value?: number;
  createdAt: string;
}

export interface Habit {
  id: string;
  userId: string;
  title: string;
  frequency: HabitFrequency;
  targetCount: number;
  color: string;
  icon: string;
  reminderTime?: string;
  createdAt: string;
  updatedAt: string;
  logs: HabitLog[];
}

export interface CreateHabitInput {
  title: string;
  frequency?: HabitFrequency;
  targetCount?: number;
  color?: string;
  icon?: string;
  reminderTime?: string;
}

export interface UserProgress {
  id: string;
  userId: string;
  points: number;
  level: number;
  streakDays: number;
  achievements: string[];
  updatedAt: string;
}

interface HabitListResponse { habits: Habit[] }
interface HabitResponse { habit: Habit }
interface LogResponse { log: HabitLog }
interface ProgressResponse { progress: UserProgress | null }

export const habitService = {
  list: () => api.get<HabitListResponse>('/api/habits'),

  create: (data: CreateHabitInput) => api.post<HabitResponse>('/api/habits', data),

  update: (id: string, data: Partial<CreateHabitInput>) =>
    api.patch<HabitResponse>(`/api/habits/${id}`, data),

  delete: (id: string) => api.delete<{ message: string }>(`/api/habits/${id}`),

  log: (id: string, date: string, completed = true, value?: number) =>
    api.post<LogResponse>(`/api/habits/${id}/log`, { date, completed, value }),

  progress: () => api.get<ProgressResponse>('/api/habits/progress'),
};
