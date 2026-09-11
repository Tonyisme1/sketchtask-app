import { prisma } from "../db.js";
import { TaskDto, CreateTaskRequest, UpdateTaskRequest } from "../types/index.js";

const parseTaskTags = (value: string | null | undefined): string[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((tag): tag is string => typeof tag === "string") : [];
  } catch {
    return [];
  }
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

    return tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      completed: t.completed,
      dueDate: t.dueDate,
      timeType: t.timeType,
      startTime: t.startTime,
      endTime: t.endTime,
      deadlineDate: t.deadlineDate,
      deadlineTime: t.deadlineTime,
      startDate: t.startDate,
      endDate: t.endDate,
      tag: t.tag,
      tags: parseTaskTags(t.tags),
      priority: t.priority,
      status: t.status,
      parentTaskId: t.parentTaskId,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }));
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
        timeType: data.timeType || "deadline",
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

    return {
      id: created.id,
      title: created.title,
      description: created.description,
      completed: created.completed,
      dueDate: created.dueDate,
      timeType: created.timeType,
      startTime: created.startTime,
      endTime: created.endTime,
      deadlineDate: created.deadlineDate,
      deadlineTime: created.deadlineTime,
      startDate: created.startDate,
      endDate: created.endDate,
      tag: created.tag,
      tags: parseTaskTags(created.tags),
      priority: created.priority,
      status: created.status,
      parentTaskId: created.parentTaskId,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
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

    return {
      id: updated.id,
      title: updated.title,
      description: updated.description,
      completed: updated.completed,
      dueDate: updated.dueDate,
      timeType: updated.timeType,
      startTime: updated.startTime,
      endTime: updated.endTime,
      deadlineDate: updated.deadlineDate,
      deadlineTime: updated.deadlineTime,
      startDate: updated.startDate,
      endDate: updated.endDate,
      tag: updated.tag,
      tags: parseTaskTags(updated.tags),
      priority: updated.priority,
      status: updated.status,
      parentTaskId: updated.parentTaskId,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
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
