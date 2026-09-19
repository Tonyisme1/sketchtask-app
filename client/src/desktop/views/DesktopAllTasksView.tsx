import React, { useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Inbox, ListTodo } from "lucide-react";
import { useAppStore } from "../../shared/stores";
import { TaskDto } from "../../types";
import {
  getLocalTodayStr,
  getTaskEffectiveDate,
  getTaskEffectiveTime,
  getTaskItemType,
} from "../../shared/utils";
import { TaskList } from "../../components/features/shared/TaskList";
import { getTaskProgress } from "../../utils/taskHierarchy";
import { formatFullDate } from "../../utils/date";

type AgendaFilter = "all" | "today" | "week" | "unscheduled";

interface AgendaGroup {
  key: string;
  date?: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  tasks: TaskDto[];
  tone: "info" | "neutral";
}

const shiftIsoDate = (dateStr: string, days: number): string => {
  const date = new Date(`${dateStr}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

// === COMPONENT: Desktop All Tasks View (Danh sách chung của workspace Công việc) ===

export const DesktopAllTasksView: React.FC = () => {
  const {
    tasks,
    toggleTask,
    deleteTask,
    moveTaskToTomorrow,
    hideCompletedTasks,
    openTaskDetail,
  } = useAppStore();

  const todayStr = getLocalTodayStr(new Date());
  const [agendaFilter, setAgendaFilter] = useState<AgendaFilter>("all");
  const taskItems = useMemo(
    () => tasks.filter((task) => getTaskItemType(task) !== "event"),
    [tasks],
  );

  // === PHẦN 1: Giữ thứ tự dạng lịch: ngày trước, giờ sau ===
  const orderedTasks = useMemo(() => {
    return [...taskItems].sort((first, second) => {
      const firstDate = getTaskEffectiveDate(first) || "9999-12-31";
      const secondDate = getTaskEffectiveDate(second) || "9999-12-31";
      const dateOrder = firstDate.localeCompare(secondDate);
      if (dateOrder !== 0) return dateOrder;

      const firstTime = getTaskEffectiveTime(first) || "99:99";
      const secondTime = getTaskEffectiveTime(second) || "99:99";
      const timeOrder = firstTime.localeCompare(secondTime);
      if (timeOrder !== 0) return timeOrder;
      if (first.completed !== second.completed) return first.completed ? 1 : -1;
      return first.title.localeCompare(second.title);
    });
  }, [taskItems]);

  const { total, completed } = useMemo(() => getTaskProgress(taskItems), [taskItems]);
  const activeCount = Math.max(0, total - completed);
  const progress = total ? Math.round((completed / total) * 100) : 0;
  const visibleTasks = hideCompletedTasks
    ? orderedTasks.filter((task) => !task.completed)
    : orderedTasks;

  const taskGroups = useMemo(() => {
    const byDate = new Map<string, typeof visibleTasks>();
    const unscheduledTasks: typeof visibleTasks = [];

    visibleTasks.forEach((task) => {
      const date = getTaskEffectiveDate(task);
      if (!date) {
        unscheduledTasks.push(task);
        return;
      }
      const dateTasks = byDate.get(date) || [];
      dateTasks.push(task);
      byDate.set(date, dateTasks);
    });

    const dateGroups: AgendaGroup[] = [...byDate.entries()]
      .sort(([firstDate], [secondDate]) => firstDate.localeCompare(secondDate))
      .map(([date, dateTasks]) => ({
        key: `date-${date}`,
        date,
        title: date === todayStr ? "Hôm nay" : formatFullDate(date),
        subtitle: `${dateTasks.filter((task) => !task.completed).length} cần làm · ${dateTasks.filter((task) => task.completed).length} đã xong`,
        icon: <CalendarDays size={15} strokeWidth={2.2} />,
        tasks: dateTasks,
        tone: date === todayStr ? ("info" as const) : ("neutral" as const),
      }));

    if (unscheduledTasks.length > 0) {
      dateGroups.push({
        key: "unscheduled",
        date: undefined,
        title: "Chưa đặt ngày",
        subtitle: `${unscheduledTasks.filter((task) => !task.completed).length} cần sắp xếp`,
        icon: <Inbox size={15} strokeWidth={2.2} />,
        tasks: unscheduledTasks,
        tone: "neutral" as const,
      });
    }

    return dateGroups;
  }, [todayStr, visibleTasks]);

  const weekEndStr = shiftIsoDate(todayStr, 6);
  const filteredAgendaGroups = useMemo(() => {
    if (agendaFilter === "all") return taskGroups;
    if (agendaFilter === "today") {
      return taskGroups.filter((group) => group.date === todayStr);
    }
    if (agendaFilter === "week") {
      return taskGroups.filter(
        (group) => Boolean(group.date && group.date >= todayStr && group.date <= weekEndStr),
      );
    }
    return taskGroups.filter((group) => !group.date);
  }, [agendaFilter, taskGroups, todayStr, weekEndStr]);

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

  const agendaFilters: Array<{ key: AgendaFilter; label: string }> = [
    { key: "all", label: "Tất cả" },
    { key: "today", label: "Hôm nay" },
    { key: "week", label: "Tuần này" },
    { key: "unscheduled", label: "Chưa đặt ngày" },
  ];

  return (
    <div className="w-full min-w-0 space-y-5 select-none animate-in fade-in duration-150">
      {/* === PHẦN 2: Tiêu đề và thống kê chung === */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#18181B]/15 pb-4 dark:border-[#2E2E34]">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#18181B] dark:border-[#2E2E34] bg-black/5 text-[#09090B] dark:bg-white/10 dark:text-white">
            <ListTodo size={22} strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-black tracking-tight text-[#09090B] dark:text-[#FFFFFF]">
              Tất cả việc
            </h1>
            <p className="mt-0.5 text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">
              {activeCount} đang làm · {completed} đã hoàn thành · {taskItems.length} tổng cộng
            </p>
          </div>
        </div>

        {total > 0 && (
          <div className="hidden items-center gap-2 sm:flex" title={`Tiến độ ${progress}%`}>
            <div className="h-2 w-24 overflow-hidden rounded-full border border-[#18181B] bg-[#E4E4E7] dark:border-[#3F3F46] dark:bg-[#2E2E34]">
              <div className="h-full bg-[#09090B] dark:bg-white transition-[width] duration-300" style={{ width: `${progress}%` }} />
            </div>
            <span className="font-mono text-xs font-bold text-[#71717A] dark:text-[#A1A1AA]">{progress}%</span>
          </div>
        )}
      </header>

      {/* === PHẦN 3: Danh sách task phân cấp theo ngày như lịch === */}
      {visibleTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-[1.5px] border-[#18181B] bg-white shadow-[2px_2px_0px_#18181B] dark:border-[#2E2E34] dark:bg-[#141417] dark:shadow-none">
            <CheckCircle2 size={28} className="text-[#71717A] dark:text-[#A1A1AA]" strokeWidth={2} />
          </div>
          <h2 className="mt-4 text-base font-bold text-[#09090B] dark:text-[#FFFFFF]">Chưa có công việc nào</h2>
          <p className="mt-1 max-w-sm text-xs text-[#71717A] dark:text-[#A1A1AA]">
            Tạo công việc đầu tiên để danh sách chung bắt đầu theo dõi tiến độ của bạn.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--border-ink)] bg-[var(--bg-surface)]">
          <div className="flex flex-wrap items-center gap-1.5 border-b border-[var(--border-ink-muted)] px-3 py-2">
            {agendaFilters.map((filter) => {
              const isActive = agendaFilter === filter.key;
              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setAgendaFilter(filter.key)}
                  className={`min-h-8 rounded-lg px-2.5 text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-[#09090B] text-white shadow-[1px_1px_0px_#18181B] dark:bg-white dark:text-[#09090B] dark:shadow-none"
                      : "text-[#71717A] hover:bg-black/5 hover:text-[#09090B] dark:text-[#A1A1AA] dark:hover:bg-white/10 dark:hover:text-white"
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          {filteredAgendaGroups.length === 0 ? (
            <div className="px-4 py-10 text-center text-xs text-[var(--text-muted)]">
              Không có công việc trong phạm vi này.
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-ink-muted)]">
              {filteredAgendaGroups.map((group) => (
                <div key={group.key} className="grid grid-cols-[108px_minmax(0,1fr)]">
                  <div className={`flex min-w-0 flex-col gap-1 border-r border-[var(--border-ink-muted)] px-3 py-3 ${
                    group.tone === "info" ? "bg-[var(--accent-blue)]/[0.06]" : "bg-[var(--bg-surface-muted)]/[0.35]"
                  }`}>
                    <div className={`flex items-center gap-1.5 text-xs font-bold ${
                      group.tone === "info" ? "text-[var(--accent-blue)]" : "text-[var(--text-main)]"
                    }`}>
                      <span className="shrink-0">{group.icon}</span>
                      <span className="min-w-0 truncate">{group.title}</span>
                    </div>
                    <span className="text-[10px] leading-tight text-[var(--text-muted)]">{group.subtitle}</span>
                  </div>
                  <div className="min-w-0 px-3 py-1">
                    <TaskList
                      tasks={group.tasks}
                      emptyMessage="Chưa có công việc nào"
                      {...listProps}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {hideCompletedTasks && completed > 0 && (
            <p className="border-t border-[var(--border-ink-muted)] px-3 py-3 text-center text-[11px] text-[var(--text-muted)]">
              Việc đã hoàn thành đang được ẩn theo cài đặt.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
