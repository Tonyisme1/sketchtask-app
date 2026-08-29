import { prisma } from "../db.js";
import { wsService } from "./websocket.service.js";

export interface SyncPayload {
  tasks: Array<{
    id: string;
    title: string;
    description?: string | null;
    completed: boolean;
    dueDate?: string | null;
    tag?: string | null;
    priority?: string | null;
    status?: string;
    notebookId?: string | null;
    createdAt?: string;
    updatedAt?: string;
  }>;
  notebooks: Array<{
    id: string;
    name: string;
    description?: string | null;
    color: string;
    icon?: string | null;
    createdAt?: string;
    updatedAt?: string;
  }>;
  stickyNotes: Array<{
    id: string;
    content: string;
    color: string;
    tilt?: string;
    isPinned: boolean;
    createdAt?: string;
    updatedAt?: string;
  }>;
  habits: Array<{
    id: string;
    name: string;
    frequency?: string;
    targetDaysPerWeek?: number | null;
    completedDates: string[];
    streak: number;
    createdAt?: string;
    updatedAt?: string;
  }>;
  dailyMoods: Record<string, string>; // dateStr -> moodEmoji
  weeklyReflection: string;
  tags: string[];
}

export class SyncService {
  /**
   * Lấy toàn bộ dữ liệu hiện có trên máy chủ của User
   */
  static async getUserData(userId: string) {
    const [tasks, notebooks, stickyNotes, habits, dailyMoods, weeklyReflection, tags] =
      await Promise.all([
        prisma.task.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
        prisma.notebook.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
        prisma.stickyNote.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
        prisma.habit.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
        prisma.dailyMood.findMany({ where: { userId } }),
        prisma.weeklyReflection.findUnique({ where: { userId } }),
        prisma.tag.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
      ]);

    // Chuyển đổi dailyMoods sang format key-value
    const moodsMap: Record<string, string> = {};
    dailyMoods.forEach((m) => {
      moodsMap[m.dateStr] = m.moodEmoji;
    });

    // Chuyển đổi habits.completedDates từ JSON string sang Array
    const formattedHabits = habits.map((h) => ({
      ...h,
      completedDates: (() => {
        try {
          return JSON.parse(h.completedDates);
        } catch {
          return [];
        }
      })(),
    }));

    return {
      tasks,
      notebooks,
      stickyNotes,
      habits: formattedHabits,
      dailyMoods: moodsMap,
      weeklyReflection: weeklyReflection?.text || "",
      tags: tags.map((t) => t.name),
    };
  }

  /**
   * Đồng bộ dữ liệu từ Client lên Server và lưu vào DB
   */
  static async syncData(userId: string, payload: SyncPayload) {
    await prisma.$transaction(async (tx) => {
      // 1. Đồng bộ Notebooks trước (để Tasks có foreign key)
      await tx.notebook.deleteMany({ where: { userId } });
      if (payload.notebooks?.length > 0) {
        await tx.notebook.createMany({
          data: payload.notebooks.map((nb) => ({
            id: nb.id,
            userId,
            name: nb.name,
            description: nb.description || null,
            color: nb.color,
            icon: nb.icon || "lucide:BookOpen",
            createdAt: nb.createdAt ? new Date(nb.createdAt) : new Date(),
            updatedAt: nb.updatedAt ? new Date(nb.updatedAt) : new Date(),
          })),
        });
      }

      // 2. Đồng bộ Tasks
      await tx.task.deleteMany({ where: { userId } });
      if (payload.tasks?.length > 0) {
        // Chỉ giữ notebookId nếu notebook tồn tại
        const validNotebookIds = new Set(payload.notebooks.map((n) => n.id));
        await tx.task.createMany({
          data: payload.tasks.map((t) => ({
            id: t.id,
            userId,
            title: t.title,
            description: t.description || null,
            completed: t.completed,
            dueDate: t.dueDate || null,
            timeType: (t as any).timeType || "scheduled",
            startTime: (t as any).startTime || null,
            endTime: (t as any).endTime || null,
            deadlineDate: (t as any).deadlineDate || null,
            deadlineTime: (t as any).deadlineTime || null,
            tag: t.tag || null,
            priority: t.priority || "medium",
            status: t.status || (t.completed ? "completed" : "todo"),
            notebookId: t.notebookId && validNotebookIds.has(t.notebookId) ? t.notebookId : null,
            createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
            updatedAt: t.updatedAt ? new Date(t.updatedAt) : new Date(),
          })),
        });
      }

      // 3. Đồng bộ StickyNotes
      await tx.stickyNote.deleteMany({ where: { userId } });
      if (payload.stickyNotes?.length > 0) {
        await tx.stickyNote.createMany({
          data: payload.stickyNotes.map((sn) => ({
            id: sn.id,
            userId,
            content: sn.content,
            color: sn.color,
            tilt: sn.tilt || "none",
            isPinned: sn.isPinned,
            createdAt: sn.createdAt ? new Date(sn.createdAt) : new Date(),
            updatedAt: sn.updatedAt ? new Date(sn.updatedAt) : new Date(),
          })),
        });
      }

      // 4. Đồng bộ Habits
      await tx.habit.deleteMany({ where: { userId } });
      if (payload.habits?.length > 0) {
        await tx.habit.createMany({
          data: payload.habits.map((h) => ({
            id: h.id,
            userId,
            name: h.name,
            frequency: h.frequency || "daily",
            targetDaysPerWeek: h.targetDaysPerWeek || 7,
            completedDates: JSON.stringify(h.completedDates || []),
            streak: h.streak || 0,
            createdAt: h.createdAt ? new Date(h.createdAt) : new Date(),
            updatedAt: h.updatedAt ? new Date(h.updatedAt) : new Date(),
          })),
        });
      }

      // 5. Đồng bộ DailyMoods
      await tx.dailyMood.deleteMany({ where: { userId } });
      if (payload.dailyMoods && Object.keys(payload.dailyMoods).length > 0) {
        await tx.dailyMood.createMany({
          data: Object.entries(payload.dailyMoods).map(([dateStr, moodEmoji]) => ({
            userId,
            dateStr,
            moodEmoji,
          })),
        });
      }

      // 6. Đồng bộ WeeklyReflection
      if (payload.weeklyReflection !== undefined) {
        await tx.weeklyReflection.upsert({
          where: { userId },
          create: { userId, text: payload.weeklyReflection },
          update: { text: payload.weeklyReflection },
        });
      }

      // 7. Đồng bộ Tags
      await tx.tag.deleteMany({ where: { userId } });
      if (payload.tags?.length > 0) {
        await tx.tag.createMany({
          data: payload.tags.map((tagName) => ({
            userId,
            name: tagName,
          })),
        });
      }
    });

    // Lấy lại dữ liệu đầy đủ sau sync
    const freshData = await this.getUserData(userId);

    // Phát broadcast WebSocket để các tab / điện thoại khác cùng tài khoản tự update ngay lập tức
    wsService.broadcastToUser(userId, {
      type: "REALTIME_DATA_UPDATE",
      payload: freshData,
    });

    return freshData;
  }
}

