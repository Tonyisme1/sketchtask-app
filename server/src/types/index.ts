// ==========================================
// SERVER TYPES & DTOS (Task/Event contract is shared with client)
// ==========================================

import type {
  TaskTag,
  TaskPriority,
  TaskStatus,
  TaskItemType,
  TaskTimeType,
  TaskDto,
  CreateTaskRequest,
  UpdateTaskRequest,
} from "@sketchtask/api-contract";

export type {
  TaskTag,
  TaskPriority,
  TaskStatus,
  TaskItemType,
  TaskTimeType,
  TaskDto,
  CreateTaskRequest,
  UpdateTaskRequest,
};

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
