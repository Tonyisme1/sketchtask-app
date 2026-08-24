import { HabitDto, CreateHabitRequest } from "../types/index.js";

let mockHabits: HabitDto[] = [
  {
    id: "h-1",
    name: "Uống 2L nước mỗi ngày",
    frequency: "daily",
    targetDaysPerWeek: 7,
    completedDates: ["2026-08-24"],
    streak: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export class HabitService {
  static async getAll(): Promise<HabitDto[]> {
    return mockHabits;
  }

  static async create(data: CreateHabitRequest): Promise<HabitDto> {
    const newHabit: HabitDto = {
      id: `h-${Date.now()}`,
      name: data.name,
      frequency: data.frequency || "daily",
      targetDaysPerWeek: data.targetDaysPerWeek || 7,
      completedDates: [],
      streak: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockHabits.push(newHabit);
    return newHabit;
  }

  static async toggleLog(id: string, date: string): Promise<HabitDto | null> {
    const habit = mockHabits.find((h) => h.id === id);
    if (!habit) return null;

    const exists = habit.completedDates.includes(date);
    habit.completedDates = exists
      ? habit.completedDates.filter((d) => d !== date)
      : [...habit.completedDates, date];
    habit.streak = habit.completedDates.length;
    habit.updatedAt = new Date().toISOString();
    return habit;
  }
}

