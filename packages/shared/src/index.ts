// User types
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  focusMode: 'work' | 'personal' | 'both';
  workHoursStart: string; // HH:mm
  workHoursEnd: string;   // HH:mm
  wellnessGoals: string[];
  notificationsEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

// Task types
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: TaskPriority;
  status: TaskStatus;
  category?: string;
  recurringPattern?: string; // RRULE
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Event types
export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  recurrenceRule?: string; // RRULE
  reminders: number[];    // minutes before
  linkedTaskId?: string;
  createdAt: string;
  updatedAt: string;
}

// Mood / Wellness types
export type MoodScore = 1 | 2 | 3 | 4 | 5;

export interface MoodEntry {
  id: string;
  userId: string;
  mood: MoodScore;
  energy: MoodScore;
  notes?: string;
  createdAt: string;
}

// Habit types
export type HabitFrequency = 'daily' | 'weekly' | 'custom';

export interface Habit {
  id: string;
  userId: string;
  title: string;
  frequency: HabitFrequency;
  targetCount: number;
  color: string;
  icon: string;
  reminderTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  userId: string;
  date: string;
  completed: boolean;
  value?: number;
}

// Chat types
export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  userId: string;
  role: ChatRole;
  content: string;
  actions?: ChatAction[];
  createdAt: string;
}

export interface ChatAction {
  type: 'create_task' | 'create_event' | 'query_schedule' | 'suggest_wellness' | 'log_mood';
  payload: Record<string, unknown>;
  executed: boolean;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

// Gamification
export interface UserProgress {
  userId: string;
  points: number;
  level: number;
  streakDays: number;
  achievements: string[];
}
