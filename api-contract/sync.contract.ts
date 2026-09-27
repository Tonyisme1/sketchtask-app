// ==========================================
// API CONTRACT: OFFLINE-FIRST SYNC
// ==========================================

/** Transport input preserves nullable legacy fields while new writes use scalar tag. */
export interface SyncTaskDto {
  id: string;
  title: string;
  description?: string | null;
  completed?: boolean;
  dueDate?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  itemType?: "task" | "event" | string | null;
  timeType?: "scheduled" | "deadline" | "event" | "task" | string | null;
  startTime?: string | null;
  endTime?: string | null;
  deadlineDate?: string | null;
  deadlineTime?: string | null;
  tag?: string | null;
  /** Legacy import support only. New writes store one scalar tag. */
  tags?: string[] | null;
  priority?: "low" | "medium" | "high" | string | null;
  status?: string;
  parentTaskId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SyncStickyNoteDto {
  id: string;
  title?: string;
  content: string;
  color: string;
  tilt?: string;
  isPinned: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SyncHabitDto {
  id: string;
  name: string;
  frequency?: string;
  targetDaysPerWeek?: number | null;
  completedDates: string[];
  streak?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SyncJournalEntryDto {
  id: string;
  date: string;
  time?: string;
  content: string;
  linkedTaskId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SyncDeletedEntities {
  tasks?: string[];
  stickyNotes?: string[];
  habits?: string[];
  journalEntries?: string[];
  tags?: string[];
}

/** The transport source of truth for pull, push, local merge and tombstones. */
export interface SyncPayload {
  updatedAt?: string;
  clientTimestamp?: string;
  tasks: SyncTaskDto[];
  stickyNotes: SyncStickyNoteDto[];
  habits: SyncHabitDto[];
  journalEntries?: SyncJournalEntryDto[];
  dailyMoods: Record<string, string | { moodEmoji: string; updatedAt?: string }>;
  weeklyReflection: string | { text: string; updatedAt?: string };
  tags: string[];
  _metadata?: {
    dailyMoodsUpdatedAt?: Record<string, string>;
    weeklyReflectionUpdatedAt?: string;
  };
  deleted?: SyncDeletedEntities;
}
