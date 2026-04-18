import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../store';
import { notificationService } from '../services/notificationService';
import type { Theme } from '../theme';

// ─── Data ────────────────────────────────────────────────────────────────────
const GOALS = [
  { id: 'productivity', emoji: '📋', label: 'Productivity' },
  { id: 'wellness', emoji: '🧘', label: 'Wellness' },
  { id: 'habits', emoji: '🌱', label: 'Build Habits' },
  { id: 'mindfulness', emoji: '🧠', label: 'Mindfulness' },
  { id: 'calendar', emoji: '📅', label: 'Stay Organised' },
  { id: 'ai', emoji: '🤖', label: 'AI Coaching' },
] as const;

type GoalId = (typeof GOALS)[number]['id'];

const STEPS = ['welcome', 'goals', 'notifications', 'done'] as const;
type Step = (typeof STEPS)[number];

// ─── Component ────────────────────────────────────────────────────────────────
export function OnboardingScreen() {
  const { theme, setOnboardingComplete, setNotificationsEnabled } = useAppStore();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<Step>('welcome');
  const [selectedGoals, setSelectedGoals] = useState<Set<GoalId>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  const stepIndex = STEPS.indexOf(step);
  const progress = (stepIndex + 1) / STEPS.length;

  const toggleGoal = useCallback((id: GoalId) => {
    setSelectedGoals((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleNext = useCallback(async () => {
    if (step === 'welcome') {
      setStep('goals');
    } else if (step === 'goals') {
      setStep('notifications');
    } else if (step === 'notifications') {
      setIsProcessing(true);
      try {
        const granted = await notificationService.requestPermission();
        setNotificationsEnabled(granted);
        if (granted) {
          await notificationService.scheduleDailyHabitReminder(20, 0);
          await notificationService.scheduleDailyMoodCheckIn(9, 0);
        }
      } catch {
        // Notifications failed — proceed anyway
      }
      setIsProcessing(false);
      setStep('done');
    } else {
      setOnboardingComplete();
    }
  }, [step, setOnboardingComplete, setNotificationsEnabled]);

  const handleSkipNotifications = useCallback(() => {
    setNotificationsEnabled(false);
    setStep('done');
  }, [setNotificationsEnabled]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 24,
        },
      ]}
    >
      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: theme.colors.border }]}>
        <View
          style={[
            styles.progressFill,
            { backgroundColor: theme.colors.primary, width: `${progress * 100}%` },
          ]}
        />
      </View>

      {/* Step counter */}
      <Text style={[styles.stepLabel, { color: theme.colors.textSecondary }]}>
        Step {stepIndex + 1} of {STEPS.length}
      </Text>

      {/* ── Step content ── */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {step === 'welcome' && (
          <WelcomeStep theme={theme} />
        )}
        {step === 'goals' && (
          <GoalsStep
            theme={theme}
            selectedGoals={selectedGoals}
            onToggle={toggleGoal}
          />
        )}
        {step === 'notifications' && (
          <NotificationsStep theme={theme} />
        )}
        {step === 'done' && (
          <DoneStep theme={theme} selectedGoals={selectedGoals} />
        )}
      </ScrollView>

      {/* ── Actions ── */}
      <View style={styles.actions}>
        {step === 'notifications' && !isProcessing && (
          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: theme.colors.border }]}
            onPress={handleSkipNotifications}
            accessibilityLabel="Skip notifications"
            accessibilityRole="button"
          >
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
              Skip for now
            </Text>
          </TouchableOpacity>
        )}

        {isProcessing ? (
          <ActivityIndicator
            size="large"
            color={theme.colors.primary}
            style={{ marginTop: 16 }}
          />
        ) : (
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              { backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md },
            ]}
            onPress={handleNext}
            accessibilityLabel={step === 'done' ? "Let's go" : 'Continue'}
            accessibilityRole="button"
            activeOpacity={0.85}
          >
            <Text style={[theme.typography.button, { color: '#fff' }]}>
              {step === 'done' ? "Let's Go! 🚀" : 'Continue →'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Step sub-components ─────────────────────────────────────────────────────
function WelcomeStep({ theme }: { theme: Theme }) {
  return (
    <View style={styles.stepContainer}>
      <View style={[styles.heroCircle, { backgroundColor: theme.colors.primaryLight }]}>
        <Text style={styles.heroEmoji}>🌊</Text>
      </View>
      <Text style={[theme.typography.h1, { color: theme.colors.textPrimary, textAlign: 'center', marginTop: 28 }]}>
        Welcome to LifeFlow
      </Text>
      <Text style={[theme.typography.body, { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 12, lineHeight: 24 }]}>
        Your all-in-one companion for tasks, wellness, habits, and AI-powered insights.
      </Text>
      <View style={styles.featureList}>
        {[
          { emoji: '📋', text: 'Manage tasks & calendar in one place' },
          { emoji: '🧘', text: 'Track mood, energy & daily habits' },
          { emoji: '🤖', text: 'AI coach that learns your patterns' },
          { emoji: '🔒', text: 'Private, offline-capable & secure' },
        ].map(({ emoji, text }) => (
          <View key={text} style={styles.featureRow}>
            <Text style={{ fontSize: 20 }}>{emoji}</Text>
            <Text style={[theme.typography.bodySmall, { color: theme.colors.textPrimary, marginLeft: 14, flex: 1 }]}>
              {text}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function GoalsStep({
  theme,
  selectedGoals,
  onToggle,
}: {
  theme: Theme;
  selectedGoals: Set<GoalId>;
  onToggle: (id: GoalId) => void;
}) {
  return (
    <View style={styles.stepContainer}>
      <Text style={{ fontSize: 48, textAlign: 'center' }}>🎯</Text>
      <Text style={[theme.typography.h2, { color: theme.colors.textPrimary, textAlign: 'center', marginTop: 16 }]}>
        What matters to you?
      </Text>
      <Text style={[theme.typography.bodySmall, { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 8 }]}>
        Select all that apply — we'll tailor LifeFlow for you.
      </Text>
      <View style={styles.goalGrid}>
        {GOALS.map((goal) => {
          const selected = selectedGoals.has(goal.id);
          return (
            <TouchableOpacity
              key={goal.id}
              style={[
                styles.goalChip,
                {
                  backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
                  borderColor: selected ? theme.colors.primary : theme.colors.border,
                  borderRadius: theme.borderRadius.md,
                },
              ]}
              onPress={() => onToggle(goal.id)}
              accessibilityLabel={goal.label}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
              activeOpacity={0.75}
            >
              <Text style={{ fontSize: 24 }}>{goal.emoji}</Text>
              <Text
                style={[
                  theme.typography.bodySmall,
                  {
                    color: selected ? '#fff' : theme.colors.textPrimary,
                    marginTop: 6,
                    fontWeight: '600',
                  },
                ]}
              >
                {goal.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function NotificationsStep({ theme }: { theme: Theme }) {
  return (
    <View style={styles.stepContainer}>
      <Text style={{ fontSize: 56, textAlign: 'center' }}>🔔</Text>
      <Text style={[theme.typography.h2, { color: theme.colors.textPrimary, textAlign: 'center', marginTop: 16 }]}>
        Stay on track
      </Text>
      <Text style={[theme.typography.body, { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 10, lineHeight: 24 }]}>
        Enable reminders so LifeFlow can gently nudge you at the right moments.
      </Text>
      <View style={styles.notifList}>
        {[
          { emoji: '🌟', title: 'Habit Check-In', time: 'Daily at 8 PM', desc: 'Log your habits before the day ends' },
          { emoji: '😊', title: 'Mood Check-In', time: 'Daily at 9 AM', desc: 'A quick morning mood snapshot' },
          { emoji: '📋', title: 'Task Reminders', time: 'When due soon', desc: 'Never miss an important deadline' },
        ].map(({ emoji, title, time, desc }) => (
          <View
            key={title}
            style={[
              styles.notifRow,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md },
            ]}
          >
            <Text style={{ fontSize: 28 }}>{emoji}</Text>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[theme.typography.body, { color: theme.colors.textPrimary, fontWeight: '600' }]}>{title}</Text>
              <Text style={[theme.typography.caption, { color: theme.colors.primary, marginTop: 1 }]}>{time}</Text>
              <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 2 }]}>{desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function DoneStep({
  theme,
  selectedGoals,
}: {
  theme: Theme;
  selectedGoals: Set<GoalId>;
}) {
  const goalCount = selectedGoals.size;
  return (
    <View style={styles.stepContainer}>
      <Text style={{ fontSize: 72, textAlign: 'center' }}>🎉</Text>
      <Text style={[theme.typography.h1, { color: theme.colors.textPrimary, textAlign: 'center', marginTop: 20 }]}>
        You're all set!
      </Text>
      <Text style={[theme.typography.body, { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 12, lineHeight: 24 }]}>
        {goalCount > 0
          ? `LifeFlow is ready to help you with ${goalCount} goal${goalCount > 1 ? 's' : ''}. Start by exploring your home screen.`
          : 'LifeFlow is ready. Start by exploring your home screen.'}
      </Text>
      <View style={[styles.tipCard, { backgroundColor: theme.colors.primaryLight, borderRadius: theme.borderRadius.lg }]}>
        <Text style={[theme.typography.bodySmall, { color: theme.colors.primary, fontWeight: '600', marginBottom: 6 }]}>
          💡 Quick Tip
        </Text>
        <Text style={[theme.typography.bodySmall, { color: theme.colors.textPrimary, lineHeight: 20 }]}>
          Start small — add one task, log your mood, and chat with your AI coach to kick things off.
        </Text>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },

  progressTrack: {
    height: 4,
    borderRadius: 2,
    marginBottom: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  stepLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },

  content: { flexGrow: 1 },

  stepContainer: { paddingVertical: 24, alignItems: 'center' },

  heroCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: { fontSize: 56 },

  featureList: { width: '100%', marginTop: 32, gap: 14 },
  featureRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },

  goalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 24,
    justifyContent: 'center',
  },
  goalChip: {
    width: '43%',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1.5,
  },

  notifList: { width: '100%', marginTop: 24, gap: 12 },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderWidth: 1,
  },

  tipCard: { marginTop: 28, padding: 18, width: '100%' },

  actions: { gap: 10, paddingTop: 16 },
  primaryBtn: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
  },
});
