// ==========================================
// API CONTRACT: TASKS
// ==========================================

export type TaskTag = "Công việc" | "Cá nhân" | "Ý tưởng" | "Học tập" | string;
export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "in_progress" | "completed" | "archived";
export type TaskTimeType = "scheduled" | "deadline" | "event" | "task";

export interface TaskDto {
  id: string;
  title: string;
  description?: string | null;
  completed: boolean;
  dueDate?: string | null; // Legacy field (ISO date string or HH:mm)
  timeType?: TaskTimeType;
  startTime?: string | null;
  endTime?: string | null;
  deadlineDate?: string | null;
  deadlineTime?: string | null;
  tag?: TaskTag | null;
  priority?: TaskPriority | null;
  status: TaskStatus;
  notebookId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string | null;
  dueDate?: string | null; // Legacy field support
  timeType?: TaskTimeType;
  startTime?: string | null;
  endTime?: string | null;
  deadlineDate?: string | null;
  deadlineTime?: string | null;
  tag?: TaskTag | null;
  priority?: TaskPriority | null;
  notebookId?: string | null;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string | null;
  completed?: boolean;
  dueDate?: string | null; // Legacy field support
  timeType?: TaskTimeType;
  startTime?: string | null;
  endTime?: string | null;
  deadlineDate?: string | null;
  deadlineTime?: string | null;
  tag?: TaskTag | null;
  priority?: TaskPriority | null;
  status?: TaskStatus;
  notebookId?: string | null;
}
