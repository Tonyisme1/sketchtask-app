// ==========================================
// CLIENT TYPES (Self-contained & Đồng bộ api-contract)
// ==========================================

export type TaskTag = "Công việc" | "Cá nhân" | "Ý tưởng" | "Học tập" | string;
export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "in_progress" | "completed" | "archived";
export type TaskTimeType = "scheduled" | "deadline" | "event" | "task";

export interface TaskDto {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: string;
  timeType?: TaskTimeType;
  startTime?: string;
  endTime?: string;
  deadlineDate?: string;
  deadlineTime?: string;
  tag?: TaskTag;
  priority?: TaskPriority;
  status: TaskStatus;
  notebookId?: string;
  parentTaskId?: string;
  createdAt: string;
  updatedAt: string;
}

export type NotebookColor =
  | "yellow"
  | "coral"
  | "mint"
  | "sky"
  | "lavender"
  | string;

export interface NotebookDto {
  id: string;
  name: string;
  description?: string;
  color: NotebookColor;
  icon?: string;
  taskCount?: number;
  createdAt: string;
  updatedAt: string;
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
  notebookId?: string; // Sổ tay / mảng chủ đề
  linkedTaskId?: string;
  createdAt: string;
  updatedAt: string;
}

export type Task = TaskDto;
export type Notebook = NotebookDto;
export type Habit = HabitDto;
export type StickyNote = StickyNoteDto;
export type JournalEntry = JournalEntryDto;

export type TabKey =
  | "dashboard"
  | "tasks"
  | "notes"
  | "today"
  | "planner"
  | "deadlines"
  | "notebooks"
  | "journal"
  | "settings"
  | "review";

export interface NavigationTarget {
  taskId?: string;
  notebookId?: string;
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
