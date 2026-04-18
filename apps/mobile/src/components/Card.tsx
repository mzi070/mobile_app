import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useAppStore } from '../store';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
}

export function Card({ children, style, elevated = false }: CardProps) {
  const { theme } = useAppStore();

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: theme.colors.cardBackground,
          borderRadius: theme.borderRadius.lg,
          borderColor: theme.colors.border,
        },
        elevated && theme.shadows.md,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    padding: 16,
    borderWidth: 1,
  },
});
