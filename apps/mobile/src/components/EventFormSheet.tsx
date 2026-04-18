import React, { useCallback, useRef, useMemo, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import BottomSheet, {
  BottomSheetTextInput,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CalendarEvent, CreateEventInput, UpdateEventInput } from '../services/eventService';
import { Theme } from '../theme';

interface EventFormSheetProps {
  theme: Theme;
  event?: CalendarEvent | null;
  initialDate?: string; // YYYY-MM-DD
  onSave: (data: CreateEventInput | UpdateEventInput) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
  visible: boolean;
}

type DateField = 'start' | 'end';

export function EventFormSheet({
  theme,
  event,
  initialDate,
  onSave,
  onDelete,
  onClose,
  visible,
}: EventFormSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['75%', '95%'], []);

  const isEditing = Boolean(event);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [endTime, setEndTime] = useState<Date>(new Date(Date.now() + 60 * 60 * 1000));
  const [showPicker, setShowPicker] = useState<false | DateField>(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description ?? '');
      setLocation(event.location ?? '');
      setStartTime(new Date(event.startTime));
      setEndTime(new Date(event.endTime));
    } else {
      setTitle('');
      setDescription('');
      setLocation('');
      const base = initialDate ? new Date(initialDate + 'T09:00:00') : new Date();
      setStartTime(base);
      setEndTime(new Date(base.getTime() + 60 * 60 * 1000));
    }
    setError('');
  }, [event, visible, initialDate]);

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === -1) onClose();
    },
    [onClose],
  );

  const openPicker = (field: DateField, mode: 'date' | 'time') => {
    setShowPicker(field);
    setPickerMode(mode);
  };

  const handlePickerChange = (_event: unknown, date?: Date) => {
    if (Platform.OS !== 'ios') setShowPicker(false);
    if (!date) return;
    if (showPicker === 'start') {
      setStartTime(date);
      // Auto-adjust end if needed
      if (date >= endTime) {
        setEndTime(new Date(date.getTime() + 60 * 60 * 1000));
      }
    } else if (showPicker === 'end') {
      setEndTime(date);
    }
  };

  const handleSave = useCallback(async () => {
    if (!title.trim()) { setError('Title is required'); return; }
    if (endTime <= startTime) { setError('End time must be after start time'); return; }

    setIsSaving(true);
    setError('');
    try {
      const data: CreateEventInput = {
        title: title.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      };
      await onSave(data);
      bottomSheetRef.current?.close();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save event');
    } finally {
      setIsSaving(false);
    }
  }, [title, description, location, startTime, endTime, onSave]);

  const handleDelete = useCallback(async () => {
    if (!onDelete) return;
    setIsSaving(true);
    try {
      await onDelete();
      bottomSheetRef.current?.close();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete event');
    } finally {
      setIsSaving(false);
    }
  }, [onDelete]);

  const formatDateTime = (d: Date) =>
    d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

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
          {isEditing ? 'Edit Event' : 'New Event'}
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
          placeholder="Event name"
          placeholderTextColor={theme.colors.textMuted}
          style={[s.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
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

        {/* Location */}
        <Text style={[s.label, { color: theme.colors.textSecondary }]}>LOCATION</Text>
        <BottomSheetTextInput
          value={location}
          onChangeText={setLocation}
          placeholder="Add location..."
          placeholderTextColor={theme.colors.textMuted}
          style={[s.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
        />

        {/* Start Time */}
        <Text style={[s.label, { color: theme.colors.textSecondary }]}>START</Text>
        <View style={s.timeRow}>
          <TouchableOpacity
            style={[s.timeButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
            onPress={() => openPicker('start', 'date')}
          >
            <Text style={{ color: theme.colors.text, fontSize: 14 }}>
              {startTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.timeButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
            onPress={() => openPicker('start', 'time')}
          >
            <Text style={{ color: theme.colors.text, fontSize: 14 }}>
              {startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
            </Text>
          </TouchableOpacity>
        </View>

        {/* End Time */}
        <Text style={[s.label, { color: theme.colors.textSecondary }]}>END</Text>
        <View style={s.timeRow}>
          <TouchableOpacity
            style={[s.timeButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
            onPress={() => openPicker('end', 'date')}
          >
            <Text style={{ color: theme.colors.text, fontSize: 14 }}>
              {endTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.timeButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
            onPress={() => openPicker('end', 'time')}
          >
            <Text style={{ color: theme.colors.text, fontSize: 14 }}>
              {endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Duration summary */}
        <Text style={[s.durationText, { color: theme.colors.textMuted }]}>
          {formatDateTime(startTime)} → {formatDateTime(endTime)}
        </Text>

        {/* DateTime Picker */}
        {showPicker !== false && (
          <DateTimePicker
            value={showPicker === 'start' ? startTime : endTime}
            mode={pickerMode}
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={handlePickerChange}
          />
        )}

        {/* Delete button */}
        {isEditing && onDelete && (
          <TouchableOpacity
            style={[s.deleteBtn, { borderColor: theme.colors.error }]}
            onPress={handleDelete}
            disabled={isSaving}
          >
            <Text style={[s.deleteBtnText, { color: theme.colors.error }]}>Delete Event</Text>
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
    saveBtn: {
      paddingHorizontal: 16,
      paddingVertical: 7,
      borderRadius: 20,
      alignItems: 'center',
    },
    saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    formContainer: { padding: 16 },
    errorBox: { borderRadius: 8, padding: 12, marginBottom: 12 },
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
    textArea: { height: 80, textAlignVertical: 'top' },
    timeRow: { flexDirection: 'row', gap: 10 },
    timeButton: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 11,
      alignItems: 'center',
    },
    durationText: {
      fontSize: 12,
      marginTop: 8,
      textAlign: 'center',
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
