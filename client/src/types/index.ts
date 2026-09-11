// ==========================================
// CLIENT TYPES (Self-contained & Đồng bộ api-contract)
// ==========================================

export type TaskTag = "Công việc" | "Cá nhân" | "Ý tưởng" | "Học tập" | string;
export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "in_progress" | "completed" | "archived";
export type TaskTimeType = "scheduled" | "deadline" | "event" | "task";

export interface TaskEditorInitialData {
  title?: string;
  description?: string;
  dueDate?: string;
  startDate?: string;
  endDate?: string;
  tag?: string;
  timeType?: TaskTimeType;
  startTime?: string;
  endTime?: string;
  deadlineTime?: string;
  priority?: TaskPriority;
  tags?: string[];
}

export interface TaskDto {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: string;
  startDate?: string;
  endDate?: string;
  timeType?: TaskTimeType;
  startTime?: string;
  endTime?: string;
  deadlineDate?: string;
  deadlineTime?: string;
  tag?: TaskTag;
  tags?: TaskTag[];
  priority?: TaskPriority;
  status: TaskStatus;
  parentTaskId?: string;
  createdAt: string;
  updatedAt: string;
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
  content: string;
  color: string;
  position: { x: number; y: number };
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
  | "notes"
  | "today"
  | "planner"
  | "deadlines"
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
