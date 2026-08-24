// ==========================================
// API CONTRACT: TASKS
// ==========================================

export type TaskTag = "Công việc" | "Cá nhân" | "Ý tưởng" | "Học tập";
export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "in_progress" | "completed" | "archived";

export interface TaskDto {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: string; // ISO date string or HH:mm
  tag?: TaskTag;
  priority?: TaskPriority;
  status: TaskStatus;
  notebookId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  dueDate?: string;
  tag?: TaskTag;
  priority?: TaskPriority;
  notebookId?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  completed?: boolean;
  dueDate?: string;
  tag?: TaskTag;
  priority?: TaskPriority;
  status?: TaskStatus;
  notebookId?: string;
}

