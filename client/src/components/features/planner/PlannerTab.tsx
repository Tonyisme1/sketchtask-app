import React, { useState, useMemo } from "react";
import { useAppStore } from "../../../stores/appStore";
import { useResponsiveLayout } from "../../../shared/hooks";
import { TaskDto } from "../../../types";
import { getLocalTodayStr } from "../../../utils/date";
import {
  getTaskEffectiveDate,
  getTaskEffectiveTime,
  getTaskTemporalState,
  normalizeTaskTimeType,
  isTaskForSpecificDate,
  getTaskTags,
  isTaskOccurringOnDate,
} from "../../../utils/taskSemantics";
import { PlannerHeader, PlannerViewMode } from "./PlannerHeader";
import { PlannerCalendar } from "./PlannerCalendar";
import { PlannerWeekView } from "./PlannerWeekView";
import {
  PlannerDayDisplayMode,
  PlannerDayTimeline,
} from "./PlannerDayTimeline";
import { TodayScheduleNotes } from "../today/TodayScheduleNotes";
import { TaskList } from "../shared/TaskList";
import { FilterBar } from "../shared/FilterBar";
import { TodayProgressBar } from "../today/TodayProgressBar";
import { registerBackHandler } from "../../../utils/backNavigation";
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
    toggleTask,
    deleteTask,
    moveTaskToNextDay,
    hideCompletedTasks,
    setSelectedPlannerDate,
    openTaskDetail,
  } = useAppStore();
  const { isMobile, isDesktop } = useResponsiveLayout();

  const todayStr = getLocalTodayStr(new Date());
  const [todayYear, todayMonth, todayDay] = todayStr.split("-").map(Number);
  const todayDate = new Date(todayYear, todayMonth - 1, todayDay);

  // Chế độ xem: biểu đồ theo giờ hoặc lịch tháng.
  const [viewMode, setViewMode] = useState<PlannerViewMode>("agenda");

  // Màn hình hiển thị: tổng quan theo tuần/tháng hoặc chi tiết ngày.
  const [plannerScreen, setPlannerScreen] = useState<"overview" | "day">("overview");

  // Offsets thời gian
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [monthOffset, setMonthOffset] = useState<number>(0);

  // Ngày đang được chọn để xem chi tiết trong DayPlanView
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);
  const [dayDisplayMode, setDayDisplayMode] = useState<PlannerDayDisplayMode>("chart");

  // Đồng bộ ngày được chọn sang global store cho FAB thông minh
  React.useEffect(() => {
    setSelectedPlannerDate(selectedDateStr);
  }, [selectedDateStr, setSelectedPlannerDate]);

  // Lắng nghe khi được chuyển từ Tab Hạn định sang
  React.useEffect(() => {
    if (!targetDateStr && !targetTaskId) return;

    if (targetDateStr) {
      setSelectedDateStr(targetDateStr);
      setPlannerScreen("day");
    } else {
      // Việc không có ngày không đi qua màn hình trung gian; mở thẳng chi tiết.
      setPlannerScreen("overview");
      if (targetTaskId) openTaskDetail(targetTaskId);
    }
    onClearTarget?.();
  }, [targetDateStr, targetTaskId, openTaskDetail, onClearTarget]);

  React.useEffect(() => {
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

  // Filter state cho DayPlanView
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed">("all");
  const [timeTypeFilter, setTimeTypeFilter] = useState<"all" | "scheduled" | "deadline">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // ==========================================
  // 1. TÍNH TOÁN DỮ LIỆU TUẦN (WEEK VIEW)
  // ==========================================
  const { weekDays, weekLabel } = useMemo(() => {
    const currentMonday = new Date(todayDate);
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
  }, [todayStr, weekOffset]);

  // ==========================================
  // 2. TÍNH TOÁN DỮ LIỆU THÁNG (MONTH VIEW)
  // ==========================================
  const { monthLabel, matrix: monthMatrix } = useMemo(() => {
    const targetDate = new Date(
      todayDate.getFullYear(),
      todayDate.getMonth() + monthOffset,
      1,
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
  }, [monthOffset, todayStr]);

  // Tiêu đề Header phụ thuộc vào viewMode
  const currentTitleLabel =
    viewMode === "agenda" ? weekLabel : monthLabel;

  // Lấy các task cho một ngày cụ thể (Hỗ trợ cả task liên ngày & qua đêm)
  const getTasksForDate = (dateStr: string): TaskDto[] => {
    return tasks.filter((t) => isTaskForSpecificDate(t, dateStr) || isTaskOccurringOnDate(t, dateStr));
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

  // Điều hướng Prev / Next / Today
  const handlePrev = () => {
    if (viewMode === "agenda") setWeekOffset((prev) => prev - 1);
    else setMonthOffset((prev) => prev - 1);
  };

  const handleNext = () => {
    if (viewMode === "agenda") setWeekOffset((prev) => prev + 1);
    else setMonthOffset((prev) => prev + 1);
  };

  const handleResetToCurrent = () => {
    if (viewMode === "agenda") setWeekOffset(0);
    else setMonthOffset(0);
  };

  // Xử lý khi chọn một ngày
  const handleSelectDate = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    setPlannerScreen("day");
  };

  // Danh sách công việc của ngày đang chọn trong DayPlanView
  const selectedDayTasks = useMemo(() => {
    return tasks.filter((t) => {
      return isTaskForSpecificDate(t, selectedDateStr) || isTaskOccurringOnDate(t, selectedDateStr);
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
    hideCompletedTasks,
    statusFilter,
    timeTypeFilter,
    priorityFilter,
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
    (tagFilter !== "all" ? 1 : 0);

  return (
    <div className={`space-y-4 w-full min-w-0 pb-16 select-none ${
      isMobile ? "" : "animate-in fade-in duration-150"
    }`}>
      {/* ========================================== */}
      {/* MÀN HÌNH TỔNG QUAN (LỊCH TRÌNH / LỊCH THÁNG) */}
      {/* ========================================== */}
      {plannerScreen === "overview" && (
        <div className={isMobile ? "space-y-3 mobile-tab-enter" : "space-y-3 animate-in fade-in duration-150"}>
          {/* Header Planner điều hướng hai cách xem */}
          <PlannerHeader
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            titleLabel={currentTitleLabel}
            onPrev={handlePrev}
            onNext={handleNext}
            onToday={handleResetToCurrent}
          />

          {/* 1. LỊCH TRÌNH THEO TUẦN */}
          {viewMode === "agenda" && (
            <PlannerWeekView
              weekDays={weekDays}
              todayStr={todayStr}
              selectedDateStr={selectedDateStr}
              onPreviewDate={setSelectedDateStr}
              getTasksForDate={getTasksForDate}
              onSelectDate={handleSelectDate}
              onSelectTask={(task) => {
                const taskDate = getTaskEffectiveDate(task) || selectedDateStr;
                setSelectedDateStr(taskDate);
                setPlannerScreen("day");
              }}
              onToggleTask={toggleTask}
              onDeleteTask={deleteTask}
              onMoveTomorrow={moveTaskToNextDay}
            />
          )}

          {/* 2. LỊCH THÁNG */}
          {viewMode === "month" && (
            <PlannerCalendar
              selectedDateStr={selectedDateStr}
              onSelectDate={handleSelectDate}
              todayStr={todayStr}
              monthMatrix={monthMatrix}
              getTasksForDate={getTasksForDate}
              getTaskSummaryForDate={getTaskSummaryForDate}
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
        return (
          <div className={isMobile ? "space-y-4 mobile-panel-enter" : "space-y-4 animate-in fade-in duration-150"}>
            {/* 1. Header Quay Lại & Tên Ngày & Tiến Độ Đồng Bộ TodayHeader */}
            <div className="pb-2 border-b border-[#262626] space-y-1.5 select-none">
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
                        : `Quay lại ${viewMode === "agenda" ? "Lịch trình" : "Lịch tháng"}`}
                    </span>
                    <span className="sm:hidden">
                      {fromTab === "deadlines" ? "Hạn" : viewMode === "agenda" ? "Lịch" : "Lịch tháng"}
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

              <TodayProgressBar
                completedCount={completedCount}
                totalCount={totalCount}
                label="Tiến độ ngày"
              />
            </div>

            {/* 2. BỘ LỌC 2 TẦNG DÙNG CHUNG INLINE (Y HỆT TAB HÔM NAY) */}
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

            {/* 3. BỐ CỤC KHU VỰC CÔNG VIỆC TRONG NGÀY */}
            <div className="space-y-4 w-full">
              {/* (A) PHẦN TRÊN: LỊCH HẸN & KHUNG GIỜ CỦA NGÀY (TodayScheduleNotes) */}
              {(() => {
                const scheduledDayTasks = filteredTasks.filter((t) => {
                  const normTime = normalizeTaskTimeType(t);
                  return normTime === "scheduled" || (Boolean(t.startTime) && normTime !== "deadline");
                });
                if (isDesktop) {
                  return (
                    <PlannerDayTimeline
                      tasks={filteredTasks}
                      listTasks={filteredTasks}
                      displayMode={dayDisplayMode}
                      onDisplayModeChange={setDayDisplayMode}
                      onSelectTask={(task) => openTaskDetail(task.id)}
                      onToggleTask={toggleTask}
                      onDeleteTask={deleteTask}
                      onMoveTomorrow={moveTaskToNextDay}
                      dateStr={selectedDateStr}
                      isToday={selectedDateStr === todayStr}
                    />
                  );
                }

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

              {/* (B) PHẦN DƯỚI: DANH SÁCH CÔNG VIỆC CẦN LÀM TRONG NGÀY */}
              {(() => {
                if (isDesktop) return null;

                const todoDayTasks = filteredTasks.filter((t) => {
                  const normTime = normalizeTaskTimeType(t);
                  return isDesktop
                    ? !getTaskEffectiveTime(t)
                    : !(normTime === "scheduled" || (Boolean(t.startTime) && normTime !== "deadline"));
                });

                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between pb-1 border-b border-[#262626]/20">
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
        );
      })()}
    </div>
  );
};
