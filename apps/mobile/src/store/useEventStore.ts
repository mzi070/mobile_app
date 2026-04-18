import { create } from 'zustand';
import { eventService, CalendarEvent, CreateEventInput, UpdateEventInput } from '../services/eventService';

// Returns YYYY-MM-DD for a given Date
function toDateString(d: Date): string {
  return d.toISOString().split('T')[0] as string;
}

interface EventState {
  events: CalendarEvent[];
  isLoading: boolean;
  error: string | null;
  selectedDate: string; // YYYY-MM-DD

  setSelectedDate: (date: string) => void;

  fetchEventsForMonth: (year: number, month: number) => Promise<void>;
  createEvent: (data: CreateEventInput) => Promise<void>;
  updateEvent: (id: string, data: UpdateEventInput) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;

  eventsForDate: (date: string) => CalendarEvent[];
  markedDates: () => Record<string, { marked: boolean; dotColor: string }>;
}

export const useEventStore = create<EventState>((set, get) => ({
  events: [],
  isLoading: false,
  error: null,
  selectedDate: toDateString(new Date()),

  setSelectedDate: (date) => set({ selectedDate: date }),

  fetchEventsForMonth: async (year, month) => {
    set({ isLoading: true, error: null });
    try {
      const startAfter = new Date(year, month - 1, 1).toISOString();
      const startBefore = new Date(year, month, 0, 23, 59, 59).toISOString();
      const res = await eventService.list({ startAfter, startBefore });
      set({ events: res.events, isLoading: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to load events', isLoading: false });
    }
  },

  createEvent: async (data) => {
    const res = await eventService.create(data);
    set((state) => ({ events: [...state.events, res.event] }));
  },

  updateEvent: async (id, data) => {
    const res = await eventService.update(id, data);
    set((state) => ({
      events: state.events.map((e) => (e.id === id ? res.event : e)),
    }));
  },

  deleteEvent: async (id) => {
    await eventService.delete(id);
    set((state) => ({ events: state.events.filter((e) => e.id !== id) }));
  },

  eventsForDate: (date) => {
    return get().events.filter((e) => e.startTime.startsWith(date));
  },

  markedDates: () => {
    const marks: Record<string, { marked: boolean; dotColor: string }> = {};
    get().events.forEach((e) => {
      const d = e.startTime.split('T')[0];
      if (d) {
        marks[d] = { marked: true, dotColor: '#6366F1' };
      }
    });
    return marks;
  },
}));
