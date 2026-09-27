import { TaskDto, TaskPriority } from "../../../types";

export interface TaskScreenFilterState {
  searchQuery: string;
  filterType: "all" | "active" | "completed";
  selectedPriority?: TaskPriority;
  selectedTag?: string;
  selectedListTags: string[];
  hideCompleted: boolean;
}

export interface TaskScreenModel {
  // Raw and Filtered Data
  tasks: TaskDto[];
  allTasks: TaskDto[];
  tags: string[];

  // State
  filters: TaskScreenFilterState;

  // Actions
  actions: {
    setSearchQuery: (query: string) => void;
    setFilterType: (type: "all" | "active" | "completed") => void;
    setSelectedPriority: (priority: TaskPriority | undefined) => void;
    setSelectedTag: (tag: string | undefined) => void;
    resetFilters: () => void;
    toggleTask: (taskId: string) => void;
    deleteTask: (taskId: string) => void;
    moveTaskToTomorrow: (taskId: string) => void;
    openTaskDetail: (taskId: string) => void;
    openQuickAdd: () => void;
  };
}
