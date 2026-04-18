import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Task, TaskPriority } from '../services/taskService';
import { Theme } from '../theme';

interface TaskItemProps {
  task: Task;
  theme: Theme;
  onToggleDone: (task: Task) => void;
  onPress: (task: Task) => void;
}

const priorityColors: Record<TaskPriority, string> = {
  high: '#F43F5E',
  medium: '#F59E0B',
  low: '#10B981',
};

const priorityLabels: Record<TaskPriority, string> = {
  high: 'High',
  medium: 'Med',
  low: 'Low',
};

function formatDueDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const isToday = date.toDateString() === today.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();
  const isPast = date < today && !isToday;

  if (isToday) return 'Today';
  if (isTomorrow) return 'Tomorrow';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + (isPast ? ' ⚠' : '');
}

export function TaskItem({ task, theme, onToggleDone, onPress }: TaskItemProps) {
  const isDone = task.status === 'done';
  const priorityColor = priorityColors[task.priority];
  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== 'done';

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderLeftColor: priorityColor,
        },
      ]}
      onPress={() => onPress(task)}
      activeOpacity={0.7}
    >
      {/* Checkbox */}
      <TouchableOpacity
        style={[
          styles.checkbox,
          {
            borderColor: isDone ? theme.colors.accent : theme.colors.border,
            backgroundColor: isDone ? theme.colors.accent : 'transparent',
          },
        ]}
        onPress={() => onToggleDone(task)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {isDone && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>

      {/* Content */}
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            {
              color: isDone ? theme.colors.textMuted : theme.colors.text,
              textDecorationLine: isDone ? 'line-through' : 'none',
            },
          ]}
          numberOfLines={2}
        >
          {task.title}
        </Text>

        {task.description ? (
          <Text
            style={[styles.description, { color: theme.colors.textMuted }]}
            numberOfLines={1}
          >
            {task.description}
          </Text>
        ) : null}

        {/* Badges row */}
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: priorityColor + '20' }]}>
            <Text style={[styles.badgeText, { color: priorityColor }]}>
              {priorityLabels[task.priority]}
            </Text>
          </View>

          {task.status === 'in-progress' && (
            <View style={[styles.badge, { backgroundColor: theme.colors.primary + '20' }]}>
              <Text style={[styles.badgeText, { color: theme.colors.primary }]}>
                In Progress
              </Text>
            </View>
          )}

          {task.category ? (
            <View style={[styles.badge, { backgroundColor: theme.colors.border }]}>
              <Text style={[styles.badgeText, { color: theme.colors.textSecondary }]}>
                {task.category}
              </Text>
            </View>
          ) : null}

          {task.dueDate ? (
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: isOverdue
                    ? theme.colors.error + '20'
                    : theme.colors.surface,
                  borderWidth: 1,
                  borderColor: isOverdue ? theme.colors.error : theme.colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: isOverdue ? theme.colors.error : theme.colors.textMuted },
                ]}
              >
                {formatDueDate(task.dueDate)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Arrow */}
      <Text style={[styles.arrow, { color: theme.colors.textMuted }]}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  arrow: {
    fontSize: 22,
    marginLeft: 8,
    fontWeight: '300',
  },
});

// Use Animated.Value for fade-in effect on new tasks
export function AnimatedTaskItem(props: TaskItemProps) {
  const opacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [opacity]);

  return (
    <Animated.View style={{ opacity }}>
      <TaskItem {...props} />
    </Animated.View>
  );
}
