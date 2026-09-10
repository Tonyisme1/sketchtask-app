import React from "react";
import { TabKey } from "../../types";
import { useAppStore } from "../../stores/appStore";
import {
  BookMarked,
  BookOpen,
  Calendar as CalendarIcon,
  CheckSquare,
  FileText,
  Hourglass,
  NotebookPen,
  Plus,
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

const activeItemClass =
  "border-[1.5px] border-[#262626] shadow-[2px_2px_0px_#262626] -translate-y-[0.5px]";

const baseItemClass =
  "w-full flex items-center justify-between px-3 py-2.5 rounded-[6px] text-xs font-bold transition-all cursor-pointer active:translate-x-[1px] active:translate-y-[1px] active:shadow-none";

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, onCreateTask }) => {
  const {
    tasks,
    notebooks,
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

  const isTodayActive = activeTab === "tasks" && activeTaskSubTab === "today";
  const isTasksActive = activeTab === "tasks" && activeTaskSubTab !== "today";
  const isNotesActive = activeTab === "notes" || activeTab === "journal";
  const isNotebooksActive = activeTab === "notebooks";

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
          ? `bg-[#1C1917] text-white border-[1.5px] border-[#1C1917] shadow-[2px_2px_0px_#262626]`
          : "bg-transparent text-[#57534E] hover:bg-white hover:text-[#1C1917]"
      }`}
    >
      <span className="flex items-center gap-3 min-w-0">
        {icon}
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
      className={`w-full flex items-center justify-between pl-10 pr-3 py-2 rounded-[5px] text-xs font-bold transition-all cursor-pointer active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
        isActive
          ? "bg-[#1C1917] text-white border border-[#1C1917]"
          : "text-[#78716C] hover:bg-white hover:text-[#1C1917]"
      }`}
    >
      <span className="flex items-center gap-2 min-w-0">
        {icon}
        <span className="truncate">{label}</span>
      </span>
      {trailing}
    </button>
  );

  if (!isSidebarOpen) {
    return (
      <aside className="hidden md:flex flex-col items-center h-[calc(100vh-56px)] sticky top-14 bg-[#FBF9F4] border-r-[1.5px] border-[#262626]/20 select-none z-20 shrink-0 w-[72px] py-3 px-1 transition-[width] duration-200">
        {onCreateTask && (
          <button
            type="button"
            onClick={onCreateTask}
            title="Tạo công việc mới"
            aria-label="Tạo công việc mới"
            className="w-full py-2.5 px-1 mb-1 rounded-[6px] flex flex-col items-center justify-center gap-1 bg-[#FEF08A] text-[#1C1917] border-[1.5px] border-[#262626] transition-all cursor-pointer active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
          >
            <Plus size={18} strokeWidth={2.8} />
            <span className="text-[10px] leading-none truncate font-bold">Tạo mới</span>
          </button>
        )}
        <nav className="flex flex-col items-center gap-1 w-full" aria-label="Không gian chính">
          <button
            type="button"
            onClick={goToday}
            title="Hôm nay"
            className={`w-full py-2.5 px-1 rounded-[6px] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              isTodayActive
                ? `bg-[#1C1917] text-white border-[1.5px] border-[#1C1917] shadow-[1.5px_1.5px_0px_#262626]`
                : "text-[#57534E] hover:bg-white hover:text-[#1C1917]"
            } active:translate-x-[1px] active:translate-y-[1px] active:shadow-none`}
          >
            <Sun size={18} strokeWidth={2.4} />
            <span className="text-[10px] leading-none truncate font-bold">Nay</span>
          </button>
          <button
            type="button"
            onClick={goTasks}
            title="Công việc"
            className={`w-full py-2.5 px-1 rounded-[6px] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              isTasksActive
                ? `bg-[#1C1917] text-white border-[1.5px] border-[#1C1917] shadow-[1.5px_1.5px_0px_#262626]`
                : "text-[#57534E] hover:bg-white hover:text-[#1C1917]"
            } active:translate-x-[1px] active:translate-y-[1px] active:shadow-none`}
          >
            <CheckSquare size={18} strokeWidth={2.4} />
            <span className="text-[10px] leading-none truncate font-bold">Việc</span>
          </button>
          <button
            type="button"
            onClick={() => onTabChange("notes")}
            title="Ghi chép"
            className={`w-full py-2.5 px-1 rounded-[6px] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              isNotesActive
                ? `bg-[#1C1917] text-white border-[1.5px] border-[#1C1917] shadow-[1.5px_1.5px_0px_#262626]`
                : "text-[#57534E] hover:bg-white hover:text-[#1C1917]"
            } active:translate-x-[1px] active:translate-y-[1px] active:shadow-none`}
          >
            <NotebookPen size={18} strokeWidth={2.4} />
            <span className="text-[10px] leading-none truncate font-bold">Ghi</span>
          </button>
          <button
            type="button"
            onClick={() => onTabChange("notebooks")}
            title="Sổ tay"
            className={`w-full py-2.5 px-1 rounded-[6px] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              isNotebooksActive
                ? `bg-[#1C1917] text-white border-[1.5px] border-[#1C1917] shadow-[1.5px_1.5px_0px_#262626]`
                : "text-[#57534E] hover:bg-white hover:text-[#1C1917]"
            } active:translate-x-[1px] active:translate-y-[1px] active:shadow-none`}
          >
            <BookMarked size={18} strokeWidth={2.4} />
            <span className="text-[10px] leading-none truncate font-bold">Sổ</span>
          </button>
        </nav>
      </aside>
    );
  }

  return (
    <aside className="hidden md:flex flex-col h-[calc(100vh-56px)] sticky top-14 bg-[#FBF9F4] border-r-[1.5px] border-[#262626]/20 select-none z-20 shrink-0 w-60 p-3 transition-[width] duration-200">
      <nav className="flex flex-col gap-1 overflow-y-auto no-scrollbar" aria-label="Không gian chính">
        {onCreateTask && (
          <button
            type="button"
            onClick={onCreateTask}
            className="w-full flex items-center justify-between px-3 py-2.5 mb-1 rounded-[6px] text-xs font-bold bg-[#FEF08A] text-[#1C1917] border-[1.5px] border-[#262626] transition-all cursor-pointer active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
          >
            <span className="flex items-center gap-3">
              <Plus size={17} strokeWidth={2.8} />
              <span>Tạo mới</span>
            </span>
            <span className="font-mono text-[10px]">⌘N</span>
          </button>
        )}
        <p className="text-[10px] font-black uppercase tracking-wider text-[#A8A29E] px-3 py-1.5 font-mono">
          Không gian
        </p>

        {renderWorkspaceButton(
          "Nay",
          <Sun size={17} strokeWidth={2.4} className="shrink-0" />,
          isTodayActive,
          goToday,
          pendingTodayCount > 0 ? (
            <span className={`font-mono text-[10px] px-2 py-0.5 rounded-[3px] font-bold ${
              isTodayActive ? "bg-white text-[#1C1917]" : "bg-[#FAF8F3] text-[#1C1917] border border-[#262626]"
            }`}>
              {pendingTodayCount}
            </span>
          ) : undefined,
        )}

        {renderWorkspaceButton(
          "Việc",
          <CheckSquare size={17} strokeWidth={2.4} className="shrink-0" />,
          isTasksActive,
          goTasks,
        )}

        {isTasksActive && (
          <div className="space-y-0.5 pb-1" aria-label="Chế độ Công việc">
            {renderSubButton(
              "Kế hoạch",
              <CalendarIcon size={14} strokeWidth={2.4} />,
              activeTaskSubTab === "planner",
              () => {
                setActiveTaskSubTab("planner");
                onTabChange("tasks");
              },
            )}
            {renderSubButton(
              "Hạn định",
              <Hourglass size={14} strokeWidth={2.4} />,
              activeTaskSubTab === "deadlines",
              () => {
                setActiveTaskSubTab("deadlines");
                onTabChange("tasks");
              },
              deadlineAlertTotal > 0 ? (
                <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-[3px] font-bold ${
                  activeTaskSubTab === "deadlines"
                    ? "bg-white text-[#1C1917]"
                    : "bg-[#1C1917] text-white border border-[#1C1917]"
                }`}>
                  {deadlineAlertTotal}
                </span>
              ) : undefined,
            )}
          </div>
        )}

        {renderWorkspaceButton(
          "Ghi",
          <NotebookPen size={17} strokeWidth={2.4} className="shrink-0" />,
          isNotesActive,
          () => onTabChange("notes"),
          notesCount + journalEntries.length > 0 ? (
            <span className={`font-mono text-[10px] px-2 py-0.5 rounded-[3px] font-bold ${
              isNotesActive ? "bg-white text-[#1C1917]" : "bg-[#FAF8F3] text-[#78716C] border border-[#D4CEBF]"
            }`}>
              {notesCount + journalEntries.length}
            </span>
          ) : undefined,
        )}

        {isNotesActive && (
          <div className="space-y-0.5 pb-1" aria-label="Chế độ Ghi chép">
            {renderSubButton(
              "Ghi chú",
              <FileText size={14} strokeWidth={2.4} />,
              activeTab === "notes",
              () => onTabChange("notes"),
              notesCount > 0 ? (
                <span className="font-mono text-[10px] text-[#78716C]">{notesCount}</span>
              ) : undefined,
            )}
            {renderSubButton(
              "Nhật ký",
              <BookOpen size={14} strokeWidth={2.4} />,
              activeTab === "journal",
              () => onTabChange("journal"),
              journalEntries.length > 0 ? (
                <span className="font-mono text-[10px] text-[#78716C]">{journalEntries.length}</span>
              ) : undefined,
            )}
          </div>
        )}

        {renderWorkspaceButton(
          "Sổ",
          <BookMarked size={17} strokeWidth={2.4} className="shrink-0" />,
          isNotebooksActive,
          () => onTabChange("notebooks"),
          notebooks.length > 0 ? (
            <span className={`font-mono text-[10px] px-2 py-0.5 rounded-[3px] font-bold ${
              isNotebooksActive ? "bg-white text-[#1C1917]" : "bg-[#FAF8F3] text-[#78716C] border border-[#D4CEBF]"
            }`}>
              {notebooks.length}
            </span>
          ) : undefined,
        )}
      </nav>
    </aside>
  );
};
