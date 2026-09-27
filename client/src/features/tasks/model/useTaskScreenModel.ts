import { useMemo, useState, useCallback } from "react";
import { useAppStore } from "../../../stores/appStore";
import { TaskDto, TaskPriority } from "../../../types";
import {
  getTaskTags,
} from "../../../utils/taskSemantics";
import { TaskScreenModel, TaskScreenFilterState } from "./types";

export const useTaskScreenModel = (): TaskScreenModel => {
  const {
    tasks,
    toggleTask,
    deleteTask,
    moveTaskToTomorrow,
    hideCompletedTasks,
    openTaskDetail,
    openQuickTaskModal,
    updateTask,
    activeTaskListTags,
    setActiveTaskListTags,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "active" | "completed">("all");
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority | undefined>();
  const [selectedTag, setSelectedTag] = useState<string | undefined>();

  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setFilterType("all");
    setSelectedPriority(undefined);
    setSelectedTag(undefined);
    setActiveTaskListTags([]);
  }, []);

  // Tất cả các tag có sẵn
  const tags = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      getTaskTags(t).forEach((tag) => set.add(tag));
    });
    return Array.from(set);
  }, [tasks]);

  // Bộ lọc dùng chung
  const applyGeneralFilters = useCallback(
    (taskList: TaskDto[]) => {
      let result = taskList;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        result = result.filter((t) => {
          const matchTitle = t.title.toLowerCase().includes(q);
          const matchDesc = t.description?.toLowerCase().includes(q);
          const matchTag = getTaskTags(t).some((tag) => tag.toLowerCase().includes(q));
          return matchTitle || matchDesc || matchTag;
        });
      }

      if (filterType === "active") {
        result = result.filter((t) => !t.completed);
      } else if (filterType === "completed") {
        result = result.filter((t) => t.completed);
      }

      if (selectedPriority) {
        result = result.filter((t) => t.priority === selectedPriority);
      }

      if (selectedTag) {
        result = result.filter((task) => getTaskTags(task).includes(selectedTag));
      } else if (activeTaskListTags.length > 0) {
        // Each task has one list; selecting several lists still uses OR logic.
        result = result.filter((task) =>
          getTaskTags(task).some((tag) => activeTaskListTags.includes(tag)),
        );
      }

      return result;
    },
    [searchQuery, filterType, selectedPriority, selectedTag, activeTaskListTags]
  );

  // Danh sách dùng chung cho desktop, tablet và mobile.
  const allTasks = useMemo(() => {
    return applyGeneralFilters(tasks);
  }, [tasks, applyGeneralFilters]);

  const filters: TaskScreenFilterState = {
    searchQuery,
    filterType,
    selectedPriority,
    selectedTag,
    selectedListTags: activeTaskListTags,
    hideCompleted: hideCompletedTasks,
  };

  return {
    tasks,
    allTasks,
    tags,

    filters,

    actions: {
      setSearchQuery,
      setFilterType,
      setSelectedPriority,
      setSelectedTag: (tag) => {
        setActiveTaskListTags([]);
        setSelectedTag(tag);
      },
      resetFilters,
      toggleTask,
      deleteTask,
      moveTaskToTomorrow,
      openTaskDetail,
      openQuickAdd: openQuickTaskModal,
    },
  };
};
