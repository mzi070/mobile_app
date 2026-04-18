import { create } from 'zustand';
import { getTheme, Theme } from '../theme';

interface AppState {
  // Theme
  themeMode: 'light' | 'dark' | 'system';
  theme: Theme;
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;

  // Auth
  isAuthenticated: boolean;
  accessToken: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  } | null;
  setAuth: (token: string, user: AppState['user']) => void;
  clearAuth: () => void;

  // Onboarding
  hasCompletedOnboarding: boolean;
  setOnboardingComplete: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Theme
  themeMode: 'system',
  theme: getTheme('system'),
  setThemeMode: (mode) =>
    set({ themeMode: mode, theme: getTheme(mode) }),

  // Auth
  isAuthenticated: false,
  accessToken: null,
  user: null,
  setAuth: (token, user) =>
    set({ isAuthenticated: true, accessToken: token, user }),
  clearAuth: () =>
    set({ isAuthenticated: false, accessToken: null, user: null }),

  // Onboarding
  hasCompletedOnboarding: false,
  setOnboardingComplete: () => set({ hasCompletedOnboarding: true }),
}));
