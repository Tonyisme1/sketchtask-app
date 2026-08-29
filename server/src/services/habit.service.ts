import { prisma } from "../db.js";
import { HabitDto, CreateHabitRequest } from "../types/index.js";

/**
 * Tính số ngày hoàn thành liên tiếp tính từ ngày hoàn thành gần nhất
 */
export function calculateConsecutiveStreak(completedDates: string[]): number {
  if (!completedDates || completedDates.length === 0) return 0;

  // Lấy danh sách ngày duy nhất hợp lệ YYYY-MM-DD
  const validDates = Array.from(
    new Set(
      completedDates
        .filter((d) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d.trim()))
        .map((d) => d.trim())
    )
  ).sort((a, b) => b.localeCompare(a)); // Giảm dần: ngày mới nhất đứng đầu

  if (validDates.length === 0) return 0;

  let streak = 1;
  let prevDate = new Date(validDates[0] + "T00:00:00Z");

  for (let i = 1; i < validDates.length; i++) {
    const curDate = new Date(validDates[i] + "T00:00:00Z");
    const diffTime = prevDate.getTime() - curDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      streak++;
      prevDate = curDate;
    } else {
      break;
    }
  }

  return streak;
}

export class HabitService {
  /**
   * Lấy toàn bộ thói quen của người dùng
   */
  static async getAll(userId: string): Promise<HabitDto[]> {
    const habits = await prisma.habit.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });

    return habits.map((h) => {
      let completedDates: string[] = [];
      try {
        completedDates = JSON.parse(h.completedDates || "[]");
      } catch {
        completedDates = [];
      }

      const streak = calculateConsecutiveStreak(completedDates);

      return {
        id: h.id,
        name: h.name,
        frequency: h.frequency as any,
        targetDaysPerWeek: h.targetDaysPerWeek || 7,
        completedDates,
        streak,
        createdAt: h.createdAt.toISOString(),
        updatedAt: h.updatedAt.toISOString(),
      };
    });
  }

  /**
   * Tạo mới một thói quen
   */
  static async create(userId: string, data: CreateHabitRequest): Promise<HabitDto> {
    const completedDates = data.completedDates || [];
    const streak = calculateConsecutiveStreak(completedDates);

    const created = await prisma.habit.create({
      data: {
        userId,
        name: data.name,
        frequency: data.frequency || "daily",
        targetDaysPerWeek: data.targetDaysPerWeek || 7,
        completedDates: JSON.stringify(completedDates),
        streak,
      },
    });

    return {
      id: created.id,
      name: created.name,
      frequency: created.frequency as any,
      targetDaysPerWeek: created.targetDaysPerWeek || 7,
      completedDates,
      streak: created.streak,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  /**
   * Đánh dấu hoặc hủy đánh dấu thói quen theo ngày và cập nhật streak chuỗi ngày liên tiếp
   */
  static async toggleLog(userId: string, id: string, date: string): Promise<HabitDto | null> {
    const existing = await prisma.habit.findFirst({
      where: { id, userId },
    });
    if (!existing) return null;

    let completedDates: string[] = [];
    try {
      completedDates = JSON.parse(existing.completedDates || "[]");
    } catch {
      completedDates = [];
    }

    const exists = completedDates.includes(date);
    const updatedDates = exists
      ? completedDates.filter((d) => d !== date)
      : [...completedDates, date];

    const updatedStreak = calculateConsecutiveStreak(updatedDates);

    const updated = await prisma.habit.update({
      where: { id },
      data: {
        completedDates: JSON.stringify(updatedDates),
        streak: updatedStreak,
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      frequency: updated.frequency as any,
      targetDaysPerWeek: updated.targetDaysPerWeek || 7,
      completedDates: updatedDates,
      streak: updated.streak,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  /**
   * Xóa thói quen thuộc userId
   */
  static async delete(userId: string, id: string): Promise<boolean> {
    const existing = await prisma.habit.findFirst({
      where: { id, userId },
    });
    if (!existing) return false;

    await prisma.habit.delete({
      where: { id },
    });
    return true;
  }
}
