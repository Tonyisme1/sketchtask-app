// ==========================================
// SERVER TYPES & DTOS (Self-Contained for Cloud Deployment)
// ==========================================

export type TaskTag = "Công việc" | "Cá nhân" | "Ý tưởng" | "Học tập" | string;
export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "in_progress" | "completed" | "archived";
export type TaskTimeType = "scheduled" | "deadline" | "task";

export interface TaskDto {
  id: string;
  title: string;
  description?: string | null;
  completed: boolean;
  dueDate?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  timeType?: TaskTimeType | string | null;
  startTime?: string | null;
  endTime?: string | null;
  deadlineDate?: string | null;
  deadlineTime?: string | null;
  tag?: string | null;
  tags?: string[] | null;
  priority?: string | null;
  status: string;
  parentTaskId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  dueDate?: string;
  startDate?: string;
  endDate?: string;
  timeType?: TaskTimeType | string;
  startTime?: string;
  endTime?: string;
  deadlineDate?: string;
  deadlineTime?: string;
  tag?: string;
  tags?: string[];
  priority?: string;
  parentTaskId?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  completed?: boolean;
  dueDate?: string;
  startDate?: string;
  endDate?: string;
  timeType?: TaskTimeType | string;
  startTime?: string;
  endTime?: string;
  deadlineDate?: string;
  deadlineTime?: string;
  tag?: string;
  tags?: string[];
  priority?: string;
  status?: string;
  parentTaskId?: string;
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
  completedDates?: string[];
}
