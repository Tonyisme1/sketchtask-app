// ==========================================
// API CONTRACT: HABITS & REVIEWS
// ==========================================

export interface HabitDto {
  id: string;
  name: string;
  frequency: "daily" | "weekly";
  targetDaysPerWeek?: number;
  completedDates: string[]; // List of YYYY-MM-DD
  streak: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHabitRequest {
  name: string;
  frequency?: "daily" | "weekly";
  targetDaysPerWeek?: number;
}

export interface ToggleHabitLogRequest {
  date: string; // YYYY-MM-DD
}

export interface WeeklyReviewDto {
  id: string;
  weekNumber: number;
  year: number;
  completedTaskCount: number;
  totalTaskCount: number;
  notes?: string;
  createdAt: string;
}
