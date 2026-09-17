// ==========================================
// COMPONENT: Desktop Sidebar (Central Ink & Paper Navigation)
// ==========================================

import React from "react";
import { TabKey } from "../../types";
import { useAppStore } from "../../stores/appStore";
import {
  Sun,
  Calendar as CalendarIcon,
  Hourglass,
  FilePenLine,
  BookOpen,
  Sparkles,
  Plus,
  Settings,
} from "lucide-react";
import {
  getTaskEffectiveDate,
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
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onCreateTask,
  onOpenSettings,
  onOpenAIModal,
}) => {
  const {
    tasks,
    journalEntries,
    activeTaskSubTab,
    setActiveTaskSubTab,
    isSidebarOpen,
  } = useAppStore();

  const todayStr = getLocalTodayStr(new Date());

  // Task Stats for Badges
  const pendingTodayCount = tasks.filter(
    (task) => !task.completed && isTaskDueToday(task)
  ).length;

  const overdueCount = tasks.filter((task) => {
    if (task.completed) return false;
    const temporal = getTaskTemporalState(task);
    return temporal === "overdue" || temporal === "pastScheduled";
  }).length;

  const dueWithin24hCount = tasks.filter((task) => {
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
  const notesCount = loadNotesFromStorage().length;

  // Active state determinations
  const isTodayActive =
    activeTab === "today" ||
    (activeTab === "tasks" && activeTaskSubTab === "today");
  const isPlannerActive =
    activeTab === "planner" ||
    (activeTab === "tasks" && activeTaskSubTab === "planner");
  const isDeadlinesActive =
    activeTab === "deadlines" ||
    (activeTab === "tasks" && activeTaskSubTab === "deadlines");
  const isNotesActive = activeTab === "notes";
  const isJournalActive = activeTab === "journal";

  // Handlers
  const handleSelectToday = () => {
    setActiveTaskSubTab("today");
    onTabChange("today");
  };

  const handleSelectPlanner = () => {
    setActiveTaskSubTab("planner");
    onTabChange("planner");
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

  // ----------------------------------------------------
  // COLLAPSED MODE (w-[72px] icon-only navigation)
  // ----------------------------------------------------
  if (!isSidebarOpen) {
    return (
      <aside className="hidden md:flex flex-col items-center justify-between h-[calc(100vh-60px)] sticky top-[60px] bg-[#FAF8F3] dark:bg-[#1C1C1E] border-r-[1.5px] border-[#262626] select-none z-20 shrink-0 w-[72px] py-3 px-2 transition-[width] duration-150">
        <div className="flex flex-col items-center gap-1.5 w-full">
          {/* Quick Create Task Button */}
          {onCreateTask && (
            <button
              type="button"
              onClick={onCreateTask}
              title="Tạo công việc mới (N)"
              aria-label="Tạo công việc mới"
              className="w-10 h-10 mb-2 rounded-xl flex items-center justify-center bg-[#1C1917] dark:bg-white text-white dark:text-[#1C1917] border-[1.5px] border-[#262626] shadow-[2px_2px_0px_#262626] hover:bg-black active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
            >
              <Plus size={18} strokeWidth={2.6} />
            </button>
          )}

          <nav className="flex flex-col items-center gap-1.5 w-full" aria-label="Menu thu gọn">
            <button
              type="button"
              onClick={handleSelectToday}
              title="Hôm nay"
              className={`w-11 h-11 rounded-xl flex items-center justify-center border-[1.5px] transition-all cursor-pointer ${
                isTodayActive
                  ? "bg-[#1C1917] text-white border-[#1C1917] dark:bg-white dark:text-[#1C1917] dark:border-white shadow-none"
                  : "border-transparent text-[#78716C] dark:text-[#A1A1AA] hover:bg-[#E7E5E4] hover:text-[#1C1917] dark:hover:bg-[#2C2C2E] dark:hover:text-white"
              } active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none`}
            >
              <Sun size={18} strokeWidth={2.2} />
            </button>

            <button
              type="button"
              onClick={handleSelectPlanner}
              title="Kế hoạch tuần & tháng"
              className={`w-11 h-11 rounded-xl flex items-center justify-center border-[1.5px] transition-all cursor-pointer ${
                isPlannerActive
                  ? "bg-[#1C1917] text-white border-[#1C1917] dark:bg-white dark:text-[#1C1917] dark:border-white shadow-none"
                  : "border-transparent text-[#78716C] dark:text-[#A1A1AA] hover:bg-[#E7E5E4] hover:text-[#1C1917] dark:hover:bg-[#2C2C2E] dark:hover:text-white"
              } active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none`}
            >
              <CalendarIcon size={18} strokeWidth={2.2} />
            </button>

            <button
              type="button"
              onClick={handleSelectDeadlines}
              title="Hạn định & Quá hạn"
              className={`w-11 h-11 rounded-xl flex items-center justify-center border-[1.5px] transition-all cursor-pointer relative ${
                isDeadlinesActive
                  ? "bg-[#1C1917] text-white border-[#1C1917] dark:bg-white dark:text-[#1C1917] dark:border-white shadow-none"
                  : "border-transparent text-[#78716C] dark:text-[#A1A1AA] hover:bg-[#E7E5E4] hover:text-[#1C1917] dark:hover:bg-[#2C2C2E] dark:hover:text-white"
              } active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none`}
            >
              <Hourglass size={18} strokeWidth={2.2} />
              {deadlineAlertTotal > 0 && (
                <span className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                  isDeadlinesActive ? "bg-white dark:bg-[#1C1917]" : "bg-[#1C1917] dark:bg-white"
                }`} />
              )}
            </button>

            <button
              type="button"
              onClick={handleSelectNotes}
              title="Ghi chú phác thảo"
              className={`w-11 h-11 rounded-xl flex items-center justify-center border-[1.5px] transition-all cursor-pointer ${
                isNotesActive
                  ? "bg-[#1C1917] text-white border-[#1C1917] dark:bg-white dark:text-[#1C1917] dark:border-white shadow-none"
                  : "border-transparent text-[#78716C] dark:text-[#A1A1AA] hover:bg-[#E7E5E4] hover:text-[#1C1917] dark:hover:bg-[#2C2C2E] dark:hover:text-white"
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
                  ? "bg-[#1C1917] text-white border-[#1C1917] dark:bg-white dark:text-[#1C1917] dark:border-white shadow-none"
                  : "border-transparent text-[#78716C] dark:text-[#A1A1AA] hover:bg-[#E7E5E4] hover:text-[#1C1917] dark:hover:bg-[#2C2C2E] dark:hover:text-white"
              } active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none`}
            >
              <BookOpen size={18} strokeWidth={2.2} />
            </button>
          </nav>
        </div>

        {/* Bottom Actions (AI & Settings) */}
        <div className="flex flex-col items-center gap-1.5 w-full pt-2 border-t border-[#262626]/20">
          <button
            type="button"
            onClick={onOpenAIModal || (() => onTabChange("ai"))}
            title="Trợ lý AI Phác Thảo"
            className="w-11 h-11 rounded-xl flex items-center justify-center border-[1.5px] border-[#262626] bg-white dark:bg-[#2C2C2E] text-[#1C1917] dark:text-white shadow-[1.5px_1.5px_0px_#262626] hover:bg-[#FAF8F3] dark:hover:bg-[#3A3A3C] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer"
          >
            <Sparkles size={18} strokeWidth={2.2} />
          </button>

          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              title="Cài đặt"
              className="w-11 h-11 rounded-xl flex items-center justify-center border-[1.5px] border-transparent hover:border-[#262626] text-[#78716C] hover:text-[#1C1917] dark:hover:text-white transition-all cursor-pointer"
            >
              <Settings size={18} strokeWidth={2.2} />
            </button>
          )}
        </div>
      </aside>
    );
  }

  // ----------------------------------------------------
  // EXPANDED MODE (Full 240px Navigation Sidebar)
  // ----------------------------------------------------
  return (
    <aside className="hidden md:flex flex-col justify-between h-[calc(100vh-60px)] sticky top-[60px] bg-[#FAF8F3] dark:bg-[#1C1C1E] border-r-[1.5px] border-[#262626] select-none z-20 shrink-0 w-60 p-3 transition-[width] duration-150">
      <div className="flex flex-col gap-2 overflow-y-auto no-scrollbar">
        {/* Quick Create Task Button */}
        {onCreateTask && (
          <button
            type="button"
            onClick={onCreateTask}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold bg-[#1C1917] dark:bg-white text-white dark:text-[#1C1917] border-[1.5px] border-[#262626] shadow-[2px_2px_0px_#262626] hover:bg-black active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
          >
            <Plus size={16} strokeWidth={2.6} />
            <span>Tạo công việc mới</span>
          </button>
        )}

        <div className="space-y-1">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#78716C] dark:text-[#A1A1AA] px-2 py-1">
            Không gian làm việc
          </p>

          {/* 1. HÔM NAY */}
          <button
            type="button"
            onClick={handleSelectToday}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold border-[1.5px] transition-all cursor-pointer ${
              isTodayActive
                ? "bg-[#1C1917] text-white border-[#1C1917] dark:bg-white dark:text-[#1C1917] dark:border-white shadow-none"
                : "border-transparent text-[#78716C] dark:text-[#A1A1AA] hover:bg-[#E7E5E4] hover:text-[#1C1917] dark:hover:bg-[#2C2C2E] dark:hover:text-white"
            } active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none`}
          >
            <div className="flex items-center gap-2.5">
              <Sun size={16} strokeWidth={2.2} />
              <span className={isTodayActive ? "font-bold" : ""}>Hôm nay</span>
            </div>
            {pendingTodayCount > 0 && (
              <span className={`font-mono text-[10px] px-1.5 py-0.25 rounded-md font-bold ${
                isTodayActive
                  ? "bg-white text-[#1C1917] dark:bg-[#1C1917] dark:text-white"
                  : "bg-[#E7E5E4] text-[#1C1917] dark:bg-[#2C2C2E] dark:text-[#F2F2F7]"
              }`}>
                {pendingTodayCount}
              </span>
            )}
          </button>

          {/* 2. KẾ HOẠCH */}
          <button
            type="button"
            onClick={handleSelectPlanner}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold border-[1.5px] transition-all cursor-pointer ${
              isPlannerActive
                ? "bg-[#1C1917] text-white border-[#1C1917] dark:bg-white dark:text-[#1C1917] dark:border-white shadow-none"
                : "border-transparent text-[#78716C] dark:text-[#A1A1AA] hover:bg-[#E7E5E4] hover:text-[#1C1917] dark:hover:bg-[#2C2C2E] dark:hover:text-white"
            } active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none`}
          >
            <div className="flex items-center gap-2.5">
              <CalendarIcon size={16} strokeWidth={2.2} />
              <span className={isPlannerActive ? "font-bold" : ""}>Kế hoạch</span>
            </div>
            <span className={`text-[10px] font-mono ${
              isPlannerActive ? "text-white/80 dark:text-[#1C1917]/80" : "text-[#78716C] dark:text-[#A1A1AA]"
            }`}>
              7 ngày
            </span>
          </button>

          {/* 3. HẠN ĐỊNH */}
          <button
            type="button"
            onClick={handleSelectDeadlines}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold border-[1.5px] transition-all cursor-pointer ${
              isDeadlinesActive
                ? "bg-[#1C1917] text-white border-[#1C1917] dark:bg-white dark:text-[#1C1917] dark:border-white shadow-none"
                : "border-transparent text-[#78716C] dark:text-[#A1A1AA] hover:bg-[#E7E5E4] hover:text-[#1C1917] dark:hover:bg-[#2C2C2E] dark:hover:text-white"
            } active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none`}
          >
            <div className="flex items-center gap-2.5">
              <Hourglass size={16} strokeWidth={2.2} />
              <span className={isDeadlinesActive ? "font-bold" : ""}>Hạn định</span>
            </div>
            {deadlineAlertTotal > 0 && (
              <span className={`font-mono text-[10px] px-1.5 py-0.25 rounded-md font-bold ${
                isDeadlinesActive
                  ? "bg-white text-[#1C1917] dark:bg-[#1C1917] dark:text-white"
                  : "bg-[#1C1917] text-white dark:bg-white dark:text-[#1C1917]"
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
                ? "bg-[#1C1917] text-white border-[#1C1917] dark:bg-white dark:text-[#1C1917] dark:border-white shadow-none"
                : "border-transparent text-[#78716C] dark:text-[#A1A1AA] hover:bg-[#E7E5E4] hover:text-[#1C1917] dark:hover:bg-[#2C2C2E] dark:hover:text-white"
            } active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none`}
          >
            <div className="flex items-center gap-2.5">
              <FilePenLine size={16} strokeWidth={2.2} />
              <span className={isNotesActive ? "font-bold" : ""}>Ghi chú</span>
            </div>
            {notesCount > 0 && (
              <span className={`font-mono text-[10px] ${
                isNotesActive ? "text-white/80 dark:text-[#1C1917]/80" : "text-[#78716C] dark:text-[#A1A1AA]"
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
                ? "bg-[#1C1917] text-white border-[#1C1917] dark:bg-white dark:text-[#1C1917] dark:border-white shadow-none"
                : "border-transparent text-[#78716C] dark:text-[#A1A1AA] hover:bg-[#E7E5E4] hover:text-[#1C1917] dark:hover:bg-[#2C2C2E] dark:hover:text-white"
            } active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none`}
          >
            <div className="flex items-center gap-2.5">
              <BookOpen size={16} strokeWidth={2.2} />
              <span className={isJournalActive ? "font-bold" : ""}>Nhật ký</span>
            </div>
            {journalEntries.length > 0 && (
              <span className={`font-mono text-[10px] ${
                isJournalActive ? "text-white/80 dark:text-[#1C1917]/80" : "text-[#78716C] dark:text-[#A1A1AA]"
              }`}>
                {journalEntries.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* FOOTER ACTIONS (AI POPUP & CÀI ĐẶT) */}
      <div className="pt-2 border-t-[1.5px] border-[#262626]/20 space-y-1">
        {/* Nút Trợ lý AI Phác Thảo */}
        <button
          type="button"
          onClick={onOpenAIModal || (() => onTabChange("ai"))}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold border-[1.5px] border-[#262626] bg-white dark:bg-[#2C2C2E] hover:bg-[#FAF8F3] dark:hover:bg-[#3A3A3C] text-[#1C1917] dark:text-[#F2F2F7] shadow-[1.5px_1.5px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Sparkles size={16} strokeWidth={2.2} />
            <span>Trợ lý AI</span>
          </div>
          <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-[#E7E5E4] dark:bg-[#3A3A3C] text-[#78716C] dark:text-[#A1A1AA] uppercase tracking-wider font-semibold">
            AI Side
          </span>
        </button>

        {/* Nút Cài đặt */}
        {onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#78716C] dark:text-[#A1A1AA] hover:text-[#1C1917] dark:hover:text-white hover:bg-white dark:hover:bg-[#2C2C2E] border-[1.5px] border-transparent hover:border-[#262626] transition-all cursor-pointer"
          >
            <Settings size={16} strokeWidth={2.2} />
            <span>Cài đặt</span>
          </button>
        )}
      </div>
    </aside>
  );
};

