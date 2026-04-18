import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { AppNavigator } from './src/navigation';
import { useAppStore } from './src/store';
import { notificationService } from './src/services/notificationService';

function App() {
  const { theme, notificationsEnabled } = useAppStore();
  const isDark = theme.colors.background === '#111827';

  useEffect(() => {
    // Set up notification channels on every app launch (idempotent)
    notificationService.setup().catch(() => {});
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
