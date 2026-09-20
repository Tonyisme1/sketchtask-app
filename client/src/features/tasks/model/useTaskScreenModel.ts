import { useMemo, useState, useCallback } from "react";
import { useAppStore } from "../../../stores/appStore";
import { TaskDto, TaskPriority } from "../../../types";
import { getLocalTodayStr, getLocalTomorrowStr } from "../../../utils/date";
import {
  isTaskDueToday,
  normalizeTaskTimeType,
  getTaskTags,
  getTaskTemporalState,
  getTaskDeadlineDate,
  getTaskEffectiveDate,
  getTaskEffectiveTime,
  getTaskItemType,
} from "../../../utils/taskSemantics";
import { getTaskProgress } from "../../../utils/taskHierarchy";
import { TaskScreenModel, TaskScreenFilterState, TaskGroup } from "./types";

const isLikelyJunkTask = (task: TaskDto) => {
  const compactTitle = task.title.trim().toLocaleLowerCase().replace(/[^a-z0-9]/g, "");
  return compactTitle.length >= 6 && /^(add|test|asdf|qwer)+$/.test(compactTitle);
};

const sortByDateAndTime = (tasks: TaskDto[]): TaskDto[] =>
  [...tasks].sort((taskA, taskB) => {
    const dateA = getTaskDeadlineDate(taskA) || getTaskEffectiveDate(taskA) || "9999-99-99";
    const dateB = getTaskDeadlineDate(taskB) || getTaskEffectiveDate(taskB) || "9999-99-99";
    const dateOrder = dateA.localeCompare(dateB);
    if (dateOrder !== 0) return dateOrder;
    return (getTaskEffectiveTime(taskA) || "99:99").localeCompare(
      getTaskEffectiveTime(taskB) || "99:99",
    );
  });

const groupByDate = (tasksList: TaskDto[]): TaskGroup[] => {
  const groups = new Map<string, TaskDto[]>();
  for (const task of tasksList) {
    const date = getTaskDeadlineDate(task) || getTaskEffectiveDate(task) || "no-date";
    const group = groups.get(date) || [];
    group.push(task);
    groups.set(date, group);
  }
  return [...groups.entries()].map(([dateStr, groupTasks]) => ({
    dateStr,
    tasks: sortByDateAndTime(groupTasks),
  }));
};

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
    activeTaskSubTab,
    setActiveTaskSubTab,
    activeTaskListTags,
    setActiveTaskListTags,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "active" | "completed">("all");
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority | undefined>();
  const [selectedTag, setSelectedTag] = useState<string | undefined>();
  const [selectedNotebook, setSelectedNotebook] = useState<string | undefined>();

  const now = new Date();
  const todayStr = getLocalTodayStr(now);
  const tomorrowStr = getLocalTomorrowStr();

  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setFilterType("all");
    setSelectedPriority(undefined);
    setSelectedTag(undefined);
    setActiveTaskListTags([]);
    setSelectedNotebook(undefined);
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
        // A task may be assigned to multiple lists; selecting several lists uses OR logic.
        result = result.filter((task) =>
          getTaskTags(task).some((tag) => activeTaskListTags.includes(tag)),
        );
      }

      return result;
    },
    [searchQuery, filterType, selectedPriority, selectedTag, activeTaskListTags]
  );

  // 1. Task Hôm Nay (Today)
  const rawTodayTasks = useMemo(() => {
    return tasks.filter((task) => isTaskDueToday(task, now));
  }, [tasks, todayStr]);

  const todayTasks = useMemo(() => {
    return applyGeneralFilters(rawTodayTasks);
  }, [rawTodayTasks, applyGeneralFilters]);

  const activeScheduledTasks = useMemo(() => {
    return todayTasks.filter((task) => {
      if (task.parentTaskId) return false;
      if (task.completed) return false;
      return normalizeTaskTimeType(task) === "scheduled";
    });
  }, [todayTasks]);

  const activeTaskListItems = useMemo(() => {
    return todayTasks.filter((task) => {
      if (task.completed) return false;
      return normalizeTaskTimeType(task) !== "scheduled";
    });
  }, [todayTasks]);

  const completedTodayTasks = useMemo(() => {
    if (hideCompletedTasks) return [];
    return todayTasks.filter((task) => task.completed);
  }, [todayTasks, hideCompletedTasks]);

  const todayProgress = useMemo(() => {
    const { completed, total } = getTaskProgress(rawTodayTasks);
    return {
      completed,
      total,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [rawTodayTasks]);

  // 2. Task Quá Hạn (Overdue)
  const overdueTasks = useMemo(() => {
    const list = tasks.filter((task) => {
      if (getTaskItemType(task) === "event") return false;
      if (task.completed) return false;
      const state = getTaskTemporalState(task);
      return state === "overdue" || state === "pastScheduled";
    });
    return sortByDateAndTime(applyGeneralFilters(list));
  }, [tasks, applyGeneralFilters]);

  // 3. Task Sắp Đến (Upcoming)
  const upcomingTasks = useMemo(() => {
    const list = tasks.filter((task) => {
      if (task.completed) return false;
      const state = getTaskTemporalState(task);
      if (state === "overdue" || state === "pastScheduled") return false;
      if (normalizeTaskTimeType(task) !== "deadline") return false;
      const date = getTaskDeadlineDate(task) || getTaskEffectiveDate(task);
      return date === todayStr || date === tomorrowStr;
    });
    return sortByDateAndTime(applyGeneralFilters(list));
  }, [tasks, todayStr, tomorrowStr, applyGeneralFilters]);

  const overdueGroups = useMemo(() => groupByDate(overdueTasks), [overdueTasks]);
  const upcomingGroups = useMemo(() => groupByDate(upcomingTasks), [upcomingTasks]);

  // 4. Tất cả công việc (All tasks)
  const allTasks = useMemo(() => {
    return applyGeneralFilters(tasks);
  }, [tasks, applyGeneralFilters]);

  const junkTasks = useMemo(() => {
    return tasks.filter((t) => !t.completed && isLikelyJunkTask(t));
  }, [tasks]);

  // Bulk Actions
  const bulkComplete = useCallback(
    (targetTasks: TaskDto[]) => {
      targetTasks.filter((t) => !t.completed).forEach((t) => toggleTask(t.id));
    },
    [toggleTask]
  );

  const bulkDelete = useCallback(
    (targetTasks: TaskDto[]) => {
      targetTasks.forEach((t) => deleteTask(t.id));
    },
    [deleteTask]
  );

  const bulkReschedule = useCallback(
    (targetTasks: TaskDto[], newDateStr: string) => {
      targetTasks.forEach((t) => {
        updateTask(t.id, {
          dueDate: newDateStr,
          startDate: newDateStr,
        });
      });
    },
    [updateTask]
  );

  const filters: TaskScreenFilterState = {
    searchQuery,
    filterType,
    selectedPriority,
    selectedTag,
    selectedListTags: activeTaskListTags,
    selectedNotebook,
    hideCompleted: hideCompletedTasks,
  };

  return {
    tasks,
    todayTasks,
    activeScheduledTasks,
    activeTaskListItems,
    completedTodayTasks,
    overdueTasks,
    upcomingTasks,
    overdueGroups,
    upcomingGroups,
    allTasks,
    junkTasks,
    tags,

    todayProgress,
    overdueCount: overdueTasks.length,
    upcomingCount: upcomingTasks.length,
    activeCount: rawTodayTasks.filter((t) => !t.completed).length,

    activeTaskSubTab,
    filters,

    actions: {
      setActiveTaskSubTab,
      setSearchQuery,
      setFilterType,
      setSelectedPriority,
      setSelectedTag: (tag) => {
        setActiveTaskListTags([]);
        setSelectedTag(tag);
      },
      setSelectedNotebook,
      resetFilters,
      toggleTask,
      deleteTask,
      moveTaskToTomorrow,
      openTaskDetail,
      openQuickAdd: openQuickTaskModal,
      bulkComplete,
      bulkDelete,
      bulkReschedule,
    },
  };
};
