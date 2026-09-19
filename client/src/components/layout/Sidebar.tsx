// ==========================================
// COMPONENT: Desktop Sidebar (Central Ink & Paper Navigation)
// ==========================================

import React from "react";
import { TabKey, TaskDto, TaskSubTab } from "../../types";
import { useAppStore } from "../../stores/appStore";
import {
  Sun,
  Calendar as CalendarIcon,
  Hourglass,
  FilePenLine,
  BookOpen,
  List,
  ListTodo,
  Plus,
  Settings,
} from "lucide-react";
import {
  getTaskItemType,
  getTaskEffectiveDate,
  getTaskEffectiveTime,
  getTaskTemporalState,
  isTaskDueToday,
  normalizeTaskTimeType,
} from "../../utils/taskSemantics";
import { getLocalTodayStr } from "../../utils/date";
import { loadNotesFromStorage } from "../../utils/noteStorage";

export interface SidebarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  onCreateTask?: () => void;
  onOpenSettings?: () => void;
  onOpenAIModal?: () => void;
  desktopPlannerSurface?: "calendar" | "list";
  onDesktopPlannerSurfaceChange?: (surface: "calendar" | "list") => void;
  onDesktopTaskSubTabChange?: (subTab: TaskSubTab) => void;
}

interface SidebarTaskPreviewProps {
  title?: string;
  tasks: TaskDto[];
  formatDate: (date?: string) => string;
}

const SidebarTaskPreview: React.FC<SidebarTaskPreviewProps> = ({
  title,
  tasks,
  formatDate,
}) => (
  <div className={title ? "mt-3" : "mt-2"}>
    {title && (
      <p className="px-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[#78716C] dark:text-[#A1A1AA]">
        {title}
      </p>
    )}
    {tasks.length ? (
      <div className="mt-1.5 space-y-1">
        {tasks.map((task) => {
          const date = formatDate(getTaskEffectiveDate(task));
          const time = getTaskEffectiveTime(task);
          return (
            <div key={task.id} className="min-w-0 rounded-xl px-1.5 py-1 hover:bg-white/70 dark:hover:bg-[#2C2C2E]">
              <p className="truncate text-[11px] font-semibold text-[#1C1917] dark:text-[#F2F2F7]" title={task.title}>
                {task.title || "Công việc không tên"}
              </p>
              <p className="mt-0.5 font-mono text-[9px] font-medium text-[#78716C] dark:text-[#A1A1AA]">
                {time ? `${date} · ${time}` : date}
              </p>
            </div>
          );
        })}
      </div>
    ) : (
      <p className="mt-1.5 px-1 text-[11px] text-[#78716C] dark:text-[#A1A1AA]">Chưa có việc cần chú ý</p>
    )}
  </div>
);

interface SidebarTextPreviewProps {
  title: string;
  items: Array<{ id: string; label: string; meta: string }>;
  emptyLabel?: string;
}

const SidebarTextPreview: React.FC<SidebarTextPreviewProps> = ({
  title,
  items,
  emptyLabel = "Chưa có nội dung gần đây",
}) => (
  <div>
    <p className="px-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[#78716C] dark:text-[#A1A1AA]">
      {title}
    </p>
    {items.length ? (
      <div className="mt-1.5 space-y-1">
        {items.map((item) => (
          <div key={item.id} className="min-w-0 rounded-xl px-1.5 py-1 hover:bg-white/70 dark:hover:bg-[#2C2C2E]">
            <p className="truncate text-[11px] font-semibold text-[#1C1917] dark:text-[#F2F2F7]" title={item.label}>
              {item.label}
            </p>
            <p className="mt-0.5 truncate font-mono text-[9px] font-medium text-[#78716C] dark:text-[#A1A1AA]">
              {item.meta}
            </p>
          </div>
        ))}
      </div>
    ) : (
      <p className="mt-1.5 px-1 text-[11px] text-[#78716C] dark:text-[#A1A1AA]">{emptyLabel}</p>
    )}
  </div>
);

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onCreateTask,
  onOpenSettings,
  onOpenAIModal,
  desktopPlannerSurface = "calendar",
  onDesktopPlannerSurfaceChange,
  onDesktopTaskSubTabChange,
}) => {
  const {
    tasks,
    journalEntries,
    activeTaskSubTab,
    setActiveTaskSubTab,
    isSidebarOpen,
    openQuickTaskModal,
  } = useAppStore();

  const [isCalendarDropdownOpen, setIsCalendarDropdownOpen] = React.useState(false);
  const calendarDropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isCalendarDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (calendarDropdownRef.current && !calendarDropdownRef.current.contains(e.target as Node)) {
        setIsCalendarDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isCalendarDropdownOpen]);

  const todayStr = getLocalTodayStr(new Date());
  const taskItems = tasks.filter((task) => getTaskItemType(task) !== "event");

  // Task Stats for Badges
  const pendingTodayCount = taskItems.filter(
    (task) => !task.completed && isTaskDueToday(task)
  ).length;

  const overdueCount = taskItems.filter((task) => {
    if (task.completed) return false;
    const temporal = getTaskTemporalState(task);
    return temporal === "overdue" || temporal === "pastScheduled";
  }).length;

  const dueWithin24hCount = taskItems.filter((task) => {
    if (task.completed) return false;
    const temporal = getTaskTemporalState(task);
    if (temporal === "overdue" || temporal === "pastScheduled") return false;

    const timeType = normalizeTaskTimeType(task);
    const effectiveDate = getTaskEffectiveDate(task);
    const tomorrow = getLocalTodayStr(new Date(Date.now() + 86400000));
    return (
      (timeType === "deadline" || Boolean(task.deadlineTime)) &&
      (effectiveDate === todayStr || effectiveDate === tomorrow)
    );
  }).length;

  const deadlineAlertTotal = overdueCount + dueWithin24hCount;
  const notes = loadNotesFromStorage();
  const notesCount = notes.length;

  // === PHẦN: DỮ LIỆU TÓM TẮT CHO SIDEBAR MỞ RỘNG ===
  const todayTasks = taskItems.filter((task) => isTaskDueToday(task));
  const completedTodayCount = todayTasks.filter((task) => task.completed).length;
  const todayProgress = todayTasks.length
    ? Math.round((completedTodayCount / todayTasks.length) * 100)
    : 0;

  const upcomingTasks = taskItems
    .filter((task) => {
      if (task.completed) return false;
      const date = getTaskEffectiveDate(task);
      const temporal = getTaskTemporalState(task);
      return Boolean(date && date >= todayStr && temporal !== "overdue" && temporal !== "pastScheduled");
    })
    .sort((first, second) => {
      const firstKey = `${getTaskEffectiveDate(first) || "9999-12-31"} ${getTaskEffectiveTime(first) || "23:59"}`;
      const secondKey = `${getTaskEffectiveDate(second) || "9999-12-31"} ${getTaskEffectiveTime(second) || "23:59"}`;
      return firstKey.localeCompare(secondKey);
    })
    .slice(0, 2);

  const overdueTasks = taskItems
    .filter((task) => {
      if (task.completed) return false;
      const temporal = getTaskTemporalState(task);
      return temporal === "overdue" || temporal === "pastScheduled";
    })
    .slice(0, 2);

  const recentNotes = notes.slice(0, 2);
  const recentJournalDays = Array.from(
    journalEntries.reduce((days, entry) => {
      days.set(entry.date, (days.get(entry.date) || 0) + 1);
      return days;
    }, new Map<string, number>())
  )
    .sort(([firstDate], [secondDate]) => secondDate.localeCompare(firstDate))
    .slice(0, 2);

  // Active state determinations
  const isTodayActive =
    activeTab === "today" ||
    (activeTab === "tasks" && activeTaskSubTab === "today");
  const isAllTasksActive = activeTab === "tasks" && activeTaskSubTab === "all";
  const isPlannerActive =
    activeTab === "planner" ||
    (activeTab === "tasks" && activeTaskSubTab === "planner");
  const isDeadlinesActive =
    activeTab === "deadlines" ||
    (activeTab === "tasks" && activeTaskSubTab === "deadlines");
  const isNotesActive = activeTab === "notes";
  const isJournalActive = activeTab === "journal";
  const isCalendarWorkspace = isPlannerActive;

  // Handlers
  const handleSelectToday = () => {
    setActiveTaskSubTab("today");
    onTabChange("today");
  };

  const handleSelectAllTasks = () => {
    if (onDesktopTaskSubTabChange) {
      onDesktopTaskSubTabChange("all");
      return;
    }
    setActiveTaskSubTab("all");
    onTabChange("tasks");
  };

  const handleSelectPlanner = () => {
    setActiveTaskSubTab("planner");
    onTabChange("planner");
  };

  const handleSelectCalendar = () => {
    onDesktopPlannerSurfaceChange?.("calendar");
    handleSelectPlanner();
  };

  const handleSelectPlannerList = () => {
    onDesktopPlannerSurfaceChange?.("list");
    handleSelectPlanner();
  };

  const handleSelectDeadlines = () => {
    setActiveTaskSubTab("deadlines");
    onTabChange("deadlines");
  };

  const handleSelectNotes = () => {
    onTabChange("notes");
  };

  const handleSelectJournal = () => {
    onTabChange("journal");
  };

  const formatSidebarDate = (date?: string) => {
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return "Chưa đặt ngày";
    return `${date.slice(8, 10)}/${date.slice(5, 7)}`;
  };

  // ----------------------------------------------------
  // COLLAPSED MODE (w-[72px] icon-only navigation)
  // ----------------------------------------------------
  if (!isSidebarOpen) {
    return (
      <aside className="hidden md:flex flex-col items-center justify-between h-[calc(100vh-60px)] sticky top-[60px] bg-[#F8F9FA] dark:bg-[#141417] select-none z-20 shrink-0 w-[72px] py-3 px-2 transition-all duration-200 ease-in-out">
        <div className="flex flex-col items-center gap-1.5 w-full">
          {/* Quick Create Task Button */}
          {onCreateTask && (
            <div ref={isCalendarWorkspace ? calendarDropdownRef : undefined} className="relative">
              <button
                type="button"
                onClick={() => {
                  if (isCalendarWorkspace) {
                    setIsCalendarDropdownOpen((prev) => !prev);
                  } else {
                    onCreateTask();
                  }
                }}
                title={isCalendarWorkspace ? "Tạo mới (Sự kiện / Công việc)" : "Tạo công việc mới (N)"}
                aria-label="Tạo mới"
                className="w-10 h-10 mb-2 rounded-xl flex items-center justify-center bg-[#09090B] dark:bg-white text-white dark:text-[#09090B] border-[1.5px] border-[#18181B] dark:border-white shadow-[2px_2px_0px_#18181B] dark:shadow-none hover:bg-black active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
              >
                <Plus size={18} strokeWidth={2.6} />
              </button>

              {isCalendarWorkspace && isCalendarDropdownOpen && (
                <div className="absolute left-[calc(100%+8px)] top-0 z-50 min-w-[160px] rounded-xl border-[1.5px] border-[#18181B] dark:border-[#2E2E34] bg-white dark:bg-[#1F1F23] shadow-[3px_3px_0px_#18181B] dark:shadow-none p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCalendarDropdownOpen(false);
                      openQuickTaskModal({ itemType: "event" });
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-bold text-[#09090B] dark:text-[#FFFFFF] hover:bg-[var(--accent-blue)] hover:text-white transition-colors cursor-pointer text-left"
                  >
                    <CalendarIcon size={14} strokeWidth={2.2} className="text-[var(--accent-blue)]" />
                    <span>Tạo sự kiện</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsCalendarDropdownOpen(false);
                      openQuickTaskModal({ itemType: "task" });
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-bold text-[#09090B] dark:text-[#FFFFFF] hover:bg-[var(--accent-sky)] hover:text-[#09090B] transition-colors cursor-pointer text-left"
                  >
                    <Plus size={14} strokeWidth={2.4} className="text-[var(--accent-sky)]" />
                    <span>Tạo công việc</span>
                  </button>
                </div>
              )}
            </div>
          )}

          <nav className="flex flex-col items-center gap-1.5 w-full" aria-label="Menu thu gọn">
            {isCalendarWorkspace && (
              <>
                <button
                  type="button"
                  onClick={handleSelectCalendar}
                  title="Lịch"
                  aria-current={desktopPlannerSurface === "calendar" ? "page" : undefined}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center border-[1.5px] transition-all cursor-pointer ${
                    desktopPlannerSurface === "calendar"
                      ? "bg-[#09090B] text-white border-[#09090B] shadow-[2px_2px_0px_#18181B] dark:bg-white dark:text-[#09090B] dark:border-white dark:shadow-none"
                      : "border-transparent text-[#71717A] dark:text-[#A1A1AA] hover:bg-black/5 hover:text-[#09090B] dark:hover:bg-white/10 dark:hover:text-white"
                  } active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none`}
                >
                  <CalendarIcon size={18} strokeWidth={2.2} />
                </button>
                <button
                  type="button"
                  onClick={handleSelectPlannerList}
                  title="Danh sách"
                  aria-current={desktopPlannerSurface === "list" ? "page" : undefined}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center border-[1.5px] transition-all cursor-pointer ${
                    desktopPlannerSurface === "list"
                      ? "bg-[#09090B] text-white border-[#09090B] shadow-[2px_2px_0px_#18181B] dark:bg-white dark:text-[#09090B] dark:border-white dark:shadow-none"
                      : "border-transparent text-[#71717A] dark:text-[#A1A1AA] hover:bg-black/5 hover:text-[#09090B] dark:hover:bg-white/10 dark:hover:text-white"
                  } active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none`}
                >
                  <List size={18} strokeWidth={2.2} />
                </button>
              </>
            )}

            {!isCalendarWorkspace && (
              <>
            <button
              type="button"
              onClick={handleSelectAllTasks}
              title="Tất cả việc"
              className={`w-11 h-11 rounded-xl flex items-center justify-center border-[1.5px] transition-all cursor-pointer ${
                isAllTasksActive
                  ? "bg-[#09090B] text-white border-[#09090B] shadow-[2px_2px_0px_#18181B] dark:bg-white dark:text-[#09090B] dark:border-white dark:shadow-none"
                  : "border-transparent text-[#71717A] dark:text-[#A1A1AA] hover:bg-black/5 hover:text-[#09090B] dark:hover:bg-white/10 dark:hover:text-white"
              } active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none`}
            >
              <ListTodo size={18} strokeWidth={2.2} />
            </button>
            <button
              type="button"
              onClick={handleSelectToday}
              title="Hôm nay"
              className={`w-11 h-11 rounded-xl flex items-center justify-center border-[1.5px] transition-all cursor-pointer ${
                isTodayActive
                  ? "bg-[#09090B] text-white border-[#09090B] shadow-[2px_2px_0px_#18181B] dark:bg-white dark:text-[#09090B] dark:border-white dark:shadow-none"
                  : "border-transparent text-[#71717A] dark:text-[#A1A1AA] hover:bg-black/5 hover:text-[#09090B] dark:hover:bg-white/10 dark:hover:text-white"
              } active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none`}
            >
              <Sun size={18} strokeWidth={2.2} />
            </button>

            <button
              type="button"
              onClick={handleSelectDeadlines}
              title="Hạn định & Quá hạn"
              className={`w-11 h-11 rounded-xl flex items-center justify-center border-[1.5px] transition-all cursor-pointer relative ${
                isDeadlinesActive
                  ? "bg-[#09090B] text-white border-[#09090B] shadow-[2px_2px_0px_#18181B] dark:bg-white dark:text-[#09090B] dark:border-white dark:shadow-none"
                  : "border-transparent text-[#71717A] dark:text-[#A1A1AA] hover:bg-black/5 hover:text-[#09090B] dark:hover:bg-white/10 dark:hover:text-white"
              } active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none`}
            >
              <Hourglass size={18} strokeWidth={2.2} />
              {deadlineAlertTotal > 0 && (
                <span className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                  isDeadlinesActive ? "bg-white dark:bg-[#09090B]" : "bg-[#DC2626] dark:bg-[#EF4444]"
                }`} />
              )}
            </button>

            <button
              type="button"
              onClick={handleSelectNotes}
              title="Ghi chú phác thảo"
              className={`w-11 h-11 rounded-xl flex items-center justify-center border-[1.5px] transition-all cursor-pointer ${
                isNotesActive
                  ? "bg-[#09090B] text-white border-[#09090B] shadow-[2px_2px_0px_#18181B] dark:bg-white dark:text-[#09090B] dark:border-white dark:shadow-none"
                  : "border-transparent text-[#71717A] dark:text-[#A1A1AA] hover:bg-black/5 hover:text-[#09090B] dark:hover:bg-white/10 dark:hover:text-white"
              } active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none`}
            >
              <FilePenLine size={18} strokeWidth={2.2} />
            </button>

            <button
              type="button"
              onClick={handleSelectJournal}
              title="Sổ nhật ký"
              className={`w-11 h-11 rounded-xl flex items-center justify-center border-[1.5px] transition-all cursor-pointer ${
                isJournalActive
                  ? "bg-[#09090B] text-white border-[#09090B] shadow-[2px_2px_0px_#18181B] dark:bg-white dark:text-[#09090B] dark:border-white dark:shadow-none"
                  : "border-transparent text-[#71717A] dark:text-[#A1A1AA] hover:bg-black/5 hover:text-[#09090B] dark:hover:bg-white/10 dark:hover:text-white"
              } active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none`}
            >
              <BookOpen size={18} strokeWidth={2.2} />
            </button>
              </>
            )}
          </nav>
        </div>

        {/* Bottom Actions (Settings) */}
        {onOpenSettings && (
          <div className="flex flex-col items-center gap-1.5 w-full pt-2 border-t border-[#262626]/20">
            <button
              type="button"
              onClick={onOpenSettings}
              title="Cài đặt"
              className="w-11 h-11 rounded-xl flex items-center justify-center border-[1.5px] border-transparent hover:border-[#262626] text-[#78716C] hover:text-[#1C1917] dark:hover:text-white transition-all cursor-pointer"
            >
              <Settings size={18} strokeWidth={2.2} />
            </button>
          </div>
        )}
      </aside>
    );
  }

  // ----------------------------------------------------
  // EXPANDED MODE (Full 240px Navigation Sidebar)
  // ----------------------------------------------------
  return (
    <aside className="hidden md:flex flex-col justify-between h-[calc(100vh-60px)] sticky top-[60px] bg-[#F8F9FA] dark:bg-[#141417] select-none z-20 shrink-0 w-60 p-3 transition-all duration-200 ease-in-out">
      <div className="flex flex-col gap-2 overflow-y-auto no-scrollbar">
        {/* Quick Create Task Button */}
        {onCreateTask && (
          <div ref={isCalendarWorkspace ? calendarDropdownRef : undefined} className="relative">
            <button
              type="button"
              onClick={() => {
                if (isCalendarWorkspace) {
                  setIsCalendarDropdownOpen((prev) => !prev);
                } else {
                  onCreateTask();
                }
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold bg-[#09090B] dark:bg-white text-white dark:text-[#09090B] border-[1.5px] border-[#18181B] dark:border-white shadow-[2px_2px_0px_#18181B] dark:shadow-none hover:bg-black active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
            >
              <Plus size={16} strokeWidth={2.6} />
              <span>{isCalendarWorkspace ? "Tạo sự kiện hoặc việc" : "Tạo công việc mới"}</span>
            </button>

            {isCalendarWorkspace && isCalendarDropdownOpen && (
              <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 rounded-xl border-[1.5px] border-[#18181B] dark:border-[#2E2E34] bg-white dark:bg-[#1F1F23] shadow-[3px_3px_0px_#18181B] dark:shadow-none p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsCalendarDropdownOpen(false);
                    openQuickTaskModal({ itemType: "event" });
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-bold text-[#09090B] dark:text-[#FFFFFF] hover:bg-[var(--accent-blue)] hover:text-white transition-colors cursor-pointer text-left"
                >
                  <CalendarIcon size={14} strokeWidth={2.2} className="text-[var(--accent-blue)]" />
                  <span>Tạo sự kiện</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsCalendarDropdownOpen(false);
                    openQuickTaskModal({ itemType: "task" });
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-bold text-[#09090B] dark:text-[#FFFFFF] hover:bg-[var(--accent-sky)] hover:text-[#09090B] transition-colors cursor-pointer text-left"
                >
                  <Plus size={14} strokeWidth={2.4} className="text-[var(--accent-sky)]" />
                  <span>Tạo công việc</span>
                </button>
              </div>
            )}
          </div>
        )}

        <div className="space-y-1">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] px-2 py-1">
            {isCalendarWorkspace ? "Không gian lịch" : "Không gian công việc"}
          </p>

          {!isCalendarWorkspace && (
            <>
          {/* 1. TẤT CẢ VIỆC */}
          <button
            type="button"
            onClick={handleSelectAllTasks}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold border-[1.5px] transition-all cursor-pointer ${
              isAllTasksActive
                ? "bg-[#09090B] text-white border-[#09090B] shadow-[2px_2px_0px_#18181B] dark:bg-white dark:text-[#09090B] dark:border-white dark:shadow-none"
                : "border-transparent text-[#71717A] dark:text-[#A1A1AA] hover:bg-black/5 hover:text-[#09090B] dark:hover:bg-white/10 dark:hover:text-white"
            } active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none`}
          >
            <div className="flex items-center gap-2.5">
              <ListTodo size={16} strokeWidth={2.2} />
              <span className={isAllTasksActive ? "font-bold" : ""}>Tất cả việc</span>
            </div>
            <span className={`font-mono text-[10px] ${
              isAllTasksActive ? "text-white/80 dark:text-[#09090B]/80" : "text-[#71717A] dark:text-[#A1A1AA]"
            }`}>
              {taskItems.length}
            </span>
          </button>
          {/* 1. HÔM NAY */}
          <button
            type="button"
            onClick={handleSelectToday}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold border-[1.5px] transition-all cursor-pointer ${
              isTodayActive
                ? "bg-[#09090B] text-white border-[#09090B] shadow-[2px_2px_0px_#18181B] dark:bg-white dark:text-[#09090B] dark:border-white dark:shadow-none"
                : "border-transparent text-[#71717A] dark:text-[#A1A1AA] hover:bg-black/5 hover:text-[#09090B] dark:hover:bg-white/10 dark:hover:text-white"
            } active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none`}
          >
            <div className="flex items-center gap-2.5">
              <Sun size={16} strokeWidth={2.2} />
              <span className={isTodayActive ? "font-bold" : ""}>Hôm nay</span>
            </div>
            {pendingTodayCount > 0 && (
              <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full font-bold min-w-[20px] text-center ${
                isTodayActive
                  ? "bg-white text-[#09090B] dark:bg-[#141417] dark:text-white"
                  : "bg-black/10 text-[#09090B] dark:bg-white/15 dark:text-[#FFFFFF]"
              }`}>
                {pendingTodayCount}
              </span>
            )}
          </button>
            </>
          )}

          {isCalendarWorkspace && (
            <>
              {/* === PHẦN: TABS LỊCH DESKTOP === */}
              <button
                type="button"
                onClick={handleSelectCalendar}
                aria-current={desktopPlannerSurface === "calendar" ? "page" : undefined}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold border-[1.5px] transition-all cursor-pointer ${
                  desktopPlannerSurface === "calendar"
                    ? "bg-[#09090B] text-white border-[#09090B] shadow-[2px_2px_0px_#18181B] dark:bg-white dark:text-[#09090B] dark:border-white dark:shadow-none"
                    : "border-transparent text-[#71717A] dark:text-[#A1A1AA] hover:bg-black/5 hover:text-[#09090B] dark:hover:bg-white/10 dark:hover:text-white"
                } active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none`}
              >
                <CalendarIcon size={16} strokeWidth={2.2} />
                <span className="font-bold">Lịch</span>
              </button>
              <button
                type="button"
                onClick={handleSelectPlannerList}
                aria-current={desktopPlannerSurface === "list" ? "page" : undefined}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold border-[1.5px] transition-all cursor-pointer ${
                  desktopPlannerSurface === "list"
                    ? "bg-[#09090B] text-white border-[#09090B] shadow-[2px_2px_0px_#18181B] dark:bg-white dark:text-[#09090B] dark:border-white dark:shadow-none"
                    : "border-transparent text-[#71717A] dark:text-[#A1A1AA] hover:bg-black/5 hover:text-[#09090B] dark:hover:bg-white/10 dark:hover:text-white"
                } active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none`}
              >
                <List size={16} strokeWidth={2.2} />
                <span className="font-bold">Danh sách</span>
              </button>
            </>
          )}

          {!isCalendarWorkspace && (
            <>
          {/* 3. HẠN ĐỊNH */}
          <button
            type="button"
            onClick={handleSelectDeadlines}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold border-[1.5px] transition-all cursor-pointer ${
              isDeadlinesActive
                ? "bg-[#09090B] text-white border-[#09090B] shadow-[2px_2px_0px_#18181B] dark:bg-white dark:text-[#09090B] dark:border-white dark:shadow-none"
                : "border-transparent text-[#71717A] dark:text-[#A1A1AA] hover:bg-black/5 hover:text-[#09090B] dark:hover:bg-white/10 dark:hover:text-white"
            } active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none`}
          >
            <div className="flex items-center gap-2.5">
              <Hourglass size={16} strokeWidth={2.2} />
              <span className={isDeadlinesActive ? "font-bold" : ""}>Hạn định</span>
            </div>
            {deadlineAlertTotal > 0 && (
              <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full font-bold min-w-[20px] text-center ${
                isDeadlinesActive
                  ? "bg-white text-[#09090B] dark:bg-[#141417] dark:text-white"
                  : "bg-[#DC2626] text-white dark:bg-[#EF4444] dark:text-white"
              }`}>
                {deadlineAlertTotal}
              </span>
            )}
          </button>

          {/* 4. GHI CHÚ */}
          <button
            type="button"
            onClick={handleSelectNotes}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold border-[1.5px] transition-all cursor-pointer ${
              isNotesActive
                ? "bg-[#09090B] text-white border-[#09090B] shadow-[2px_2px_0px_#18181B] dark:bg-white dark:text-[#09090B] dark:border-white dark:shadow-none"
                : "border-transparent text-[#71717A] dark:text-[#A1A1AA] hover:bg-black/5 hover:text-[#09090B] dark:hover:bg-white/10 dark:hover:text-white"
            } active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none`}
          >
            <div className="flex items-center gap-2.5">
              <FilePenLine size={16} strokeWidth={2.2} />
              <span className={isNotesActive ? "font-bold" : ""}>Ghi chú</span>
            </div>
            {notesCount > 0 && (
              <span className={`font-mono text-[10px] ${
                isNotesActive ? "text-white/80 dark:text-[#09090B]/80" : "text-[#71717A] dark:text-[#A1A1AA]"
              }`}>
                {notesCount}
              </span>
            )}
          </button>

          {/* 5. SỔ NHẬT KÝ */}
          <button
            type="button"
            onClick={handleSelectJournal}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold border-[1.5px] transition-all cursor-pointer ${
              isJournalActive
                ? "bg-[#09090B] text-white border-[#09090B] shadow-[2px_2px_0px_#18181B] dark:bg-white dark:text-[#09090B] dark:border-white dark:shadow-none"
                : "border-transparent text-[#71717A] dark:text-[#A1A1AA] hover:bg-black/5 hover:text-[#09090B] dark:hover:bg-white/10 dark:hover:text-white"
            } active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none`}
          >
            <div className="flex items-center gap-2.5">
              <BookOpen size={16} strokeWidth={2.2} />
              <span className={isJournalActive ? "font-bold" : ""}>Nhật ký</span>
            </div>
            {journalEntries.length > 0 && (
              <span className={`font-mono text-[10px] ${
                isJournalActive ? "text-white/80 dark:text-[#09090B]/80" : "text-[#71717A] dark:text-[#A1A1AA]"
              }`}>
                {journalEntries.length}
              </span>
            )}
          </button>
            </>
          )}
        </div>

        {/* === PHẦN: TÓM TẮT THEO NGỮ CẢNH DESKTOP === */}
        <section className="mt-3 border-t border-[#262626]/10 dark:border-[#3A3A3C] pt-3" aria-label="Tóm tắt không gian đang mở">
          {isAllTasksActive ? (
            <>
              <p className="px-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[#78716C] dark:text-[#A1A1AA]">
                Tất cả việc
              </p>
              <div className="mt-2 rounded-xl border border-[#262626]/10 bg-white/70 p-2.5 dark:border-[#3A3A3C] dark:bg-[#2C2C2E]">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-bold text-[#1C1917] dark:text-[#F2F2F7]">Tổng số việc</span>
                  <span className="font-mono text-[10px] font-bold text-[#78716C] dark:text-[#A1A1AA]">
                    {taskItems.filter((task) => !task.completed).length} đang làm
                  </span>
                </div>
                <p className="mt-1 text-[10px] text-[#78716C] dark:text-[#A1A1AA]">
                  Gồm cả việc chưa đặt ngày và việc đã hoàn thành.
                </p>
              </div>
              <SidebarTaskPreview title="Việc sắp tới" tasks={upcomingTasks} formatDate={formatSidebarDate} />
            </>
          ) : isTodayActive ? (
            <>
              <p className="px-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[#78716C] dark:text-[#A1A1AA]">
                Hôm nay
              </p>
              <div className="mt-2 rounded-xl border border-[#262626]/10 bg-white/70 p-2.5 dark:border-[#3A3A3C] dark:bg-[#2C2C2E]">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-bold text-[#1C1917] dark:text-[#F2F2F7]">Tiến độ</span>
                  <span className="font-mono text-[10px] font-bold text-[#78716C] dark:text-[#A1A1AA]">
                    {completedTodayCount}/{todayTasks.length || 0}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E7E5E4] dark:bg-[#3A3A3C]">
                  <div
                    className="h-full rounded-full bg-[#1C1917] transition-[width] duration-200 dark:bg-white"
                    style={{ width: `${todayProgress}%` }}
                  />
                </div>
              </div>
              <SidebarTaskPreview title="Việc kế tiếp" tasks={upcomingTasks} formatDate={formatSidebarDate} />
            </>
          ) : isPlannerActive ? (
            <SidebarTaskPreview title="Lịch sắp tới" tasks={upcomingTasks} formatDate={formatSidebarDate} />
          ) : isDeadlinesActive ? (
            <>
              <div className="flex items-center justify-between gap-2 px-1">
                <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#78716C] dark:text-[#A1A1AA]">
                  Cần xử lý
                </p>
                <span className="rounded-full bg-[#FF3B30]/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#FF3B30]">
                  {overdueCount} quá hạn
                </span>
              </div>
              <SidebarTaskPreview tasks={overdueTasks} formatDate={formatSidebarDate} />
            </>
          ) : isNotesActive ? (
            <SidebarTextPreview
              title="Ghi chú gần đây"
              items={recentNotes.map((note) => ({
                id: note.id,
                label: note.title || "Ghi chú không tiêu đề",
                meta: note.updatedAt,
              }))}
            />
          ) : isJournalActive ? (
            <SidebarTextPreview
              title="Nhật ký gần đây"
              items={recentJournalDays.map(([date, count]) => ({
                id: date,
                label: formatSidebarDate(date),
                meta: `${count} ghi chép`,
              }))}
              emptyLabel="Chưa có ngày ghi chép"
            />
          ) : (
            <SidebarTaskPreview title="Tổng quan hôm nay" tasks={upcomingTasks} formatDate={formatSidebarDate} />
          )}
        </section>
      </div>

      {/* FOOTER ACTIONS (CÀI ĐẶT) */}
      {onOpenSettings && (
        <div className="pt-2 border-t-[1.5px] border-[#18181B]/15 dark:border-[#2E2E34]">
          <button
            type="button"
            onClick={onOpenSettings}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA] hover:text-[#09090B] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 border-[1.5px] border-transparent hover:border-[#18181B] dark:hover:border-white shadow-none hover:shadow-[1.5px_1.5px_0px_#18181B] dark:hover:shadow-none transition-all cursor-pointer"
          >
            <Settings size={16} strokeWidth={2.2} />
            <span>Cài đặt</span>
          </button>
        </div>
      )}
    </aside>
  );
};
