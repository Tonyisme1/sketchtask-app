import { TaskDto, TaskPriority, TaskSubTab } from "../../../types";

export interface TaskScreenFilterState {
  searchQuery: string;
  filterType: "all" | "active" | "completed";
  selectedPriority?: TaskPriority;
  selectedTag?: string;
  selectedListTags: string[];
  selectedNotebook?: string;
  hideCompleted: boolean;
}

export interface TaskProgressMetrics {
  completed: number;
  total: number;
  percent: number;
}

export interface TaskGroup {
  dateStr: string;
  tasks: TaskDto[];
}

export interface TaskScreenModel {
  // Raw and Filtered Data
  tasks: TaskDto[];
  todayTasks: TaskDto[];
  activeScheduledTasks: TaskDto[];
  activeTaskListItems: TaskDto[];
  completedTodayTasks: TaskDto[];
  overdueTasks: TaskDto[];
  upcomingTasks: TaskDto[];
  overdueGroups: TaskGroup[];
  upcomingGroups: TaskGroup[];
  allTasks: TaskDto[];
  junkTasks: TaskDto[];
  tags: string[];

  // Derived Metrics
  todayProgress: TaskProgressMetrics;
  overdueCount: number;
  upcomingCount: number;
  activeCount: number;

  // State
  activeTaskSubTab: TaskSubTab;
  filters: TaskScreenFilterState;

  // Actions
  actions: {
    setActiveTaskSubTab: (subTab: TaskSubTab) => void;
    setSearchQuery: (query: string) => void;
    setFilterType: (type: "all" | "active" | "completed") => void;
    setSelectedPriority: (priority: TaskPriority | undefined) => void;
    setSelectedTag: (tag: string | undefined) => void;
    setSelectedNotebook: (notebook: string | undefined) => void;
    resetFilters: () => void;
    toggleTask: (taskId: string) => void;
    deleteTask: (taskId: string) => void;
    moveTaskToTomorrow: (taskId: string) => void;
    openTaskDetail: (taskId: string) => void;
    openQuickAdd: () => void;
    bulkComplete: (tasks: TaskDto[]) => void;
    bulkDelete: (tasks: TaskDto[]) => void;
    bulkReschedule: (tasks: TaskDto[], newDateStr: string) => void;
  };
}
