import React from "react";
import { TabKey } from "../../types";
import { useAppStore } from "../../stores/appStore";
import {
  BookOpen,
  Calendar as CalendarIcon,
  CheckSquare,
  FileText,
  Hourglass,
  FilePenLine,
  Plus,
  Sparkles,
  Sun,
} from "lucide-react";
import {
  getTaskEffectiveDate,
  getTaskTemporalState,
  isTaskDueToday,
  normalizeTaskTimeType,
} from "../../utils/taskSemantics";
import { getLocalTodayStr } from "../../utils/date";
import { loadNotesFromStorage } from "../../utils/noteStorage";

// Desktop navigation keeps the same four workspaces as mobile and tablet.
export interface SidebarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  onCreateTask?: () => void;
  onOpenSettings?: () => void;
}

const baseItemClass =
  "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer select-none active:scale-[0.98]";

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, onCreateTask }) => {
  const {
    tasks,
    journalEntries,
    activeTaskSubTab,
    setActiveTaskSubTab,
    isSidebarOpen,
  } = useAppStore();
  const todayStr = getLocalTodayStr(new Date());
  const pendingTodayCount = tasks.filter((task) => !task.completed && isTaskDueToday(task)).length;
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
    return (timeType === "deadline" || Boolean(task.deadlineTime)) &&
      (effectiveDate === todayStr || effectiveDate === tomorrow);
  }).length;
  const deadlineAlertTotal = overdueCount + dueWithin24hCount;
  const notesCount = loadNotesFromStorage().length;

  const isTodayActive = activeTab === "today" || (activeTab === "tasks" && activeTaskSubTab === "today");
  const isTasksActive = activeTab === "tasks" && activeTaskSubTab !== "today";
  const isNotesActive = activeTab === "notes" || activeTab === "journal";
  const isAiActive = activeTab === "ai";

  const goToday = () => {
    setActiveTaskSubTab("today");
    onTabChange("today");
  };

  const goTasks = () => onTabChange("tasks");

  const renderWorkspaceButton = (
    label: string,
    icon: React.ReactNode,
    isActive: boolean,
    onClick: () => void,
    trailing?: React.ReactNode,
  ) => (
    <button
      type="button"
      onClick={onClick}
      className={`${baseItemClass} ${
        isActive
          ? "bg-black/[0.08] dark:bg-white/[0.12] text-[#1C1C1E] dark:text-[#F2F2F7] font-semibold shadow-xs"
          : "bg-transparent text-[#8E8E93] dark:text-[#8E8E93] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-[#1C1C1E] dark:hover:text-[#F2F2F7]"
      }`}
    >
      <span className="flex items-center gap-3 min-w-0">
        <span className={isActive ? "text-[#007AFF] dark:text-[#0A84FF]" : "text-[#8E8E93] dark:text-[#8E8E93]"}>
          {icon}
        </span>
        <span className="tracking-tight truncate">{label}</span>
      </span>
      {trailing}
    </button>
  );

  const renderSubButton = (
    label: string,
    icon: React.ReactNode,
    isActive: boolean,
    onClick: () => void,
    trailing?: React.ReactNode,
  ) => (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between pl-9 pr-3 py-2 rounded-lg text-xs transition-all cursor-pointer select-none active:scale-[0.98] ${
        isActive
          ? "bg-black/[0.06] dark:bg-white/[0.08] text-[#1C1C1E] dark:text-[#F2F2F7] font-semibold"
          : "text-[#8E8E93] dark:text-[#8E8E93] hover:bg-black/[0.03] dark:hover:bg-white/[0.04] hover:text-[#1C1C1E] dark:hover:text-[#F2F2F7]"
      }`}
    >
      <span className="flex items-center gap-2 min-w-0">
        <span className={isActive ? "text-[#007AFF] dark:text-[#0A84FF]" : "text-[#8E8E93] dark:text-[#8E8E93]"}>
          {icon}
        </span>
        <span className="truncate">{label}</span>
      </span>
      {trailing}
    </button>
  );

  if (!isSidebarOpen) {
    return (
      <aside className="hidden md:flex flex-col items-center h-[calc(100vh-60px)] sticky top-[60px] bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl border-r border-[#E5E5EA] dark:border-[#2C2C2E] select-none z-20 shrink-0 w-[72px] py-3 px-2 transition-[width] duration-200">
        {onCreateTask && (
          <button
            type="button"
            onClick={onCreateTask}
            title="Tạo công việc mới"
            aria-label="Tạo công việc mới"
            className="w-full py-2.5 px-1 mb-2 rounded-xl flex flex-col items-center justify-center gap-1 bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] shadow-sm hover:opacity-90 transition-all cursor-pointer active:scale-95"
          >
            <Plus size={18} strokeWidth={2.4} />
            <span className="text-[10px] leading-none truncate font-semibold">Tạo mới</span>
          </button>
        )}
        <nav className="flex flex-col items-center gap-1 w-full" aria-label="Không gian chính">
          <button
            type="button"
            onClick={goToday}
            title="Hôm nay"
            className={`w-full py-2.5 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              isTodayActive
                ? "bg-black/[0.08] dark:bg-white/[0.12] text-[#007AFF] dark:text-[#0A84FF] font-semibold"
                : "text-[#8E8E93] dark:text-[#8E8E93] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-[#1C1C1E] dark:hover:text-white"
            } active:scale-95`}
          >
            <Sun size={18} strokeWidth={2.2} />
            <span className="text-[10px] leading-none truncate font-medium">Nay</span>
          </button>
          <button
            type="button"
            onClick={goTasks}
            title="Công việc"
            className={`w-full py-2.5 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              isTasksActive
                ? "bg-black/[0.08] dark:bg-white/[0.12] text-[#007AFF] dark:text-[#0A84FF] font-semibold"
                : "text-[#8E8E93] dark:text-[#8E8E93] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-[#1C1C1E] dark:hover:text-white"
            } active:scale-95`}
          >
            <CheckSquare size={18} strokeWidth={2.2} />
            <span className="text-[10px] leading-none truncate font-medium">Việc</span>
          </button>
          <button
            type="button"
            onClick={() => onTabChange("notes")}
            title="Ghi chép"
            className={`w-full py-2.5 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              isNotesActive
                ? "bg-black/[0.08] dark:bg-white/[0.12] text-[#007AFF] dark:text-[#0A84FF] font-semibold"
                : "text-[#8E8E93] dark:text-[#8E8E93] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-[#1C1C1E] dark:hover:text-white"
            } active:scale-95`}
          >
            <FilePenLine size={18} strokeWidth={2.2} />
            <span className="text-[10px] leading-none truncate font-medium">Ghi</span>
          </button>
          <button
            type="button"
            onClick={() => onTabChange("ai")}
            title="Trợ lý AI"
            className={`w-full py-2.5 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              isAiActive
                ? "bg-black/[0.08] dark:bg-white/[0.12] text-[#007AFF] dark:text-[#0A84FF] font-semibold"
                : "text-[#8E8E93] dark:text-[#8E8E93] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-[#1C1C1E] dark:hover:text-white"
            } active:scale-95`}
          >
            <Sparkles size={18} strokeWidth={2.2} />
            <span className="text-[10px] leading-none truncate font-medium">AI</span>
          </button>
        </nav>
      </aside>
    );
  }

  return (
    <aside className="hidden md:flex flex-col h-[calc(100vh-60px)] sticky top-[60px] bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl border-r border-[#E5E5EA] dark:border-[#2C2C2E] select-none z-20 shrink-0 w-60 p-3 transition-[width] duration-200">
      <nav className="flex flex-col gap-1 overflow-y-auto no-scrollbar" aria-label="Không gian chính">
        {onCreateTask && (
          <button
            type="button"
            onClick={onCreateTask}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 mb-2 rounded-xl text-xs font-semibold bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] shadow-sm hover:opacity-90 transition-all cursor-pointer active:scale-[0.98]"
          >
            <Plus size={16} strokeWidth={2.4} />
            <span>Tạo mới</span>
          </button>
        )}
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8E8E93] px-3 py-1.5 font-mono">
          Không gian
        </p>

        {renderWorkspaceButton(
          "Nay",
          <Sun size={17} strokeWidth={2.2} className="shrink-0" />,
          isTodayActive,
          goToday,
          pendingTodayCount > 0 ? (
            <span className={`font-mono text-[10px] px-2 py-0.5 rounded-md font-semibold ${
              isTodayActive
                ? "bg-[#007AFF] text-white"
                : "bg-black/[0.05] dark:bg-white/[0.1] text-[#8E8E93]"
            }`}>
              {pendingTodayCount}
            </span>
          ) : undefined,
        )}

        {renderWorkspaceButton(
          "Việc",
          <CheckSquare size={17} strokeWidth={2.2} className="shrink-0" />,
          isTasksActive,
          goTasks,
        )}

        {isTasksActive && (
          <div className="space-y-0.5 pb-1" aria-label="Chế độ Công việc">
            {renderSubButton(
              "Kế hoạch",
              <CalendarIcon size={14} strokeWidth={2.2} />,
              activeTaskSubTab === "planner",
              () => {
                setActiveTaskSubTab("planner");
                onTabChange("tasks");
              },
            )}
            {renderSubButton(
              "Hạn định",
              <Hourglass size={14} strokeWidth={2.2} />,
              activeTaskSubTab === "deadlines",
              () => {
                setActiveTaskSubTab("deadlines");
                onTabChange("tasks");
              },
              deadlineAlertTotal > 0 ? (
                <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                  activeTaskSubTab === "deadlines"
                    ? "bg-[#FF3B30] text-white"
                    : "bg-[#FF3B30]/10 text-[#FF3B30]"
                }`}>
                  {deadlineAlertTotal}
                </span>
              ) : undefined,
            )}
          </div>
        )}

        {renderWorkspaceButton(
          "Ghi",
          <FilePenLine size={17} strokeWidth={2.2} className="shrink-0" />,
          isNotesActive,
          () => onTabChange("notes"),
          notesCount + journalEntries.length > 0 ? (
            <span className={`font-mono text-[10px] px-2 py-0.5 rounded-md font-semibold ${
              isNotesActive
                ? "bg-[#007AFF] text-white"
                : "bg-black/[0.05] dark:bg-white/[0.1] text-[#8E8E93]"
            }`}>
              {notesCount + journalEntries.length}
            </span>
          ) : undefined,
        )}

        {isNotesActive && (
          <div className="space-y-0.5 pb-1" aria-label="Chế độ Ghi chép">
            {renderSubButton(
              "Ghi chú",
              <FileText size={14} strokeWidth={2.2} />,
              activeTab === "notes",
              () => onTabChange("notes"),
              notesCount > 0 ? (
                <span className="font-mono text-[10px] text-[#8E8E93]">{notesCount}</span>
              ) : undefined,
            )}
            {renderSubButton(
              "Nhật ký",
              <BookOpen size={14} strokeWidth={2.2} />,
              activeTab === "journal",
              () => onTabChange("journal"),
              journalEntries.length > 0 ? (
                <span className="font-mono text-[10px] text-[#8E8E93]">{journalEntries.length}</span>
              ) : undefined,
            )}
          </div>
        )}

        {renderWorkspaceButton(
          "Trợ lý AI",
          <Sparkles size={17} strokeWidth={2.2} className="shrink-0 text-amber-500" />,
          isAiActive,
          () => onTabChange("ai"),
        )}
      </nav>
    </aside>
  );
};
