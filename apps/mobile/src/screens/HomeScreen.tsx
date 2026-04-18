import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useAppStore } from '../store';
import { useTaskStore } from '../store/useTaskStore';
import { useEventStore } from '../store/useEventStore';
import { useMoodStore } from '../store/useMoodStore';
import { useHabitStore } from '../store/useHabitStore';
import { Card, TaskItem, MoodLogSheet, TaskFormSheet } from '../components';
import { CreateMoodInput } from '../services/moodService';
import { CreateTaskInput, UpdateTaskInput } from '../services/taskService';
import { Task, CalendarEvent } from '../services';
import { MainTabParamList } from '../navigation/AppNavigator';
import type { Theme } from '../theme';

type HomeNav = BottomTabNavigationProp<MainTabParamList, 'Home'>;

const MOOD_EMOJIS: Record<number, string> = { 1: '😞', 2: '😕', 3: '😐', 4: '😊', 5: '🤩' };

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function formatEventTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function QuickAction({
  emoji,
  label,
  theme,
  onPress,
}: {
  emoji: string;
  label: string;
  theme: Theme;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.quickAction,
        { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg, borderColor: theme.colors.border },
      ]}
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
      activeOpacity={0.7}
    >
      <Text style={{ fontSize: 24 }}>{emoji}</Text>
      <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 4, textAlign: 'center' }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function SectionHeader({
  title,
  actionLabel,
  onAction,
  theme,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  theme: Theme;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={[theme.typography.h3, { color: theme.colors.textPrimary }]}>{title}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
          <Text style={{ fontSize: 13, color: theme.colors.primary, fontWeight: '600' }}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function SummaryPill({
  emoji,
  value,
  label,
  theme,
}: {
  emoji: string;
  value: string;
  label: string;
  theme: Theme;
}) {
  return (
    <View style={[styles.summaryPill, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <Text style={{ fontSize: 18 }}>{emoji}</Text>
      <View style={{ marginLeft: 6 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: theme.colors.text }}>{value}</Text>
        <Text style={{ fontSize: 10, color: theme.colors.textMuted }}>{label}</Text>
      </View>
    </View>
  );
}

function EventRow({ event, theme }: { event: CalendarEvent; theme: Theme }) {
  return (
    <View style={[styles.eventRow, { borderLeftColor: theme.colors.primary }]}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text }} numberOfLines={1}>
          {event.title}
        </Text>
        {event.location ? (
          <Text style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 1 }} numberOfLines={1}>
            📍 {event.location}
          </Text>
        ) : null}
      </View>
      <Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginLeft: 8 }}>
        {formatEventTime(event.startTime)}
      </Text>
    </View>
  );
}

// ─── Main HomeScreen ──────────────────────────────────────────────────────────
export function HomeScreen() {
  const { theme, user } = useAppStore();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<HomeNav>();

  const { tasks, fetchTasks, toggleDone, createTask } = useTaskStore();
  const { events, fetchEventsForMonth } = useEventStore();
  const { todayEntry, fetchToday, fetchRecent, logMood } = useMoodStore();
  const { fetchHabits, fetchProgress, todayCompletionRate, isCompletedToday, habits } = useHabitStore();

  const [moodSheetVisible, setMoodSheetVisible] = useState(false);
  const [taskSheetVisible, setTaskSheetVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const firstName = user?.name?.split(' ')[0] || 'there';
  const today = new Date().toISOString().split('T')[0] as string;
  const now = new Date();

  useEffect(() => {
    fetchTasks();
    fetchEventsForMonth(now.getFullYear(), now.getMonth() + 1);
    fetchToday();
    fetchRecent(7);
    fetchHabits();
    fetchProgress();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      fetchTasks(),
      fetchEventsForMonth(now.getFullYear(), now.getMonth() + 1),
      fetchToday(),
      fetchRecent(7),
      fetchHabits(),
      fetchProgress(),
    ]);
    setIsRefreshing(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Derive today's data
  const todayTasks = tasks.filter(
    (t) => t.status !== 'done' && (!t.dueDate || t.dueDate.startsWith(today)),
  ).slice(0, 3);
  const doneTodayCount = tasks.filter(
    (t) => t.status === 'done' && (!t.dueDate || t.dueDate.startsWith(today)),
  ).length;
  const todayEvents = events
    .filter((e) => e.startTime.startsWith(today))
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .slice(0, 3);
  const habitRate = todayCompletionRate();

  const handleSaveMood = useCallback(
    async (data: CreateMoodInput) => {
      await logMood(data);
    },
    [logMood],
  );

  const handleCreateTask = useCallback(
    async (data: CreateTaskInput | UpdateTaskInput) => {
      await createTask(data as CreateTaskInput);
      setTaskSheetVisible(false);
      navigation.navigate('Tasks');
    },
    [createTask, navigation],
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
    >
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={[theme.typography.h1, { color: theme.colors.textPrimary }]}>
            {getGreeting()}, {firstName} 👋
          </Text>
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: 4 }]}>
            {formatDate()}
          </Text>
        </View>
      </View>

      {/* ── Today's summary pills ── */}
      <View style={styles.summaryRow}>
        <SummaryPill
          emoji="✅"
          value={`${doneTodayCount}/${tasks.length}`}
          label="tasks done"
          theme={theme}
        />
        <SummaryPill
          emoji="🎯"
          value={habits.length > 0 ? `${habitRate}%` : '—'}
          label="habits"
          theme={theme}
        />
        <SummaryPill
          emoji="😊"
          value={todayEntry ? MOOD_EMOJIS[todayEntry.mood] ?? '—' : '—'}
          label="today's mood"
          theme={theme}
        />
      </View>

      {/* ── Quick Actions ── */}
      <View style={styles.quickActions}>
        <QuickAction
          emoji="📝"
          label="Add Task"
          theme={theme}
          onPress={() => setTaskSheetVisible(true)}
        />
        <QuickAction
          emoji="😊"
          label="Log Mood"
          theme={theme}
          onPress={() => setMoodSheetVisible(true)}
        />
        <QuickAction
          emoji="💬"
          label="Chat AI"
          theme={theme}
          onPress={() => navigation.navigate('Chat')}
        />
        <QuickAction
          emoji="🌱"
          label="Habits"
          theme={theme}
          onPress={() => navigation.navigate('Wellness')}
        />
      </View>

      {/* ── Upcoming events ── */}
      <View style={styles.section}>
        <SectionHeader
          title="Coming Up"
          actionLabel={todayEvents.length > 0 ? 'See calendar' : undefined}
          onAction={() => navigation.navigate('Calendar')}
          theme={theme}
        />
        <Card elevated>
          {todayEvents.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={{ fontSize: 28 }}>📅</Text>
              <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: 8 }]}>
                No events today
              </Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {todayEvents.map((ev) => (
                <EventRow key={ev.id} event={ev} theme={theme} />
              ))}
            </View>
          )}
        </Card>
      </View>

      {/* ── Today's Tasks ── */}
      <View style={styles.section}>
        <SectionHeader
          title="Today's Tasks"
          actionLabel="See all"
          onAction={() => navigation.navigate('Tasks')}
          theme={theme}
        />
        {todayTasks.length === 0 ? (
          <Card elevated>
            <View style={styles.emptyCard}>
              <Text style={{ fontSize: 28 }}>🎉</Text>
              <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: 8 }]}>
                {tasks.length > 0 ? 'All tasks done! Great work.' : 'No pending tasks today.'}
              </Text>
            </View>
          </Card>
        ) : (
          <View style={[styles.taskList, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            {todayTasks.map((task, idx) => (
              <View key={task.id}>
                <TaskItem
                  task={task}
                  theme={theme}
                  onToggleDone={(t: Task) => toggleDone(t)}
                  onPress={() => navigation.navigate('Tasks')}
                />
                {idx < todayTasks.length - 1 && (
                  <View style={[styles.taskDivider, { backgroundColor: theme.colors.border }]} />
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      {/* ── Wellness snapshot ── */}
      <View style={styles.section}>
        <SectionHeader
          title="Wellness"
          actionLabel="Open"
          onAction={() => navigation.navigate('Wellness')}
          theme={theme}
        />
        <View style={styles.wellnessRow}>
          {/* Mood card */}
          <TouchableOpacity
            style={[
              styles.wellnessCard,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
            onPress={() => setMoodSheetVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 30 }}>
              {todayEntry ? MOOD_EMOJIS[todayEntry.mood] : '😶'}
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.text, marginTop: 6 }}>
              {todayEntry ? `Mood: ${todayEntry.mood}/5` : 'Log mood'}
            </Text>
            <Text style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 2 }}>
              {todayEntry ? `Energy: ${todayEntry.energy}/5` : 'Tap to log'}
            </Text>
          </TouchableOpacity>

          {/* Habits card */}
          <TouchableOpacity
            style={[
              styles.wellnessCard,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
            onPress={() => navigation.navigate('Wellness')}
            activeOpacity={0.8}
          >
            {/* Simple progress arc using text */}
            <Text style={{ fontSize: 30 }}>
              {habits.length === 0 ? '🌱' : habitRate === 100 ? '🏆' : habitRate > 50 ? '🔥' : '⚡'}
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.text, marginTop: 6 }}>
              {habits.length === 0 ? 'Add habits' : `${habitRate}% done`}
            </Text>
            <Text style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 2 }}>
              {habits.length === 0 ? 'Build routines' : `${habits.filter((h) => isCompletedToday(h.id)).length}/${habits.length} habits`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── AI suggestion card ── */}
      <View style={[styles.section, { marginBottom: 0 }]}>
        <TouchableOpacity
          style={[styles.aiCard, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.navigate('Chat')}
          activeOpacity={0.85}
        >
          <Text style={{ fontSize: 28 }}>🤖</Text>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>
              Ask LifeFlow AI
            </Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
              Get personalised tips for your day
            </Text>
          </View>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 18 }}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom sheets */}
      <MoodLogSheet
        theme={theme}
        visible={moodSheetVisible}
        currentMood={todayEntry?.mood ?? null}
        currentEnergy={todayEntry?.energy ?? null}
        onSave={handleSaveMood}
        onClose={() => setMoodSheetVisible(false)}
      />
      <TaskFormSheet
        theme={theme}
        task={null}
        visible={taskSheetVisible}
        onSave={handleCreateTask}
        onClose={() => setTaskSheetVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, marginBottom: 16 },

  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  summaryPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 24,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    minHeight: 76,
    borderWidth: 1,
  },

  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  emptyCard: { alignItems: 'center', paddingVertical: 18 },

  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 3,
    paddingLeft: 10,
  },

  taskList: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  taskDivider: { height: 1 },

  wellnessRow: { flexDirection: 'row', gap: 10 },
  wellnessCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
  },

  aiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
  },
});
