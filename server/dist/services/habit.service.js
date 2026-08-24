let mockHabits = [
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
    static async getAll() {
        return mockHabits;
    }
    static async create(data) {
        const newHabit = {
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
    static async toggleLog(id, date) {
        const habit = mockHabits.find((h) => h.id === id);
        if (!habit)
            return null;
        const exists = habit.completedDates.includes(date);
        habit.completedDates = exists
            ? habit.completedDates.filter((d) => d !== date)
            : [...habit.completedDates, date];
        habit.streak = habit.completedDates.length;
        habit.updatedAt = new Date().toISOString();
        return habit;
    }
}
