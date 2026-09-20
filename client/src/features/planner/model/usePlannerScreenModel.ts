import { useState, useMemo, useCallback, useEffect } from "react";
import { useAppStore } from "../../../stores/appStore";
import { TaskDto } from "../../../types";
import { getLocalTodayStr } from "../../../utils/date";
import {
  isTaskForSpecificDate,
  isTaskOccurringOnDate,
  normalizeTaskTimeType,
  getTaskItemType,
  getTaskTemporalState,
  getTaskTags,
} from "../../../utils/taskSemantics";
import { getTaskProgress } from "../../../utils/taskHierarchy";
import {
  PlannerScreenModel,
  PlannerViewMode,
  PlannerDayInfo,
  PlannerTaskSummary,
} from "./types";

const DAY_NAMES = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"];
const SHORT_DAY_NAMES = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export interface UsePlannerScreenModelOptions {
  targetDateStr?: string;
  targetTaskId?: string;
  fromTab?: "deadlines" | "overview";
  onBackToDeadlines?: () => void;
  onClearTarget?: () => void;
}

export const usePlannerScreenModel = (
  options?: UsePlannerScreenModelOptions
): PlannerScreenModel => {
  const {
    tasks,
    toggleTask,
    deleteTask,
    updateTask,
    moveTaskToNextDay,
    selectedPlannerDate,
    setSelectedPlannerDate,
    openTaskDetail,
    openQuickTaskModal,
    hideCompletedTasks,
  } = useAppStore();

  const todayStr = getLocalTodayStr(new Date());
  const [todayYear, todayMonth, todayDay] = todayStr.split("-").map(Number);
  const todayDate = useMemo(() => new Date(todayYear, todayMonth - 1, todayDay), [todayYear, todayMonth, todayDay]);

  const [viewMode, setViewMode] = useState<PlannerViewMode>("agenda");
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const currentDayStr = options?.targetDateStr || selectedPlannerDate || todayStr;
  const currentDate = useMemo(() => {
    const [y, m, d] = currentDayStr.split("-").map(Number);
    return new Date(y, m - 1, d);
  }, [currentDayStr]);

  // Sync target date
  useEffect(() => {
    if (options?.targetDateStr) {
      setSelectedPlannerDate(options.targetDateStr);
    }
  }, [options?.targetDateStr, setSelectedPlannerDate]);

  const selectDay = useCallback(
    (dateStr: string) => {
      setSelectedPlannerDate(dateStr);
    },
    [setSelectedPlannerDate]
  );

  const nextWeek = useCallback(() => setWeekOffset((prev) => prev + 1), []);
  const prevWeek = useCallback(() => setWeekOffset((prev) => prev - 1), []);
  const goToToday = useCallback(() => {
    setWeekOffset(0);
    setMonthOffset(0);
    setSelectedPlannerDate(todayStr);
  }, [todayStr, setSelectedPlannerDate]);

  const nextMonth = useCallback(() => setMonthOffset((prev) => prev + 1), []);
  const prevMonth = useCallback(() => setMonthOffset((prev) => prev - 1), []);

  // Helper: Lấy các task cho một ngày cụ thể
  const getTasksForDate = useCallback(
    (dateStr: string): TaskDto[] => {
      return tasks.filter(
        (t) => isTaskForSpecificDate(t, dateStr) || isTaskOccurringOnDate(t, dateStr)
      );
    },
    [tasks]
  );

  // Helper: Tính tóm tắt task cho một ngày
  const getTaskSummaryForDate = useCallback(
    (dateStr: string): PlannerTaskSummary => {
      const dayTasks = getTasksForDate(dateStr);
      return dayTasks.reduce(
        (summary, task) => {
          const normalizedTimeType = normalizeTaskTimeType(task);
          const isScheduled = normalizedTimeType === "scheduled";
          const isDeadline = normalizedTimeType === "deadline";
          const temporalState = getTaskTemporalState(task);

          summary.total += 1;
          if (task.completed) summary.completed += 1;
          else summary.active += 1;

          if (isScheduled && !task.completed) summary.scheduled += 1;
          if (!task.completed && isDeadline && temporalState === "overdue")
            summary.overdue += 1;
          if (!task.completed && isScheduled && temporalState === "pastScheduled")
            summary.pastScheduled += 1;
          return summary;
        },
        { total: 0, active: 0, completed: 0, overdue: 0, pastScheduled: 0, scheduled: 0 }
      );
    },
    [getTasksForDate]
  );

  // 1. Tính toán 7 ngày trong tuần
  const { weekDays, weekLabel } = useMemo(() => {
    const monday = new Date(todayDate);
    const dayOfWeek = todayDate.getDay();
    const distToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    monday.setDate(todayDate.getDate() + distToMonday + weekOffset * 7);

    const days: PlannerDayInfo[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dStr = getLocalTodayStr(d);

      const dayAllTasks = tasks.filter(
        (t) => isTaskForSpecificDate(t, dStr) || isTaskOccurringOnDate(t, dStr)
      );
      const scheduledTasks = dayAllTasks.filter(
        (t) => !t.completed && normalizeTaskTimeType(t) === "scheduled" && getTaskItemType(t) !== "event"
      );
      const regularTasks = dayAllTasks.filter(
        (t) => !t.completed && normalizeTaskTimeType(t) !== "scheduled" && getTaskItemType(t) !== "event"
      );
      const completedTasks = dayAllTasks.filter(
        (t) => t.completed && getTaskItemType(t) !== "event"
      );
      const eventTasks = dayAllTasks.filter((t) => getTaskItemType(t) === "event");

      days.push({
        dateStr: dStr,
        date: d,
        dayNum: d.getDate(),
        isToday: dStr === todayStr,
        isSelected: dStr === currentDayStr,
        tasks: dayAllTasks,
        scheduledTasks,
        regularTasks,
        completedTasks,
        eventTasks,
        dayName: DAY_NAMES[i],
        shortDayName: SHORT_DAY_NAMES[i],
      });
    }

    const startD = new Date(monday);
    const endD = new Date(monday);
    endD.setDate(startD.getDate() + 6);
    const label = `${startD.getDate()}/${startD.getMonth() + 1} - ${endD.getDate()}/${endD.getMonth() + 1}`;

    return { weekDays: days, weekLabel: label };
  }, [todayDate, weekOffset, tasks, todayStr, currentDayStr]);

  // 2. Tính toán lịch tháng (Month Days)
  const { monthDays, monthLabel } = useMemo(() => {
    const targetMonthDate = new Date(todayDate.getFullYear(), todayDate.getMonth() + monthOffset, 1);
    const year = targetMonthDate.getFullYear();
    const month = targetMonthDate.getMonth();
    const firstDayIndex = (targetMonthDate.getDay() + 6) % 7; // Monday = 0
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const result = [];

    // Padding ngày trước
    const prevMonthTotalDays = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dNum = prevMonthTotalDays - i;
      const d = new Date(year, month - 1, dNum);
      const dStr = getLocalTodayStr(d);
      result.push({
        dateStr: dStr,
        dayNum: dNum,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        isSelected: dStr === currentDayStr,
        taskCount: tasks.filter((t) => isTaskForSpecificDate(t, dStr) || isTaskOccurringOnDate(t, dStr)).length,
        tasks: tasks.filter((t) => isTaskForSpecificDate(t, dStr) || isTaskOccurringOnDate(t, dStr)),
      });
    }

    // Ngày trong tháng
    for (let dNum = 1; dNum <= totalDaysInMonth; dNum++) {
      const d = new Date(year, month, dNum);
      const dStr = getLocalTodayStr(d);
      result.push({
        dateStr: dStr,
        dayNum: dNum,
        isCurrentMonth: true,
        isToday: dStr === todayStr,
        isSelected: dStr === currentDayStr,
        taskCount: tasks.filter((t) => isTaskForSpecificDate(t, dStr) || isTaskOccurringOnDate(t, dStr)).length,
        tasks: tasks.filter((t) => isTaskForSpecificDate(t, dStr) || isTaskOccurringOnDate(t, dStr)),
      });
    }

    // Padding ngày sau (đủ 35 hoặc 42 ô)
    const totalSlots = result.length <= 35 ? 35 : 42;
    const remaining = totalSlots - result.length;
    for (let dNum = 1; dNum <= remaining; dNum++) {
      const d = new Date(year, month + 1, dNum);
      const dStr = getLocalTodayStr(d);
      result.push({
        dateStr: dStr,
        dayNum: dNum,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        isSelected: dStr === currentDayStr,
        taskCount: tasks.filter((t) => isTaskForSpecificDate(t, dStr) || isTaskOccurringOnDate(t, dStr)).length,
        tasks: tasks.filter((t) => isTaskForSpecificDate(t, dStr) || isTaskOccurringOnDate(t, dStr)),
      });
    }

    return {
      monthDays: result,
      monthLabel: `Tháng ${month + 1}, ${year}`,
    };
  }, [todayDate, monthOffset, tasks, todayStr, currentDayStr]);

  // 3. Phân tách task cho ngày đang chọn (Selected Day)
  const rawDayTasks = useMemo(() => {
    return tasks.filter((t) => isTaskForSpecificDate(t, currentDayStr) || isTaskOccurringOnDate(t, currentDayStr));
  }, [tasks, currentDayStr]);

  const filteredDayTasks = useMemo(() => {
    if (!searchQuery.trim()) return rawDayTasks;
    const q = searchQuery.toLowerCase().trim();
    return rawDayTasks.filter((t) => {
      const mTitle = t.title.toLowerCase().includes(q);
      const mDesc = t.description?.toLowerCase().includes(q);
      const mTag = getTaskTags(t).some((tag) => tag.toLowerCase().includes(q));
      return mTitle || mDesc || mTag;
    });
  }, [rawDayTasks, searchQuery]);

  const dayScheduledTasks = useMemo(() => {
    return filteredDayTasks.filter(
      (t) => !t.completed && normalizeTaskTimeType(t) === "scheduled" && getTaskItemType(t) !== "event"
    );
  }, [filteredDayTasks]);

  const dayRegularTasks = useMemo(() => {
    return filteredDayTasks.filter(
      (t) => !t.completed && normalizeTaskTimeType(t) !== "scheduled" && getTaskItemType(t) !== "event"
    );
  }, [filteredDayTasks]);

  const dayCompletedTasks = useMemo(() => {
    return filteredDayTasks.filter(
      (t) => t.completed && getTaskItemType(t) !== "event"
    );
  }, [filteredDayTasks]);

  const dayEventTasks = useMemo(() => {
    return filteredDayTasks.filter((t) => getTaskItemType(t) === "event");
  }, [filteredDayTasks]);

  const dayProgress = useMemo(() => {
    const actionable = rawDayTasks.filter((t) => getTaskItemType(t) !== "event");
    const { completed, total } = getTaskProgress(actionable);
    return {
      completed,
      total,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [rawDayTasks]);

  return {
    currentDayStr,
    currentDate,
    todayStr,
    todayDate,
    tasks,
    hideCompletedTasks,
    weekOffset,
    monthOffset,
    weekLabel,
    monthLabel,
    weekDays,
    monthDays,

    dayTasks: filteredDayTasks,
    dayScheduledTasks,
    dayRegularTasks,
    dayCompletedTasks,
    dayEventTasks,
    dayProgress,

    viewMode,
    searchQuery,
    isOverdueBackVisible: options?.fromTab === "deadlines",

    getTasksForDate,
    getTaskSummaryForDate,

    actions: {
      selectDay,
      nextWeek,
      prevWeek,
      goToToday,
      nextMonth,
      prevMonth,
      setViewMode,
      setSearchQuery,
      toggleTask,
      deleteTask,
      updateTask,
      moveTaskToNextDay,
      openTaskDetail,
      openQuickTaskModal,
    },
  };
};
