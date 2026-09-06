import React, { useState, useMemo } from "react";
import { useAppStore } from "../../../stores/appStore";
import { TaskDto } from "../../../types";
import { getLocalTodayStr, formatShortDayMonth } from "../../../utils/date";
import {
  getTaskEffectiveDate,
  moveTaskToDate,
  getTaskTemporalState,
  normalizeTaskTimeType,
  isTaskUnscheduled,
  isTaskForSpecificDate,
} from "../../../utils/taskSemantics";
import { PlannerHeader, PlannerViewMode } from "./PlannerHeader";
import { PlannerCalendar } from "./PlannerCalendar";
import { PlannerWeekView } from "./PlannerWeekView";
import { PlannerYearView } from "./PlannerYearView";
import { TodayScheduleNotes } from "../today/TodayScheduleNotes";
import { TodayComposerSidebar } from "../today/TodayComposerSidebar";
import { TaskList } from "../shared/TaskList";
import { FilterBar } from "../shared/FilterBar";
import { PlannerBacklog } from "./PlannerBacklog";
import { ArrowLeft, Lock, ListTodo } from "lucide-react";

const DAY_NAMES = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"];
const SHORT_DAY_NAMES = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export interface PlannerTabProps {
  targetDateStr?: string;
  targetTaskId?: string;
  fromTab?: "deadlines" | "overview";
  onBackToDeadlines?: () => void;
  onClearTarget?: () => void;
}

export const PlannerTab: React.FC<PlannerTabProps> = ({
  targetDateStr,
  targetTaskId,
  fromTab,
  onBackToDeadlines,
  onClearTarget,
}) => {
  const {
    tasks,
    updateTask,
    toggleTask,
    deleteTask,
    moveTaskToNextDay,
    hideCompletedTasks,
    setSelectedPlannerDate,
  } = useAppStore();

  const now = new Date();
  const todayStr = getLocalTodayStr(now);

  // Chế độ xem: "week" (Tuần) | "month" (Tháng) | "year" (Năm)
  const [viewMode, setViewMode] = useState<PlannerViewMode>("week");

  // Màn hình hiển thị: "overview" (theo viewMode) | "day" (chi tiết ngày) | "backlog" (hộp chờ)
  const [plannerScreen, setPlannerScreen] = useState<"overview" | "day" | "backlog">("overview");

  // Offsets thời gian
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [monthOffset, setMonthOffset] = useState<number>(0);
  const [yearOffset, setYearOffset] = useState<number>(0);

  // Ngày đang được chọn để xem chi tiết trong DayPlanView
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);

  // Đồng bộ ngày được chọn sang global store cho FAB thông minh
  React.useEffect(() => {
    setSelectedPlannerDate(selectedDateStr);
  }, [selectedDateStr, setSelectedPlannerDate]);

  // Drawer Panel State
  const [activeTask, setActiveTask] = useState<TaskDto | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  // Lắng nghe khi được chuyển từ Tab Hạn định sang
  React.useEffect(() => {
    if (!targetDateStr && !targetTaskId) return;

    if (targetDateStr) {
      setSelectedDateStr(targetDateStr);
      setPlannerScreen("day");
    } else {
      // An undated search result belongs in the backlog, not in today's list.
      setPlannerScreen("backlog");
    }

    if (targetTaskId) {
      const found = tasks.find((t) => t.id === targetTaskId);
      if (found && targetDateStr) {
        setActiveTask(found);
      }
    }
    onClearTarget?.();
  }, [targetDateStr, targetTaskId, tasks, onClearTarget]);

  // Filter state cho DayPlanView
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed">("all");
  const [timeTypeFilter, setTimeTypeFilter] = useState<"all" | "scheduled" | "deadline">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [notebookFilter, setNotebookFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Danh sách các việc chưa sắp lịch (Hộp chờ)
  const unscheduledTasks = useMemo(() => {
    return tasks.filter((t) => !t.completed && isTaskUnscheduled(t));
  }, [tasks]);

  // ==========================================
  // 1. TÍNH TOÁN DỮ LIỆU TUẦN (WEEK VIEW)
  // ==========================================
  const { weekDays, weekLabel } = useMemo(() => {
    const currentMonday = new Date(now);
    const dayOfWeek = currentMonday.getDay();
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    currentMonday.setDate(currentMonday.getDate() + distanceToMonday + weekOffset * 7);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentMonday);
      d.setDate(currentMonday.getDate() + i);
      const dStr = getLocalTodayStr(d);
      days.push({
        dateStr: dStr,
        dayName: SHORT_DAY_NAMES[i],
        dayNum: d.getDate(),
        isToday: dStr === todayStr,
      });
    }

    const startD = new Date(currentMonday);
    const endD = new Date(currentMonday);
    endD.setDate(startD.getDate() + 6);

    const label = `${startD.getDate()}/${startD.getMonth() + 1} - ${endD.getDate()}/${endD.getMonth() + 1}/${endD.getFullYear()}`;

    return {
      weekDays: days,
      weekLabel: `Tuần ${label}`,
    };
  }, [now, weekOffset, todayStr]);

  // ==========================================
  // 2. TÍNH TOÁN DỮ LIỆU THÁNG (MONTH VIEW)
  // ==========================================
  const { monthLabel, matrix: monthMatrix } = useMemo(() => {
    const targetDate = new Date(
      now.getFullYear(),
      now.getMonth() + monthOffset,
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

    // Ngày tháng trước
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const d = new Date(year, month - 1, dayNum);
      matrix.push({
        dayNum,
        dateStr: getLocalTodayStr(d),
        isCurrentMonth: false,
      });
    }

    // Ngày tháng này
    for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
      const d = new Date(year, month, dayNum);
      matrix.push({
        dayNum,
        dateStr: getLocalTodayStr(d),
        isCurrentMonth: true,
      });
    }

    // Ngày tháng sau bù đủ 35 hoặc 42 ô
    const totalSlots = matrix.length <= 35 ? 35 : 42;
    const remaining = totalSlots - matrix.length;
    for (let dayNum = 1; dayNum <= remaining; dayNum++) {
      const d = new Date(year, month + 1, dayNum);
      matrix.push({
        dayNum,
        dateStr: getLocalTodayStr(d),
        isCurrentMonth: false,
      });
    }

    return {
      monthLabel: `Tháng ${month + 1}, ${year}`,
      matrix,
    };
  }, [now, monthOffset]);

  // ==========================================
  // 3. TÍNH TOÁN DỮ LIỆU NĂM (YEAR VIEW)
  // ==========================================
  const currentYear = now.getFullYear() + yearOffset;
  const yearLabel = `Năm ${currentYear}`;

  // Tiêu đề Header phụ thuộc vào viewMode
  const currentTitleLabel =
    viewMode === "week"
      ? weekLabel
      : viewMode === "month"
      ? monthLabel
      : yearLabel;

  // Lấy các task cho một ngày cụ thể
  const getTasksForDate = (dateStr: string): TaskDto[] => {
    return tasks.filter((t) => isTaskForSpecificDate(t, dateStr));
  };

  // Tính tóm tắt task cho một ngày
  const getTaskSummaryForDate = (dateStr: string) => {
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
  };

  const getTaskCountForDate = (dateStr: string) => {
    return getTaskSummaryForDate(dateStr).total;
  };

  // Điều hướng Prev / Next / Today
  const handlePrev = () => {
    if (viewMode === "week") setWeekOffset((prev) => prev - 1);
    else if (viewMode === "month") setMonthOffset((prev) => prev - 1);
    else setYearOffset((prev) => prev - 1);
  };

  const handleNext = () => {
    if (viewMode === "week") setWeekOffset((prev) => prev + 1);
    else if (viewMode === "month") setMonthOffset((prev) => prev + 1);
    else setYearOffset((prev) => prev + 1);
  };

  const handleResetToCurrent = () => {
    if (viewMode === "week") setWeekOffset(0);
    else if (viewMode === "month") setMonthOffset(0);
    else setYearOffset(0);
  };

  // Xử lý khi chọn một ngày
  const handleSelectDate = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    setPlannerScreen("day");
  };

  // Xử lý khi chọn tháng từ Year View
  const handleSelectMonthFromYear = (monthIndex: number) => {
    const targetMonthOffset =
      (currentYear - now.getFullYear()) * 12 + (monthIndex - now.getMonth());
    setMonthOffset(targetMonthOffset);
    setViewMode("month");
  };

  // Danh sách công việc của ngày đang chọn trong DayPlanView
  const selectedDayTasks = useMemo(() => {
    return tasks.filter((t) => {
      const taskDate = getTaskEffectiveDate(t);
      return taskDate === selectedDateStr;
    });
  }, [tasks, selectedDateStr]);

  // Lọc danh sách công việc của ngày
  const filteredTasks = useMemo(() => {
    return selectedDayTasks.filter((task) => {
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

      const matchNotebook =
        notebookFilter === "all"
          ? true
          : notebookFilter === "none"
          ? !task.notebookId
          : task.notebookId === notebookFilter;

      const matchTag =
        tagFilter === "all"
          ? true
          : tagFilter === "none"
          ? !task.tag
          : task.tag === tagFilter;

      return matchStatus && matchTimeType && matchPriority && matchNotebook && matchTag;
    });
  }, [
    selectedDayTasks,
    hideCompletedTasks,
    statusFilter,
    timeTypeFilter,
    priorityFilter,
    notebookFilter,
    tagFilter,
  ]);

  // Format tiêu đề ngày
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
    (notebookFilter !== "all" ? 1 : 0) +
    (tagFilter !== "all" ? 1 : 0);

  // Xếp việc từ backlog vào ngày đang chọn
  const handleScheduleFromBacklog = (taskId: string, targetDateStr: string) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;
    updateTask(taskId, moveTaskToDate(task, targetDateStr));
  };

  return (
    <div className="space-y-4 w-full min-w-0 pb-16 select-none animate-in fade-in duration-150">
      {/* ========================================== */}
      {/* MÀN HÌNH TỔNG QUAN (TUẦN / THÁNG / NĂM) */}
      {/* ========================================== */}
      {plannerScreen === "overview" && (
        <div className="space-y-3 animate-in fade-in duration-150">
          {/* Header Planner Điều Hướng 3 Chế Độ */}
          <PlannerHeader
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            titleLabel={currentTitleLabel}
            onPrev={handlePrev}
            onNext={handleNext}
            onToday={handleResetToCurrent}
            unscheduledCount={unscheduledTasks.length}
            onOpenBacklog={() => setPlannerScreen("backlog")}
          />

          {/* 1. VIEW TUẦN (WEEK VIEW) */}
          {viewMode === "week" && (
            <PlannerWeekView
              weekDays={weekDays}
              todayStr={todayStr}
              getTasksForDate={getTasksForDate}
              onSelectDate={handleSelectDate}
              onSelectTask={(task) => {
                const taskDate = getTaskEffectiveDate(task) || selectedDateStr;
                setSelectedDateStr(taskDate);
                setActiveTask(task);
                setPlannerScreen("day");
              }}
              onToggleTask={toggleTask}
              onQuickAddForDate={(dateStr) => {
                setSelectedDateStr(dateStr);
                setActiveTask(null);
                setPlannerScreen("day");
              }}
            />
          )}

          {/* 2. VIEW THÁNG (MONTH VIEW) */}
          {viewMode === "month" && (
            <PlannerCalendar
              selectedDateStr={selectedDateStr}
              onSelectDate={handleSelectDate}
              todayStr={todayStr}
              monthMatrix={monthMatrix}
              getTaskCountForDate={getTaskCountForDate}
              getTaskSummaryForDate={getTaskSummaryForDate}
            />
          )}

          {/* 3. VIEW NĂM (YEAR VIEW) */}
          {viewMode === "year" && (
            <PlannerYearView
              year={currentYear}
              todayStr={todayStr}
              tasks={tasks}
              onSelectMonth={handleSelectMonthFromYear}
              onSelectDate={handleSelectDate}
            />
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* MÀN HÌNH CHI TIẾT NGÀY (GIỐNG Y HỆT TAB HÔM NAY) */}
      {/* ========================================== */}
      {plannerScreen === "day" && (() => {
        const isPastDate = selectedDateStr < todayStr;
        const completedCount = selectedDayTasks.filter((t) => t.completed).length;
        const totalCount = selectedDayTasks.length;
        const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

        return (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* 1. Header Quay Lại & Tên Ngày & Tiến Độ Đồng Bộ TodayHeader */}
            <div className="pb-2 border-b border-[#262626] space-y-1.5 animate-in fade-in duration-150 select-none">
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
                    className="flex shrink-0 items-center gap-1.5 whitespace-nowrap px-2.5 py-1 bg-[#FAF8F3] hover:bg-[#F3EFE6] border-[1.5px] border-[#262626] rounded-[5px] shadow-[1.5px_1.5px_0px_#262626] text-xs font-bold text-[#1C1917] active:translate-x-[0.5px] active:translate-y-[0.5px] transition-all"
                  >
                    <ArrowLeft size={13} strokeWidth={2.4} />
                    <span className="hidden sm:inline">
                      {fromTab === "deadlines"
                        ? "Quay lại Hạn định"
                        : `Quay lại ${viewMode === "week" ? "Tuần" : viewMode === "year" ? "Năm" : "Lịch Tháng"}`}
                    </span>
                    <span className="sm:hidden">
                      {fromTab === "deadlines" ? "Hạn" : viewMode === "week" ? "Tuần" : viewMode === "year" ? "Năm" : "Lịch"}
                    </span>
                  </button>

                  <div className="flex min-w-0 flex-1 items-center gap-1.5">
                    <h2 className="min-w-0 flex-1 truncate whitespace-nowrap font-bold text-sm sm:text-lg text-[#1C1917]">
                      {getDayFormattedTitle()}
                    </h2>
                    {selectedDateStr === todayStr && (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-[#FEF08A] border border-[#262626] rounded-full text-[#1C1917]">
                        Hôm nay
                      </span>
                    )}
                    {isPastDate && (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-[#F3EFE6] border border-[#D4CEBF] rounded-full text-[#78716C] flex items-center gap-1">
                        <Lock size={10} strokeWidth={2.4} />
                        <span>Quá khứ</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Badge Thống Kê Hoàn Thành */}
                <div className="flex items-center justify-end gap-2 sm:justify-start">
                  <div className="font-mono text-xs font-bold bg-white px-2.5 py-0.5 border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] text-[#1C1917]">
                    {completedCount}/{totalCount}
                  </div>
                </div>
              </div>

              {/* Thanh Tiến Độ Hoàn Thành Mini Nét Mực */}
              {totalCount > 0 && (
                <div className="w-full h-1.5 bg-white border border-[#262626] rounded-[2px] overflow-hidden shadow-[1px_1px_0px_#262626]">
                  <div
                    className="h-full bg-[#BBF7D0] border-r border-[#262626] transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              )}
            </div>

            {/* Banner Cảnh Báo Khóa Tạo Việc Cho Ngày Quá Khứ */}
            {isPastDate && (
              <div className="flex items-center gap-2 p-2.5 bg-amber-50 border-[1.5px] border-amber-300 rounded-[6px] text-xs text-amber-950 font-medium shadow-[1px_1px_0px_#262626] animate-in fade-in">
                <Lock size={14} className="text-amber-800 shrink-0" strokeWidth={2.4} />
                <span>
                  <strong>Lưu ý:</strong> Đây là ngày trong quá khứ nên hệ thống đã khóa chức năng thêm việc mới. Bạn có thể tick hoàn thành, dời ngày sang hôm nay/tương lai hoặc xóa việc.
                </span>
              </div>
            )}

            {/* 2. BỘ LỌC 2 TẦNG DÙNG CHUNG INLINE (Y HỆT TAB HÔM NAY) */}
            <FilterBar
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              timeTypeFilter={timeTypeFilter}
              onTimeTypeChange={setTimeTypeFilter}
              priorityFilter={priorityFilter}
              onPriorityChange={setPriorityFilter}
              notebookFilter={notebookFilter}
              onNotebookChange={setNotebookFilter}
              tagFilter={tagFilter}
              onTagChange={setTagFilter}
              isDrawerOpen={isFilterDrawerOpen}
              onToggleDrawer={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
              onResetFilters={() => {
                setPriorityFilter("all");
                setNotebookFilter("all");
                setTagFilter("all");
                setTimeTypeFilter("all");
              }}
              activeFilterCount={activeAdvancedFilterCount}
            />

            {/* 3. BỐ CỤC 2 CỘT: KHU VỰC CÔNG VIỆC (TRÁI) & PANEL THÊM/SỬA VIỆC (PHẢI) */}
            <div className="flex flex-col lg:flex-row gap-4 items-start w-full">
              {/* KHU VỰC TRÁI: (A) Lịch Hẹn Nằm Trên -> (B) Danh Sách Task Nằm Dưới */}
              <div className="flex-1 min-w-0 space-y-4 w-full">
                {/* (A) PHẦN TRÊN: LỊCH HẸN & KHUNG GIỜ CỦA NGÀY (TodayScheduleNotes) */}
                {(() => {
                  const scheduledDayTasks = filteredTasks.filter((t) => {
                    if (t.parentTaskId) return false;
                    const normTime = normalizeTaskTimeType(t);
                    return normTime === "scheduled" || (Boolean(t.startTime) && normTime !== "deadline");
                  });

                  if (scheduledDayTasks.length === 0) return null;

                  return (
                    <TodayScheduleNotes
                      scheduledTasks={scheduledDayTasks}
                      onToggle={toggleTask}
                      onEdit={(task) => {
                        setActiveTask(task);
                      }}
                      onDelete={setDeletingTaskId}
                      onAddSubtask={(parent) => {
                        setActiveTask(parent);
                      }}
                      onClick={(task) => setActiveTask(task)}
                      activeTaskId={activeTask?.id}
                      title="Lịch hẹn trong ngày"
                    />
                  );
                })()}

                {/* (B) PHẦN DƯỚI: DANH SÁCH CÔNG VIỆC CẦN LÀM TRONG NGÀY */}
                {(() => {
                  const todoDayTasks = filteredTasks.filter((t) => {
                    const normTime = normalizeTaskTimeType(t);
                    return !(normTime === "scheduled" || (Boolean(t.startTime) && normTime !== "deadline"));
                  });

                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-1 border-b border-[#262626]/20">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#1C1917]">
                          <ListTodo size={14} className="text-[#57534E]" />
                          <span>Công việc cần làm trong ngày ({todoDayTasks.length})</span>
                        </div>
                      </div>

                      <TaskList
                        tasks={todoDayTasks}
                        emptyMessage="Chưa có công việc nào trong ngày này"
                        emptySubMessage={isPastDate ? "Ngày trong quá khứ không có công việc nào." : "Thêm công việc để bắt đầu lên kế hoạch!"}
                        emptyActionText={isPastDate ? undefined : "+ Thêm việc vào ngày này"}
                        onEmptyAction={undefined}
                        onToggle={toggleTask}
                        onEdit={(task) => setActiveTask(task)}
                        onDelete={deleteTask}
                        onMoveTomorrow={moveTaskToNextDay}
                        onAddSubtask={(parent) => setActiveTask(parent)}
                        onClick={(task) => setActiveTask(task)}
                        variant="planner"
                        hideDate={true}
                        baseDateStr={selectedDateStr}
                        activeTaskId={activeTask?.id}
                      />
                    </div>
                  );
                })()}
              </div>

              {/* CỘT CẠNH PHẢI: Panel Thao Tác Thêm & Sửa Việc Của Ngày Đó (Khóa khi là ngày quá khứ và không có activeTask) */}
              <div className="shrink-0 sticky top-16 self-start w-full sm:w-auto">
                {isPastDate && !activeTask ? (
                  <div className="p-4 bg-[#FAF8F3] border-[1.5px] border-[#262626] rounded-[8px] shadow-[2px_2px_0px_#262626] text-center space-y-2.5 w-full sm:w-[320px]">
                    <div className="w-10 h-10 mx-auto rounded-full bg-amber-100 border-[1.5px] border-[#262626] flex items-center justify-center text-amber-900 shadow-[1.5px_1.5px_0px_#262626]">
                      <Lock size={18} strokeWidth={2.4} />
                    </div>
                    <h4 className="font-bold text-xs sm:text-sm text-[#1C1917]">Đã khóa tạo việc mới</h4>
                    <p className="text-[11px] text-[#78716C] leading-relaxed">
                      Đây là ngày trong quá khứ. Bạn không thể tạo thêm việc mới. Bấm vào một công việc cũ để xem hoặc dời sang ngày mới.
                    </p>
                  </div>
                ) : activeTask ? (
                  <TodayComposerSidebar
                    isOpen={true}
                    onToggle={() => {}}
                    parentTask={null}
                    editingTask={activeTask}
                    onSelectTask={setActiveTask}
                    onClearParentTask={() => {}}
                    onCancelEdit={() => setActiveTask(null)}
                    onDeleteTask={(id) => {
                      deleteTask(id);
                      if (activeTask?.id === id) setActiveTask(null);
                    }}
                    onMoveTomorrow={(id) => {
                      moveTaskToNextDay(id);
                      setActiveTask(null);
                    }}
                    onAddSubtaskToTask={(parent) => setActiveTask(parent)}
                  />
                ) : null}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================== */}
      {/* MÀN HÌNH HỘP CHỜ (UNSCHEDULED BACKLOG) */}
      {/* ========================================== */}
      {plannerScreen === "backlog" && (
        <div className="space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
            <button
              type="button"
              onClick={() => setPlannerScreen("overview")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F3] hover:bg-[#F3EFE6] border-[1.5px] border-[#262626] rounded-[6px] shadow-[1.5px_1.5px_0px_#262626] text-xs font-bold text-[#1C1917] active:translate-x-[0.5px] active:translate-y-[0.5px] transition-all"
            >
              <ArrowLeft size={14} strokeWidth={2.4} />
              <span>Quay lại Kế hoạch</span>
            </button>
            <h3 className="font-bold text-sm text-[#1C1917]">
              Hộp Chờ Công Việc ({unscheduledTasks.length})
            </h3>
          </div>

          <PlannerBacklog
            isOpen={plannerScreen === "backlog"}
            onClose={() => setPlannerScreen("overview")}
            tasks={unscheduledTasks}
            onScheduleToDate={handleScheduleFromBacklog}
            onEdit={(task: TaskDto) => {
              setActiveTask(task);
              if (task.dueDate) {
                setSelectedDateStr(task.dueDate.split(" ")[0]);
                setPlannerScreen("day");
              }
            }}
          />
        </div>
      )}
    </div>
  );
};
