import notifee, {
  AndroidImportance,
  TriggerType,
  RepeatFrequency,
  TimestampTrigger,
  AndroidNotificationSetting,
  AuthorizationStatus,
} from '@notifee/react-native';

// ─── Channel IDs ─────────────────────────────────────────────────────────────
export const CHANNELS = {
  HABITS: 'habits',
  TASKS: 'tasks',
  WELLNESS: 'wellness',
} as const;

export type ChannelId = (typeof CHANNELS)[keyof typeof CHANNELS];

// ─── Setup (call once at app start) ──────────────────────────────────────────
export async function setupNotifications(): Promise<void> {
  await notifee.createChannels([
    {
      id: CHANNELS.HABITS,
      name: 'Habit Reminders',
      importance: AndroidImportance.DEFAULT,
      description: 'Daily reminders to check in on your habits',
    },
    {
      id: CHANNELS.TASKS,
      name: 'Task Reminders',
      importance: AndroidImportance.HIGH,
      description: 'Reminders for upcoming task due dates',
    },
    {
      id: CHANNELS.WELLNESS,
      name: 'Wellness Check-in',
      importance: AndroidImportance.LOW,
      description: 'Daily mood logging prompts',
    },
  ]);
}

// ─── Permission ───────────────────────────────────────────────────────────────
export async function requestNotificationPermission(): Promise<boolean> {
  const settings = await notifee.requestPermission();

  if (settings.authorizationStatus === AuthorizationStatus.DENIED) {
    return false;
  }

  // Android 12+: request exact alarm permission if not already granted
  if (settings.android?.alarm === AndroidNotificationSetting.NOT_SUPPORTED) {
    return settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
  }

  if (settings.android?.alarm !== AndroidNotificationSetting.ENABLED) {
    await notifee.openAlarmPermissionSettings();
  }

  return settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
}

export async function getPermissionStatus(): Promise<boolean> {
  const settings = await notifee.getNotificationSettings();
  return settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
}

// ─── Schedule daily habit reminder ────────────────────────────────────────────
/**
 * Schedules a repeating daily reminder for habit check-ins.
 * @param hour 0-23
 * @param minute 0-59
 */
export async function scheduleDailyHabitReminder(
  hour = 20,
  minute = 0,
): Promise<string> {
  // Cancel any existing habit reminder first
  await cancelHabitReminder();

  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  // If the time has already passed today, start tomorrow
  if (date.getTime() <= Date.now()) {
    date.setDate(date.getDate() + 1);
  }

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: date.getTime(),
    repeatFrequency: RepeatFrequency.DAILY,
  };

  const id = await notifee.createTriggerNotification(
    {
      id: 'habit-daily-reminder',
      title: '🌟 Habit Check-In',
      body: "Don't forget to log your habits for today!",
      android: {
        channelId: CHANNELS.HABITS,
        smallIcon: 'ic_launcher',
        pressAction: { id: 'default' },
      },
    },
    trigger,
  );

  return id;
}

export async function cancelHabitReminder(): Promise<void> {
  await notifee.cancelTriggerNotification('habit-daily-reminder');
}

// ─── Schedule daily mood check-in ─────────────────────────────────────────────
export async function scheduleDailyMoodCheckIn(
  hour = 9,
  minute = 0,
): Promise<string> {
  await cancelMoodReminder();

  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  if (date.getTime() <= Date.now()) {
    date.setDate(date.getDate() + 1);
  }

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: date.getTime(),
    repeatFrequency: RepeatFrequency.DAILY,
  };

  const id = await notifee.createTriggerNotification(
    {
      id: 'mood-daily-checkin',
      title: '😊 Daily Mood Check-In',
      body: 'How are you feeling today? Take a moment to log your mood.',
      android: {
        channelId: CHANNELS.WELLNESS,
        smallIcon: 'ic_launcher',
        pressAction: { id: 'default' },
      },
    },
    trigger,
  );

  return id;
}

export async function cancelMoodReminder(): Promise<void> {
  await notifee.cancelTriggerNotification('mood-daily-checkin');
}

// ─── Task due-date reminder ───────────────────────────────────────────────────
/**
 * Schedules a one-time notification for a task due date.
 * @param taskId Unique task ID (used as notification ID)
 * @param taskTitle Task title
 * @param dueAt ISO string of due date
 * @param minutesBefore How many minutes before due date to notify (default: 60)
 */
export async function scheduleTaskReminder(
  taskId: string,
  taskTitle: string,
  dueAt: string,
  minutesBefore = 60,
): Promise<void> {
  const dueDate = new Date(dueAt);
  const notifyAt = new Date(dueDate.getTime() - minutesBefore * 60 * 1000);

  if (notifyAt.getTime() <= Date.now()) return; // too late

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: notifyAt.getTime(),
  };

  await notifee.createTriggerNotification(
    {
      id: `task-${taskId}`,
      title: '📋 Task Due Soon',
      body: `"${taskTitle}" is due in ${minutesBefore} minutes.`,
      android: {
        channelId: CHANNELS.TASKS,
        smallIcon: 'ic_launcher',
        pressAction: { id: 'default' },
      },
    },
    trigger,
  );
}

export async function cancelTaskReminder(taskId: string): Promise<void> {
  await notifee.cancelTriggerNotification(`task-${taskId}`);
}

// ─── Cancel all ───────────────────────────────────────────────────────────────
export async function cancelAllNotifications(): Promise<void> {
  await notifee.cancelAllNotifications();
}

// ─── Display immediate notification ──────────────────────────────────────────
export async function displayNotification(
  title: string,
  body: string,
  channelId: ChannelId = CHANNELS.WELLNESS,
): Promise<void> {
  await notifee.displayNotification({
    title,
    body,
    android: {
      channelId,
      smallIcon: 'ic_launcher',
      pressAction: { id: 'default' },
    },
  });
}

export const notificationService = {
  setup: setupNotifications,
  requestPermission: requestNotificationPermission,
  getPermissionStatus,
  scheduleDailyHabitReminder,
  cancelHabitReminder,
  scheduleDailyMoodCheckIn,
  cancelMoodReminder,
  scheduleTaskReminder,
  cancelTaskReminder,
  cancelAll: cancelAllNotifications,
  display: displayNotification,
};
