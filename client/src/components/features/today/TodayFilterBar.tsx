import React from "react";
import { FilterBar } from "../shared/FilterBar";

export interface TodayFilterBarProps {
  statusFilter: "all" | "active" | "completed";
  onStatusChange: (status: "all" | "active" | "completed") => void;
  timeTypeFilter: "all" | "scheduled" | "deadline";
  onTimeTypeChange: (timeType: "all" | "scheduled" | "deadline") => void;
  priorityFilter: "all" | "high" | "medium" | "low";
  onPriorityChange: (priority: "all" | "high" | "medium" | "low") => void;
  notebookFilter: string;
  onNotebookChange: (notebookId: string) => void;
  tagFilter: string;
  onTagChange: (tag: string) => void;
  isFilterDrawerOpen: boolean;
  onToggleFilterDrawer: () => void;
  onResetFilters: () => void;
  activeFilterCount: number;
}

export const TodayFilterBar: React.FC<TodayFilterBarProps> = ({
  statusFilter,
  onStatusChange,
  timeTypeFilter,
  onTimeTypeChange,
  priorityFilter,
  onPriorityChange,
  notebookFilter,
  onNotebookChange,
  tagFilter,
  onTagChange,
  isFilterDrawerOpen,
  onToggleFilterDrawer,
  onResetFilters,
  activeFilterCount,
}) => {
  return (
    <FilterBar
      statusFilter={statusFilter}
      onStatusChange={onStatusChange}
      timeTypeFilter={timeTypeFilter}
      onTimeTypeChange={onTimeTypeChange}
      priorityFilter={priorityFilter}
      onPriorityChange={onPriorityChange}
      notebookFilter={notebookFilter}
      onNotebookChange={onNotebookChange}
      tagFilter={tagFilter}
      onTagChange={onTagChange}
      isDrawerOpen={isFilterDrawerOpen}
      onToggleDrawer={onToggleFilterDrawer}
      onResetFilters={onResetFilters}
      activeFilterCount={activeFilterCount}
    />
  );
};
