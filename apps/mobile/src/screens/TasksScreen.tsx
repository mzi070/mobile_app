import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { useTaskStore, FilterStatus, FilterPriority } from '../store/useTaskStore';
import { Task, CreateTaskInput, UpdateTaskInput } from '../services/taskService';
import { Header, EmptyState, FilterTabs, AnimatedTaskItem, TaskFormSheet } from '../components';

const STATUS_FILTERS: { label: string; value: FilterStatus }[] = [
  { label: 'All', value: 'all' },
  { label: 'To Do', value: 'todo' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Done', value: 'done' },
];

const PRIORITY_FILTERS: { label: string; value: FilterPriority }[] = [
  { label: 'All Priority', value: 'all' },
  { label: '🔴 High', value: 'high' },
  { label: '🟡 Medium', value: 'medium' },
  { label: '🟢 Low', value: 'low' },
];

export function TasksScreen() {
  const { theme } = useAppStore();
  const {
    tasks,
    isLoading,
    error,
    filterStatus,
    filterPriority,
    setFilterStatus,
    setFilterPriority,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleDone,
  } = useTaskStore();

  const [sheetVisible, setSheetVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks, filterStatus, filterPriority]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchTasks();
    setIsRefreshing(false);
  }, [fetchTasks]);

  const openCreate = useCallback(() => {
    setSelectedTask(null);
    setSheetVisible(true);
  }, []);

  const openEdit = useCallback((task: Task) => {
    setSelectedTask(task);
    setSheetVisible(true);
  }, []);

  const handleSave = useCallback(
    async (data: CreateTaskInput | UpdateTaskInput) => {
      if (selectedTask) {
        await updateTask(selectedTask.id, data as UpdateTaskInput);
      } else {
        await createTask(data as CreateTaskInput);
      }
    },
    [selectedTask, createTask, updateTask],
  );

  const handleDelete = useCallback(async () => {
    if (selectedTask) {
      await deleteTask(selectedTask.id);
    }
  }, [selectedTask, deleteTask]);

  const doneCount = tasks.filter((t) => t.status === 'done').length;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header
        title="Tasks"
        subtitle={
          tasks.length > 0
            ? `${doneCount}/${tasks.length} completed`
            : 'Manage your to-dos'
        }
      />

      {/* Status filter */}
      <FilterTabs
        options={STATUS_FILTERS}
        selected={filterStatus}
        onSelect={(v) => setFilterStatus(v as FilterStatus)}
        theme={theme}
      />

      {/* Priority filter */}
      <FilterTabs
        options={PRIORITY_FILTERS}
        selected={filterPriority}
        onSelect={(v) => setFilterPriority(v as FilterPriority)}
        theme={theme}
      />

      {/* Error banner */}
      {error ? (
        <View style={[styles.errorBanner, { backgroundColor: theme.colors.error + '15' }]}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
        </View>
      ) : null}

      {/* Loading */}
      {isLoading && tasks.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AnimatedTaskItem
              task={item}
              theme={theme}
              onToggleDone={toggleDone}
              onPress={openEdit}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="📋"
              title="No tasks found"
              message={
                filterStatus !== 'all' || filterPriority !== 'all'
                  ? 'Try changing your filters'
                  : 'Tap the + button to add your first task'
              }
            />
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={openCreate}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Task form bottom sheet */}
      <TaskFormSheet
        theme={theme}
        task={selectedTask}
        visible={sheetVisible}
        onSave={handleSave}
        onDelete={selectedTask ? handleDelete : undefined}
        onClose={() => setSheetVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingTop: 4, paddingBottom: 100 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorBanner: { marginHorizontal: 16, marginBottom: 8, borderRadius: 8, padding: 10 },
  errorText: { fontSize: 13 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  fabIcon: { color: '#FFFFFF', fontSize: 28, lineHeight: 32, fontWeight: '300' },
});

