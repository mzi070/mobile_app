import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTheme, Theme } from '../theme';

type ThemeMode = 'light' | 'dark' | 'system';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface AppState {
  // Theme
  themeMode: ThemeMode;
  theme: Theme;
  setThemeMode: (mode: ThemeMode) => void;

  // Auth
  isAuthenticated: boolean;
  accessToken: string | null;
  user: AppUser | null;
  setAuth: (token: string, user: AppUser) => void;
  clearAuth: () => void;

  // Notifications
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;

  // Onboarding
  hasCompletedOnboarding: boolean;
  setOnboardingComplete: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Theme
      themeMode: 'system' as ThemeMode,
      theme: getTheme('system'),
      setThemeMode: (mode) => set({ themeMode: mode, theme: getTheme(mode) }),

      // Auth
      isAuthenticated: false,
      accessToken: null,
      user: null,
      setAuth: (token, user) =>
        set({ isAuthenticated: true, accessToken: token, user }),
      clearAuth: () =>
        set({ isAuthenticated: false, accessToken: null, user: null }),

      // Notifications
      notificationsEnabled: true,
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),

      // Onboarding
      hasCompletedOnboarding: false,
      setOnboardingComplete: () => set({ hasCompletedOnboarding: true }),
    }),
    {
      name: 'lifeflow-app',
      storage: createJSONStorage(() => AsyncStorage),
      // Recompute non-serialisable `theme` object from the persisted `themeMode`
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.theme = getTheme(state.themeMode);
        }
      },
      partialize: (state) => ({
        themeMode: state.themeMode,
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        user: state.user,
        notificationsEnabled: state.notificationsEnabled,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
    },
  ),
);
