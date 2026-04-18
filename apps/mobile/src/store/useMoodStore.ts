import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { moodService, MoodEntry, CreateMoodInput, MoodScore } from '../services/moodService';

// Returns YYYY-MM-DD
function todayString(): string {
  return new Date().toISOString().split('T')[0] as string;
}

// Average of an array of numbers, returns null if empty
function avg(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

interface MoodState {
  entries: MoodEntry[];
  todayEntry: MoodEntry | null;
  isLoading: boolean;
  error: string | null;

  fetchRecent: (days?: number) => Promise<void>;
  fetchToday: () => Promise<void>;
  logMood: (data: CreateMoodInput) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;

  // Computed helpers
  avgMoodLast7: () => number | null;
  avgEnergyLast7: () => number | null;
  moodHistory: () => Array<{ date: string; mood: MoodScore; energy: MoodScore }>;
}

export const useMoodStore = create<MoodState>()(
  persist(
    (set, get) => ({
  entries: [],
  todayEntry: null,
  isLoading: false,
  error: null,

  fetchRecent: async (days = 30) => {
    set({ isLoading: true, error: null });
    try {
      const res = await moodService.list(days);
      set({ entries: res.entries, isLoading: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to load mood', isLoading: false });
    }
  },

  fetchToday: async () => {
    try {
      const res = await moodService.today();
      set({ todayEntry: res.entry });
    } catch {
      // Non-fatal
    }
  },

  logMood: async (data) => {
    const res = await moodService.create(data);
    set((state) => ({
      todayEntry: res.entry,
      entries: [res.entry, ...state.entries.filter((e) => !e.createdAt.startsWith(todayString()))],
    }));
  },

  deleteEntry: async (id) => {
    await moodService.delete(id);
    set((state) => ({
      entries: state.entries.filter((e) => e.id !== id),
      todayEntry: state.todayEntry?.id === id ? null : state.todayEntry,
    }));
  },

  avgMoodLast7: () => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    const recent = get().entries.filter((e) => new Date(e.createdAt) >= cutoff);
    return avg(recent.map((e) => e.mood));
  },

  avgEnergyLast7: () => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    const recent = get().entries.filter((e) => new Date(e.createdAt) >= cutoff);
    return avg(recent.map((e) => e.energy));
  },

  moodHistory: () =>
    get()
      .entries.slice(0, 7)
      .map((e) => ({
        date: e.createdAt.split('T')[0] as string,
        mood: e.mood as MoodScore,
        energy: e.energy as MoodScore,
      }))
      .reverse(),
}),
{
  name: 'lifeflow-mood',
  storage: createJSONStorage(() => AsyncStorage),
  partialize: (state) => ({ entries: state.entries, todayEntry: state.todayEntry }),
},
  ),
);
