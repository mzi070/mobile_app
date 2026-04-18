import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useAppStore } from '../store/useAppStore';
import { useEventStore } from '../store/useEventStore';
import { CalendarEvent, CreateEventInput, UpdateEventInput } from '../services/eventService';
import { Header, EmptyState, EventFormSheet } from '../components';
import { Theme } from '../theme';

function formatEventTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function getDurationMinutes(start: string, end: string): number {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
}

interface EventCardProps {
  event: CalendarEvent;
  theme: Theme;
  onPress: (event: CalendarEvent) => void;
}

function EventCard({ event, theme, onPress }: EventCardProps) {
  const duration = getDurationMinutes(event.startTime, event.endTime);
  const durationLabel =
    duration >= 60
      ? `${Math.floor(duration / 60)}h${duration % 60 > 0 ? ` ${duration % 60}m` : ''}`
      : `${duration}m`;

  return (
    <TouchableOpacity
      style={[
        styles.eventCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderLeftColor: theme.colors.primary,
        },
      ]}
      onPress={() => onPress(event)}
      activeOpacity={0.7}
    >
      <View style={styles.eventTimeCol}>
        <Text style={[styles.eventTimeText, { color: theme.colors.primary }]}>
          {formatEventTime(event.startTime)}
        </Text>
        <Text style={[styles.eventDuration, { color: theme.colors.textMuted }]}>
          {durationLabel}
        </Text>
      </View>
      <View style={styles.eventContent}>
        <Text style={[styles.eventTitle, { color: theme.colors.text }]} numberOfLines={1}>
          {event.title}
        </Text>
        {event.location ? (
          <Text style={[styles.eventLocation, { color: theme.colors.textMuted }]} numberOfLines={1}>
            📍 {event.location}
          </Text>
        ) : null}
        {event.description ? (
          <Text style={[styles.eventDescription, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            {event.description}
          </Text>
        ) : null}
      </View>
      <Text style={[styles.eventArrow, { color: theme.colors.textMuted }]}>›</Text>
    </TouchableOpacity>
  );
}

export function CalendarScreen() {
  const { theme } = useAppStore();
  const {
    isLoading,
    selectedDate,
    setSelectedDate,
    fetchEventsForMonth,
    createEvent,
    updateEvent,
    deleteEvent,
    eventsForDate,
    markedDates,
  } = useEventStore();

  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth() + 1);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    fetchEventsForMonth(currentYear, currentMonth);
  }, [fetchEventsForMonth, currentYear, currentMonth]);

  const handleMonthChange = useCallback(
    (month: { year: number; month: number }) => {
      setCurrentYear(month.year);
      setCurrentMonth(month.month);
    },
    [],
  );

  const openCreate = useCallback(() => {
    setSelectedEvent(null);
    setSheetVisible(true);
  }, []);

  const openEdit = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setSheetVisible(true);
  }, []);

  const handleSave = useCallback(
    async (data: CreateEventInput | UpdateEventInput) => {
      if (selectedEvent) {
        await updateEvent(selectedEvent.id, data as UpdateEventInput);
      } else {
        await createEvent(data as CreateEventInput);
      }
    },
    [selectedEvent, createEvent, updateEvent],
  );

  const handleDelete = useCallback(async () => {
    if (selectedEvent) {
      await deleteEvent(selectedEvent.id);
    }
  }, [selectedEvent, deleteEvent]);

  const dayEvents = eventsForDate(selectedDate);
  const marks = {
    ...markedDates(),
    [selectedDate]: {
      ...(markedDates()[selectedDate] ?? {}),
      selected: true,
      selectedColor: theme.colors.primary,
    },
  };

  const selectedDateLabel = new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header title="Calendar" subtitle="Your schedule" />

      {/* Monthly Calendar */}
      <Calendar
        current={selectedDate}
        onDayPress={(day: { dateString: string }) => setSelectedDate(day.dateString)}
        onMonthChange={handleMonthChange}
        markedDates={marks}
        theme={{
          backgroundColor: theme.colors.background,
          calendarBackground: theme.colors.background,
          selectedDayBackgroundColor: theme.colors.primary,
          selectedDayTextColor: '#ffffff',
          todayTextColor: theme.colors.primary,
          dayTextColor: theme.colors.text,
          textDisabledColor: theme.colors.textMuted,
          dotColor: theme.colors.primary,
          selectedDotColor: '#ffffff',
          arrowColor: theme.colors.primary,
          monthTextColor: theme.colors.text,
          textMonthFontWeight: '600',
          textDayFontSize: 14,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 12,
        }}
        style={[styles.calendar, { borderBottomColor: theme.colors.border }]}
      />

      {/* Day header */}
      <View style={[styles.dayHeader, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.dayHeaderText, { color: theme.colors.text }]}>
          {selectedDateLabel}
        </Text>
        <TouchableOpacity
          style={[styles.addEventBtn, { backgroundColor: theme.colors.primary }]}
          onPress={openCreate}
        >
          <Text style={styles.addEventBtnText}>+ Event</Text>
        </TouchableOpacity>
      </View>

      {/* Events for selected day */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={dayEvents}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <EventCard event={item} theme={theme} onPress={openEdit} />
          )}
          contentContainerStyle={styles.eventList}
          ListEmptyComponent={
            <EmptyState
              icon="📅"
              title="No events"
              message="Your day is free. Tap '+ Event' to schedule something."
            />
          }
        />
      )}

      {/* Event form sheet */}
      <EventFormSheet
        theme={theme}
        event={selectedEvent}
        initialDate={selectedDate}
        visible={sheetVisible}
        onSave={handleSave}
        onDelete={selectedEvent ? handleDelete : undefined}
        onClose={() => setSheetVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  calendar: {
    borderBottomWidth: 1,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dayHeaderText: { fontSize: 15, fontWeight: '600' },
  addEventBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  addEventBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  loadingContainer: { padding: 20, alignItems: 'center' },
  eventList: { paddingTop: 8, paddingBottom: 100 },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: 12,
  },
  eventTimeCol: { width: 60, marginRight: 12 },
  eventTimeText: { fontSize: 13, fontWeight: '600' },
  eventDuration: { fontSize: 11, marginTop: 2 },
  eventContent: { flex: 1, gap: 2 },
  eventTitle: { fontSize: 15, fontWeight: '500' },
  eventLocation: { fontSize: 12 },
  eventDescription: { fontSize: 12 },
  eventArrow: { fontSize: 22, fontWeight: '300', marginLeft: 4 },
});

