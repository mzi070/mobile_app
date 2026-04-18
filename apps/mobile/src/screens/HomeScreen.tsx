import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../store';
import { Card } from '../components';
import type { Theme } from '../theme';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function HomeScreen() {
  const { theme, user } = useAppStore();
  const insets = useSafeAreaInsets();
  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={[theme.typography.h1, { color: theme.colors.textPrimary }]}>
          {getGreeting()}, {firstName}
        </Text>
        <Text
          style={[
            theme.typography.body,
            { color: theme.colors.textSecondary, marginTop: 4 },
          ]}
        >
          {formatDate()}
        </Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <QuickActionButton emoji="📝" label="Add Task" theme={theme} />
        <QuickActionButton emoji="😊" label="Log Mood" theme={theme} />
        <QuickActionButton emoji="💬" label="Chat" theme={theme} />
        <QuickActionButton emoji="🎯" label="Habits" theme={theme} />
      </View>

      {/* Upcoming Card */}
      <View style={styles.section}>
        <Text
          style={[
            theme.typography.h3,
            { color: theme.colors.textPrimary, marginBottom: 12 },
          ]}
        >
          Coming Up
        </Text>
        <Card elevated>
          <View style={styles.emptyCard}>
            <Text style={{ fontSize: 32 }}>📅</Text>
            <Text
              style={[
                theme.typography.body,
                { color: theme.colors.textSecondary, marginTop: 8 },
              ]}
            >
              No upcoming events today
            </Text>
          </View>
        </Card>
      </View>

      {/* Tasks Card */}
      <View style={styles.section}>
        <Text
          style={[
            theme.typography.h3,
            { color: theme.colors.textPrimary, marginBottom: 12 },
          ]}
        >
          Today's Tasks
        </Text>
        <Card elevated>
          <View style={styles.emptyCard}>
            <Text style={{ fontSize: 32 }}>✅</Text>
            <Text
              style={[
                theme.typography.body,
                { color: theme.colors.textSecondary, marginTop: 8 },
              ]}
            >
              No tasks for today. Enjoy your free time!
            </Text>
          </View>
        </Card>
      </View>

      {/* Wellness Card */}
      <View style={styles.section}>
        <Text
          style={[
            theme.typography.h3,
            { color: theme.colors.textPrimary, marginBottom: 12 },
          ]}
        >
          Wellness
        </Text>
        <Card
          elevated
          style={{ backgroundColor: theme.colors.primaryLight }}
        >
          <View style={styles.wellnessCard}>
            <Text style={{ fontSize: 28 }}>🧘</Text>
            <View style={{ marginLeft: 16, flex: 1 }}>
              <Text
                style={[theme.typography.h3, { color: theme.colors.textPrimary }]}
              >
                How are you feeling?
              </Text>
              <Text
                style={[
                  theme.typography.bodySmall,
                  { color: theme.colors.textSecondary, marginTop: 4 },
                ]}
              >
                Take a moment to check in with yourself
              </Text>
            </View>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}

function QuickActionButton({
  emoji,
  label,
  theme,
}: {
  emoji: string;
  label: string;
  theme: Theme;
}) {
  return (
    <View
      style={[
        styles.quickAction,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.lg,
        },
      ]}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <Text style={{ fontSize: 24 }}>{emoji}</Text>
      <Text
        style={[
          theme.typography.caption,
          { color: theme.colors.textSecondary, marginTop: 4 },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    minHeight: 80,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  wellnessCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
