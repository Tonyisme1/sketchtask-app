import { TaskDto } from "../../../types";

export type PlannerViewMode = "agenda" | "month";

export interface PlannerDayInfo {
  dateStr: string;
  date: Date;
  isToday: boolean;
  isSelected: boolean;
  tasks: TaskDto[];
  scheduledTasks: TaskDto[];
  regularTasks: TaskDto[];
  completedTasks: TaskDto[];
  eventTasks: TaskDto[];
  dayName: string;
  shortDayName: string;
  dayNum: number;
}

export interface PlannerTaskSummary {
  total: number;
  completed: number;
  active: number;
  overdue: number;
  pastScheduled: number;
  scheduled: number;
}

export interface PlannerScreenModel {
  // Date & Navigation State
  currentDayStr: string;
  currentDate: Date;
  todayStr: string;
  todayDate: Date;
  tasks: TaskDto[];
  hideCompletedTasks: boolean;
  weekOffset: number;
  monthOffset: number;
  weekLabel: string;
  monthLabel: string;
  weekDays: PlannerDayInfo[];
  monthDays: Array<{
    dateStr: string;
    dayNum: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
    taskCount: number;
    tasks: TaskDto[];
  }>;

  // Selected Day Task Breakdown
  dayTasks: TaskDto[];
  dayScheduledTasks: TaskDto[];
  dayRegularTasks: TaskDto[];
  dayCompletedTasks: TaskDto[];
  dayEventTasks: TaskDto[];
  dayProgress: {
    completed: number;
    total: number;
    percent: number;
  };

  // View state
  viewMode: PlannerViewMode;
  searchQuery: string;
  isOverdueBackVisible: boolean;

  // Helpers
  getTasksForDate: (dateStr: string) => TaskDto[];
  getTaskSummaryForDate: (dateStr: string) => PlannerTaskSummary;

  // Actions
  actions: {
    selectDay: (dateStr: string) => void;
    nextWeek: () => void;
    prevWeek: () => void;
    goToToday: () => void;
    nextMonth: () => void;
    prevMonth: () => void;
    setViewMode: (mode: PlannerViewMode) => void;
    setSearchQuery: (query: string) => void;
    toggleTask: (taskId: string) => void;
    deleteTask: (taskId: string) => void;
    updateTask: (taskId: string, updates: Partial<TaskDto>) => void;
    moveTaskToNextDay: (taskId: string, baseDateStr?: string) => void;
    openTaskDetail: (taskId: string) => void;
    openQuickTaskModal: (initialData?: { dueDate?: string }) => void;
  };
}
