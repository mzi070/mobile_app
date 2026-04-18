import React, { useCallback, useRef, useMemo, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import BottomSheet, {
  BottomSheetTextInput,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Task, CreateTaskInput, UpdateTaskInput, TaskPriority, TaskStatus } from '../services/taskService';
import { Theme } from '../theme';

interface TaskFormSheetProps {
  theme: Theme;
  task?: Task | null;
  onSave: (data: CreateTaskInput | UpdateTaskInput) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
  visible: boolean;
}

const PRIORITIES: { label: string; value: TaskPriority }[] = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
];

const STATUSES: { label: string; value: TaskStatus }[] = [
  { label: 'To Do', value: 'todo' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Done', value: 'done' },
];

const CATEGORIES = ['Work', 'Personal', 'Health', 'Learning', 'Finance', 'Other'];

export function TaskFormSheet({
  theme,
  task,
  onSave,
  onDelete,
  onClose,
  visible,
}: TaskFormSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['70%', '92%'], []);

  const isEditing = Boolean(task);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [category, setCategory] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Populate form when editing
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? '');
      setPriority(task.priority);
      setStatus(task.status);
      setCategory(task.category ?? '');
      setDueDate(task.dueDate ? new Date(task.dueDate) : null);
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setStatus('todo');
      setCategory('');
      setDueDate(null);
    }
    setError('');
  }, [task, visible]);

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose],
  );

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      const data: CreateTaskInput = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        category: category.trim() || undefined,
        dueDate: dueDate ? dueDate.toISOString() : undefined,
      };
      if (isEditing) {
        await onSave({ ...data, status });
      } else {
        await onSave(data);
      }
      bottomSheetRef.current?.close();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save task');
    } finally {
      setIsSaving(false);
    }
  }, [title, description, priority, status, category, dueDate, isEditing, onSave]);

  const handleDelete = useCallback(async () => {
    if (!onDelete) return;
    setIsSaving(true);
    try {
      await onDelete();
      bottomSheetRef.current?.close();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete task');
    } finally {
      setIsSaving(false);
    }
  }, [onDelete]);

  const s = makeStyles(theme);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      onChange={handleSheetChange}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: theme.colors.surface }}
      handleIndicatorStyle={{ backgroundColor: theme.colors.border }}
    >
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => bottomSheetRef.current?.close()} style={s.cancelBtn}>
          <Text style={[s.cancelText, { color: theme.colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: theme.colors.text }]}>
          {isEditing ? 'Edit Task' : 'New Task'}
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          style={[s.saveBtn, { backgroundColor: theme.colors.primary }]}
        >
          <Text style={s.saveBtnText}>{isSaving ? '...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <BottomSheetScrollView contentContainerStyle={s.formContainer}>
        {/* Error */}
        {error ? (
          <View style={[s.errorBox, { backgroundColor: theme.colors.error + '15' }]}>
            <Text style={[s.errorText, { color: theme.colors.error }]}>{error}</Text>
          </View>
        ) : null}

        {/* Title */}
        <Text style={[s.label, { color: theme.colors.textSecondary }]}>TITLE *</Text>
        <BottomSheetTextInput
          value={title}
          onChangeText={setTitle}
          placeholder="What needs to be done?"
          placeholderTextColor={theme.colors.textMuted}
          style={[s.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
          returnKeyType="next"
          autoFocus
        />

        {/* Description */}
        <Text style={[s.label, { color: theme.colors.textSecondary }]}>DESCRIPTION</Text>
        <BottomSheetTextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Add details..."
          placeholderTextColor={theme.colors.textMuted}
          style={[s.input, s.textArea, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
          multiline
          numberOfLines={3}
        />

        {/* Priority */}
        <Text style={[s.label, { color: theme.colors.textSecondary }]}>PRIORITY</Text>
        <View style={s.segmentRow}>
          {PRIORITIES.map((p) => (
            <TouchableOpacity
              key={p.value}
              style={[
                s.segment,
                {
                  backgroundColor:
                    priority === p.value ? theme.colors.primary : theme.colors.background,
                  borderColor:
                    priority === p.value ? theme.colors.primary : theme.colors.border,
                },
              ]}
              onPress={() => setPriority(p.value)}
            >
              <Text
                style={[
                  s.segmentText,
                  { color: priority === p.value ? '#fff' : theme.colors.textSecondary },
                ]}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Status (only when editing) */}
        {isEditing && (
          <>
            <Text style={[s.label, { color: theme.colors.textSecondary }]}>STATUS</Text>
            <View style={s.segmentRow}>
              {STATUSES.map((st) => (
                <TouchableOpacity
                  key={st.value}
                  style={[
                    s.segment,
                    {
                      backgroundColor:
                        status === st.value ? theme.colors.primary : theme.colors.background,
                      borderColor:
                        status === st.value ? theme.colors.primary : theme.colors.border,
                    },
                  ]}
                  onPress={() => setStatus(st.value)}
                >
                  <Text
                    style={[
                      s.segmentText,
                      { color: status === st.value ? '#fff' : theme.colors.textSecondary },
                    ]}
                  >
                    {st.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Category */}
        <Text style={[s.label, { color: theme.colors.textSecondary }]}>CATEGORY</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.categoryScroll}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                s.categoryChip,
                {
                  backgroundColor:
                    category === cat ? theme.colors.primary + '20' : theme.colors.background,
                  borderColor:
                    category === cat ? theme.colors.primary : theme.colors.border,
                },
              ]}
              onPress={() => setCategory(category === cat ? '' : cat)}
            >
              <Text
                style={[
                  s.categoryChipText,
                  { color: category === cat ? theme.colors.primary : theme.colors.textSecondary },
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Due Date */}
        <Text style={[s.label, { color: theme.colors.textSecondary }]}>DUE DATE</Text>
        <TouchableOpacity
          style={[s.dateButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={{ color: dueDate ? theme.colors.text : theme.colors.textMuted }}>
            {dueDate
              ? dueDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
              : 'No due date'}
          </Text>
          {dueDate && (
            <TouchableOpacity onPress={() => setDueDate(null)}>
              <Text style={{ color: theme.colors.error, marginLeft: 8 }}>✕</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={dueDate ?? new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            minimumDate={new Date()}
            onChange={(_event, date) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (date) setDueDate(date);
            }}
          />
        )}

        {/* Delete button (edit mode only) */}
        {isEditing && onDelete && (
          <TouchableOpacity
            style={[s.deleteBtn, { borderColor: theme.colors.error }]}
            onPress={handleDelete}
            disabled={isSaving}
          >
            <Text style={[s.deleteBtnText, { color: theme.colors.error }]}>
              Delete Task
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    cancelBtn: { minWidth: 60 },
    cancelText: { fontSize: 15 },
    headerTitle: { fontSize: 16, fontWeight: '600' },
    saveBtn: {
      paddingHorizontal: 16,
      paddingVertical: 7,
      borderRadius: 20,
      minWidth: 60,
      alignItems: 'center',
    },
    saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    formContainer: { padding: 16 },
    errorBox: {
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
    },
    errorText: { fontSize: 13 },
    label: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 0.5,
      marginTop: 16,
      marginBottom: 6,
    },
    input: {
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 15,
    },
    textArea: {
      height: 80,
      textAlignVertical: 'top',
    },
    segmentRow: { flexDirection: 'row', gap: 8 },
    segment: {
      flex: 1,
      paddingVertical: 9,
      borderRadius: 8,
      borderWidth: 1,
      alignItems: 'center',
    },
    segmentText: { fontSize: 13, fontWeight: '500' },
    categoryScroll: { marginBottom: 4 },
    categoryChip: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      borderWidth: 1,
      marginRight: 8,
    },
    categoryChipText: { fontSize: 13 },
    dateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 11,
    },
    deleteBtn: {
      marginTop: 24,
      borderWidth: 1.5,
      borderRadius: 12,
      paddingVertical: 13,
      alignItems: 'center',
    },
    deleteBtnText: { fontSize: 15, fontWeight: '600' },
  });
}
