import { api } from './api';

export type MoodScore = 1 | 2 | 3 | 4 | 5;

export interface MoodEntry {
  id: string;
  userId: string;
  mood: MoodScore;
  energy: MoodScore;
  notes?: string;
  createdAt: string;
}

export interface CreateMoodInput {
  mood: MoodScore;
  energy: MoodScore;
  notes?: string;
}

interface MoodListResponse { entries: MoodEntry[] }
interface MoodResponse { entry: MoodEntry | null }

export const moodService = {
  list: (days?: number) =>
    api.get<MoodListResponse>('/api/mood', days ? { days: String(days) } : undefined),

  today: () => api.get<MoodResponse>('/api/mood/today'),

  create: (data: CreateMoodInput) => api.post<{ entry: MoodEntry }>('/api/mood', data),

  delete: (id: string) => api.delete<{ message: string }>(`/api/mood/${id}`),
};
