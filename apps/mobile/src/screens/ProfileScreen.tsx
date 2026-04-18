import React, { useCallback, useEffect } from 'react';
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
import { useHabitStore } from '../store/useHabitStore';
import { Header } from '../components';
import { authService } from '../services/authService';
import { notificationService } from '../services/notificationService';

// ─── Achievement definitions ──────────────────────────────────────────────────
const ACHIEVEMENT_META: Record<string, { emoji: string; name: string; description: string }> = {
  habit_logged_1:  { emoji: '🌱', name: 'First Habit',     description: 'Logged your first habit' },
  habit_streak_3:  { emoji: '🔥', name: 'On a Roll',       description: '3-day habit streak' },
  habit_streak_7:  { emoji: '⚡', name: 'Streak Master',   description: '7-day habit streak' },
  habit_streak_30: { emoji: '👑', name: 'Habit Royalty',   description: '30-day habit streak' },
  perfect_day:     { emoji: '🏆', name: 'Perfect Day',     description: 'Completed all habits in a day' },
  mood_logged_1:   { emoji: '😊', name: 'Self-Aware',      description: 'Logged your first mood' },
  mood_streak_7:   { emoji: '🧘', name: 'Mindful Week',    description: '7-day mood logging streak' },
  task_done_1:     { emoji: '✅', name: 'First Step',      description: 'Completed your first task' },
  task_done_10:    { emoji: '📋', name: 'Task Champion',   description: 'Completed 10 tasks' },
  ai_chat_1:       { emoji: '🤖', name: 'AI Explorer',     description: 'Started your first AI chat' },
  level_5:         { emoji: '⭐', name: 'Rising Star',     description: 'Reached Level 5' },
  level_10:        { emoji: '🌟', name: 'Dedicated',       description: 'Reached Level 10' },
};

const LEVEL_LABELS: Record<number, string> = {
  1: 'Beginner', 2: 'Explorer', 3: 'Builder', 4: 'Achiever',
  5: 'Trailblazer', 6: 'Champion', 7: 'Expert', 8: 'Master',
  9: 'Elite', 10: 'Legend',
};

function getLevelLabel(level: number): string {
  return LEVEL_LABELS[Math.min(level, 10)] ?? 'Legend';
}


export function ProfileScreen() {
  const { theme, user, themeMode, setThemeMode, clearAuth, notificationsEnabled, setNotificationsEnabled } = useAppStore();
  const { progress, fetchProgress } = useHabitStore();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

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

        {/* Progress & Level */}
        {progress && (
          <View style={[styles.progressCard, { backgroundColor: theme.colors.primary }]}>
            <View style={styles.progressRow}>
              <View style={styles.progressStat}>
                <Text style={styles.progressStatValue}>{progress.level}</Text>
                <Text style={styles.progressStatLabel}>Level</Text>
              </View>
              <View style={[styles.progressDivider, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
              <View style={styles.progressStat}>
                <Text style={styles.progressStatValue}>{progress.points}</Text>
                <Text style={styles.progressStatLabel}>Points</Text>
              </View>
              <View style={[styles.progressDivider, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
              <View style={styles.progressStat}>
                <Text style={styles.progressStatValue}>{progress.streakDays}</Text>
                <Text style={styles.progressStatLabel}>Day Streak</Text>
              </View>
            </View>
            <Text style={styles.levelLabel}>{getLevelLabel(progress.level)}</Text>
            {/* XP bar: progress within current level */}
            <View style={styles.xpTrack}>
              <View
                style={[
                  styles.xpFill,
                  { width: `${((progress.points % 100) / 100) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.xpLabel}>
              {progress.points % 100}/100 XP to Level {progress.level + 1}
            </Text>
          </View>
        )}

        {/* Achievements */}
        <View style={styles.settingsSection}>
          <Text style={[theme.typography.h3, { color: theme.colors.textPrimary, marginBottom: 12 }]}>
            Achievements
          </Text>
          {progress && progress.achievements.length > 0 ? (
            <View style={styles.achievementGrid}>
              {progress.achievements.map((key) => {
                const meta = ACHIEVEMENT_META[key];
                if (!meta) return null;
                return (
                  <View
                    key={key}
                    style={[
                      styles.achievementBadge,
                      { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md },
                    ]}
                  >
                    <Text style={{ fontSize: 26 }}>{meta.emoji}</Text>
                    <Text
                      style={[theme.typography.caption, { color: theme.colors.textPrimary, fontWeight: '700', marginTop: 4, textAlign: 'center' }]}
                      numberOfLines={1}
                    >
                      {meta.name}
                    </Text>
                    <Text
                      style={[theme.typography.caption, { color: theme.colors.textMuted, fontSize: 10, textAlign: 'center', marginTop: 2 }]}
                      numberOfLines={2}
                    >
                      {meta.description}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={[styles.emptyAchievements, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md }]}>
              <Text style={{ fontSize: 32 }}>🏅</Text>
              <Text style={[theme.typography.bodySmall, { color: theme.colors.textSecondary, marginTop: 8, textAlign: 'center' }]}>
                Complete tasks, log moods and build habits to earn badges.
              </Text>
            </View>
          )}
        </View>
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

  // Progress card
  progressCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 18,
    padding: 20,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressStat: { alignItems: 'center' },
  progressStatValue: { fontSize: 24, fontWeight: '800', color: '#fff' },
  progressStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  progressDivider: { width: 1, height: 32 },
  levelLabel: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginBottom: 8 },
  xpTrack: { height: 6, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  xpFill: { height: '100%', backgroundColor: '#fff', borderRadius: 3 },
  xpLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },

  // Achievements
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  achievementBadge: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderWidth: 1,
  },
  emptyAchievements: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderWidth: 1,
  },
});
