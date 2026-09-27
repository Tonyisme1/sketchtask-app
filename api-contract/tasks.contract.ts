// ==========================================
// API CONTRACT: TASKS
// ==========================================

export type TaskTag = "Công việc" | "Cá nhân" | "Ý tưởng" | "Học tập" | string;
export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "in_progress" | "completed" | "archived";
export type TaskItemType = "task" | "event";
export type TaskTimeType = "scheduled" | "deadline" | "event" | "task";

export interface TaskDto {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: string; // Legacy field (ISO date string or HH:mm)
  startDate?: string;
  endDate?: string;
  itemType?: TaskItemType;
  timeType?: TaskTimeType;
  startTime?: string;
  endTime?: string;
  deadlineDate?: string;
  deadlineTime?: string;
  tag?: TaskTag;
  /** Legacy import field. New writes must use the scalar `tag`. */
  tags?: TaskTag[];
  priority?: TaskPriority;
  status: TaskStatus;
  parentTaskId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  dueDate?: string; // Legacy field support
  startDate?: string;
  endDate?: string;
  itemType?: TaskItemType;
  timeType?: TaskTimeType;
  startTime?: string;
  endTime?: string;
  deadlineDate?: string;
  deadlineTime?: string;
  tag?: TaskTag;
  tags?: TaskTag[];
  priority?: TaskPriority;
  parentTaskId?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  completed?: boolean;
  dueDate?: string; // Legacy field support
  startDate?: string;
  endDate?: string;
  itemType?: TaskItemType;
  timeType?: TaskTimeType;
  startTime?: string;
  endTime?: string;
  deadlineDate?: string;
  deadlineTime?: string;
  tag?: TaskTag;
  tags?: TaskTag[];
  priority?: TaskPriority;
  status?: TaskStatus;
  parentTaskId?: string;
}
