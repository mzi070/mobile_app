import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useAppStore } from '../store';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message: string;
  action?: React.ReactNode;
  style?: ViewStyle;
}

export function EmptyState({ icon, title, message, action, style }: EmptyStateProps) {
  const { theme } = useAppStore();

  return (
    <View style={[styles.container, style]}>
      {icon && (
        <Text style={styles.icon}>{icon}</Text>
      )}
      <Text
        style={[
          theme.typography.h3,
          { color: theme.colors.textPrimary, marginBottom: 8 },
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          theme.typography.body,
          { color: theme.colors.textSecondary, textAlign: 'center' },
        ]}
      >
        {message}
      </Text>
      {action && <View style={styles.action}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  action: {
    marginTop: 24,
  },
});
