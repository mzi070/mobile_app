import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAppStore } from '../store';
import { Header, EmptyState, Button } from '../components';

export function WellnessScreen() {
  const { theme } = useAppStore();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header title="Wellness" subtitle="Your mind & body" />
      <EmptyState
        icon="🧘"
        title="Welcome to Wellness"
        message="Track your mood, build healthy habits, and find guided exercises to reduce stress."
        action={
          <Button
            title="Log Mood"
            onPress={() => {}}
            variant="secondary"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
