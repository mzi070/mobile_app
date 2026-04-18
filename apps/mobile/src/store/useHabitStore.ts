import { create } from 'zustand';
import { habitService, Habit, CreateHabitInput, UserProgress } from '../services/habitService';

function todayDateString(): string {
  return new Date().toISOString().split('T')[0] as string;
}

// Calculate streak from habit logs (consecutive days completed)
function calcStreak(logs: Habit['logs']): number {
  if (logs.length === 0) return 0;
  const completedDates = logs
    .filter((l) => l.completed)
    .map((l) => l.date.split('T')[0] as string)
    .sort()
    .reverse();

  if (completedDates.length === 0) return 0;

  let streak = 0;
  const today = new Date();

  for (let i = 0; i < completedDates.length; i++) {
    const expected = new Date(today);
    expected.setDate(today.getDate() - i);
    const expectedStr = expected.toISOString().split('T')[0] as string;
    if (completedDates[i] === expectedStr) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

interface HabitState {
  habits: Habit[];
  progress: UserProgress | null;
  isLoading: boolean;
  error: string | null;

  fetchHabits: () => Promise<void>;
  fetchProgress: () => Promise<void>;
  createHabit: (data: CreateHabitInput) => Promise<void>;
  updateHabit: (id: string, data: Partial<CreateHabitInput>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  toggleLog: (habitId: string, date?: string) => Promise<void>;

  // Computed
  todayCompletionRate: () => number;
  streakForHabit: (habitId: string) => number;
  isCompletedToday: (habitId: string) => boolean;
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  progress: null,
  isLoading: false,
  error: null,

  fetchHabits: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await habitService.list();
      set({ habits: res.habits, isLoading: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to load habits', isLoading: false });
    }
  },

  fetchProgress: async () => {
    try {
      const res = await habitService.progress();
      set({ progress: res.progress });
    } catch {
      // Non-fatal
    }
  },

  createHabit: async (data) => {
    const res = await habitService.create(data);
    set((state) => ({ habits: [...state.habits, res.habit] }));
  },

  updateHabit: async (id, data) => {
    const res = await habitService.update(id, data);
    set((state) => ({
      habits: state.habits.map((h) => (h.id === id ? res.habit : h)),
    }));
  },

  deleteHabit: async (id) => {
    await habitService.delete(id);
    set((state) => ({ habits: state.habits.filter((h) => h.id !== id) }));
  },

  toggleLog: async (habitId, date) => {
    const d = date ?? todayDateString();
    // Optimistic toggle
    set((state) => ({
      habits: state.habits.map((h) => {
        if (h.id !== habitId) return h;
        const existingLog = h.logs.find((l) => l.date.startsWith(d));
        if (existingLog) {
          return {
            ...h,
            logs: h.logs.map((l) =>
              l.date.startsWith(d) ? { ...l, completed: !l.completed } : l,
            ),
          };
        }
        // No log yet — add an optimistic one
        const newLog = {
          id: `optimistic-${Date.now()}`,
          habitId,
          userId: '',
          date: d,
          completed: true,
          createdAt: new Date().toISOString(),
        };
        return { ...h, logs: [newLog, ...h.logs] };
      }),
    }));
    try {
      const res = await habitService.log(habitId, d);
      // Replace optimistic log with real log
      set((state) => ({
        habits: state.habits.map((h) => {
          if (h.id !== habitId) return h;
          const filtered = h.logs.filter((l) => !l.id.startsWith('optimistic'));
          const exists = filtered.find((l) => l.id === res.log.id);
          if (exists) {
            return { ...h, logs: filtered.map((l) => (l.id === res.log.id ? res.log : l)) };
          }
          return { ...h, logs: [res.log, ...filtered] };
        }),
      }));
    } catch {
      // Revert optimistic
      await get().fetchHabits();
    }
  },

  todayCompletionRate: () => {
    const { habits } = get();
    if (habits.length === 0) return 0;
    const today = todayDateString();
    const done = habits.filter((h) =>
      h.logs.some((l) => l.date.startsWith(today) && l.completed),
    ).length;
    return Math.round((done / habits.length) * 100);
  },

  streakForHabit: (habitId) => {
    const habit = get().habits.find((h) => h.id === habitId);
    if (!habit) return 0;
    return calcStreak(habit.logs);
  },

  isCompletedToday: (habitId) => {
    const today = todayDateString();
    const habit = get().habits.find((h) => h.id === habitId);
    if (!habit) return false;
    return habit.logs.some((l) => l.date.startsWith(today) && l.completed);
  },
}));
