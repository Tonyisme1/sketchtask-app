import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Bell,
  BookOpen,
  Clock3,
  FilePenLine,
  Search,
  X,
} from "lucide-react";
import type { TaskDto } from "../../types";
import { useAppStore } from "../../stores";
import {
  getTaskEffectiveDate,
  getTaskEffectiveTime,
  getTaskItemType,
  getTaskTemporalState,
  isTaskDueToday,
} from "../../utils";
import { getLocalTodayStr } from "../../utils/date";
import { DesktopJournalTool } from "../tools/DesktopJournalTool";
import { DesktopNotesTool } from "../tools/DesktopNotesTool";

export type DesktopUtilityPanel =
  | "search"
  | "notifications"
  | "overdue"
  | "upcoming"
  | "notes"
  | "journal";

export interface DesktopRightDockProps {
  activeUtility: DesktopUtilityPanel | null;
  onUtilityChange: (utility: DesktopUtilityPanel | null) => void;
}

const utilityTitles: Record<DesktopUtilityPanel, string> = {
  search: "Tìm kiếm",
  notifications: "Thông báo",
  overdue: "Quá hạn",
  upcoming: "Sắp đến",
  notes: "Ghi chú",
  journal: "Nhật ký",
};

// Keep every utility surface aligned with the Desktop task-detail sidebar.
const DESKTOP_UTILITY_PANEL_WIDTH = "w-[360px] lg:w-[400px] xl:w-[480px] 2xl:w-[520px]";
const DESKTOP_UTILITY_DOCK_WIDTH = "w-[416px] lg:w-[456px] xl:w-[536px] 2xl:w-[576px]";

const sortByEffectiveTime = (first: TaskDto, second: TaskDto) => {
  const firstDate = getTaskEffectiveDate(first) || "9999-12-31";
  const secondDate = getTaskEffectiveDate(second) || "9999-12-31";
  const firstTime = getTaskEffectiveTime(first) || "99:99";
  const secondTime = getTaskEffectiveTime(second) || "99:99";
  return `${firstDate} ${firstTime}`.localeCompare(`${secondDate} ${secondTime}`);
};

export const DesktopRightDock: React.FC<DesktopRightDockProps> = ({
  activeUtility,
  onUtilityChange,
}) => {
  const dockRef = useRef<HTMLElement>(null);
  const [query, setQuery] = useState("");
  const { tasks, openTaskDetail } = useAppStore();
  const todayStr = getLocalTodayStr(new Date());

  const taskItems = useMemo(
    () => tasks.filter((task) => getTaskItemType(task) !== "event"),
    [tasks],
  );
  const overdueTasks = useMemo(
    () =>
      taskItems
        .filter((task) => {
          if (task.completed) return false;
          const state = getTaskTemporalState(task);
          return state === "overdue" || state === "pastScheduled";
        })
        .sort(sortByEffectiveTime),
    [taskItems],
  );
  const upcomingTasks = useMemo(
    () =>
      taskItems
        .filter((task) => {
          if (task.completed) return false;
          const state = getTaskTemporalState(task);
          const date = getTaskEffectiveDate(task);
          return state !== "overdue" && state !== "pastScheduled" && typeof date === "string" && date >= todayStr;
        })
        .sort(sortByEffectiveTime),
    [taskItems, todayStr],
  );
  const notificationTasks = useMemo(
    () =>
      [...overdueTasks, ...taskItems.filter((task) => !task.completed && isTaskDueToday(task))]
        .filter((task, index, list) => list.findIndex((item) => item.id === task.id) === index)
        .sort(sortByEffectiveTime),
    [overdueTasks, taskItems],
  );
  const searchResults = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return [];
    return tasks
      .filter((task) =>
        [task.title, task.description, task.tag, ...(task.tags || [])]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase()
          .includes(normalizedQuery),
      )
      .sort(sortByEffectiveTime)
      .slice(0, 12);
  }, [query, tasks]);

  useEffect(() => {
    if (!activeUtility) return;
    const closeWhenOutside = (event: MouseEvent) => {
      if (!dockRef.current?.contains(event.target as Node)) {
        onUtilityChange(null);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onUtilityChange(null);
    };
    document.addEventListener("mousedown", closeWhenOutside);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeWhenOutside);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [activeUtility, onUtilityChange]);

  const openTask = (task: TaskDto) => {
    onUtilityChange(null);
    openTaskDetail(task.id);
  };
  const toggleUtility = (utility: DesktopUtilityPanel) => {
    onUtilityChange(activeUtility === utility ? null : utility);
  };
  const renderTaskRows = (items: TaskDto[], emptyLabel: string) => {
    if (items.length === 0) {
      return <p className="px-3 py-10 text-center text-xs text-[var(--text-muted)]">{emptyLabel}</p>;
    }
    return (
      <div className="space-y-1 p-2">
        {items.map((task) => {
          const date = getTaskEffectiveDate(task);
          const time = getTaskEffectiveTime(task);
          return (
            <button
              key={task.id}
              type="button"
              onClick={() => openTask(task)}
              className="block w-full rounded-2xl px-3 py-2 text-left transition-colors hover:bg-[var(--bg-surface-muted)]"
            >
              <p className="truncate text-xs font-semibold text-[var(--text-main)]">
                {task.title?.trim() || "Công việc không tên"}
              </p>
              <p className="mt-1 truncate font-mono text-[10px] text-[var(--text-muted)]">
                {time || "Cả ngày"}{date ? ` · ${date}` : " · Chưa đặt ngày"}
              </p>
            </button>
          );
        })}
      </div>
    );
  };
  const renderPanelContent = () => {
    switch (activeUtility) {
      case "search":
        return (
          <div className="flex min-h-0 flex-1 flex-col">
            <label className="m-3 flex items-center gap-2 rounded-2xl bg-[var(--bg-surface-muted)] px-3 text-[var(--text-muted)] focus-within:ring-2 focus-within:ring-[var(--accent-blue)]/30">
              <Search size={16} strokeWidth={2.2} />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm task hoặc sự kiện..."
                className="min-w-0 flex-1 bg-transparent py-2 text-xs text-[var(--text-main)] outline-none placeholder:text-[var(--text-subtle)]"
              />
            </label>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {query.trim()
                ? renderTaskRows(searchResults, "Không tìm thấy kết quả phù hợp.")
                : <p className="px-5 py-10 text-center text-xs text-[var(--text-muted)]">Nhập từ khóa để tìm trong task và sự kiện.</p>}
            </div>
          </div>
        );
      case "notifications":
        return <div className="min-h-0 flex-1 overflow-y-auto">{renderTaskRows(notificationTasks, "Hiện không có thông báo cần xử lý.")}</div>;
      case "overdue":
        return <div className="min-h-0 flex-1 overflow-y-auto">{renderTaskRows(overdueTasks, "Không có công việc quá hạn.")}</div>;
      case "upcoming":
        return <div className="min-h-0 flex-1 overflow-y-auto">{renderTaskRows(upcomingTasks, "Chưa có công việc sắp đến.")}</div>;
      case "notes":
        return <DesktopNotesTool />;
      case "journal":
        return <DesktopJournalTool />;
      default:
        return null;
    }
  };

  const utilityButtons: Array<{ id: DesktopUtilityPanel; label: string; icon: React.ReactNode; count?: number }> = [
    { id: "search", label: "Tìm kiếm", icon: <Search size={19} strokeWidth={2.2} /> },
    { id: "notifications", label: "Thông báo", icon: <Bell size={19} strokeWidth={2.2} />, count: notificationTasks.length },
    { id: "overdue", label: "Quá hạn", icon: <AlertTriangle size={19} strokeWidth={2.2} />, count: overdueTasks.length },
    { id: "upcoming", label: "Sắp đến", icon: <Clock3 size={19} strokeWidth={2.2} />, count: upcomingTasks.length },
    { id: "notes", label: "Ghi chú", icon: <FilePenLine size={19} strokeWidth={2.2} /> },
    { id: "journal", label: "Nhật ký", icon: <BookOpen size={19} strokeWidth={2.2} /> },
  ];

  return (
    <aside
      ref={dockRef}
      aria-label="Công cụ Desktop"
      className={`z-30 flex h-full shrink-0 bg-[var(--bg-canvas)] transition-[width] duration-200 ease-out ${
        activeUtility ? DESKTOP_UTILITY_DOCK_WIDTH : "w-14"
      }`}
    >
      {activeUtility && (
        <section
          role="dialog"
          aria-label={utilityTitles[activeUtility]}
          className={`my-2 flex min-w-0 flex-col self-stretch overflow-hidden rounded-xl border border-[var(--border-ink-muted)] bg-[var(--bg-surface)] ${DESKTOP_UTILITY_PANEL_WIDTH}`}
        >
          <header className="flex h-12 shrink-0 items-center justify-between px-3">
            <h2 className="text-sm font-bold text-[var(--text-main)]">{utilityTitles[activeUtility]}</h2>
            <button
              type="button"
              onClick={() => onUtilityChange(null)}
              className="flex h-8 w-8 items-center justify-center rounded-2xl text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-surface-muted)] hover:text-[var(--text-main)] cursor-pointer"
              aria-label={`Đóng ${utilityTitles[activeUtility]}`}
            >
              <X size={17} strokeWidth={2.3} />
            </button>
          </header>
          {renderPanelContent()}
        </section>
      )}

      <nav className="flex w-14 shrink-0 flex-col items-center gap-1 bg-[var(--bg-surface-muted)] px-1.5 py-2" aria-label="Thanh công cụ">
        {utilityButtons.map((utility) => {
          const isActive = activeUtility === utility.id;
          return (
            <button
              key={utility.id}
              type="button"
              onClick={() => toggleUtility(utility.id)}
              title={utility.label}
              aria-label={utility.label}
              aria-pressed={isActive}
              className={`relative flex h-9 w-9 items-center justify-center rounded-2xl transition-colors cursor-pointer active:scale-95 ${
                isActive
                  ? "bg-[var(--text-strong)] text-[var(--bg-surface)] shadow-xs"
                  : "text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-main)]"
              }`}
            >
              {utility.icon}
              {utility.count && utility.count > 0 ? (
                <span className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-[var(--accent-coral)] px-1 font-mono text-[9px] font-bold leading-4 text-white">
                  {utility.count > 9 ? "9+" : utility.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
