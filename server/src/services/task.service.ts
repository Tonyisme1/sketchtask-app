import type { Task as PrismaTask } from "@prisma/client";
import { prisma } from "../db.js";
import {
  TaskDto,
  TaskItemType,
  TaskPriority,
  TaskStatus,
  TaskTimeType,
  CreateTaskRequest,
  UpdateTaskRequest,
} from "../types/index.js";

const parseTaskTags = (value: string | null | undefined): string[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((tag): tag is string => typeof tag === "string") : [];
  } catch {
    return [];
  }
};

const isTaskItemType = (value: string | null): value is TaskItemType =>
  value === "task" || value === "event";

const isTaskTimeType = (value: string | null): value is TaskTimeType =>
  value === "scheduled" || value === "deadline" || value === "event" || value === "task";

const isTaskPriority = (value: string | null): value is TaskPriority =>
  value === "low" || value === "medium" || value === "high";

const isTaskStatus = (value: string): value is TaskStatus =>
  value === "todo" || value === "in_progress" || value === "completed" || value === "archived";

/** Convert database nulls and legacy tag arrays into the stable transport contract. */
const toTaskDto = (task: PrismaTask): TaskDto => {
  const tags = parseTaskTags(task.tags);
  return {
    id: task.id,
    title: task.title,
    description: task.description || undefined,
    completed: task.completed,
    dueDate: task.dueDate || undefined,
    itemType: isTaskItemType(task.itemType) ? task.itemType : undefined,
    timeType: isTaskTimeType(task.timeType) ? task.timeType : undefined,
    startTime: task.startTime || undefined,
    endTime: task.endTime || undefined,
    deadlineDate: task.deadlineDate || undefined,
    deadlineTime: task.deadlineTime || undefined,
    startDate: task.startDate || undefined,
    endDate: task.endDate || undefined,
    tag: task.tag || tags[0] || undefined,
    tags: tags.length > 0 ? tags : undefined,
    priority: isTaskPriority(task.priority) ? task.priority : undefined,
    status: isTaskStatus(task.status) ? task.status : "todo",
    parentTaskId: task.parentTaskId || undefined,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
};

export class TaskService {
  /**
   * Lấy danh sách toàn bộ task của người dùng
   */
  static async getAllTasks(userId: string): Promise<TaskDto[]> {
    const tasks = await prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return tasks.map(toTaskDto);
  }

  /**
   * Tạo task mới gắn với userId
   */
  static async createTask(userId: string, data: CreateTaskRequest): Promise<TaskDto> {
    const created = await prisma.task.create({
      data: {
        userId,
        title: data.title,
        description: data.description || null,
        completed: false,
        dueDate: data.dueDate || null,
        itemType: data.itemType || (data.timeType === "event" ? "event" : "task"),
        timeType: data.timeType || (data.itemType === "event" ? "event" : "task"),
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        deadlineDate: data.deadlineDate || null,
        deadlineTime: data.deadlineTime || null,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
        tag: data.tag || null,
        tags: data.tags ? JSON.stringify(data.tags) : null,
        priority: data.priority || "medium",
        status: "todo",
        parentTaskId: data.parentTaskId || null,
      },
    });

    return toTaskDto(created);
  }

  /**
   * Cập nhật task thuộc userId
   */
  static async updateTask(
    userId: string,
    id: string,
    data: UpdateTaskRequest
  ): Promise<TaskDto | null> {
    const existing = await prisma.task.findFirst({
      where: { id, userId },
    });
    if (!existing) return null;

    const updated = await prisma.task.update({
      where: { id },
      data: {
        title: data.title !== undefined ? data.title : undefined,
        description: data.description !== undefined ? data.description : undefined,
        completed: data.completed !== undefined ? data.completed : undefined,
        dueDate: data.dueDate !== undefined ? data.dueDate : undefined,
        itemType: data.itemType !== undefined ? data.itemType : undefined,
        timeType: data.timeType !== undefined ? data.timeType : undefined,
        startTime: data.startTime !== undefined ? data.startTime : undefined,
        endTime: data.endTime !== undefined ? data.endTime : undefined,
        deadlineDate: data.deadlineDate !== undefined ? data.deadlineDate : undefined,
        deadlineTime: data.deadlineTime !== undefined ? data.deadlineTime : undefined,
        startDate: data.startDate !== undefined ? data.startDate : undefined,
        endDate: data.endDate !== undefined ? data.endDate : undefined,
        tag: data.tag !== undefined ? data.tag : undefined,
        tags: data.tags !== undefined ? JSON.stringify(data.tags) : undefined,
        priority: data.priority !== undefined ? data.priority : undefined,
        status:
          data.status !== undefined
            ? data.status
            : data.completed !== undefined
              ? data.completed
                ? "completed"
                : "todo"
              : undefined,
        parentTaskId: data.parentTaskId !== undefined ? data.parentTaskId : undefined,
      },
    });

    return toTaskDto(updated);
  }

  /**
   * Xóa task thuộc userId
   */
  static async deleteTask(userId: string, id: string): Promise<boolean> {
    const existing = await prisma.task.findFirst({
      where: { id, userId },
    });
    if (!existing) return false;

    await prisma.task.delete({
      where: { id },
    });
    return true;
  }
}
