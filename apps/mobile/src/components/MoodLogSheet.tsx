import React, { useCallback, useRef, useMemo, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { CreateMoodInput, MoodScore } from '../services/moodService';
import { Theme } from '../theme';

interface MoodLogSheetProps {
  theme: Theme;
  visible: boolean;
  currentMood?: MoodScore | null;
  currentEnergy?: MoodScore | null;
  onSave: (data: CreateMoodInput) => Promise<void>;
  onClose: () => void;
}

const MOOD_OPTIONS: { score: MoodScore; emoji: string; label: string }[] = [
  { score: 1, emoji: '😞', label: 'Awful' },
  { score: 2, emoji: '😕', label: 'Bad' },
  { score: 3, emoji: '😐', label: 'Okay' },
  { score: 4, emoji: '😊', label: 'Good' },
  { score: 5, emoji: '🤩', label: 'Great' },
];

const ENERGY_OPTIONS: { score: MoodScore; emoji: string; label: string }[] = [
  { score: 1, emoji: '🪫', label: 'Drained' },
  { score: 2, emoji: '😴', label: 'Low' },
  { score: 3, emoji: '⚡', label: 'Normal' },
  { score: 4, emoji: '🔋', label: 'High' },
  { score: 5, emoji: '🚀', label: 'Pumped' },
];

export function MoodLogSheet({
  theme,
  visible,
  currentMood,
  currentEnergy,
  onSave,
  onClose,
}: MoodLogSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['60%', '85%'], []);

  const [mood, setMood] = useState<MoodScore>(currentMood ?? 3);
  const [energy, setEnergy] = useState<MoodScore>(currentEnergy ?? 3);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setMood(currentMood ?? 3);
      setEnergy(currentEnergy ?? 3);
      setNotes('');
      setError('');
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible, currentMood, currentEnergy]);

  const handleSheetChange = useCallback(
    (index: number) => { if (index === -1) onClose(); },
    [onClose],
  );

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setError('');
    try {
      await onSave({ mood, energy, notes: notes.trim() || undefined });
      bottomSheetRef.current?.close();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  }, [mood, energy, notes, onSave]);

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
        <Text style={[s.headerTitle, { color: theme.colors.text }]}>How are you feeling?</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          style={[s.saveBtn, { backgroundColor: theme.colors.accent }]}
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

        {/* Mood selector */}
        <Text style={[s.sectionLabel, { color: theme.colors.textSecondary }]}>MOOD</Text>
        <View style={s.emojiRow}>
          {MOOD_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.score}
              style={[
                s.emojiButton,
                {
                  backgroundColor:
                    mood === opt.score
                      ? theme.colors.primary + '20'
                      : 'transparent',
                  borderColor:
                    mood === opt.score
                      ? theme.colors.primary
                      : theme.colors.border,
                },
              ]}
              onPress={() => setMood(opt.score)}
            >
              <Text style={s.emoji}>{opt.emoji}</Text>
              <Text
                style={[
                  s.emojiLabel,
                  {
                    color:
                      mood === opt.score
                        ? theme.colors.primary
                        : theme.colors.textMuted,
                    fontWeight: mood === opt.score ? '600' : '400',
                  },
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Energy selector */}
        <Text style={[s.sectionLabel, { color: theme.colors.textSecondary }]}>ENERGY</Text>
        <View style={s.emojiRow}>
          {ENERGY_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.score}
              style={[
                s.emojiButton,
                {
                  backgroundColor:
                    energy === opt.score
                      ? theme.colors.accent + '20'
                      : 'transparent',
                  borderColor:
                    energy === opt.score
                      ? theme.colors.accent
                      : theme.colors.border,
                },
              ]}
              onPress={() => setEnergy(opt.score)}
            >
              <Text style={s.emoji}>{opt.emoji}</Text>
              <Text
                style={[
                  s.emojiLabel,
                  {
                    color:
                      energy === opt.score
                        ? theme.colors.accent
                        : theme.colors.textMuted,
                    fontWeight: energy === opt.score ? '600' : '400',
                  },
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Notes */}
        <Text style={[s.sectionLabel, { color: theme.colors.textSecondary }]}>
          NOTES (optional)
        </Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="What's on your mind?"
          placeholderTextColor={theme.colors.textMuted}
          style={[
            s.notesInput,
            {
              color: theme.colors.text,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.background,
            },
          ]}
          multiline
          numberOfLines={3}
        />

        <View style={{ height: 32 }} />
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
    saveBtn: {
      paddingHorizontal: 16,
      paddingVertical: 7,
      borderRadius: 20,
      alignItems: 'center',
    },
    saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    body: { padding: 16 },
    errorBox: { borderRadius: 8, padding: 12, marginBottom: 12 },
    errorText: { fontSize: 13 },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 0.5,
      marginTop: 16,
      marginBottom: 10,
    },
    emojiRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    emojiButton: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 10,
      marginHorizontal: 2,
      borderRadius: 10,
      borderWidth: 1.5,
    },
    emoji: { fontSize: 24 },
    emojiLabel: { fontSize: 10, marginTop: 4 },
    notesInput: {
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 15,
      height: 90,
      textAlignVertical: 'top',
    },
  });
}
