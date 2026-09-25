import React, { useState, useMemo, useEffect } from "react";
import { TaskDto } from "../../types";
import {
  normalizeTaskTimeType,
  getTaskTags,
} from "../../utils";
import {
  PlannerHeader,
  PlannerViewMode,
} from "../../components/shared/planner/PlannerHeader";
import { PlannerCalendar } from "../../components/shared/planner/PlannerCalendar";
import { PlannerWeekView } from "../../components/shared/planner/PlannerWeekView";
import { PlannerTaskPreviewPopover } from "../../components/shared/planner/PlannerTaskPreviewPopover";
import { TodayScheduleNotes } from "../../components/shared/today/TodayScheduleNotes";
import { TaskList } from "../../components/shared/common/TaskList";
import { FilterBar } from "../../components/shared/common/FilterBar";
import { registerBackHandler } from "../../utils/backNavigation";
import {
  PlannerScreenModel,
  usePlannerScreenModel,
} from "../../features/planner/model/createPlannerScreenModel";
import {
  ArrowLeft,
  ListTodo,
  Lock,
  Search,
  X,
} from "lucide-react";

const DAY_NAMES = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"];

const shiftDateKey = (dateStr: string, offset: number) => {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

export interface TabletPlannerPageProps {
  model?: PlannerScreenModel;
  targetDateStr?: string;
  targetTaskId?: string;
  fromTab?: "deadlines" | "overview";
  onBackToDeadlines?: () => void;
  onClearTarget?: () => void;
}

export const TabletPlannerPage: React.FC<TabletPlannerPageProps> = ({
  model: propModel,
  targetDateStr,
  targetTaskId,
  fromTab,
  onBackToDeadlines,
  onClearTarget,
}) => {
  const defaultModel = usePlannerScreenModel({
    targetDateStr,
    targetTaskId,
    fromTab,
    onBackToDeadlines,
    onClearTarget,
  });
  const model = propModel || defaultModel;

  const { tasks, hideCompletedTasks } = model;
  const {
    toggleTask,
    deleteTask,
    updateTask,
    moveTaskToNextDay,
    openTaskDetail,
    selectDay,
  } = model.actions;

  const [viewMode, setViewMode] = useState<PlannerViewMode>("day");
  const [plannerScreen, setPlannerScreen] = useState<"overview" | "day">("overview");
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [monthOffset, setMonthOffset] = useState<number>(0);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(model.currentDayStr);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed">("all");
  const [timeTypeFilter, setTimeTypeFilter] = useState<"all" | "scheduled" | "deadline">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const [previewTaskState, setPreviewTaskState] = useState<{
    task: TaskDto;
    anchorRect?: DOMRect | null;
  } | null>(null);

  const handleOpenTaskPreview = (task: TaskDto, anchorRect?: DOMRect | null) => {
    setPreviewTaskState({ task, anchorRect });
  };

  const handleCloseTaskPreview = () => {
    setPreviewTaskState(null);
  };

  const handleEditFromPreview = (task: TaskDto) => {
    setPreviewTaskState(null);
    openTaskDetail(task.id);
  };

  useEffect(() => {
    selectDay(selectedDateStr);
  }, [selectedDateStr, selectDay]);

  useEffect(() => {
    if (!targetDateStr && !targetTaskId) return;
    if (targetDateStr) {
      setSelectedDateStr(targetDateStr);
      setViewMode("day");
      setPlannerScreen("overview");
    } else {
      setPlannerScreen("overview");
      if (targetTaskId) openTaskDetail(targetTaskId);
    }
    onClearTarget?.();
  }, [targetDateStr, targetTaskId, openTaskDetail, onClearTarget]);

  useEffect(() => {
    if (plannerScreen !== "day") return;
    return registerBackHandler(() => {
      if (fromTab === "deadlines" && onBackToDeadlines) {
        onBackToDeadlines();
      } else {
        setPlannerScreen("overview");
      }
      return true;
    });
  }, [fromTab, onBackToDeadlines, plannerScreen]);

  const { weekDays, weekLabel } = useMemo(() => {
    const monday = new Date(model.todayDate);
    const dayOfWeek = model.todayDate.getDay();
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    monday.setDate(model.todayDate.getDate() + distanceToMonday + weekOffset * 7);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      days.push({
        dateStr: dStr,
        dayName: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"][i],
        dayNum: d.getDate(),
        isToday: dStr === model.todayStr,
      });
    }
    const startD = new Date(monday);
    const endD = new Date(monday);
    endD.setDate(startD.getDate() + 6);
    const label = `${startD.getDate()}/${startD.getMonth() + 1} - ${endD.getDate()}/${endD.getMonth() + 1}`;
    return { weekDays: days, weekLabel: label };
  }, [model.todayDate, model.todayStr, weekOffset]);

  const { monthLabel, matrix: monthMatrix } = useMemo(() => {
    const targetDate = new Date(
      model.todayDate.getFullYear(),
      model.todayDate.getMonth() + monthOffset,
      1
    );
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startDayOfWeek = firstDay.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    const totalDays = lastDay.getDate();
    const matrix = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const d = new Date(year, month - 1, dayNum);
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      matrix.push({ dayNum, dateStr: dStr, isCurrentMonth: false });
    }

    for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
      const d = new Date(year, month, dayNum);
      const dStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      matrix.push({ dayNum, dateStr: dStr, isCurrentMonth: true });
    }

    const totalSlots = matrix.length <= 35 ? 35 : 42;
    const remaining = totalSlots - matrix.length;
    for (let dayNum = 1; dayNum <= remaining; dayNum++) {
      const d = new Date(year, month + 1, dayNum);
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      matrix.push({ dayNum, dateStr: dStr, isCurrentMonth: false });
    }

    return {
      monthLabel: `Tháng ${month + 1}, ${year}`,
      matrix,
    };
  }, [model.todayDate, monthOffset]);

  const getDayCompactTitle = () => {
    const parts = selectedDateStr.split("-");
    return parts.length === 3 ? `${Number(parts[2])}/${Number(parts[1])}` : selectedDateStr;
  };

  const currentTitleLabel = viewMode === "day"
    ? getDayCompactTitle()
    : viewMode === "agenda"
      ? weekLabel
      : monthLabel;

  const handlePrev = () => {
    if (viewMode === "day") setSelectedDateStr((dateStr) => shiftDateKey(dateStr, -1));
    else if (viewMode === "agenda") setWeekOffset((prev) => prev - 1);
    else setMonthOffset((prev) => prev - 1);
  };

  const handleNext = () => {
    if (viewMode === "day") setSelectedDateStr((dateStr) => shiftDateKey(dateStr, 1));
    else if (viewMode === "agenda") setWeekOffset((prev) => prev + 1);
    else setMonthOffset((prev) => prev + 1);
  };

  const handleResetToCurrent = () => {
    if (viewMode === "day") setSelectedDateStr(model.todayStr);
    else if (viewMode === "agenda") setWeekOffset(0);
    else setMonthOffset(0);
  };

  const handleSelectDate = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    setViewMode("day");
    setPlannerScreen("overview");
  };

  const selectedDayTasks = useMemo(() => {
    return model.getTasksForDate(selectedDateStr);
  }, [model, selectedDateStr]);

  const filteredTasks = useMemo(() => {
    return selectedDayTasks.filter((task) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesTag = getTaskTags(task).some((t) => t.toLowerCase().includes(q));
        const matchesNote = task.description?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesTag && !matchesNote) return false;
      }

      if (hideCompletedTasks && statusFilter === "all" && task.completed)
        return false;

      const matchStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
          ? !task.completed
          : task.completed;

      const normalizedTimeType = normalizeTaskTimeType(task);
      const isScheduled = normalizedTimeType === "scheduled";
      const isDeadline = normalizedTimeType === "deadline";

      const matchTimeType =
        timeTypeFilter === "all"
          ? true
          : timeTypeFilter === "scheduled"
          ? isScheduled
          : isDeadline;

      const matchPriority =
        priorityFilter === "all"
          ? true
          : (task.priority || "medium") === priorityFilter;

      const matchTag =
        tagFilter === "all"
          ? true
          : tagFilter === "none"
          ? getTaskTags(task).length === 0
          : getTaskTags(task).includes(tagFilter);

      return matchStatus && matchTimeType && matchPriority && matchTag;
    });
  }, [
    selectedDayTasks,
    searchQuery,
    hideCompletedTasks,
    statusFilter,
    timeTypeFilter,
    priorityFilter,
    tagFilter,
  ]);

  const getDayFormattedTitle = () => {
    const parts = selectedDateStr.split("-");
    if (parts.length === 3) {
      const d = new Date(
        parseInt(parts[0], 10),
        parseInt(parts[1], 10) - 1,
        parseInt(parts[2], 10)
      );
      const dayOfWeekIndex = d.getDay() === 0 ? 6 : d.getDay() - 1;
      const dayName = DAY_NAMES[dayOfWeekIndex] || "Ngày";
      return `${dayName}, ${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return selectedDateStr;
  };

  const activeAdvancedFilterCount =
    (timeTypeFilter !== "all" ? 1 : 0) +
    (priorityFilter !== "all" ? 1 : 0) +
    (tagFilter !== "all" ? 1 : 0);

  const isPastDate = selectedDateStr < model.todayStr;
  return (
    <div className="w-full min-w-0 select-none space-y-4 pb-16 animate-in fade-in duration-150">
      {/* 1. MÀN HÌNH TỔNG QUAN */}
      {plannerScreen === "overview" && (
        <div className="space-y-3">
          <PlannerHeader
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            titleLabel={currentTitleLabel}
            onPrev={handlePrev}
            onNext={handleNext}
            onToday={handleResetToCurrent}
          />

          {viewMode === "agenda" && (
            <PlannerWeekView
              weekDays={weekDays}
              selectedDateStr={selectedDateStr}
              getTasksForDate={model.getTasksForDate}
              onSelectDate={handleSelectDate}
              onToggleTask={toggleTask}
              onDeleteTask={deleteTask}
              onUpdateTask={updateTask}
              onPreviewTask={handleOpenTaskPreview}
            />
          )}

          {viewMode === "day" && (
            <TaskList
              tasks={filteredTasks}
              emptyMessage="Chưa có công việc trong ngày này"
              emptySubMessage="Chưa có công việc."
              emptyActionText="+ Thêm việc vào ngày này"
              onEmptyAction={() => openTaskDetail("new")}
              onToggle={toggleTask}
              onEdit={(task) => openTaskDetail(task.id)}
              onDelete={deleteTask}
              onMoveTomorrow={moveTaskToNextDay}
              onClick={(task) => openTaskDetail(task.id)}
              variant="planner"
              hideDate={true}
              baseDateStr={selectedDateStr}
              activeTaskId={targetTaskId}
              showQuickAdd={false}
            />
          )}

          {viewMode === "month" && (
            <PlannerCalendar
              selectedDateStr={selectedDateStr}
              onSelectDate={handleSelectDate}
              todayStr={model.todayStr}
              monthMatrix={monthMatrix}
              getTasksForDate={model.getTasksForDate}
              getTaskSummaryForDate={model.getTaskSummaryForDate}
            />
          )}
        </div>
      )}

      {/* 2. MÀN HÌNH CHI TIẾT NGÀY */}
      {plannerScreen === "day" && (
        <div className="space-y-4">
          <div className="pb-2 space-y-1.5 select-none">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (fromTab === "deadlines" && onBackToDeadlines) {
                      onBackToDeadlines();
                    } else {
                      setPlannerScreen("overview");
                    }
                  }}
                  aria-label={fromTab === "deadlines" ? "Quay lại Hạn định" : "Quay lại lịch"}
                  className="mobile-back-button flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3 py-1.5 bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] rounded-2xl shadow-2xs text-xs font-bold text-[#1C1C1E] dark:text-[#F2F2F7] active:scale-95 transition-all cursor-pointer"
                >
                  <ArrowLeft size={13} strokeWidth={2.4} />
                  <span className="hidden sm:inline">
                    {fromTab === "deadlines"
                      ? "Quay lại Hạn định"
                      : `Quay lại ${viewMode === "agenda" ? "Lịch trình" : "Lịch tháng"}`}
                  </span>
                  <span className="sm:hidden">
                    {fromTab === "deadlines" ? "Hạn" : viewMode === "agenda" ? "Lịch" : "Lịch tháng"}
                  </span>
                </button>

                <div className="flex min-w-0 flex-1 items-center gap-1.5">
                  <h2 className="min-w-0 flex-1 truncate whitespace-nowrap font-bold text-sm sm:text-lg text-[#1C1C1E] dark:text-[#F2F2F7]">
                    {getDayFormattedTitle()}
                  </h2>
                  {selectedDateStr === model.todayStr && (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 bg-[#FEF08A] rounded-full text-[#1C1917] shadow-2xs">
                      Hôm nay
                    </span>
                  )}
                  {isPastDate && (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 bg-black/[0.04] dark:bg-white/[0.08] rounded-full text-[#78716C] dark:text-[#A1A1AA] flex items-center gap-1 shadow-2xs">
                      <Lock size={10} strokeWidth={2.4} />
                      <span>Quá khứ</span>
                    </span>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Thanh tìm kiếm */}
          <div className="flex min-w-0 items-center gap-2.5 rounded-2xl border-none bg-white dark:bg-[#1C1C20] px-3.5 shadow-xs">
            <Search size={14} strokeWidth={2.4} className="shrink-0 text-[#78716C] dark:text-[#A1A1AA]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Tìm việc trong ngày này..."
              className="w-full bg-transparent py-2 pl-1 text-xs text-[#1C1917] dark:text-[#ECECF1] placeholder:text-[#A8A29E] dark:placeholder:text-[#71717A] focus:outline-none sm:text-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="shrink-0 text-[#78716C] dark:text-[#A1A1AA] hover:text-[#1C1917] dark:hover:text-[#ECECF1] cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X size={13} strokeWidth={2.4} />
              </button>
            )}
          </div>

          {/* Bộ lọc 2 tầng */}
          <FilterBar
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            timeTypeFilter={timeTypeFilter}
            onTimeTypeChange={setTimeTypeFilter}
            priorityFilter={priorityFilter}
            onPriorityChange={setPriorityFilter}
            tagFilter={tagFilter}
            onTagChange={setTagFilter}
            isDrawerOpen={isFilterDrawerOpen}
            onToggleDrawer={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
            onResetFilters={() => {
              setPriorityFilter("all");
              setTagFilter("all");
              setTimeTypeFilter("all");
            }}
            activeFilterCount={activeAdvancedFilterCount}
          />

          {/* Bố cục danh sách việc */}
          <div className="space-y-4 w-full">
            {(() => {
              const scheduledDayTasks = filteredTasks.filter((t) => {
                const normTime = normalizeTaskTimeType(t);
                return normTime === "scheduled" || (Boolean(t.startTime) && normTime !== "deadline");
              });

              if (scheduledDayTasks.length === 0) return null;

              return (
                <TodayScheduleNotes
                  scheduledTasks={scheduledDayTasks}
                  onToggle={toggleTask}
                  onEdit={(task) => openTaskDetail(task.id)}
                  onDelete={deleteTask}
                  onMoveTomorrow={moveTaskToNextDay}
                  onClick={(task) => openTaskDetail(task.id)}
                  activeTaskId={targetTaskId}
                  title="Lịch hẹn"
                />
              );
            })()}

            {(() => {
              const todoDayTasks = filteredTasks.filter((t) => {
                const normTime = normalizeTaskTimeType(t);
                return !(normTime === "scheduled" || (Boolean(t.startTime) && normTime !== "deadline"));
              });

              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-1">
                    <div className="flex items-center gap-1.5 text-sm font-bold text-[#1C1917]">
                      <ListTodo size={14} className="text-[#57534E]" />
                      <span>Công việc ({todoDayTasks.length})</span>
                    </div>
                  </div>

                  <TaskList
                    tasks={todoDayTasks}
                    emptyMessage="Chưa có công việc trong ngày này"
                    emptySubMessage={isPastDate ? "Không có công việc trong ngày." : "Chưa có công việc."}
                    emptyActionText={isPastDate ? undefined : "+ Thêm việc vào ngày này"}
                    onEmptyAction={isPastDate ? undefined : () => openTaskDetail("new")}
                    onToggle={toggleTask}
                    onEdit={(task) => openTaskDetail(task.id)}
                    onDelete={deleteTask}
                    onMoveTomorrow={moveTaskToNextDay}
                    onClick={(task) => openTaskDetail(task.id)}
                    variant="planner"
                    hideDate={true}
                    baseDateStr={selectedDateStr}
                    activeTaskId={targetTaskId}
                    showQuickAdd={false}
                  />
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Popover xem nhanh */}
      {previewTaskState && (
        <PlannerTaskPreviewPopover
          task={previewTaskState.task}
          anchorRect={previewTaskState.anchorRect}
          onClose={handleCloseTaskPreview}
          onEdit={handleEditFromPreview}
          onDelete={deleteTask}
          onToggleComplete={toggleTask}
        />
      )}
    </div>
  );
};
