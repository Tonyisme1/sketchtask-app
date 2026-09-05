import { prisma } from "../db.js";
import { calculateConsecutiveStreak } from "./habit.service.js";

const userSelect = {
  id: true,
  name: true,
  email: true,
  avatar: true,
  avatarBg: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      tasks: true,
      notebooks: true,
      stickyNotes: true,
      habits: true,
    },
  },
} as const;

export class AdminService {
  static async getOverview() {
    const [users, tasks, notebooks, stickyNotes, habits, latestUsers] = await Promise.all([
      prisma.user.count(),
      prisma.task.count(),
      prisma.notebook.count(),
      prisma.stickyNote.count(),
      prisma.habit.count(),
      prisma.user.findMany({
        select: userSelect,
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    return {
      totals: { users, tasks, notebooks, stickyNotes, habits },
      latestUsers: latestUsers.map((user) => ({
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      })),
    };
  }

  static async listUsers(search: string, page: number, pageSize: number) {
    const normalizedSearch = search.trim();
    const where = normalizedSearch
      ? {
          OR: [
            { name: { contains: normalizedSearch } },
            { email: { contains: normalizedSearch } },
          ],
        }
      : {};

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: userSelect,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items: users.map((user) => ({
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  static async getUserData(userId: string) {
    const [user, tasks, notebooks, stickyNotes, habits, dailyMoods, weeklyReflection, tags] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            avatarBg: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.task.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } }),
        prisma.notebook.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } }),
        prisma.stickyNote.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } }),
        prisma.habit.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } }),
        prisma.dailyMood.findMany({ where: { userId }, orderBy: { dateStr: "desc" } }),
        prisma.weeklyReflection.findUnique({ where: { userId } }),
        prisma.tag.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
      ]);

    if (!user) return null;

    return {
      user: {
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      tasks,
      notebooks,
      stickyNotes,
      habits: habits.map((habit) => {
        let completedDates: string[] = [];
        try {
          completedDates = JSON.parse(habit.completedDates);
        } catch {
          completedDates = [];
        }

        return {
          ...habit,
          completedDates,
          streak: calculateConsecutiveStreak(completedDates),
        };
      }),
      dailyMoods: dailyMoods.reduce<Record<string, string>>((result, mood) => {
        result[mood.dateStr] = mood.moodEmoji;
        return result;
      }, {}),
      weeklyReflection: weeklyReflection?.text || "",
      tags: tags.map((tag) => tag.name),
      dataAvailability: {
        notes: "local-only",
        journalEntries: "local-only",
      },
    };
  }
}
