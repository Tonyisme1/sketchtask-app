// ==========================================
// SERVER TYPES & DTOS (Self-Contained for Cloud Deployment)
// ==========================================

export type TaskTag = "Công việc" | "Cá nhân" | "Ý tưởng" | "Học tập" | string;
export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "in_progress" | "completed" | "archived";

export interface TaskDto {
  id: string;
  title: string;
  description?: string | null;
  completed: boolean;
  dueDate?: string | null;
  tag?: string | null;
  priority?: string | null;
  status: string;
  notebookId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  dueDate?: string;
  tag?: string;
  priority?: string;
  notebookId?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  completed?: boolean;
  dueDate?: string;
  tag?: string;
  priority?: string;
  status?: string;
  notebookId?: string;
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
  description?: string | null;
  color: string;
  icon?: string | null;
  taskCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotebookRequest {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface UpdateNotebookRequest {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface HabitDto {
  id: string;
  name: string;
  frequency: string;
  targetDaysPerWeek?: number | null;
  completedDates: string[];
  streak: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHabitRequest {
  name: string;
  frequency?: string;
  targetDaysPerWeek?: number;
}
