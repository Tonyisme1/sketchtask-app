// ==========================================
// CLIENT TYPES (Self-contained & Đồng bộ api-contract)
// ==========================================

export type TaskTag = "Công việc" | "Cá nhân" | "Ý tưởng" | "Học tập" | string;
export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "in_progress" | "completed" | "archived";

export interface TaskDto {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: string;
  tag?: TaskTag;
  priority?: TaskPriority;
  status: TaskStatus;
  notebookId?: string;
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

export type Task = TaskDto;
export type Notebook = NotebookDto;
export type Habit = HabitDto;
export type StickyNote = StickyNoteDto;

export type TabKey = "today" | "planner" | "notebooks" | "braindump" | "review";

export interface TabConfig {
  key: TabKey;
  label: string;
  icon: string;
  accentColor: string;
}
