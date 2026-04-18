import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAppStore } from '../store';
import { Header, EmptyState, Button } from '../components';

export function CalendarScreen() {
  const { theme } = useAppStore();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header title="Calendar" subtitle="Your schedule at a glance" />
      <EmptyState
        icon="📅"
        title="No events"
        message="Your calendar is clear. Schedule an event to see it here."
        action={
          <Button
            title="Add Event"
            onPress={() => {}}
            variant="primary"
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
