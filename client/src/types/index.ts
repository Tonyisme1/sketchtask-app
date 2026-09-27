// ==========================================
// CLIENT TYPES (Task/Event contract is shared with server)
// ==========================================

import type {
  TaskTag,
  TaskPriority,
  TaskStatus,
  TaskItemType,
  TaskTimeType,
  TaskDto,
  SyncPayload,
} from "../../../api-contract/index.js";

export type {
  TaskTag,
  TaskPriority,
  TaskStatus,
  TaskItemType,
  TaskTimeType,
  TaskDto,
  SyncPayload,
};
export interface TaskEditorInitialData {
  title?: string;
  description?: string;
  dueDate?: string;
  startDate?: string;
  endDate?: string;
  itemType?: TaskItemType;
  tag?: string;
  timeType?: TaskTimeType;
  startTime?: string;
  endTime?: string;
  deadlineTime?: string;
  priority?: TaskPriority;
  /** Legacy initial value; editors keep only the first entry. */
  tags?: string[];
  mode?: "view" | "edit";
  lockItemType?: boolean;
}

export interface DeletedEntityIds {
  tasks: string[];
  stickyNotes: string[];
  habits: string[];
  journalEntries: string[];
  tags: string[];
}

export interface HabitDto {
  id: string;
  name: string;
  frequency: "daily" | "weekly";
  targetDaysPerWeek?: number;
  completedDates: string[]; // List of YYYY-MM-DD
  streak: number;
  createdAt: string;
  updatedAt: string;
}

export interface StickyNoteDto {
  id: string;
  title: string;
  content: string;
  color: string;
  tilt: "left" | "right" | "none";
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntryDto {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  content: string;
  linkedTaskId?: string;
  createdAt: string;
  updatedAt: string;
}

export type Task = TaskDto;
export type Habit = HabitDto;
export type StickyNote = StickyNoteDto;
export type JournalEntry = JournalEntryDto;

export type TabKey =
  | "tasks"
  | "events"
  | "notes"
  | "journal"
  | "ai"
  | "settings";

export interface NavigationTarget {
  taskId?: string;
  noteId?: string;
  journalEntryId?: string;
  date?: string;
}

export interface TabConfig {
  key: TabKey;
  label: string;
  icon: string;
  accentColor: string;
}

export type SettingsSectionKey =
  | "account"
  | "general"
  | "notifications"
  | "data"
  | "security"
  | "shortcuts"
  | "about";
