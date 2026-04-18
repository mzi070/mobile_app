import React, { useCallback, useRef, useMemo, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import BottomSheet, {
  BottomSheetTextInput,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { Habit, CreateHabitInput, HabitFrequency } from '../services/habitService';
import { Theme } from '../theme';

interface HabitFormSheetProps {
  theme: Theme;
  habit?: Habit | null;
  visible: boolean;
  onSave: (data: CreateHabitInput) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
}

const ICONS = [
  { key: 'star', emoji: '⭐' },
  { key: 'heart', emoji: '❤️' },
  { key: 'water', emoji: '💧' },
  { key: 'run', emoji: '🏃' },
  { key: 'book', emoji: '📚' },
  { key: 'sleep', emoji: '😴' },
  { key: 'food', emoji: '🥗' },
  { key: 'meditation', emoji: '🧘' },
  { key: 'gym', emoji: '💪' },
  { key: 'music', emoji: '🎵' },
  { key: 'code', emoji: '💻' },
  { key: 'sun', emoji: '☀️' },
];

const COLORS = [
  '#6366F1', // indigo
  '#10B981', // emerald
  '#F59E0B', // amber
  '#F43F5E', // rose
  '#3B82F6', // blue
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#14B8A6', // teal
];

const FREQUENCIES: { label: string; value: HabitFrequency }[] = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
];

export function HabitFormSheet({
  theme,
  habit,
  visible,
  onSave,
  onDelete,
  onClose,
}: HabitFormSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['75%', '95%'], []);
  const isEditing = Boolean(habit);

  const [title, setTitle] = useState('');
  const [frequency, setFrequency] = useState<HabitFrequency>('daily');
  const [icon, setIcon] = useState('star');
  const [color, setColor] = useState('#6366F1');
  const [targetCount, setTargetCount] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (habit) {
      setTitle(habit.title);
      setFrequency(habit.frequency);
      setIcon(habit.icon);
      setColor(habit.color);
      setTargetCount(habit.targetCount);
    } else {
      setTitle('');
      setFrequency('daily');
      setIcon('star');
      setColor('#6366F1');
      setTargetCount(1);
    }
    setError('');
  }, [habit, visible]);

  useEffect(() => {
    if (visible) bottomSheetRef.current?.expand();
    else bottomSheetRef.current?.close();
  }, [visible]);

  const handleSheetChange = useCallback(
    (index: number) => { if (index === -1) onClose(); },
    [onClose],
  );

  const handleSave = useCallback(async () => {
    if (!title.trim()) { setError('Title is required'); return; }
    setIsSaving(true);
    setError('');
    try {
      await onSave({ title: title.trim(), frequency, icon, color, targetCount });
      bottomSheetRef.current?.close();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save habit');
    } finally {
      setIsSaving(false);
    }
  }, [title, frequency, icon, color, targetCount, onSave]);

  const handleDelete = useCallback(async () => {
    if (!onDelete) return;
    setIsSaving(true);
    try {
      await onDelete();
      bottomSheetRef.current?.close();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete');
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
        <TouchableOpacity onPress={() => bottomSheetRef.current?.close()}>
          <Text style={[s.cancelText, { color: theme.colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: theme.colors.text }]}>
          {isEditing ? 'Edit Habit' : 'New Habit'}
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          style={[s.saveBtn, { backgroundColor: color }]}
        >
          <Text style={s.saveBtnText}>{isSaving ? '...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <BottomSheetScrollView contentContainerStyle={s.body}>
        {error ? (
          <View style={[s.errorBox, { backgroundColor: theme.colors.error + '15' }]}>
            <Text style={[s.errorText, { color: theme.colors.error }]}>{error}</Text>
          </View>
        ) : null}

        {/* Preview badge */}
        <View style={s.previewRow}>
          <View style={[s.previewBadge, { backgroundColor: color + '25', borderColor: color }]}>
            <Text style={s.previewEmoji}>{ICONS.find((i) => i.key === icon)?.emoji ?? '⭐'}</Text>
          </View>
          <View style={[s.previewColor, { backgroundColor: color }]} />
        </View>

        {/* Title */}
        <Text style={[s.label, { color: theme.colors.textSecondary }]}>HABIT NAME *</Text>
        <BottomSheetTextInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Drink 8 glasses of water"
          placeholderTextColor={theme.colors.textMuted}
          style={[s.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
          autoFocus
        />

        {/* Frequency */}
        <Text style={[s.label, { color: theme.colors.textSecondary }]}>FREQUENCY</Text>
        <View style={s.segmentRow}>
          {FREQUENCIES.map((f) => (
            <TouchableOpacity
              key={f.value}
              style={[
                s.segment,
                {
                  backgroundColor: frequency === f.value ? color : theme.colors.background,
                  borderColor: frequency === f.value ? color : theme.colors.border,
                },
              ]}
              onPress={() => setFrequency(f.value)}
            >
              <Text style={[s.segmentText, { color: frequency === f.value ? '#fff' : theme.colors.textSecondary }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Target count */}
        <Text style={[s.label, { color: theme.colors.textSecondary }]}>TARGET COUNT PER DAY</Text>
        <View style={s.counterRow}>
          <TouchableOpacity
            style={[s.counterBtn, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
            onPress={() => setTargetCount(Math.max(1, targetCount - 1))}
          >
            <Text style={[s.counterBtnText, { color: theme.colors.text }]}>−</Text>
          </TouchableOpacity>
          <Text style={[s.counterValue, { color: theme.colors.text }]}>{targetCount}</Text>
          <TouchableOpacity
            style={[s.counterBtn, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
            onPress={() => setTargetCount(Math.min(100, targetCount + 1))}
          >
            <Text style={[s.counterBtnText, { color: theme.colors.text }]}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Icon picker */}
        <Text style={[s.label, { color: theme.colors.textSecondary }]}>ICON</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.iconScroll}>
          {ICONS.map((ic) => (
            <TouchableOpacity
              key={ic.key}
              style={[
                s.iconButton,
                {
                  backgroundColor: icon === ic.key ? color + '25' : theme.colors.background,
                  borderColor: icon === ic.key ? color : theme.colors.border,
                },
              ]}
              onPress={() => setIcon(ic.key)}
            >
              <Text style={s.iconEmoji}>{ic.emoji}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Color picker */}
        <Text style={[s.label, { color: theme.colors.textSecondary }]}>COLOR</Text>
        <View style={s.colorRow}>
          {COLORS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[
                s.colorSwatch,
                { backgroundColor: c },
                color === c && s.colorSwatchSelected,
              ]}
              onPress={() => setColor(c)}
            >
              {color === c && <Text style={s.colorCheck}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {/* Delete */}
        {isEditing && onDelete && (
          <TouchableOpacity
            style={[s.deleteBtn, { borderColor: theme.colors.error }]}
            onPress={handleDelete}
            disabled={isSaving}
          >
            <Text style={[s.deleteBtnText, { color: theme.colors.error }]}>Delete Habit</Text>
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
    cancelText: { fontSize: 15 },
    headerTitle: { fontSize: 16, fontWeight: '600' },
    saveBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, alignItems: 'center' },
    saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    body: { padding: 16 },
    errorBox: { borderRadius: 8, padding: 12, marginBottom: 12 },
    errorText: { fontSize: 13 },
    previewRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
    previewBadge: {
      width: 52,
      height: 52,
      borderRadius: 26,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    previewEmoji: { fontSize: 26 },
    previewColor: { width: 24, height: 24, borderRadius: 12 },
    label: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginTop: 16, marginBottom: 6 },
    input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
    segmentRow: { flexDirection: 'row', gap: 8 },
    segment: { flex: 1, paddingVertical: 9, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
    segmentText: { fontSize: 13, fontWeight: '500' },
    counterRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    counterBtn: { width: 40, height: 40, borderWidth: 1, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    counterBtnText: { fontSize: 22, lineHeight: 26 },
    counterValue: { fontSize: 22, fontWeight: '600', minWidth: 32, textAlign: 'center' },
    iconScroll: { marginBottom: 4 },
    iconButton: { width: 48, height: 48, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
    iconEmoji: { fontSize: 24 },
    colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    colorSwatch: { width: 36, height: 36, borderRadius: 18 },
    colorSwatchSelected: { borderWidth: 3, borderColor: '#fff', elevation: 4 },
    colorCheck: { color: '#fff', fontSize: 16, textAlign: 'center', lineHeight: 30 },
    deleteBtn: { marginTop: 24, borderWidth: 1.5, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
    deleteBtnText: { fontSize: 15, fontWeight: '600' },
  });
}
