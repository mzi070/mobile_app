import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { useMoodStore } from '../store/useMoodStore';
import { useHabitStore } from '../store/useHabitStore';
import { Habit, CreateHabitInput } from '../services/habitService';
import { CreateMoodInput, MoodScore } from '../services/moodService';
import { Header, HabitCard, HabitFormSheet, MoodLogSheet } from '../components';
import { Theme } from '../theme';

const MOOD_EMOJIS: Record<number, string> = { 1: '😞', 2: '😕', 3: '😐', 4: '😊', 5: '🤩' };
const ENERGY_EMOJIS: Record<number, string> = { 1: '🪫', 2: '😴', 3: '⚡', 4: '🔋', 5: '🚀' };

// ─── Stat card component ──────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  emoji,
  theme,
}: {
  label: string;
  value: string;
  emoji: string;
  theme: Theme;
}) {
  return (
    <View
      style={[
        statStyles.card,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
    >
      <Text style={statStyles.emoji}>{emoji}</Text>
      <Text style={[statStyles.value, { color: theme.colors.text }]}>{value}</Text>
      <Text style={[statStyles.label, { color: theme.colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  emoji: { fontSize: 26 },
  value: { fontSize: 20, fontWeight: '700' },
  label: { fontSize: 11, textAlign: 'center' },
});

// ─── Mood history bar chart ────────────────────────────────────────────────────
function MoodHistoryChart({
  history,
  theme,
}: {
  history: Array<{ date: string; mood: MoodScore; energy: MoodScore }>;
  theme: Theme;
}) {
  if (history.length === 0) return null;

  return (
    <View style={chartStyles.container}>
      {history.map((entry, i) => {
        const dayLabel = new Date(entry.date + 'T12:00:00').toLocaleDateString('en-US', {
          weekday: 'short',
        });
        const moodHeight = (entry.mood / 5) * 56;
        const energyHeight = (entry.energy / 5) * 56;
        return (
          <View key={i} style={chartStyles.dayCol}>
            <View style={chartStyles.barsRow}>
              <View
                style={[
                  chartStyles.bar,
                  {
                    height: moodHeight,
                    backgroundColor: theme.colors.primary + 'CC',
                  },
                ]}
              />
              <View
                style={[
                  chartStyles.bar,
                  {
                    height: energyHeight,
                    backgroundColor: theme.colors.accent + 'CC',
                  },
                ]}
              />
            </View>
            <Text style={[chartStyles.dayLabel, { color: theme.colors.textMuted }]}>
              {dayLabel}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, height: 80, alignItems: 'flex-end' },
  dayCol: { flex: 1, alignItems: 'center', gap: 4 },
  barsRow: { flexDirection: 'row', gap: 2, alignItems: 'flex-end', height: 60 },
  bar: { width: 6, borderRadius: 3 },
  dayLabel: { fontSize: 9, textAlign: 'center' },
});

// ─── Main WellnessScreen ──────────────────────────────────────────────────────
export function WellnessScreen() {
  const { theme } = useAppStore();
  const {
    todayEntry,
    isLoading: moodLoading,
    fetchToday,
    fetchRecent,
    logMood,
    avgMoodLast7,
    avgEnergyLast7,
    moodHistory,
  } = useMoodStore();

  const {
    habits,
    isLoading: habitsLoading,
    fetchHabits,
    fetchProgress,
    createHabit,
    updateHabit,
    deleteHabit,
    toggleLog,
    todayCompletionRate,
    streakForHabit,
    isCompletedToday,
    progress,
  } = useHabitStore();

  const [moodSheetVisible, setMoodSheetVisible] = useState(false);
  const [habitSheetVisible, setHabitSheetVisible] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchToday();
    fetchRecent(30);
    fetchHabits();
    fetchProgress();
  }, [fetchToday, fetchRecent, fetchHabits, fetchProgress]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([fetchToday(), fetchRecent(30), fetchHabits(), fetchProgress()]);
    setIsRefreshing(false);
  }, [fetchToday, fetchRecent, fetchHabits, fetchProgress]);

  const openCreateHabit = useCallback(() => {
    setSelectedHabit(null);
    setHabitSheetVisible(true);
  }, []);

  const openEditHabit = useCallback((habit: Habit) => {
    setSelectedHabit(habit);
    setHabitSheetVisible(true);
  }, []);

  const handleSaveHabit = useCallback(
    async (data: CreateHabitInput) => {
      if (selectedHabit) {
        await updateHabit(selectedHabit.id, data);
      } else {
        await createHabit(data);
      }
    },
    [selectedHabit, createHabit, updateHabit],
  );

  const handleDeleteHabit = useCallback(async () => {
    if (selectedHabit) await deleteHabit(selectedHabit.id);
  }, [selectedHabit, deleteHabit]);

  const handleLogMood = useCallback(
    async (data: CreateMoodInput) => {
      await logMood(data);
    },
    [logMood],
  );

  const isLoading = moodLoading || habitsLoading;
  const history = moodHistory();
  const avgMood = avgMoodLast7();
  const avgEnergy = avgEnergyLast7();
  const completionRate = todayCompletionRate();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header title="Wellness" subtitle="Mind & body dashboard" />

      {isLoading && habits.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.accent}
              colors={[theme.colors.accent]}
            />
          }
        >
          {/* ── Today's mood card ── */}
          <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Today's Mood</Text>
              <TouchableOpacity
                style={[styles.logBtn, { backgroundColor: theme.colors.accent }]}
                onPress={() => setMoodSheetVisible(true)}
              >
                <Text style={styles.logBtnText}>{todayEntry ? 'Update' : '+ Log'}</Text>
              </TouchableOpacity>
            </View>

            {todayEntry ? (
              <View style={styles.moodRow}>
                <View style={styles.moodItem}>
                  <Text style={styles.moodEmoji}>{MOOD_EMOJIS[todayEntry.mood]}</Text>
                  <Text style={[styles.moodLabel, { color: theme.colors.text }]}>
                    Mood: {todayEntry.mood}/5
                  </Text>
                </View>
                <View style={styles.moodItem}>
                  <Text style={styles.moodEmoji}>{ENERGY_EMOJIS[todayEntry.energy]}</Text>
                  <Text style={[styles.moodLabel, { color: theme.colors.text }]}>
                    Energy: {todayEntry.energy}/5
                  </Text>
                </View>
                {todayEntry.notes ? (
                  <Text style={[styles.moodNotes, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                    {todayEntry.notes}
                  </Text>
                ) : null}
              </View>
            ) : (
              <Text style={[styles.noMoodText, { color: theme.colors.textMuted }]}>
                You haven't logged your mood today yet.
              </Text>
            )}
          </View>

          {/* ── Stats row ── */}
          <View style={styles.statsRow}>
            <StatCard
              label="Avg Mood (7d)"
              value={avgMood !== null ? `${avgMood}` : '—'}
              emoji="😊"
              theme={theme}
            />
            <View style={styles.statGap} />
            <StatCard
              label="Avg Energy (7d)"
              value={avgEnergy !== null ? `${avgEnergy}` : '—'}
              emoji="⚡"
              theme={theme}
            />
            <View style={styles.statGap} />
            <StatCard
              label="Habits Today"
              value={habits.length > 0 ? `${completionRate}%` : '—'}
              emoji="✅"
              theme={theme}
            />
          </View>

          {/* ── Progress badge ── */}
          {progress && (
            <View style={[styles.progressBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.progressText, { color: theme.colors.text }]}>
                🏆 Level {progress.level}  •  {progress.points} pts  •  🔥 {progress.streakDays} day streak
              </Text>
            </View>
          )}

          {/* ── 7-day chart ── */}
          {history.length > 0 && (
            <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Last 7 Days</Text>
                <View style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: theme.colors.primary }]} />
                  <Text style={[styles.legendText, { color: theme.colors.textMuted }]}>Mood</Text>
                  <View style={[styles.legendDot, { backgroundColor: theme.colors.accent }]} />
                  <Text style={[styles.legendText, { color: theme.colors.textMuted }]}>Energy</Text>
                </View>
              </View>
              <MoodHistoryChart history={history} theme={theme} />
            </View>
          )}

          {/* ── Habits section ── */}
          <View style={styles.habitsHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Habits ({habits.length})
            </Text>
            <TouchableOpacity
              style={[styles.addHabitBtn, { borderColor: theme.colors.primary }]}
              onPress={openCreateHabit}
            >
              <Text style={[styles.addHabitText, { color: theme.colors.primary }]}>+ Habit</Text>
            </TouchableOpacity>
          </View>

          {habits.length === 0 ? (
            <View style={[styles.emptyHabits, { borderColor: theme.colors.border }]}>
              <Text style={styles.emptyEmoji}>🌱</Text>
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No habits yet</Text>
              <Text style={[styles.emptyMessage, { color: theme.colors.textMuted }]}>
                Build positive routines by adding your first habit.
              </Text>
            </View>
          ) : (
            habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                theme={theme}
                isCompletedToday={isCompletedToday(habit.id)}
                streak={streakForHabit(habit.id)}
                onToggle={() => toggleLog(habit.id)}
                onPress={() => openEditHabit(habit)}
              />
            ))
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Mood log bottom sheet */}
      <MoodLogSheet
        theme={theme}
        visible={moodSheetVisible}
        currentMood={todayEntry?.mood ?? null}
        currentEnergy={todayEntry?.energy ?? null}
        onSave={handleLogMood}
        onClose={() => setMoodSheetVisible(false)}
      />

      {/* Habit form bottom sheet */}
      <HabitFormSheet
        theme={theme}
        habit={selectedHabit}
        visible={habitSheetVisible}
        onSave={handleSaveHabit}
        onDelete={selectedHabit ? handleDeleteHabit : undefined}
        onClose={() => setHabitSheetVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: 16, gap: 12 },

  section: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600' },

  logBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  logBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  moodRow: { gap: 8 },
  moodItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  moodEmoji: { fontSize: 22 },
  moodLabel: { fontSize: 14, fontWeight: '500' },
  moodNotes: { fontSize: 13, fontStyle: 'italic', marginTop: 4 },
  noMoodText: { fontSize: 14, textAlign: 'center', paddingVertical: 8 },

  statsRow: { flexDirection: 'row', alignItems: 'stretch' },
  statGap: { width: 8 },

  progressBar: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
  },
  progressText: { fontSize: 14, fontWeight: '500' },

  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11 },

  habitsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 8,
  },
  addHabitBtn: { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  addHabitText: { fontSize: 13, fontWeight: '600' },

  emptyHabits: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    gap: 6,
  },
  emptyEmoji: { fontSize: 32 },
  emptyTitle: { fontSize: 15, fontWeight: '600' },
  emptyMessage: { fontSize: 13, textAlign: 'center' },
});

