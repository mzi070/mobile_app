import { api } from './api';

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  recurrenceRule?: string;
  reminders: number[];
  linkedTaskId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventInput {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  reminders?: number[];
  linkedTaskId?: string;
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  reminders?: number[];
  linkedTaskId?: string;
}

interface EventListResponse {
  events: CalendarEvent[];
}

interface EventResponse {
  event: CalendarEvent;
}

export const eventService = {
  list: (params?: { startAfter?: string; startBefore?: string }) => {
    const query: Record<string, string> = {};
    if (params?.startAfter) query.startAfter = params.startAfter;
    if (params?.startBefore) query.startBefore = params.startBefore;
    return api.get<EventListResponse>('/api/events', query);
  },

  get: (id: string) => api.get<EventResponse>(`/api/events/${id}`),

  create: (data: CreateEventInput) =>
    api.post<EventResponse>('/api/events', data),

  update: (id: string, data: UpdateEventInput) =>
    api.patch<EventResponse>(`/api/events/${id}`, data),

  delete: (id: string) => api.delete<{ message: string }>(`/api/events/${id}`),
};
