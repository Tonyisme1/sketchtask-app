import React, { useState, useMemo } from "react";
import { useAppStore } from "../../../stores/appStore";
import { useResponsiveLayout } from "../../../shared/hooks";
import { TaskDto } from "../../../types";
import { getLocalTodayStr } from "../../../utils/date";
import {
  getTaskEffectiveDate,
  getTaskEffectiveTime,
  getTaskItemType,
  getTaskTemporalState,
  normalizeTaskTimeType,
  isTaskForSpecificDate,
  getTaskTags,
  isTaskOccurringOnDate,
} from "../../../utils/taskSemantics";
import { PlannerHeader, PlannerViewMode } from "./PlannerHeader";
import { DesktopPlannerHeader } from "./DesktopPlannerHeader";
import type { DesktopPlannerSurface } from "./DesktopPlannerHeader";
import { PlannerCalendar } from "./PlannerCalendar";
import { DesktopPlannerCalendar } from "./DesktopPlannerCalendar";
import { DesktopPlannerListView } from "./DesktopPlannerListView";
import { PlannerWeekView } from "./PlannerWeekView";
import {
  PlannerDayDisplayMode,
  PlannerDayTimeline,
} from "./PlannerDayTimeline";
import { PlannerTaskPreviewPopover } from "./PlannerTaskPreviewPopover";
import { TodayScheduleNotes } from "../today/TodayScheduleNotes";
import { TodayTaskList } from "../today/TodayTaskList";
import { TaskList } from "../shared/TaskList";
import { TaskListSection } from "../shared/TaskListSection";
import { FilterBar } from "../shared/FilterBar";
import { TodayProgressBar } from "../today/TodayProgressBar";
import { getTaskProgress } from "../../../utils/taskHierarchy";
import { registerBackHandler } from "../../../utils/backNavigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Clock,
  Lock,
  ListTodo,
  Plus,
  Search,
  X,
} from "lucide-react";

const DAY_NAMES = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"];
const SHORT_DAY_NAMES = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export interface PlannerTabProps {
  targetDateStr?: string;
  targetTaskId?: string;
  fromTab?: "deadlines" | "overview";
  onBackToDeadlines?: () => void;
  onClearTarget?: () => void;
  desktopSurface?: DesktopPlannerSurface;
  desktopSurfaceRevision?: number;
}

export const PlannerTab: React.FC<PlannerTabProps> = ({
  targetDateStr,
  targetTaskId,
  fromTab,
  onBackToDeadlines,
  onClearTarget,
  desktopSurface: controlledDesktopSurface,
  desktopSurfaceRevision,
}) => {
  const {
    tasks,
    toggleTask,
    deleteTask,
    updateTask,
    moveTaskToNextDay,
    hideCompletedTasks,
    setSelectedPlannerDate,
    openTaskDetail,
    openQuickTaskModal,
  } = useAppStore();
  const { isMobile, isDesktop } = useResponsiveLayout();

  const todayStr = getLocalTodayStr(new Date());
  const [todayYear, todayMonth, todayDay] = todayStr.split("-").map(Number);
  const todayDate = new Date(todayYear, todayMonth - 1, todayDay);

  // Chế độ xem: biểu đồ theo giờ hoặc lịch tháng.
  const [viewMode, setViewMode] = useState<PlannerViewMode>("agenda");
  // Desktop tách workspace Lịch và Danh sách; mobile/tablet giữ flow hiện tại.
  const desktopSurface: DesktopPlannerSurface = isDesktop && controlledDesktopSurface
    ? controlledDesktopSurface
    : "calendar";

  // Màn hình hiển thị: tổng quan theo tuần/tháng hoặc chi tiết ngày.
  const [plannerScreen, setPlannerScreen] = useState<"overview" | "day">("overview");

  // Offsets thời gian
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [monthOffset, setMonthOffset] = useState<number>(0);

  // Ngày đang được chọn để xem chi tiết trong DayPlanView
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);
  const [dayDisplayMode, setDayDisplayMode] = useState<PlannerDayDisplayMode>("chart");
  const [isCompletedSectionOpen, setIsCompletedSectionOpen] = useState<boolean>(true);

  // Popover xem nhanh công việc trên lịch (Google Calendar Style)
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

  const desktopSurfaceRevisionRef = React.useRef(desktopSurfaceRevision);
  React.useEffect(() => {
    if (!isDesktop || desktopSurfaceRevision === undefined) return;
    if (desktopSurfaceRevisionRef.current === desktopSurfaceRevision) return;

    desktopSurfaceRevisionRef.current = desktopSurfaceRevision;
    setPlannerScreen("overview");
  }, [desktopSurfaceRevision, isDesktop]);

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
  const [searchQuery, setSearchQuery] = useState("");
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

    const label = `${startD.getDate()}/${startD.getMonth() + 1} - ${endD.getDate()}/${endD.getMonth() + 1}`;

    return {
      weekDays: days,
      weekLabel: label,
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
    desktopSurface === "list" || viewMode === "agenda" ? weekLabel : monthLabel;

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
    if (desktopSurface === "list" || viewMode === "agenda") setWeekOffset((prev) => prev - 1);
    else setMonthOffset((prev) => prev - 1);
  };

  const handleNext = () => {
    if (desktopSurface === "list" || viewMode === "agenda") setWeekOffset((prev) => prev + 1);
    else setMonthOffset((prev) => prev + 1);
  };

  const handleResetToCurrent = () => {
    if (desktopSurface === "list" || viewMode === "agenda") setWeekOffset(0);
    else setMonthOffset(0);
  };

  // Xử lý khi chọn một ngày
  const handleSelectDate = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    setPlannerScreen("day");
  };

  const handlePrevDay = () => {
    const parts = selectedDateStr.split("-").map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() - 1);
    setSelectedDateStr(getLocalTodayStr(d));
  };

  const handleNextDay = () => {
    const parts = selectedDateStr.split("-").map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() + 1);
    setSelectedDateStr(getLocalTodayStr(d));
  };

  const handleTodayDay = () => {
    setSelectedDateStr(todayStr);
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
    <div
      className={`w-full min-w-0 select-none ${
        isDesktop ? "h-full w-full flex flex-col min-h-0 pb-0" : "space-y-4 pb-16"
      } ${isMobile ? "" : "animate-in fade-in duration-150"}`}
    >
      {/* ========================================== */}
      {/* MÀN HÌNH TỔNG QUAN (LỊCH TRÌNH / LỊCH THÁNG) */}
      {/* ========================================== */}
      {plannerScreen === "overview" && (
        <div
          className={
            isMobile
              ? "space-y-3 mobile-tab-enter"
              : isDesktop
                ? "h-full w-full flex flex-col min-h-0"
                : "space-y-3 animate-in fade-in duration-150"
          }
        >
          {/* Header Planner điều hướng hai cách xem (Phân nhánh Desktop vs Mobile/Tablet) */}
          {isDesktop ? (
            <DesktopPlannerHeader
              viewMode={viewMode}
              surface={desktopSurface}
              onViewModeChange={setViewMode}
              titleLabel={currentTitleLabel}
              onPrev={handlePrev}
              onNext={handleNext}
              onToday={handleResetToCurrent}
            />
          ) : (
            <PlannerHeader
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              titleLabel={currentTitleLabel}
              onPrev={handlePrev}
              onNext={handleNext}
              onToday={handleResetToCurrent}
            />
          )}

          {/* 1. Danh sách desktop có workspace riêng, không lặp dưới biểu đồ. */}
          {isDesktop && desktopSurface === "list" && (
            <DesktopPlannerListView
              weekDays={weekDays}
              getTasksForDate={getTasksForDate}
              onToggleTask={toggleTask}
              onDeleteTask={deleteTask}
              onOpenTask={(task) => handleOpenTaskPreview(task, null)}
            />
          )}

          {/* 2. LỊCH TRÌNH THEO TUẦN */}
          {(!isDesktop || desktopSurface === "calendar") && viewMode === "agenda" && (
            <PlannerWeekView
              weekDays={weekDays}
              selectedDateStr={selectedDateStr}
              getTasksForDate={getTasksForDate}
              onSelectDate={handleSelectDate}
              onToggleTask={toggleTask}
              onDeleteTask={deleteTask}
              onUpdateTask={updateTask}
              onPreviewTask={handleOpenTaskPreview}
            />
          )}

          {/* 3. LỊCH THÁNG (Phân nhánh Desktop vs Mobile/Tablet) */}
          {(!isDesktop || desktopSurface === "calendar") && viewMode === "month" && (
            isDesktop ? (
              <DesktopPlannerCalendar
                selectedDateStr={selectedDateStr}
                onSelectDate={handleSelectDate}
                todayStr={todayStr}
                monthMatrix={monthMatrix}
                getTasksForDate={getTasksForDate}
                getTaskSummaryForDate={getTaskSummaryForDate}
                onPreviewTask={handleOpenTaskPreview}
              />
            ) : (
              <PlannerCalendar
                selectedDateStr={selectedDateStr}
                onSelectDate={handleSelectDate}
                todayStr={todayStr}
                monthMatrix={monthMatrix}
                getTasksForDate={getTasksForDate}
                getTaskSummaryForDate={getTaskSummaryForDate}
              />
            )
          )}

        </div>
      )}

      {/* ========================================== */}
      {/* MÀN HÌNH CHI TIẾT NGÀY (ĐỒNG BỘ CHUẨN TAB HÔM NAY TRÊN DESKTOP) */}
      {/* ========================================== */}
      {plannerScreen === "day" && (() => {
        const isPastDate = selectedDateStr < todayStr;
        const { completed: completedCount, total: totalCount } = getTaskProgress(selectedDayTasks);

        if (isDesktop) {
          const activeEventItems = selectedDayTasks.filter((task) => {
            if (task.parentTaskId) return false;
            if (task.completed) return false;
            return getTaskItemType(task) === "event";
          });
          const activeScheduledTasks = selectedDayTasks.filter((task) => {
            if (task.parentTaskId) return false;
            if (task.completed) return false;
            return normalizeTaskTimeType(task) === "scheduled" && getTaskItemType(task) !== "event";
          });
          const activeTaskListItems = selectedDayTasks.filter((task) => {
            if (task.completed) return false;
            return getTaskItemType(task) !== "event" && normalizeTaskTimeType(task) !== "scheduled";
          });
          const completedDayTasks = hideCompletedTasks
            ? []
            : selectedDayTasks.filter((task) => task.completed && getTaskItemType(task) !== "event");

          return (
            <div className="h-full min-h-0 w-full min-w-0 flex flex-col select-none animate-in fade-in duration-150">
              {/* 1. Header Chi Tiết Ngày Chuẩn Desktop (Đồng bộ thiết kế & tỷ lệ chuẩn với DesktopPlannerHeader) */}
              <header className="flex items-center justify-between gap-3 px-4 py-2 border-b border-[var(--border-ink)] bg-[var(--bg-surface)] select-none shrink-0 h-[54px]">
                {/* Nhóm trái: Nút Quay Lại + Hôm nay + Prev/Next + Tiêu đề ngày & Badge */}
                <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
                  {/* Nút Quay Lại */}
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
                    className="h-[34px] px-3 text-xs font-bold bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-muted)] border border-[var(--border-ink)] rounded-xl shadow-xs active:scale-95 text-[var(--text-main)] transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                    title={fromTab === "deadlines" ? "Quay lại Hạn định" : `Quay lại ${viewMode === "agenda" ? "Lịch trình" : "Lịch tháng"}`}
                  >
                    <ArrowLeft size={14} strokeWidth={2.4} />
                    <span>{fromTab === "deadlines" ? "Hạn định" : viewMode === "agenda" ? "Lịch trình" : "Lịch tháng"}</span>
                  </button>

                  <div className="h-4 w-[1px] bg-[var(--border-ink-muted)] mx-0.5" />

                  {/* Nút Hôm nay */}
                  <button
                    type="button"
                    onClick={handleTodayDay}
                    className={`h-[34px] px-3.5 text-xs font-bold rounded-xl border shadow-xs active:scale-95 transition-all cursor-pointer shrink-0 ${
                      selectedDateStr === todayStr
                        ? "bg-[var(--accent-blue)] text-white border-[var(--accent-blue)]"
                        : "bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-muted)] border-[var(--border-ink)] text-[var(--text-main)]"
                    }`}
                    title="Nhảy về ngày hôm nay"
                  >
                    Hôm nay
                  </button>

                  {/* Nút Ngày trước / Ngày sau */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={handlePrevDay}
                      className="w-8 h-[34px] rounded-xl border border-[var(--border-ink)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-muted)] flex items-center justify-center text-[var(--text-main)] active:scale-95 transition-all cursor-pointer shadow-xs"
                      title="Ngày trước"
                      aria-label="Ngày trước"
                    >
                      <ChevronLeft size={16} strokeWidth={2.2} />
                    </button>

                    <button
                      type="button"
                      onClick={handleNextDay}
                      className="w-8 h-[34px] rounded-xl border border-[var(--border-ink)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-muted)] flex items-center justify-center text-[var(--text-main)] active:scale-95 transition-all cursor-pointer shadow-xs"
                      title="Ngày sau"
                      aria-label="Ngày sau"
                    >
                      <ChevronRight size={16} strokeWidth={2.2} />
                    </button>
                  </div>

                  {/* Tiêu đề ngày & Badges */}
                  <div className="flex items-center gap-2 min-w-0 pl-1">
                    <h2 className="text-base lg:text-lg font-extrabold text-[var(--text-main)] tracking-tight truncate">
                      {getDayFormattedTitle()}
                    </h2>

                    {selectedDateStr === todayStr && (
                      <span className="text-[10.5px] font-bold px-2 py-0.5 bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] dark:bg-[var(--accent-blue)]/20 border border-[var(--accent-blue)]/30 rounded-md shrink-0">
                        Hôm nay
                      </span>
                    )}
                    {isPastDate && (
                      <span className="text-[10.5px] font-bold px-2 py-0.5 bg-[var(--bg-surface-muted)] border border-[var(--border-ink)] rounded-md text-[var(--text-muted)] flex items-center gap-1 shrink-0">
                        <Lock size={10} strokeWidth={2.4} />
                        <span>Quá khứ</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Nhóm phải: Tiến độ + Toggle Chuyển Đổi Biểu Đồ / Danh Sách + Nút Thêm Việc */}
                <div className="flex items-center gap-2.5 shrink-0">
                  {/* Tiến độ mini tinh tế */}
                  {totalCount > 0 && (
                    <div
                      className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-xl bg-[var(--bg-surface-muted)] border border-[var(--border-ink)]"
                      title={`Tiến độ ngày: ${completedCount}/${totalCount} việc (${Math.round((completedCount / totalCount) * 100)}%)`}
                    >
                      <div className="w-16 h-1.5 bg-[var(--border-ink-muted)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                          style={{ width: `${Math.round((completedCount / totalCount) * 100)}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] font-bold text-[var(--text-muted)]">
                        {completedCount}/{totalCount} việc
                      </span>
                    </div>
                  )}

                  {/* Toggle Chuyển Đổi Biểu Đồ / Danh Sách */}
                  <div
                    className="inline-flex h-[34px] p-0.5 bg-[var(--bg-surface-muted)] border border-[var(--border-ink)] rounded-xl shrink-0"
                    role="tablist"
                    aria-label="Kiểu hiển thị chi tiết ngày"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={dayDisplayMode === "chart"}
                      onClick={() => setDayDisplayMode("chart")}
                      className={`flex items-center gap-1.5 px-3 h-full rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        dayDisplayMode === "chart"
                          ? "bg-[var(--bg-surface)] text-[var(--text-main)] shadow-xs"
                          : "bg-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]"
                      } active:scale-95`}
                      title="Xem dạng biểu đồ 24 giờ"
                    >
                      <Clock size={13} strokeWidth={dayDisplayMode === "chart" ? 2.5 : 2} />
                      <span>Biểu đồ</span>
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={dayDisplayMode === "list"}
                      onClick={() => setDayDisplayMode("list")}
                      className={`flex items-center gap-1.5 px-3 h-full rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        dayDisplayMode === "list"
                          ? "bg-[var(--bg-surface)] text-[var(--text-main)] shadow-xs"
                          : "bg-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]"
                      } active:scale-95`}
                      title="Xem dạng danh sách việc"
                    >
                      <ListTodo size={13} strokeWidth={dayDisplayMode === "list" ? 2.5 : 2} />
                      <span>Danh sách ({totalCount})</span>
                    </button>
                  </div>
                </div>
              </header>

              {/* 2. Nội dung hiển thị theo chế độ đã chọn */}
              {dayDisplayMode === "chart" ? (
                <div className="flex-1 min-h-0 min-w-0">
                  <PlannerDayTimeline
                    tasks={selectedDayTasks}
                    onToggleTask={toggleTask}
                    onDeleteTask={deleteTask}
                    onUpdateTask={updateTask}
                    onPreviewTask={handleOpenTaskPreview}
                    dateStr={selectedDateStr}
                    isToday={selectedDateStr === todayStr}
                  />
                </div>
              ) : (
                <section className="flex-1 min-h-0 overflow-y-auto bg-[var(--bg-canvas)] px-5 py-5">
                  <div className="mx-auto w-full max-w-4xl space-y-4 pb-12">
                    {/* A. Thẻ Tóm Tắt Ngày & Hành Động */}
                    <header className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border-ink)] bg-[var(--bg-surface)] px-5 py-3.5 shadow-xs">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] dark:bg-[var(--accent-blue)]/20">
                          <CalendarDays size={20} strokeWidth={2.2} />
                        </span>
                        <div className="min-w-0">
                          <h2 className="truncate text-sm font-bold text-[var(--text-main)]">
                            {getDayFormattedTitle()}
                          </h2>
                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-[var(--text-muted)]">
                            <span>{totalCount} công việc</span>
                            <span>·</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              {completedCount} đã hoàn thành
                            </span>
                            {activeEventItems.length > 0 && (
                              <>
                                <span>·</span>
                                <span className="text-[var(--accent-blue)] font-semibold">
                                  {activeEventItems.length} sự kiện
                                </span>
                              </>
                            )}
                            {activeScheduledTasks.length > 0 && (
                              <>
                                <span>·</span>
                                <span>{activeScheduledTasks.length} lịch hẹn</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {!isPastDate && (
                        <button
                          type="button"
                          onClick={() => openQuickTaskModal({ dueDate: selectedDateStr })}
                          className="h-[34px] px-3.5 rounded-xl bg-[var(--accent-blue)] hover:brightness-110 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                        >
                          <Plus size={14} strokeWidth={2.4} />
                          <span>Thêm việc mới</span>
                        </button>
                      )}
                    </header>

                    {/* B. Trạng Thái Rỗng (Chưa có việc trong ngày) */}
                    {selectedDayTasks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--border-ink)] bg-[var(--bg-surface)] py-14 px-6 text-center shadow-xs">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] dark:bg-[var(--accent-blue)]/20 mb-3">
                          <CalendarDays size={28} strokeWidth={1.8} />
                        </div>
                        <h3 className="text-sm font-bold text-[var(--text-main)]">
                          Chưa có công việc trong ngày này
                        </h3>
                        <p className="mt-1 text-xs text-[var(--text-muted)] max-w-sm">
                          Lên kế hoạch và thêm công việc để ngày làm việc của bạn trở nên khoa học và hiệu quả hơn.
                        </p>
                        {!isPastDate && (
                          <button
                            type="button"
                            onClick={() => openQuickTaskModal({ dueDate: selectedDateStr })}
                            className="mt-4 h-[36px] px-4 rounded-xl bg-[var(--accent-blue)] hover:brightness-110 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <Plus size={15} strokeWidth={2.4} />
                            <span>Thêm công việc đầu tiên</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="space-y-3">
                          {activeEventItems.length > 0 && (
                            <TaskListSection
                              title="Sự kiện"
                              tasks={activeEventItems}
                              icon={<CircleDot size={15} strokeWidth={2.3} />}
                              tone="info"
                              variant="planner"
                              hideDate={true}
                              baseDateStr={selectedDateStr}
                              showEventTimeLabel={true}
                              onToggle={toggleTask}
                              onEdit={(task) => handleOpenTaskPreview(task, null)}
                              onDelete={deleteTask}
                              onMoveTomorrow={moveTaskToNextDay}
                              onClick={(task) => handleOpenTaskPreview(task, null)}
                              activeTaskId={targetTaskId}
                              showQuickAdd={false}
                            />
                          )}

                          {activeScheduledTasks.length > 0 && (
                            <TaskListSection
                              title="Lịch hẹn theo giờ"
                              tasks={activeScheduledTasks}
                              icon={<Clock size={15} strokeWidth={2.3} />}
                              tone="info"
                              variant="planner"
                              hideDate={true}
                              baseDateStr={selectedDateStr}
                              showEventTimeLabel={true}
                              onToggle={toggleTask}
                              onEdit={(task) => handleOpenTaskPreview(task, null)}
                              onDelete={deleteTask}
                              onMoveTomorrow={moveTaskToNextDay}
                              onClick={(task) => handleOpenTaskPreview(task, null)}
                              activeTaskId={targetTaskId}
                              showQuickAdd={false}
                            />
                          )}

                          {activeTaskListItems.length > 0 && (
                            <TaskListSection
                              title="Công việc cần làm"
                              tasks={activeTaskListItems}
                              icon={<ListTodo size={15} strokeWidth={2.3} />}
                              tone="neutral"
                              variant="planner"
                              hideDate={true}
                              baseDateStr={selectedDateStr}
                              onToggle={toggleTask}
                              onEdit={(task) => handleOpenTaskPreview(task, null)}
                              onDelete={deleteTask}
                              onMoveTomorrow={moveTaskToNextDay}
                              onClick={(task) => handleOpenTaskPreview(task, null)}
                              activeTaskId={targetTaskId}
                              showQuickAdd={false}
                            />
                          )}

                          {completedDayTasks.length > 0 && (
                            <TaskListSection
                              title="Đã hoàn thành"
                              tasks={completedDayTasks}
                              icon={<CheckCircle2 size={15} strokeWidth={2.3} />}
                              tone="success"
                              collapsed={!isCompletedSectionOpen}
                              onCollapsedChange={(collapsed) => setIsCompletedSectionOpen(!collapsed)}
                              variant="planner"
                              hideDate={true}
                              baseDateStr={selectedDateStr}
                              onToggle={toggleTask}
                              onEdit={(task) => handleOpenTaskPreview(task, null)}
                              onDelete={deleteTask}
                              onMoveTomorrow={moveTaskToNextDay}
                              onClick={(task) => handleOpenTaskPreview(task, null)}
                              activeTaskId={targetTaskId}
                              showQuickAdd={false}
                            />
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </section>
              )}
            </div>
          );
        }

        // GIAO DIỆN MOBILE / TABLET
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
                    aria-label={fromTab === "deadlines" ? "Quay lại Hạn định" : "Quay lại lịch"}
                    className="mobile-back-button flex shrink-0 items-center gap-1.5 whitespace-nowrap px-2.5 py-1 bg-[#FAF8F3] hover:bg-[#F3EFE6] border-[1.5px] border-[#262626] rounded-[5px] shadow-[1.5px_1.5px_0px_#262626] text-xs font-bold text-[#1C1917] active:translate-x-[0.5px] active:translate-y-[0.5px] transition-all"
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

            {/* 2. Thanh tìm kiếm trên cùng của ngày */}
            <div className="flex min-w-0 items-center gap-2.5 rounded-xl border-[1.5px] border-[#262626] dark:border-[#2E2E36] bg-white dark:bg-[#1C1C20] px-3 shadow-[1.5px_1.5px_0px_#262626] dark:shadow-none">
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

            {/* 3. BỘ LỌC 2 TẦNG DÙNG CHUNG INLINE (Y HỆT TAB HÔM NAY) */}
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

            {/* 4. BỐ CỤC KHU VỰC CÔNG VIỆC TRONG NGÀY TRÊN MOBILE */}
            <div className="space-y-4 w-full">
              {/* (A) PHẦN TRÊN: LỊCH HẸN & KHUNG GIỜ CỦA NGÀY (TodayScheduleNotes) */}
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

              {/* (B) PHẦN DƯỚI: DANH SÁCH CÔNG VIỆC CẦN LÀM TRONG NGÀY */}
              {(() => {
                const todoDayTasks = filteredTasks.filter((t) => {
                  const normTime = normalizeTaskTimeType(t);
                  return !(normTime === "scheduled" || (Boolean(t.startTime) && normTime !== "deadline"));
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

      {/* 4. Popover xem nhanh Task trên lịch (Google Calendar Style) */}
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
