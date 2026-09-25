import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  BellRing,
  CalendarClock,
} from "lucide-react";
import { TaskDto } from "../../../types";
import { DeadlinesScreenModel } from "../../../features/deadlines/model/types";
import { formatFullDate, getLocalTodayStr, getLocalTomorrowStr } from "../../../utils/date";
import { SketchTabs } from "../../layout/SketchTabs";
import { RescheduleDateModal } from "../../ui/overlays/RescheduleDateModal";
import { formatDisplayDate } from "../../ui/pickers/time/DatePickerPopover";
import { dispatchToast } from "../../../utils/toast";
import {
  getTaskDeadlineDate,
  getTaskEffectiveDate,
  getTaskEffectiveTime,
  getDeadlineTaskBuckets,
  moveTaskToDate,
} from "../../../utils/taskSemantics";
import { TaskList } from "../common/TaskList";
import { TaskListSection } from "../common/TaskListSection";
import type { TaskListProps } from "../common/TaskList";
import { DesktopTaskGroup } from "../common/DesktopTaskGroup";

export type DeadlineView = "overdue" | "upcoming";

export interface DeadlinesViewProps extends DeadlinesScreenModel {
  taskListPresentation?: TaskListProps["presentation"];
  view?: DeadlineView;
  onViewChange?: (view: DeadlineView) => void;
}

const sortByDateAndTime = (tasks: TaskDto[]) =>
  [...tasks].sort((taskA, taskB) => {
    const dateA = getTaskDeadlineDate(taskA) || getTaskEffectiveDate(taskA) || "9999-99-99";
    const dateB = getTaskDeadlineDate(taskB) || getTaskEffectiveDate(taskB) || "9999-99-99";
    const dateOrder = dateA.localeCompare(dateB);
    if (dateOrder !== 0) return dateOrder;
    return (getTaskEffectiveTime(taskA) || "99:99").localeCompare(
      getTaskEffectiveTime(taskB) || "99:99",
    );
  });

const groupByDate = (tasks: TaskDto[]) => {
  const groups = new Map<string, TaskDto[]>();

  for (const task of tasks) {
    const date = getTaskDeadlineDate(task) || getTaskEffectiveDate(task) || "no-date";
    const group = groups.get(date) || [];
    group.push(task);
    groups.set(date, group);
  }

  return [...groups.entries()].map(([dateStr, groupTasks]) => ({
    dateStr,
    tasks: sortByDateAndTime(groupTasks),
  }));
};

const getDeadlineGroupLabel = (dateStr: string) => {
  if (dateStr === "no-date") return "Chưa đặt ngày";
  if (dateStr === getLocalTodayStr()) return "Hôm nay";
  if (dateStr === getLocalTomorrowStr()) return "Ngày mai";
  return formatFullDate(dateStr);
};

export const DeadlinesView: React.FC<DeadlinesViewProps> = ({
  tasks,
  toggleTask,
  deleteTask,
  updateTask,
  openTaskDetail,
  isMobile,
  taskListPresentation = "default",
  view: controlledView,
  onViewChange,
}) => {
  const [uncontrolledView, setUncontrolledView] = useState<DeadlineView>("upcoming");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [rescheduleModalState, setRescheduleModalState] = useState<{
    isOpen: boolean;
    tasks: TaskDto[];
    taskTitle?: string;
  } | null>(null);

  const view = controlledView ?? uncontrolledView;
  const setView = (nextView: DeadlineView) => {
    if (onViewChange) {
      onViewChange(nextView);
      return;
    }
    setUncontrolledView(nextView);
  };

  const deadlineBuckets = useMemo(() => getDeadlineTaskBuckets(tasks), [tasks]);
  const overdueTasks = useMemo(() => sortByDateAndTime(deadlineBuckets.overdue), [deadlineBuckets.overdue]);
  const upcomingTasks = useMemo(() => sortByDateAndTime(deadlineBuckets.upcoming), [deadlineBuckets.upcoming]);

  const overdueGroups = useMemo(() => groupByDate(overdueTasks), [overdueTasks]);
  const upcomingGroups = useMemo(() => groupByDate(upcomingTasks), [upcomingTasks]);

  const handleSmartReschedule = (taskId: string) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;
    setRescheduleModalState({
      isOpen: true,
      tasks: [task],
      taskTitle: task.title,
    });
  };

  const handleConfirmReschedule = (targetDate: string) => {
    if (!rescheduleModalState || rescheduleModalState.tasks.length === 0) return;
    const { tasks: selectedTasks } = rescheduleModalState;
    for (const task of selectedTasks) {
      // Giữ nguyên ngữ nghĩa deadline và giờ khi người dùng chỉ đổi ngày.
      updateTask(task.id, moveTaskToDate(task, targetDate));
    }
    const formatted = formatDisplayDate(targetDate);
    dispatchToast({
      message:
        selectedTasks.length === 1
          ? `Đã dời công việc sang ${formatted}`
          : `Đã dời ${selectedTasks.length} việc sang ${formatted}`,
    });
    setRescheduleModalState(null);
  };

  const handleTaskClick = (task: TaskDto) => {
    openTaskDetail(task.id);
  };

  const renderGroups = (
    groups: Array<{ dateStr: string; tasks: TaskDto[] }>,
    emptyMessage: string,
    emptySubMessage: string,
    variant: "overdue" | "planner"
  ) => {
    if (groups.length === 0) {
      if (taskListPresentation === "desktop") {
        return (
          <DesktopTaskGroup
            title={view === "overdue" ? "Quá hạn" : "Sắp đến"}
            tasks={[]}
            subtitle="0 việc"
            emptyMessage={emptyMessage}
            emptySubMessage={emptySubMessage}
            variant={variant}
            onToggle={toggleTask}
            onOpenTask={handleTaskClick}
            onDelete={deleteTask}
            onMoveTomorrow={handleSmartReschedule}
          />
        );
      }

      return (
        <TaskList
          tasks={[]}
          emptyMessage={emptyMessage}
          emptySubMessage={emptySubMessage}
          onToggle={toggleTask}
          onEdit={handleTaskClick}
          onDelete={deleteTask}
          onMoveTomorrow={handleSmartReschedule}
          onAddSubtask={handleTaskClick}
          onClick={handleTaskClick}
          variant={variant}
          hideDate={false}
          showQuickAdd={false}
          presentation={taskListPresentation}
        />
      );
    }

    return (
      <div className="space-y-4 pt-1">
        {groups.map((group) => (
          (() => {
            const groupKey = `${view}:${group.dateStr}`;
            const isCollapsed = collapsedGroups[groupKey] ?? group.tasks.length > 8;

            const groupTitle = getDeadlineGroupLabel(group.dateStr);
            const groupSubtitle = variant === "overdue" ? "Đã quá hạn" : "Hạn chót";

            if (taskListPresentation === "desktop") {
              return (
                <DesktopTaskGroup
                  key={group.dateStr}
                  title={groupTitle}
                  dateStr={group.dateStr}
                  tasks={group.tasks}
                  subtitle={groupSubtitle}
                  collapsed={isCollapsed}
                  onCollapsedChange={(nextCollapsed) => {
                    setCollapsedGroups((previous) => ({
                      ...previous,
                      [groupKey]: nextCollapsed,
                    }));
                  }}
                  variant={variant}
                  onToggle={toggleTask}
                  onOpenTask={handleTaskClick}
                  onDelete={deleteTask}
                  onMoveTomorrow={handleSmartReschedule}
                />
              );
            }

            return (
              <TaskListSection
                key={group.dateStr}
                title={groupTitle}
                subtitle={groupSubtitle}
                tasks={group.tasks}
                tone={variant === "overdue" ? "danger" : "info"}
                icon={<CalendarClock size={15} strokeWidth={2.2} />}
                collapsed={isCollapsed}
                onCollapsedChange={(nextCollapsed) => {
                  setCollapsedGroups((previous) => ({
                    ...previous,
                    [groupKey]: nextCollapsed,
                  }));
                }}
                onToggle={toggleTask}
                onEdit={handleTaskClick}
                onDelete={deleteTask}
                onMoveTomorrow={handleSmartReschedule}
                onAddSubtask={handleTaskClick}
                onClick={handleTaskClick}
                variant={variant}
                hideDate={true}
                baseDateStr={group.dateStr}
                showQuickAdd={false}
                presentation={taskListPresentation}
              />
            );
          })()
        ))}
      </div>
    );
  };

  const isOverdueView = view === "overdue";
  const activeCount = isOverdueView ? overdueTasks.length : upcomingTasks.length;
  const activeTitle = isOverdueView ? "Việc quá hạn" : "Việc sắp đến hạn";
  const activeDescription = isOverdueView
    ? "Deadline đã qua, cần xử lý lại."
    : "Deadline trong 7 ngày tới.";
  const tabs = [
    {
      key: "upcoming" as const,
      label: "Sắp đến",
      icon: <BellRing size={14} strokeWidth={2.2} />,
      badge: upcomingTasks.length > 0 ? (
        <span className="min-w-[18px] rounded-full bg-[var(--bg-surface-muted)] px-1.5 py-0.5 text-center font-mono text-[10px] leading-none font-semibold text-[var(--accent-blue)]">
          {upcomingTasks.length}
        </span>
      ) : undefined,
    },
    {
      key: "overdue" as const,
      label: "Quá hạn",
      icon: <AlertTriangle size={14} strokeWidth={2.2} />,
      badge: overdueTasks.length > 0 ? (
        <span className="min-w-[18px] rounded-full bg-[var(--bg-surface-muted)] px-1.5 py-0.5 text-center font-mono text-[10px] leading-none font-semibold text-[var(--accent-coral)]">
          {overdueTasks.length}
        </span>
      ) : undefined,
    },
  ];

  return (
    <div className={`w-full min-w-0 select-none pb-24 sm:pb-10 ${
      isMobile ? "" : "animate-in fade-in duration-150"
    }`}>
      {/* === PHẦN 1: Ngữ cảnh deadline và bộ chuyển trạng thái === */}
      {isMobile ? (
        <header className="mb-3 flex items-center justify-between gap-3 pb-3">
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-[var(--text-main)]">{activeTitle}</h1>
            <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">{activeDescription}</p>
          </div>
          <span
            aria-label={`${activeCount} việc`}
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
              isOverdueView
                ? "bg-[var(--accent-coral)]/15 text-[var(--accent-coral)]"
                : "bg-[var(--accent-blue)]/12 text-[var(--accent-blue)]"
            }`}
          >
            {activeCount} việc
          </span>
        </header>
      ) : (
        <header className="mb-4 flex flex-col gap-3 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-[var(--text-strong)]">Hạn định</h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{activeDescription}</p>
          </div>
          <SketchTabs
            ariaLabel="Chuyển loại hạn định"
            size="md"
            className="w-full sm:w-auto [&>button]:min-h-10 [&>button]:flex-1 sm:[&>button]:flex-none"
            value={view}
            onChange={setView}
            items={tabs}
          />
        </header>
      )}

      {/* === PHẦN 2: Danh sách deadline theo ngày === */}
      {isOverdueView
        ? renderGroups(overdueGroups, "Không có việc quá hạn", "Mọi task đang trong kế hoạch.", "overdue")
        : renderGroups(upcomingGroups, "Không có việc sắp đến hạn", "Bạn có thể thêm hạn khi tạo hoặc sửa task.", "planner")}

      {/* Reschedule Date Modal */}
      {rescheduleModalState && (
        <RescheduleDateModal
          isOpen={rescheduleModalState.isOpen}
          taskCount={rescheduleModalState.tasks.length}
          taskTitle={rescheduleModalState.taskTitle}
          onClose={() => setRescheduleModalState(null)}
          onConfirm={handleConfirmReschedule}
        />
      )}
    </div>
  );
};
