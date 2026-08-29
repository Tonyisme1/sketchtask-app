import { prisma } from "../db.js";
export class TaskService {
    /**
     * Lấy danh sách toàn bộ task của người dùng
     */
    static async getAllTasks(userId) {
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
            tag: t.tag,
            priority: t.priority,
            status: t.status,
            notebookId: t.notebookId,
            createdAt: t.createdAt.toISOString(),
            updatedAt: t.updatedAt.toISOString(),
        }));
    }
    /**
     * Tạo task mới gắn với userId
     */
    static async createTask(userId, data) {
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
                tag: data.tag || null,
                priority: data.priority || "medium",
                status: "todo",
                notebookId: data.notebookId || null,
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
            tag: created.tag,
            priority: created.priority,
            status: created.status,
            notebookId: created.notebookId,
            createdAt: created.createdAt.toISOString(),
            updatedAt: created.updatedAt.toISOString(),
        };
    }
    /**
     * Cập nhật task thuộc userId
     */
    static async updateTask(userId, id, data) {
        const existing = await prisma.task.findFirst({
            where: { id, userId },
        });
        if (!existing)
            return null;
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
                tag: data.tag !== undefined ? data.tag : undefined,
                priority: data.priority !== undefined ? data.priority : undefined,
                status: data.status !== undefined
                    ? data.status
                    : data.completed !== undefined
                        ? data.completed
                            ? "completed"
                            : "todo"
                        : undefined,
                notebookId: data.notebookId !== undefined ? data.notebookId : undefined,
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
            tag: updated.tag,
            priority: updated.priority,
            status: updated.status,
            notebookId: updated.notebookId,
            createdAt: updated.createdAt.toISOString(),
            updatedAt: updated.updatedAt.toISOString(),
        };
    }
    /**
     * Xóa task thuộc userId
     */
    static async deleteTask(userId, id) {
        const existing = await prisma.task.findFirst({
            where: { id, userId },
        });
        if (!existing)
            return false;
        await prisma.task.delete({
            where: { id },
        });
        return true;
    }
}
