import React from "react";
import { FilterBar } from "../shared/FilterBar";

export interface TodayFilterBarProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  statusFilter: "all" | "active" | "completed";
  onStatusChange: (status: "all" | "active" | "completed") => void;
  timeTypeFilter: "all" | "scheduled" | "deadline";
  onTimeTypeChange: (timeType: "all" | "scheduled" | "deadline") => void;
  priorityFilter: "all" | "high" | "medium" | "low";
  onPriorityChange: (priority: "all" | "high" | "medium" | "low") => void;
  tagFilter: string;
  onTagChange: (tag: string) => void;
  isFilterDrawerOpen: boolean;
  onToggleFilterDrawer: () => void;
  onResetFilters: () => void;
  activeFilterCount: number;
}

export const TodayFilterBar: React.FC<TodayFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  timeTypeFilter,
  onTimeTypeChange,
  priorityFilter,
  onPriorityChange,
  tagFilter,
  onTagChange,
  isFilterDrawerOpen,
  onToggleFilterDrawer,
  onResetFilters,
  activeFilterCount,
}) => {
  return (
    <FilterBar
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      statusFilter={statusFilter}
      onStatusChange={onStatusChange}
      timeTypeFilter={timeTypeFilter}
      onTimeTypeChange={onTimeTypeChange}
      priorityFilter={priorityFilter}
      onPriorityChange={onPriorityChange}
      tagFilter={tagFilter}
      onTagChange={onTagChange}
      isDrawerOpen={isFilterDrawerOpen}
      onToggleDrawer={onToggleFilterDrawer}
      onResetFilters={onResetFilters}
      activeFilterCount={activeFilterCount}
    />
  );
};
