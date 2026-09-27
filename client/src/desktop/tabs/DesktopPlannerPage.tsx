import React, { useCallback, useEffect, useMemo, useState } from "react";
import { TaskDto, TaskItemType } from "../../types";
import { useAppStore } from "../../stores/appStore";
import {
  getTaskItemType,
  getTaskTags,
  getTaskTemporalState,
  normalizeTaskTimeType,
} from "../../utils";
import {
  DesktopPlannerHeader,
  DesktopPlannerSurface,
  PlannerViewMode,
} from "../components/planner/DesktopPlannerHeader";
import { DesktopPlannerCalendar } from "../components/planner/DesktopPlannerCalendar";
import { DesktopPlannerListView } from "../components/planner/DesktopPlannerListView";
import { DesktopPlannerYearView } from "../components/planner/DesktopPlannerYearView";
import { PlannerWeekView } from "../../components/shared/planner/PlannerWeekView";
import { PlannerTaskPreviewPopover } from "../../components/shared/planner/PlannerTaskPreviewPopover";
import {
  PlannerScreenModel,
  usePlannerScreenModel,
} from "../../features/planner/model/createPlannerScreenModel";

const WEEKDAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
type DesktopPlannerScope = TaskItemType | "all";

export interface DesktopPlannerPageProps {
  model?: PlannerScreenModel;
  targetDateStr?: string;
  targetTaskId?: string;
  onClearTarget?: () => void;
  desktopSurface?: DesktopPlannerSurface;
  /** `all` is the Desktop activity calendar: events and tasks share one time grid. */
  workspaceKind?: DesktopPlannerScope;
}

const createDateString = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const createPlannerDay = (date: Date, todayStr: string) => {
  const dateStr = createDateString(date);
  return {
    dateStr,
    dayName: WEEKDAY_LABELS[(date.getDay() + 6) % 7],
    dayNum: date.getDate(),
    isToday: dateStr === todayStr,
  };
};

export const DesktopPlannerPage: React.FC<DesktopPlannerPageProps> = ({
  model: propModel,
  targetDateStr,
  targetTaskId,
  onClearTarget,
  desktopSurface: controlledDesktopSurface,
  workspaceKind = "task",
}) => {
  const defaultModel = usePlannerScreenModel({ targetDateStr, targetTaskId, onClearTarget });
  const model = propModel || defaultModel;
  const { toggleTask, deleteTask, updateTask, openTaskDetail } = model.actions;
  const { activeTaskListTags } = useAppStore();

  const desktopSurface: DesktopPlannerSurface = controlledDesktopSurface || "calendar";
  // Desktop needs the weekly grid first; a selected day still enters the day view explicitly.
  const [viewMode, setViewMode] = useState<PlannerViewMode>("agenda");
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [dayOffset, setDayOffset] = useState(0);
  const [yearOffset, setYearOffset] = useState(0);
  const [selectedDateStr, setSelectedDateStr] = useState(model.todayStr);
  const [previewTaskState, setPreviewTaskState] = useState<{
    task: TaskDto;
    anchorRect?: DOMRect | null;
  } | null>(null);

  // Preview stores placement only; task content always comes from the live model
  // so toggling completion from the card or popup updates both surfaces at once.
  const previewTask = previewTaskState
    ? model.tasks.find((task) => task.id === previewTaskState.task.id) ?? previewTaskState.task
    : null;

  const isVisibleItem = useCallback(
    (task: TaskDto) => {
      if (workspaceKind === "all") return true;
      if (getTaskItemType(task) !== workspaceKind) return false;
      if (workspaceKind !== "task" || activeTaskListTags.length === 0) return true;
      return getTaskTags(task).some((tag) => activeTaskListTags.includes(tag));
    },
    [workspaceKind, activeTaskListTags],
  );

  // === PHẦN 1: Một nguồn lọc cho lịch hoạt động, Event và Task ===
  const getVisibleTasksForDate = useCallback(
    (dateStr: string) => model.getTasksForDate(dateStr).filter(isVisibleItem),
    [model, isVisibleItem],
  );

  const getVisibleTaskSummaryForDate = useCallback(
    (dateStr: string) => {
      const dayTasks = getVisibleTasksForDate(dateStr);
      const completed = dayTasks.filter((task) => task.completed).length;
      const scheduled = dayTasks.filter(
        (task) => normalizeTaskTimeType(task) === "scheduled",
      ).length;
      const overdue = dayTasks.filter(
        (task) => getTaskTemporalState(task) === "overdue",
      ).length;
      const pastScheduled = dayTasks.filter(
        (task) => getTaskTemporalState(task) === "pastScheduled",
      ).length;

      return {
        total: dayTasks.length,
        completed,
        active: dayTasks.length - completed,
        overdue,
        pastScheduled,
        scheduled,
      };
    },
    [getVisibleTasksForDate],
  );

  // === PHẦN 2: Tạo dữ liệu tuần và tháng theo workspace hiện tại ===
  const { weekDays, weekLabel } = useMemo(() => {
    const monday = new Date(model.todayDate);
    const dayOfWeek = monday.getDay();
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    monday.setDate(monday.getDate() + distanceToMonday + weekOffset * 7);

    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return createPlannerDay(date, model.todayStr);
    });

    const end = new Date(monday);
    end.setDate(monday.getDate() + 6);
    return {
      weekDays: days,
      weekLabel: `${monday.getDate()}/${monday.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}`,
    };
  }, [model.todayDate, model.todayStr, weekOffset]);

  const { monthLabel, matrix: monthMatrix } = useMemo(() => {
    const target = new Date(
      model.todayDate.getFullYear(),
      model.todayDate.getMonth() + monthOffset,
      1,
    );
    const year = target.getFullYear();
    const month = target.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstWeekday = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const matrix: Array<{ dayNum: number; dateStr: string; isCurrentMonth: boolean }> = [];

    for (let index = firstWeekday - 1; index >= 0; index -= 1) {
      const date = new Date(year, month, -index);
      matrix.push({ dayNum: date.getDate(), dateStr: createDateString(date), isCurrentMonth: false });
    }
    for (let dayNum = 1; dayNum <= lastDay.getDate(); dayNum += 1) {
      const date = new Date(year, month, dayNum);
      matrix.push({ dayNum, dateStr: createDateString(date), isCurrentMonth: true });
    }
    const totalSlots = matrix.length <= 35 ? 35 : 42;
    for (let dayNum = 1; matrix.length < totalSlots; dayNum += 1) {
      const date = new Date(year, month + 1, dayNum);
      matrix.push({ dayNum, dateStr: createDateString(date), isCurrentMonth: false });
    }

    return { monthLabel: `Tháng ${month + 1}, ${year}`, matrix };
  }, [model.todayDate, monthOffset]);

  const dayInfo = useMemo(() => {
    const date = new Date(model.todayDate);
    date.setDate(date.getDate() + dayOffset);
    return {
      ...createPlannerDay(date, model.todayStr),
      label: `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`,
    };
  }, [model.todayDate, model.todayStr, dayOffset]);

  const yearLabel = `Năm ${model.todayDate.getFullYear() + yearOffset}`;

  const currentTitleLabel =
    viewMode === "agenda"
      ? weekLabel
      : viewMode === "day"
        ? dayInfo.label
        : viewMode === "year"
          ? yearLabel
          : monthLabel;

  // The activity stream shares the same range selector as the calendar instead
  // of silently staying on a week when the header says month or year.
  const streamDays = useMemo(() => {
    if (viewMode === "day") return [dayInfo];
    if (viewMode === "agenda") return weekDays;
    if (viewMode === "month") {
      return monthMatrix
        .filter((item) => item.isCurrentMonth)
        .map((item) => {
          const [year, month, day] = item.dateStr.split("-").map(Number);
          return createPlannerDay(new Date(year, month - 1, day), model.todayStr);
        });
    }

    const targetYear = model.todayDate.getFullYear() + yearOffset;
    const totalDays = new Date(targetYear, 2, 0).getDate() === 29 ? 366 : 365;
    return Array.from({ length: totalDays }, (_, index) => {
      const date = new Date(targetYear, 0, index + 1);
      return createPlannerDay(date, model.todayStr);
    });
  }, [viewMode, dayInfo, weekDays, monthMatrix, model.todayDate, model.todayStr, yearOffset]);

  // === PHẦN 3: Điều hướng lịch, không còn màn hình chi tiết ngày ===
  const handleSelectDate = (dateStr: string) => {
    setSelectedDateStr(dateStr);
  };

  // A date cell in month/year is an entry point to its detailed hourly view.
  const handleOpenDayView = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    const targetDate = new Date(year, month - 1, day);
    const offset = Math.round(
      (targetDate.getTime() - model.todayDate.getTime()) / (24 * 60 * 60 * 1000),
    );
    setSelectedDateStr(dateStr);
    setDayOffset(offset);
    setViewMode("day");
  };

  const handleResetToCurrent = () => {
    if (viewMode === "agenda") {
      setWeekOffset(0);
    } else if (viewMode === "day") {
      setDayOffset(0);
    } else if (viewMode === "year") {
      setYearOffset(0);
    } else {
      setMonthOffset(0);
    }
    setSelectedDateStr(model.todayStr);
  };

  const handlePrev = () => {
    if (viewMode === "agenda") {
      setWeekOffset((current) => current - 1);
    } else if (viewMode === "day") {
      setDayOffset((current) => current - 1);
    } else if (viewMode === "year") {
      setYearOffset((current) => current - 1);
    } else {
      setMonthOffset((current) => current - 1);
    }
  };

  const handleNext = () => {
    if (viewMode === "agenda") {
      setWeekOffset((current) => current + 1);
    } else if (viewMode === "day") {
      setDayOffset((current) => current + 1);
    } else if (viewMode === "year") {
      setYearOffset((current) => current + 1);
    } else {
      setMonthOffset((current) => current + 1);
    }
  };

  useEffect(() => {
    if (targetDateStr) setSelectedDateStr(targetDateStr);
    if (targetTaskId) openTaskDetail(targetTaskId);
    if (targetDateStr || targetTaskId) onClearTarget?.();
  }, [targetDateStr, targetTaskId, openTaskDetail, onClearTarget]);

  const handleOpenTaskPreview = (task: TaskDto, anchorRect?: DOMRect | null) => {
    setPreviewTaskState({ task, anchorRect });
  };

  const itemLabel = workspaceKind === "all" ? "hoạt động" : workspaceKind === "event" ? "sự kiện" : "việc";
  // The hybrid activity calendar creates Events from an empty time cell. Tasks
  // remain creatable in their dedicated tag workspace, keeping creation intent clear.
  const calendarItemType: TaskItemType = workspaceKind === "all" ? "event" : workspaceKind;

  return (
    <div className="flex h-full min-h-0 w-full flex-col select-none animate-in fade-in duration-150">
      <DesktopPlannerHeader
        viewMode={viewMode}
        surface={desktopSurface}
        onViewModeChange={setViewMode}
        titleLabel={currentTitleLabel}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleResetToCurrent}
      />

      {desktopSurface === "list" ? (
        <DesktopPlannerListView
          weekDays={streamDays}
          period={viewMode === "agenda" ? "week" : viewMode}
          getTasksForDate={getVisibleTasksForDate}
          onToggleTask={toggleTask}
          onOpenTask={(task) => openTaskDetail(task.id)}
          itemScope={workspaceKind}
        />
      ) : viewMode === "agenda" || viewMode === "day" ? (
        <PlannerWeekView
          weekDays={viewMode === "day" ? [dayInfo] : weekDays}
          selectedDateStr={selectedDateStr}
          previewedTaskId={previewTask?.id}
          getTasksForDate={getVisibleTasksForDate}
          onSelectDate={handleSelectDate}
          onOpenDay={handleOpenDayView}
          onToggleTask={toggleTask}
          onDeleteTask={deleteTask}
          onUpdateTask={updateTask}
          onPreviewTask={handleOpenTaskPreview}
          calendarItemType={calendarItemType}
        />
      ) : viewMode === "year" ? (
        <DesktopPlannerYearView
          year={model.todayDate.getFullYear() + yearOffset}
          todayStr={model.todayStr}
          selectedDateStr={selectedDateStr}
          getTasksForDate={getVisibleTasksForDate}
          onSelectDate={handleOpenDayView}
        />
      ) : (
        <DesktopPlannerCalendar
          selectedDateStr={selectedDateStr}
          onSelectDate={handleOpenDayView}
          todayStr={model.todayStr}
          monthMatrix={monthMatrix}
          getTasksForDate={getVisibleTasksForDate}
          getTaskSummaryForDate={getVisibleTaskSummaryForDate}
          onPreviewTask={handleOpenTaskPreview}
          onToggleTask={toggleTask}
          itemLabel={itemLabel}
        />
      )}

      {previewTaskState && previewTask && (
        <PlannerTaskPreviewPopover
          task={previewTask}
          anchorRect={previewTaskState.anchorRect}
          onClose={() => setPreviewTaskState(null)}
          onEdit={(task) => {
            setPreviewTaskState(null);
            openTaskDetail(task.id);
          }}
          onDelete={deleteTask}
          onToggleComplete={toggleTask}
        />
      )}
    </div>
  );
};
