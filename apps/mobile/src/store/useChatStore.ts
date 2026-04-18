import { create } from 'zustand';
import { chatService, ChatMessage } from '../services/chatService';

interface ChatStore {
  messages: ChatMessage[];
  isLoading: boolean;
  isTyping: boolean;
  error: string | null;
  fetchHistory: () => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  clearHistory: () => Promise<void>;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isLoading: false,
  isTyping: false,
  error: null,

  fetchHistory: async () => {
    if (get().isLoading) return;
    set({ isLoading: true, error: null });
    try {
      const messages = await chatService.list(50);
      set({ messages });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load chat history' });
    } finally {
      set({ isLoading: false });
    }
  },

  sendMessage: async (content: string) => {
    if (get().isTyping) return;

    // Optimistic user bubble
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      actions: null,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, tempUserMsg],
      isTyping: true,
      error: null,
    }));

    try {
      const { userMessage, assistantMessage } = await chatService.send(content);
      // Replace temp message and append assistant reply
      set((state) => ({
        messages: [
          ...state.messages.filter((m) => m.id !== tempUserMsg.id),
          userMessage,
          assistantMessage,
        ],
        isTyping: false,
      }));
    } catch (err) {
      // Remove temp message on failure
      set((state) => ({
        messages: state.messages.filter((m) => m.id !== tempUserMsg.id),
        isTyping: false,
        error: err instanceof Error ? err.message : 'Failed to send message',
      }));
    }
  },

  clearHistory: async () => {
    try {
      await chatService.clear();
      set({ messages: [] });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to clear history' });
    }
  },
}));
