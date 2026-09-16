import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Hourglass,
  Trash2,
  Search,
  X,
} from "lucide-react";
import { useAppStore } from "../../../stores/appStore";
import { useResponsiveLayout } from "../../../shared/hooks";
import { TaskDto } from "../../../types";
import { formatFullDate, getLocalTodayStr, getLocalTomorrowStr } from "../../../utils/date";
import { SketchTabs } from "../../layout/SketchTabs";
import { ConfirmModal } from "../../ui/overlays/ConfirmModal";
import { dispatchToast } from "../../../utils/toast";
import {
  getTaskDeadlineDate,
  getTaskEffectiveDate,
  getTaskEffectiveTime,
  getTaskTemporalState,
  normalizeTaskTimeType,
  getTaskTags,
} from "../../../utils/taskSemantics";
import { TaskList } from "../shared/TaskList";

export interface DeadlinesTabProps {
  onNavigateToTaskDate?: (dateStr: string, taskId: string) => void;
}

type DeadlineView = "overdue" | "upcoming";
type BulkActionKind = "complete" | "reschedule" | "delete";

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

export const DeadlinesTab: React.FC<DeadlinesTabProps> = ({
  onNavigateToTaskDate,
}) => {
  const { isMobile } = useResponsiveLayout();
  const { tasks, toggleTask, deleteTask, moveTaskToTomorrow } = useAppStore();
  const todayStr = getLocalTodayStr(new Date());
  const tomorrowStr = getLocalTomorrowStr();
  const [view, setView] = useState<DeadlineView>("overdue");
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [pendingBulkAction, setPendingBulkAction] = useState<PendingBulkAction | null>(null);

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

    const date = getTaskEffectiveDate(task);
    if (!date) return;

    const [year, month, day] = date.split("-").map(Number);
    const taskDate = new Date(year, month - 1, day);
    const [todayYear, todayMonth, todayDay] = todayStr.split("-").map(Number);
    const today = new Date(todayYear, todayMonth - 1, todayDay);
    const diffDays = Math.round((today.getTime() - taskDate.getTime()) / 86400000);

    if (diffDays <= 1 || !onNavigateToTaskDate) {
      moveTaskToTomorrow(taskId);
      return;
    }

    onNavigateToTaskDate(date, task.id);
  };

  const handleTaskClick = (task: TaskDto) => {
    const date = getTaskEffectiveDate(task);
    if (date && onNavigateToTaskDate) {
      onNavigateToTaskDate(date, task.id);
    }
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
    if (kind === "reschedule") {
      selectedTasks.forEach((task) => moveTaskToTomorrow(task.id));
      dispatchToast({ message: `Đã dời ${selectedTasks.length} việc sang ngày mai.` });
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
        />
      );
    }

    return (
      <div className="space-y-4 pt-1">
        {groups.map((group) => (
          (() => {
            const groupKey = `${view}:${group.dateStr}`;
            const isCollapsed = collapsedGroups[groupKey] ?? group.tasks.length > 8;
            const completedCount = group.tasks.filter((task) => task.completed).length;
            const scheduledCount = group.tasks.filter(
              (task) => normalizeTaskTimeType(task) === "scheduled",
            ).length;
            const deadlineCount = group.tasks.filter(
              (task) => normalizeTaskTimeType(task) === "deadline",
            ).length;

            return (
              <section key={group.dateStr} className="space-y-2">
                <div className="flex items-center gap-2 border-b border-[#E5E5EA] dark:border-[#2C2C2E] pb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCollapsedGroups((previous) => ({
                        ...previous,
                        [groupKey]: !isCollapsed,
                      }));
                    }}
                    aria-expanded={!isCollapsed}
                    aria-label={`${isCollapsed ? "Mở" : "Thu gọn"} nhóm ${formatFullDate(group.dateStr)}`}
                    className="flex min-h-[40px] min-w-0 flex-1 items-center gap-2 text-left active:scale-[0.98] transition-all cursor-pointer"
                  >
                    {isCollapsed ? <ChevronDown size={16} strokeWidth={2.4} /> : <ChevronUp size={16} strokeWidth={2.4} />}
                    <span className="h-2 w-2 shrink-0 rounded-full bg-[#1C1C1E] dark:bg-white" />
                    <span className="min-w-0 truncate text-sm font-semibold text-[#1C1C1E] dark:text-[#F2F2F7]">
                      {formatFullDate(group.dateStr)}
                    </span>
                  </button>

                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-x-2 gap-y-0.5 text-[11px] text-[#8E8E93] dark:text-[#aeaeb2]">
                    <span className="font-semibold text-[#1C1C1E] dark:text-[#F2F2F7]">{group.tasks.length} việc</span>
                    <span>{completedCount} xong</span>
                    {scheduledCount > 0 && <span>{scheduledCount} hẹn</span>}
                    {deadlineCount > 0 && <span>{deadlineCount} hạn</span>}
                  </div>
                </div>

                {isCollapsed ? (
                  <button
                    type="button"
                    onClick={() => {
                      setCollapsedGroups((previous) => ({ ...previous, [groupKey]: false }));
                    }}
                    className="w-full rounded-xl border border-dashed border-[#E5E5EA] dark:border-[#2C2C2E] bg-black/[0.02] dark:bg-white/[0.04] px-3.5 py-2.5 text-left text-xs text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-[#F2F2F7] cursor-pointer transition-colors"
                  >
                    Nhóm đang thu gọn. Chạm để xem {group.tasks.length} việc.
                  </button>
                ) : (
                  <TaskList
                    tasks={group.tasks}
                    emptyMessage=""
                    emptySubMessage=""
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
                  />
                )}
              </section>
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
      {/* 1. Tiêu đề + thanh chuyển đổi chính + Tìm kiếm */}
      <div className="space-y-2.5 select-none">
        <SketchTabs
          ariaLabel="Chuyển loại hạn định"
          size="md"
          className="w-full flex justify-center [&>button]:min-h-[40px] [&>button]:flex-1"
          value={view}
          onChange={setView}
          items={[
            {
              key: "overdue",
              label: "Quá hạn",
              icon: <AlertTriangle size={13} strokeWidth={2.2} />,
              badge:
                overdueTasks.length > 0 ? (
                  <span className="min-w-[18px] rounded-md bg-[#FF3B30] text-white px-1.5 py-0.5 text-center font-mono text-[10px] leading-none font-semibold">
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
                  <span className="min-w-[18px] rounded-md bg-[#007AFF] text-white px-1.5 py-0.5 text-center font-mono text-[10px] leading-none font-semibold">
                    {upcomingTasks.length}
                  </span>
                ) : undefined,
            },
          ]}
        />

        {/* Thanh tìm kiếm trong hạn định */}
        <div className="flex items-center gap-2 h-10 px-3 bg-black/[0.04] dark:bg-white/[0.08] rounded-none border border-transparent focus-within:ring-2 focus-within:ring-[#007AFF] focus-within:bg-white dark:focus-within:bg-[#2C2C2E] transition-all w-full">
          <Search size={15} strokeWidth={2.2} className="text-[#8E8E93] shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Tìm việc ${isOverdueView ? "quá hạn" : "sắp đến"}...`}
            className="bg-transparent text-xs sm:text-sm text-[#1C1C1E] dark:text-[#F2F2F7] placeholder:text-[#8E8E93] focus:outline-none w-full font-sans"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-[#F2F2F7] cursor-pointer shrink-0 rounded-md p-0.5"
              title="Xóa tìm kiếm"
            >
              <X size={14} strokeWidth={2.2} />
            </button>
          )}
        </div>
      </div>

      {/* 2. Batch actions */}
      {activeTasks.length > 0 && (
        <section className="space-y-2 rounded-2xl border border-[#E5E5EA] dark:border-[#2C2C2E] bg-white/70 dark:bg-[#1C1C1E]/70 p-3 shadow-xs">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => requestBulkAction("complete", activeTasks)}
              className="min-h-[36px] flex-1 rounded-xl bg-[#34C759]/15 hover:bg-[#34C759]/25 text-[#34C759] dark:text-[#30D158] px-3 py-1.5 text-xs font-semibold active:scale-[0.98] transition-all sm:flex-none cursor-pointer"
            >
              <CheckCheck size={14} className="mr-1.5 inline-block" />
              Hoàn thành tất cả
            </button>
            {isOverdueView && (
              <button
                type="button"
                onClick={() => requestBulkAction("reschedule", activeTasks)}
                className="min-h-[36px] flex-1 rounded-xl bg-black/[0.05] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] text-[#1C1C1E] dark:text-[#F2F2F7] px-3 py-1.5 text-xs font-semibold active:scale-[0.98] transition-all sm:flex-none cursor-pointer"
              >
                <ArrowRight size={14} className="mr-1.5 inline-block" />
                Dời ngày mai
              </button>
            )}
            {junkTasks.length > 0 && (
              <button
                type="button"
                onClick={() => requestBulkAction("delete", junkTasks)}
                className="min-h-[36px] flex-1 rounded-xl bg-[#FF3B30]/15 hover:bg-[#FF3B30]/25 text-[#FF3B30] px-3 py-1.5 text-xs font-semibold active:scale-[0.98] transition-all sm:flex-none cursor-pointer"
              >
                <Trash2 size={14} className="mr-1.5 inline-block" />
                Xóa rác ({junkTasks.length})
              </button>
            )}
          </div>
        </section>
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
            : pendingBulkAction?.kind === "reschedule"
              ? "Dời nhiều việc sang ngày mai?"
              : "Xóa task rác?"
        }
        message={
          pendingBulkAction?.kind === "complete"
            ? `Thao tác này sẽ đánh dấu ${pendingBulkAction?.tasks.length || 0} việc là đã xong.`
            : pendingBulkAction?.kind === "reschedule"
              ? `Thao tác này sẽ đưa ${pendingBulkAction?.tasks.length || 0} việc sang ngày mai.`
              : `Chỉ ${pendingBulkAction?.tasks.length || 0} task có tiêu đề lặp kiểu test đã được nhận diện. Bạn có chắc muốn xóa chúng?`
        }
        confirmText={
          pendingBulkAction?.kind === "complete"
            ? "Hoàn thành"
            : pendingBulkAction?.kind === "reschedule"
              ? "Dời ngày"
              : "Xóa task rác"
        }
      />
    </div>
  );
};
