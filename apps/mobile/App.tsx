import React, { useEffect, useCallback } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import notifee, { EventType } from '@notifee/react-native';
import type { Notification } from '@notifee/react-native';
import { AppNavigator, navigationRef } from './src/navigation';
import { useAppStore } from './src/store';
import { notificationService } from './src/services/notificationService';

// ─── Notification deep-link helper ───────────────────────────────────────────
function routeForNotification(notification: Notification | undefined): string | null {
  if (!notification) return null;
  const id = notification.id ?? '';
  const channel = (notification.android?.channelId ?? '') as string;
  if (id.startsWith('task-') || channel === 'tasks') return 'Tasks';
  if (id === 'habit-daily-reminder' || channel === 'habits') return 'Wellness';
  if (id === 'mood-daily-checkin' || channel === 'wellness') return 'Wellness';
  return null;
}

function navigateFromNotification(notification: Notification | undefined) {
  const route = routeForNotification(notification);
  if (route && navigationRef.isReady()) {
    navigationRef.navigate(route as never);
  }
}

function App() {
  const { theme, notificationsEnabled } = useAppStore();
  const isDark = theme.colors.background === '#111827';

  // ── Notification deep-link handler ────────────────────────────────────────
  const handleForegroundEvent = useCallback(() => {
    return notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        navigateFromNotification(detail.notification);
      }
    });
  }, []);

  useEffect(() => {
    // Set up notification channels on every app launch (idempotent)
    notificationService.setup().catch(() => {});

    // Handle notification that launched the app (cold-start or background press)
    notifee.getInitialNotification().then((initial) => {
      if (initial?.notification) {
        // Small delay to let NavigationContainer mount
        setTimeout(() => navigateFromNotification(initial.notification), 300);
      }
    }).catch(() => {});

    // Subscribe to foreground notification events
    const unsubscribe = handleForegroundEvent();
    return unsubscribe;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Re-schedule recurring reminders if notifications are enabled
    if (notificationsEnabled) {
      notificationService.scheduleDailyHabitReminder(20, 0).catch(() => {});
      notificationService.scheduleDailyMoodCheckIn(9, 0).catch(() => {});
    }
  }, [notificationsEnabled]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <StatusBar
            barStyle={isDark ? 'light-content' : 'dark-content'}
            backgroundColor={theme.colors.background}
          />
          <AppNavigator />
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
