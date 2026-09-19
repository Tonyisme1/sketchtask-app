import React, { useMemo } from "react";
import { AlertTriangle, CalendarDays, CheckCircle2, Inbox, ListTodo, Plus } from "lucide-react";
import { useAppStore } from "../../shared/stores";
import {
  getLocalTodayStr,
  getTaskEffectiveDate,
  getTaskEffectiveTime,
  getTaskItemType,
  getTaskTemporalState,
} from "../../shared/utils";
import { TaskListSection } from "../../components/features/shared/TaskListSection";
import { getTaskProgress } from "../../utils/taskHierarchy";

// === COMPONENT: Desktop All Tasks View (Danh sách chung của workspace Công việc) ===

export const DesktopAllTasksView: React.FC = () => {
  const {
    tasks,
    toggleTask,
    deleteTask,
    moveTaskToTomorrow,
    hideCompletedTasks,
    openTaskDetail,
    openQuickTaskModal,
  } = useAppStore();

  const todayStr = getLocalTodayStr(new Date());
  const taskItems = useMemo(
    () => tasks.filter((task) => getTaskItemType(task) !== "event"),
    [tasks],
  );

  // === PHẦN 1: Ưu tiên việc cần xử lý trước, sau đó mới đến việc đã xong ===
  const orderedTasks = useMemo(() => {
    const temporalRank = (task: (typeof taskItems)[number]) => {
      if (task.completed) return 4;
      const temporal = getTaskTemporalState(task);
      if (temporal === "overdue" || temporal === "pastScheduled") return 0;
      const date = getTaskEffectiveDate(task);
      if (date === todayStr) return 1;
      if (date) return 2;
      return 3;
    };

    return [...taskItems].sort((first, second) => {
      const rankOrder = temporalRank(first) - temporalRank(second);
      if (rankOrder !== 0) return rankOrder;
      if (first.priority !== second.priority) {
        const priorityRank = { high: 0, medium: 1, low: 2 } as const;
        return (priorityRank[first.priority || "low"] ?? 2) - (priorityRank[second.priority || "low"] ?? 2);
      }
      const firstKey = `${getTaskEffectiveDate(first) || "9999-12-31"} ${getTaskEffectiveTime(first) || "99:99"}`;
      const secondKey = `${getTaskEffectiveDate(second) || "9999-12-31"} ${getTaskEffectiveTime(second) || "99:99"}`;
      return firstKey.localeCompare(secondKey);
    });
  }, [taskItems, todayStr]);

  const { total, completed } = useMemo(() => getTaskProgress(taskItems), [taskItems]);
  const activeCount = Math.max(0, total - completed);
  const progress = total ? Math.round((completed / total) * 100) : 0;
  const visibleTasks = hideCompletedTasks
    ? orderedTasks.filter((task) => !task.completed)
    : orderedTasks;

  const taskGroups = useMemo(() => {
    const activeTasks = visibleTasks.filter((task) => !task.completed);
    const completedTasks = visibleTasks.filter((task) => task.completed);
    const overdueTasks = activeTasks.filter((task) => {
      const temporal = getTaskTemporalState(task);
      return temporal === "overdue" || temporal === "pastScheduled";
    });
    const todayTasks = activeTasks.filter((task) => {
      const temporal = getTaskTemporalState(task);
      return temporal !== "overdue" && temporal !== "pastScheduled" && getTaskEffectiveDate(task) === todayStr;
    });
    const unscheduledTasks = activeTasks.filter((task) => !getTaskEffectiveDate(task));
    const upcomingTasks = activeTasks.filter((task) => {
      const date = getTaskEffectiveDate(task);
      return Boolean(date && date > todayStr);
    });

    return [
      {
        key: "overdue",
        title: "Quá hạn",
        subtitle: "Cần xử lý trước",
        icon: <AlertTriangle size={15} strokeWidth={2.2} />,
        tasks: overdueTasks,
        tone: "danger" as const,
        defaultCollapsed: overdueTasks.length > 6,
      },
      {
        key: "today",
        title: "Hôm nay",
        subtitle: "Việc đang cần làm",
        icon: <ListTodo size={15} strokeWidth={2.2} />,
        tasks: todayTasks,
        tone: "info" as const,
        defaultCollapsed: false,
      },
      {
        key: "upcoming",
        title: "Sắp tới",
        subtitle: "Đã có ngày thực hiện",
        icon: <CalendarDays size={15} strokeWidth={2.2} />,
        tasks: upcomingTasks,
        tone: "neutral" as const,
        defaultCollapsed: upcomingTasks.length > 8,
      },
      {
        key: "unscheduled",
        title: "Chưa đặt lịch",
        subtitle: "Việc đang chờ sắp xếp",
        icon: <Inbox size={15} strokeWidth={2.2} />,
        tasks: unscheduledTasks,
        tone: "neutral" as const,
        defaultCollapsed: false,
      },
      {
        key: "completed",
        title: "Đã hoàn thành",
        subtitle: "Lịch sử công việc",
        icon: <CheckCircle2 size={15} strokeWidth={2.2} />,
        tasks: completedTasks,
        tone: "success" as const,
        defaultCollapsed: true,
      },
    ].filter((group) => group.tasks.length > 0);
  }, [todayStr, visibleTasks]);

  const listProps = {
    onToggle: toggleTask,
    onEdit: (task: (typeof taskItems)[number]) => openTaskDetail(task.id),
    onDelete: deleteTask,
    onMoveTomorrow: moveTaskToTomorrow,
    onClick: (task: (typeof taskItems)[number]) => openTaskDetail(task.id),
    variant: "planner" as const,
    hideDate: false,
    showQuickAdd: false,
  };

  return (
    <div className="w-full min-w-0 space-y-5 select-none animate-in fade-in duration-150">
      {/* === PHẦN 2: Tiêu đề và thống kê chung === */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#262626]/20 pb-4 dark:border-transparent">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--border-ink)] bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] dark:bg-[var(--accent-blue)]/20">
            <ListTodo size={22} strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-black tracking-tight text-[#1C1917] dark:text-[#F2F2F7]">
              Tất cả việc
            </h1>
            <p className="mt-0.5 text-xs font-medium text-[#78716C] dark:text-[#A1A1AA]">
              {activeCount} đang làm · {completed} đã hoàn thành · {taskItems.length} tổng cộng
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {total > 0 && (
            <div className="hidden items-center gap-2 sm:flex" title={`Tiến độ ${progress}%`}>
              <div className="h-2 w-24 overflow-hidden rounded-full border border-[#262626] bg-[#F3EFE6] dark:border-[#48484A] dark:bg-[#2C2C2E]">
                <div className="h-full bg-[var(--accent-blue)] transition-[width] duration-300" style={{ width: `${progress}%` }} />
              </div>
              <span className="font-mono text-xs font-bold text-[#78716C] dark:text-[#A1A1AA]">{progress}%</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => openQuickTaskModal()}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border-[1.5px] border-[#262626] bg-[#1C1917] px-3 text-xs font-bold text-white shadow-[2px_2px_0px_#262626] transition-all hover:bg-black active:translate-x-[1px] active:translate-y-[1px] active:shadow-none dark:bg-white dark:text-[#1C1917] dark:hover:bg-[#F2F2F7]"
          >
            <Plus size={15} strokeWidth={2.6} />
            <span>Thêm việc</span>
          </button>
        </div>
      </header>

      {/* === PHẦN 3: Danh sách task duy nhất, Hôm nay chỉ là bộ lọc của danh sách này === */}
      {visibleTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-[1.5px] border-[#262626] bg-[#FAF8F3] shadow-[2px_2px_0px_#262626] dark:bg-[#2C2C2E]">
            <CheckCircle2 size={28} className="text-[#78716C] dark:text-[#A1A1AA]" strokeWidth={2} />
          </div>
          <h2 className="mt-4 text-base font-bold text-[#1C1917] dark:text-[#F2F2F7]">Chưa có công việc nào</h2>
          <p className="mt-1 max-w-sm text-xs text-[#78716C] dark:text-[#8E8E93]">
            Tạo công việc đầu tiên để danh sách chung bắt đầu theo dõi tiến độ của bạn.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {taskGroups.map((group) => (
            <TaskListSection
              key={group.key}
              title={group.title}
              subtitle={group.subtitle}
              icon={group.icon}
              tasks={group.tasks}
              tone={group.tone}
              defaultCollapsed={group.defaultCollapsed}
              emptyMessage="Chưa có công việc nào"
              {...listProps}
            />
          ))}
          {hideCompletedTasks && completed > 0 && (
            <p className="mt-3 border-t border-[var(--border-ink-muted)] pt-3 text-center text-[11px] text-[var(--text-muted)]">
              Việc đã hoàn thành đang được ẩn theo cài đặt.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
