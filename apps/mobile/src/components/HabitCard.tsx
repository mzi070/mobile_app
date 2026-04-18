import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Habit } from '../services/habitService';
import { Theme } from '../theme';

interface HabitCardProps {
  habit: Habit;
  theme: Theme;
  isCompletedToday: boolean;
  streak: number;
  onToggle: () => void;
  onPress: () => void;
}

export function HabitCard({
  habit,
  theme,
  isCompletedToday,
  streak,
  onToggle,
  onPress,
}: HabitCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderLeftColor: habit.color,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Color dot + title */}
      <View style={styles.left}>
        <View style={[styles.iconBadge, { backgroundColor: habit.color + '25' }]}>
          <Text style={styles.iconText}>{iconEmoji(habit.icon)}</Text>
        </View>
        <View style={styles.titleCol}>
          <Text
            style={[styles.title, { color: theme.colors.text }]}
            numberOfLines={1}
          >
            {habit.title}
          </Text>
          <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
            {habit.frequency === 'daily' ? 'Daily' : 'Weekly'}
            {streak > 0 ? `  •  🔥 ${streak} day${streak > 1 ? 's' : ''}` : ''}
          </Text>
        </View>
      </View>

      {/* Completion checkmark */}
      <TouchableOpacity
        style={[
          styles.checkBtn,
          {
            backgroundColor: isCompletedToday ? habit.color : 'transparent',
            borderColor: isCompletedToday ? habit.color : theme.colors.border,
          },
        ]}
        onPress={onToggle}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {isCompletedToday && <Text style={styles.checkMark}>✓</Text>}
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

/** Map icon string to an emoji */
function iconEmoji(icon: string): string {
  const map: Record<string, string> = {
    star: '⭐',
    heart: '❤️',
    water: '💧',
    run: '🏃',
    book: '📚',
    sleep: '😴',
    food: '🥗',
    meditation: '🧘',
    gym: '💪',
    music: '🎵',
    code: '💻',
    sun: '☀️',
  };
  return map[icon] ?? '⭐';
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: 12,
  },
  left: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 20 },
  titleCol: { flex: 1 },
  title: { fontSize: 15, fontWeight: '500' },
  meta: { fontSize: 12, marginTop: 2 },
  checkBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  checkMark: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});
