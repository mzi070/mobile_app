import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAppStore } from '../store';
import { Header, EmptyState, Button } from '../components';

export function TasksScreen() {
  const { theme } = useAppStore();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header title="Tasks" subtitle="Manage your to-dos" />
      <EmptyState
        icon="📋"
        title="No tasks yet"
        message="Add your first task to get started with organizing your day"
        action={
          <Button
            title="Add Task"
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
