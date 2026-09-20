import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  CalendarPlus,
  CheckCheck,
  Hourglass,
  Trash2,
  Search,
  X,
} from "lucide-react";
import { TaskDto } from "../../../types";
import { DeadlinesScreenModel } from "../../../features/deadlines/model/types";
import { formatFullDate, getLocalTodayStr, getLocalTomorrowStr } from "../../../utils/date";
import { SketchTabs } from "../../layout/SketchTabs";
import { ConfirmModal } from "../../ui/overlays/ConfirmModal";
import { RescheduleDateModal } from "../../ui/overlays/RescheduleDateModal";
import { formatDisplayDate } from "../../ui/pickers/time/DatePickerPopover";
import { dispatchToast } from "../../../utils/toast";
import {
  getTaskDeadlineDate,
  getTaskEffectiveDate,
  getTaskEffectiveTime,
  getTaskTemporalState,
  normalizeTaskTimeType,
  getTaskTags,
} from "../../../utils/taskSemantics";
import { TaskList } from "../common/TaskList";
import { TaskListSection } from "../common/TaskListSection";
import type { TaskListProps } from "../common/TaskList";
import { DesktopTaskGroup } from "../common/DesktopTaskGroup";

export interface DeadlinesViewProps extends DeadlinesScreenModel {
  onNavigateToTaskDate?: (dateStr: string, taskId: string) => void;
  taskListPresentation?: TaskListProps["presentation"];
}

type DeadlineView = "overdue" | "upcoming";
type BulkActionKind = "complete" | "delete";

interface PendingBulkAction {
  kind: BulkActionKind;
  tasks: TaskDto[];
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

// Chỉ nhận diện chuỗi test lặp rất rõ; không tự suy đoán task thật là rác.
const isLikelyJunkTask = (task: TaskDto) => {
  const compactTitle = task.title.trim().toLocaleLowerCase().replace(/[^a-z0-9]/g, "");
  return compactTitle.length >= 6 && /^(add|test|asdf|qwer)+$/.test(compactTitle);
};

export const DeadlinesView: React.FC<DeadlinesViewProps> = ({
  onNavigateToTaskDate,
  tasks,
  toggleTask,
  deleteTask,
  updateTask,
  openTaskDetail,
  isMobile,
  taskListPresentation = "default",
}) => {
  const todayStr = getLocalTodayStr(new Date());
  const tomorrowStr = getLocalTomorrowStr();
  const [view, setView] = useState<DeadlineView>("overdue");
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [pendingBulkAction, setPendingBulkAction] = useState<PendingBulkAction | null>(null);
  const [rescheduleModalState, setRescheduleModalState] = useState<{
    isOpen: boolean;
    tasks: TaskDto[];
    taskTitle?: string;
  } | null>(null);

  const filterBySearch = (list: TaskDto[]) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (task) =>
        task.title.toLowerCase().includes(q) ||
        task.description?.toLowerCase().includes(q) ||
        getTaskTags(task).some((t) => t.toLowerCase().includes(q))
    );
  };

  const overdueTasks = useMemo(
    () =>
      sortByDateAndTime(
        filterBySearch(
          tasks.filter((task) => {
            if (task.completed) return false;
            const state = getTaskTemporalState(task);
            return state === "overdue" || state === "pastScheduled";
          })
        ),
      ),
    [tasks, searchQuery],
  );

  const upcomingTasks = useMemo(
    () =>
      sortByDateAndTime(
        filterBySearch(
          tasks.filter((task) => {
            if (task.completed) return false;
            const state = getTaskTemporalState(task);
            if (state === "overdue" || state === "pastScheduled") return false;
            if (normalizeTaskTimeType(task) !== "deadline") return false;
            const date = getTaskDeadlineDate(task) || getTaskEffectiveDate(task);
            return date === todayStr || date === tomorrowStr;
          })
        ),
      ),
    [tasks, todayStr, tomorrowStr, searchQuery],
  );

  const overdueGroups = useMemo(() => groupByDate(overdueTasks), [overdueTasks]);
  const upcomingGroups = useMemo(() => groupByDate(upcomingTasks), [upcomingTasks]);

  const activeTasks = view === "overdue" ? overdueTasks : upcomingTasks;
  const junkTasks = useMemo(
    () => activeTasks.filter(isLikelyJunkTask),
    [activeTasks],
  );

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
      if (task.dueDate) {
        updateTask(task.id, { dueDate: targetDate });
      } else if (task.deadlineDate) {
        updateTask(task.id, { deadlineDate: targetDate });
      } else {
        updateTask(task.id, { dueDate: targetDate });
      }
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

  const requestBulkAction = (kind: BulkActionKind, selectedTasks: TaskDto[]) => {
    if (selectedTasks.length === 0) return;
    setPendingBulkAction({ kind, tasks: selectedTasks });
  };

  const performBulkAction = () => {
    if (!pendingBulkAction) return;

    const { kind, tasks: selectedTasks } = pendingBulkAction;
    if (kind === "complete") {
      selectedTasks.filter((task) => !task.completed).forEach((task) => toggleTask(task.id));
      dispatchToast({ message: `Đã hoàn thành ${selectedTasks.length} việc.` });
    }
    if (kind === "delete") {
      selectedTasks.forEach((task) => deleteTask(task.id));
      dispatchToast({ message: `Đã dọn ${selectedTasks.length} task rác.` });
    }

    setPendingBulkAction(null);
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
            const scheduledCount = group.tasks.filter(
              (task) => normalizeTaskTimeType(task) === "scheduled",
            ).length;
            const deadlineCount = group.tasks.filter(
              (task) => normalizeTaskTimeType(task) === "deadline",
            ).length;

            const groupTitle =
              group.dateStr === "no-date" ? "Chưa đặt ngày" : formatFullDate(group.dateStr);

            if (taskListPresentation === "desktop") {
              return (
                <DesktopTaskGroup
                  key={group.dateStr}
                  title={groupTitle}
                  dateStr={group.dateStr}
                  tasks={group.tasks}
                  subtitle={`${scheduledCount} lịch · ${deadlineCount} hạn`}
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
                  headerAction={(
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setRescheduleModalState({
                            isOpen: true,
                            tasks: group.tasks.filter((task) => !task.completed),
                            taskTitle: `Nhóm ${groupTitle}`,
                          });
                        }}
                        className="inline-flex h-7 items-center gap-1 rounded-xl bg-black/[0.04] px-2.5 text-[11px] font-semibold text-[#1C1C1E] transition-colors hover:bg-black/[0.08] dark:bg-white/[0.08] dark:text-[#F2F2F7] dark:hover:bg-white/[0.12]"
                        title={`Dời tất cả việc của ${groupTitle}`}
                      >
                        <CalendarPlus size={12} strokeWidth={2.2} />
                        <span className="hidden sm:inline">Dời nhóm</span>
                      </button>
                      {group.tasks.some((task) => !task.completed) && (
                        <button
                          type="button"
                          onClick={() =>
                            requestBulkAction(
                              "complete",
                              group.tasks.filter((task) => !task.completed),
                            )
                          }
                          className="inline-flex h-7 items-center gap-1 rounded-xl bg-[#34C759]/15 px-2.5 text-[11px] font-semibold text-[#34C759] transition-colors hover:bg-[#34C759]/25 dark:text-[#30D158]"
                          title={`Hoàn thành tất cả việc của ${groupTitle}`}
                        >
                          <CheckCheck size={12} strokeWidth={2.2} />
                          <span className="hidden sm:inline">Xong nhóm</span>
                        </button>
                      )}
                    </>
                  )}
                />
              );
            }

            return (
              <TaskListSection
                key={group.dateStr}
                title={formatFullDate(group.dateStr)}
                subtitle={`${scheduledCount} lịch · ${deadlineCount} hạn`}
                tasks={group.tasks}
                tone={variant === "overdue" ? "danger" : "info"}
                icon={<Hourglass size={15} strokeWidth={2.2} />}
                collapsed={isCollapsed}
                onCollapsedChange={(nextCollapsed) => {
                  setCollapsedGroups((previous) => ({
                    ...previous,
                    [groupKey]: nextCollapsed,
                  }));
                }}
                headerAction={(
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setRescheduleModalState({
                          isOpen: true,
                          tasks: group.tasks.filter((t) => !t.completed),
                          taskTitle: `Nhóm ${formatFullDate(group.dateStr)}`,
                        });
                      }}
                      className="inline-flex h-7 items-center gap-1 rounded-xl bg-black/[0.04] px-2.5 text-[11px] font-semibold text-[#1C1C1E] transition-colors hover:bg-black/[0.08] dark:bg-white/[0.08] dark:text-[#F2F2F7] dark:hover:bg-white/[0.12]"
                      title={`Dời tất cả việc của ngày ${formatFullDate(group.dateStr)}`}
                    >
                      <CalendarPlus size={12} strokeWidth={2.2} />
                      <span className="hidden sm:inline">Dời nhóm</span>
                    </button>
                    {group.tasks.some((t) => !t.completed) && (
                      <button
                        type="button"
                        onClick={() =>
                          requestBulkAction(
                            "complete",
                            group.tasks.filter((t) => !t.completed),
                          )
                        }
                        className="inline-flex h-7 items-center gap-1 rounded-xl bg-[#34C759]/15 px-2.5 text-[11px] font-semibold text-[#34C759] transition-colors hover:bg-[#34C759]/25 dark:text-[#30D158]"
                        title={`Hoàn thành tất cả việc của ngày ${formatFullDate(group.dateStr)}`}
                      >
                        <CheckCheck size={12} strokeWidth={2.2} />
                        <span className="hidden sm:inline">Xong nhóm</span>
                      </button>
                    )}
                  </>
                )}
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

  return (
    <div className={`space-y-3.5 w-full min-w-0 pb-16 select-none ${
      isMobile ? "" : "animate-in fade-in duration-150"
    }`}>
      {/* 1. Header Toolbar */}
      {isMobile ? (
        <div className="space-y-2 select-none">
          <SketchTabs
            ariaLabel="Chuyển loại hạn định"
            size="sm"
            className="w-full flex justify-center [&>button]:min-h-[36px] [&>button]:flex-1"
            value={view}
            onChange={setView}
            items={[
              {
                key: "overdue",
                label: "Quá hạn",
                icon: <AlertTriangle size={13} strokeWidth={2.2} />,
                badge:
                  overdueTasks.length > 0 ? (
                    <span className="min-w-[18px] rounded-full bg-[#FF3B30] text-white px-2 py-0.5 text-center font-mono text-[10px] leading-none font-semibold shadow-2xs">
                      {overdueTasks.length}
                    </span>
                  ) : undefined,
              },
              {
                key: "upcoming",
                label: "Sắp đến",
                icon: <BellRing size={13} strokeWidth={2.2} />,
                badge:
                  upcomingTasks.length > 0 ? (
                    <span className="min-w-[18px] rounded-full bg-[#007AFF] text-white px-2 py-0.5 text-center font-mono text-[10px] leading-none font-semibold shadow-2xs">
                      {upcomingTasks.length}
                    </span>
                  ) : undefined,
              },
            ]}
          />

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2.5 h-9 px-3 bg-black/[0.04] dark:bg-[#1C1C20] rounded-2xl border-none shadow-2xs focus-within:ring-2 focus-within:ring-[#007AFF]/30 focus-within:bg-white dark:focus-within:bg-[#25252A] transition-all flex-1">
              <Search size={14} strokeWidth={2.2} className="text-[#71717A] dark:text-[#A1A1AA] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Tìm việc ${isOverdueView ? "quá hạn" : "sắp đến"}...`}
                className="bg-transparent pl-1 text-xs text-[#18181B] dark:text-[#ECECF1] placeholder:text-[#71717A] dark:placeholder:text-[#71717A] focus:outline-none w-full font-sans"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-[#F2F2F7] cursor-pointer shrink-0 rounded-full p-0.5"
                  title="Xóa tìm kiếm"
                >
                  <X size={13} strokeWidth={2.2} />
                </button>
              )}
            </div>

            {activeTasks.length > 0 && (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => requestBulkAction("complete", activeTasks)}
                  className="h-9 rounded-2xl bg-[#34C759]/15 hover:bg-[#34C759]/25 text-[#34C759] dark:text-[#30D158] px-3 text-xs font-semibold active:scale-[0.98] transition-all cursor-pointer inline-flex items-center shadow-2xs"
                  title="Hoàn thành tất cả"
                >
                  <CheckCheck size={14} />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setRescheduleModalState({
                      isOpen: true,
                      tasks: activeTasks,
                      taskTitle: isOverdueView ? "Tất cả việc quá hạn" : "Tất cả việc sắp đến hạn",
                    })
                  }
                  className="h-9 rounded-2xl bg-black/[0.05] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] text-[#1C1917] dark:text-[#F2F2F7] px-3 text-xs font-semibold active:scale-[0.98] transition-all cursor-pointer inline-flex items-center shadow-2xs"
                  title={`Dời ngày (${activeTasks.length})`}
                >
                  <CalendarPlus size={14} />
                </button>
                {junkTasks.length > 0 && (
                  <button
                    type="button"
                    onClick={() => requestBulkAction("delete", junkTasks)}
                    className="h-9 rounded-2xl bg-[#FF3B30]/15 hover:bg-[#FF3B30]/25 text-[#FF3B30] px-3 text-xs font-semibold active:scale-[0.98] transition-all cursor-pointer inline-flex items-center shadow-2xs"
                    title={`Xóa rác (${junkTasks.length})`}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* GIAO DIỆN DESKTOP: Chỉ giữ thanh Tab Quá hạn / Sắp đến */
        <div className="flex items-center justify-between pb-3 select-none">
          {/* Nhóm Trái: Segmented Switcher Quá hạn / Sắp đến */}
          <SketchTabs
            ariaLabel="Chuyển loại hạn định"
            size="sm"
            className="w-auto flex-none"
            value={view}
            onChange={setView}
            items={[
              {
                key: "overdue",
                label: "Quá hạn",
                icon: <AlertTriangle size={13} strokeWidth={2.2} />,
                badge:
                  overdueTasks.length > 0 ? (
                    <span className="min-w-[18px] rounded-full bg-[#FF3B30] text-white px-2 py-0.5 text-center font-mono text-[10px] leading-none font-semibold shadow-2xs">
                      {overdueTasks.length}
                    </span>
                  ) : undefined,
              },
              {
                key: "upcoming",
                label: "Sắp đến",
                icon: <BellRing size={13} strokeWidth={2.2} />,
                badge:
                  upcomingTasks.length > 0 ? (
                    <span className="min-w-[18px] rounded-full bg-[#007AFF] text-white px-2 py-0.5 text-center font-mono text-[10px] leading-none font-semibold shadow-2xs">
                      {upcomingTasks.length}
                    </span>
                  ) : undefined,
              },
            ]}
          />
        </div>
      )}

      {/* 4. Danh Sách Nhóm Việc Theo Ngày */}
      {isOverdueView
        ? renderGroups(overdueGroups, "Không có việc quá hạn", "Mọi task đang trong kế hoạch.", "overdue")
        : renderGroups(upcomingGroups, "Không có việc sắp đến hạn", "Bạn có thể thêm hạn khi tạo hoặc sửa task.", "planner")}

      <ConfirmModal
        isOpen={Boolean(pendingBulkAction)}
        onCancel={() => setPendingBulkAction(null)}
        onConfirm={performBulkAction}
        title={
          pendingBulkAction?.kind === "complete"
            ? "Hoàn thành nhiều việc?"
            : "Xóa task rác?"
        }
        message={
          pendingBulkAction?.kind === "complete"
            ? `Thao tác này sẽ đánh dấu ${pendingBulkAction?.tasks.length || 0} việc là đã xong.`
            : `Chỉ ${pendingBulkAction?.tasks.length || 0} task có tiêu đề lặp kiểu test đã được nhận diện. Bạn có chắc muốn xóa chúng?`
        }
        confirmText={
          pendingBulkAction?.kind === "complete"
            ? "Hoàn thành"
            : "Xóa task rác"
        }
      />

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
