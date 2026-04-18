import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../store';
import { Header } from '../components';
import { authService } from '../services/authService';
import { notificationService } from '../services/notificationService';

export function ProfileScreen() {
  const { theme, user, themeMode, setThemeMode, clearAuth, notificationsEnabled, setNotificationsEnabled } = useAppStore();
  const insets = useSafeAreaInsets();

  const handleSignOut = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await authService.logout();
          } catch {
            // clearSession may fail if no web session exists (demo login); continue anyway
          }
          await authService.clearCredentials();
          await notificationService.cancelAll();
          clearAuth();
        },
      },
    ]);
  }, [clearAuth]);

  const handleNotificationsToggle = useCallback(
    async (enabled: boolean) => {
      setNotificationsEnabled(enabled);
      if (enabled) {
        const granted = await notificationService.requestPermission();
        if (granted) {
          await notificationService.scheduleDailyHabitReminder(20, 0);
          await notificationService.scheduleDailyMoodCheckIn(9, 0);
        } else {
          // Permission denied — revert toggle
          setNotificationsEnabled(false);
        }
      } else {
        await notificationService.cancelAll();
      }
    },
    [setNotificationsEnabled],
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header title="Profile" subtitle="Settings & preferences" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {/* User Info */}
        <View style={styles.section}>
          <View
            style={[
              styles.avatarContainer,
              { backgroundColor: theme.colors.primaryLight },
            ]}
          >
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <Text
            style={[
              theme.typography.h2,
              { color: theme.colors.textPrimary, textAlign: 'center', marginTop: 12 },
            ]}
          >
            {user?.name || 'Guest User'}
          </Text>
          <Text
            style={[
              theme.typography.body,
              { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 4 },
            ]}
          >
            {user?.email || 'Not signed in'}
          </Text>
        </View>

        {/* Theme Setting */}
        <View style={styles.settingsSection}>
          <Text
            style={[
              theme.typography.h3,
              { color: theme.colors.textPrimary, marginBottom: 12 },
            ]}
          >
            Appearance
          </Text>
          {(['light', 'dark', 'system'] as const).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.settingRow,
                { borderBottomColor: theme.colors.border },
              ]}
              onPress={() => setThemeMode(mode)}
              accessibilityLabel={`${mode} theme`}
              accessibilityRole="radio"
              accessibilityState={{ selected: themeMode === mode }}
            >
              <Text
                style={[
                  theme.typography.body,
                  { color: theme.colors.textPrimary, textTransform: 'capitalize' },
                ]}
              >
                {mode}
              </Text>
              <View
                style={[
                  styles.radio,
                  {
                    borderColor: theme.colors.primary,
                    backgroundColor:
                      themeMode === mode ? theme.colors.primary : 'transparent',
                  },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Privacy */}
        <View style={styles.settingsSection}>
          <Text
            style={[
              theme.typography.h3,
              { color: theme.colors.textPrimary, marginBottom: 12 },
            ]}
          >
            Privacy & Data
          </Text>
          <View
            style={[
              styles.settingRow,
              { borderBottomColor: theme.colors.border },
            ]}
          >
            <Text
              style={[theme.typography.body, { color: theme.colors.textPrimary }]}
            >
              Notifications
            </Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationsToggle}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primaryLight,
              }}
              thumbColor={theme.colors.primary}
              accessibilityLabel="Toggle notifications"
            />
          </View>
          <TouchableOpacity
            style={[
              styles.settingRow,
              { borderBottomColor: theme.colors.border },
            ]}
            accessibilityLabel="Export data"
            accessibilityRole="button"
          >
            <Text
              style={[theme.typography.body, { color: theme.colors.textPrimary }]}
            >
              Export My Data
            </Text>
            <Text
              style={[theme.typography.body, { color: theme.colors.textSecondary }]}
            >
              →
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.settingRow,
              { borderBottomColor: theme.colors.border },
            ]}
            accessibilityLabel="Delete account"
            accessibilityRole="button"
          >
            <Text
              style={[theme.typography.body, { color: theme.colors.error }]}
            >
              Delete Account
            </Text>
            <Text
              style={[theme.typography.body, { color: theme.colors.error }]}
            >
              →
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <View style={styles.settingsSection}>
          <TouchableOpacity
            style={[
              styles.signOutButton,
              { borderColor: theme.colors.error, borderRadius: theme.borderRadius.md },
            ]}
            onPress={handleSignOut}
            accessibilityLabel="Sign out"
            accessibilityRole="button"
          >
            <Text
              style={[theme.typography.button, { color: theme.colors.error }]}
            >
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>

        {/* Version */}
        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.textTertiary, textAlign: 'center', marginTop: 24 },
          ]}
        >
          LifeFlow v0.1.0
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
  },
  settingsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    minHeight: 48,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  signOutButton: {
    borderWidth: 1.5,
    paddingVertical: 14,
    alignItems: 'center',
  },
});
