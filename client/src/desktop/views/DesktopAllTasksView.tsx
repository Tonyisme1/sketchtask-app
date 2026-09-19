import React, { useMemo } from "react";
import { CalendarDays, CheckCircle2, Inbox, ListTodo } from "lucide-react";
import { useAppStore } from "../../shared/stores";
import {
  getLocalTodayStr,
  getTaskEffectiveDate,
  getTaskEffectiveTime,
  getTaskItemType,
} from "../../shared/utils";
import { TaskListSection } from "../../components/features/shared/TaskListSection";
import { getTaskProgress } from "../../utils/taskHierarchy";
import { formatFullDate } from "../../utils/date";

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

    const dateGroups = [...byDate.entries()]
      .sort(([firstDate], [secondDate]) => firstDate.localeCompare(secondDate))
      .map(([date, dateTasks]) => ({
        key: `date-${date}`,
        title: date === todayStr ? "Hôm nay" : formatFullDate(date),
        subtitle: `${dateTasks.filter((task) => !task.completed).length} cần làm · ${dateTasks.filter((task) => task.completed).length} đã xong`,
        icon: <CalendarDays size={15} strokeWidth={2.2} />,
        tasks: dateTasks,
        tone: date === todayStr ? ("info" as const) : ("neutral" as const),
        defaultCollapsed: date !== todayStr && dateTasks.length > 8,
      }));

    if (unscheduledTasks.length > 0) {
      dateGroups.push({
        key: "unscheduled",
        title: "Chưa đặt ngày",
        subtitle: `${unscheduledTasks.filter((task) => !task.completed).length} cần sắp xếp`,
        icon: <Inbox size={15} strokeWidth={2.2} />,
        tasks: unscheduledTasks,
        tone: "neutral" as const,
        defaultCollapsed: false,
      });
    }

    return dateGroups;
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

        {total > 0 && (
          <div className="hidden items-center gap-2 sm:flex" title={`Tiến độ ${progress}%`}>
            <div className="h-2 w-24 overflow-hidden rounded-full border border-[#262626] bg-[#F3EFE6] dark:border-[#48484A] dark:bg-[#2C2C2E]">
              <div className="h-full bg-[var(--accent-blue)] transition-[width] duration-300" style={{ width: `${progress}%` }} />
            </div>
            <span className="font-mono text-xs font-bold text-[#78716C] dark:text-[#A1A1AA]">{progress}%</span>
          </div>
        )}
      </header>

      {/* === PHẦN 3: Danh sách task phân cấp theo ngày như lịch === */}
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
