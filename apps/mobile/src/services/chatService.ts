import { api } from './api';

export interface ActionCard {
  label: string;
  action: 'navigate' | 'remind';
  screen?: string;
  message?: string;
  time?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actions: ActionCard[] | null;
  createdAt: string;
}

export interface SendMessageResponse {
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
}

export const chatService = {
  list: (limit = 50) =>
    api.get<ChatMessage[]>('/api/chat', { limit: String(limit) }),

  send: (content: string) =>
    api.post<SendMessageResponse>('/api/chat', { content }),

  clear: () => api.delete<{ ok: boolean }>('/api/chat'),
};
