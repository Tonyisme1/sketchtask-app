import { prisma } from "../db.js";
export class NotebookService {
    /**
     * Lấy danh sách toàn bộ sổ tay của người dùng kèm đếm số task
     */
    static async getAll(userId) {
        const notebooks = await prisma.notebook.findMany({
            where: { userId },
            include: {
                _count: {
                    select: { tasks: true },
                },
            },
            orderBy: { createdAt: "asc" },
        });
        return notebooks.map((nb) => ({
            id: nb.id,
            name: nb.name,
            description: nb.description,
            color: nb.color,
            icon: nb.icon,
            taskCount: nb._count.tasks,
            createdAt: nb.createdAt.toISOString(),
            updatedAt: nb.updatedAt.toISOString(),
        }));
    }
    /**
     * Tạo cuốn sổ tay mới
     */
    static async create(userId, data) {
        const created = await prisma.notebook.create({
            data: {
                userId,
                name: data.name,
                description: data.description || null,
                color: data.color || "yellow",
                icon: data.icon || "lucide:BookOpen",
            },
        });
        return {
            id: created.id,
            name: created.name,
            description: created.description,
            color: created.color,
            icon: created.icon,
            taskCount: 0,
            createdAt: created.createdAt.toISOString(),
            updatedAt: created.updatedAt.toISOString(),
        };
    }
    /**
     * Cập nhật cuốn sổ tay thuộc userId
     */
    static async update(userId, id, data) {
        const existing = await prisma.notebook.findFirst({
            where: { id, userId },
        });
        if (!existing)
            return null;
        const updated = await prisma.notebook.update({
            where: { id },
            data: {
                name: data.name !== undefined ? data.name : undefined,
                description: data.description !== undefined ? data.description : undefined,
                color: data.color !== undefined ? data.color : undefined,
                icon: data.icon !== undefined ? data.icon : undefined,
            },
            include: {
                _count: {
                    select: { tasks: true },
                },
            },
        });
        return {
            id: updated.id,
            name: updated.name,
            description: updated.description,
            color: updated.color,
            icon: updated.icon,
            taskCount: updated._count.tasks,
            createdAt: updated.createdAt.toISOString(),
            updatedAt: updated.updatedAt.toISOString(),
        };
    }
    /**
     * Xóa cuốn sổ tay thuộc userId
     */
    static async delete(userId, id) {
        const existing = await prisma.notebook.findFirst({
            where: { id, userId },
        });
        if (!existing)
            return false;
        await prisma.notebook.delete({
            where: { id },
        });
        return true;
    }
}
