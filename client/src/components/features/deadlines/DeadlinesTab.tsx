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
} from "lucide-react";
import { useAppStore } from "../../../stores/appStore";
import { useResponsiveLayout } from "../../../shared/hooks";
import { TaskDto } from "../../../types";
import { formatFullDate, getLocalTodayStr, getLocalTomorrowStr } from "../../../utils/date";
import { SketchTabs } from "../../layout/SketchTabs";
import { ConfirmModal } from "../../ui/overlays/ConfirmModal";
import { dispatchToast } from "../../../utils/toast";
import {
  getTaskEffectiveDate,
  getTaskEffectiveTime,
  getTaskTemporalState,
  normalizeTaskTimeType,
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
    const dateA = getTaskEffectiveDate(taskA) || "9999-99-99";
    const dateB = getTaskEffectiveDate(taskB) || "9999-99-99";
    const dateOrder = dateA.localeCompare(dateB);
    if (dateOrder !== 0) return dateOrder;
    return (getTaskEffectiveTime(taskA) || "99:99").localeCompare(
      getTaskEffectiveTime(taskB) || "99:99",
    );
  });

const groupByDate = (tasks: TaskDto[]) => {
  const groups = new Map<string, TaskDto[]>();

  for (const task of tasks) {
    const date = getTaskEffectiveDate(task) || "no-date";
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
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [pendingBulkAction, setPendingBulkAction] = useState<PendingBulkAction | null>(null);

  const overdueTasks = useMemo(
    () =>
      sortByDateAndTime(
        tasks.filter((task) => {
          if (task.completed) return false;
          const state = getTaskTemporalState(task);
          return state === "overdue" || state === "pastScheduled";
        }),
      ),
    [tasks],
  );

  const upcomingTasks = useMemo(
    () =>
      sortByDateAndTime(
        tasks.filter((task) => {
          if (task.completed) return false;
          const state = getTaskTemporalState(task);
          if (state === "overdue" || state === "pastScheduled") return false;
          if (normalizeTaskTimeType(task) !== "deadline") return false;
          const date = getTaskEffectiveDate(task);
          return date === todayStr || date === tomorrowStr;
        }),
      ),
    [tasks, todayStr, tomorrowStr],
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
                <div className="flex items-center gap-2 border-b border-[#262626]/20 pb-2">
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
                    className="flex min-h-[44px] min-w-0 flex-1 items-center gap-2 text-left active:translate-x-[0.5px] active:translate-y-[0.5px]"
                  >
                    {isCollapsed ? <ChevronDown size={16} strokeWidth={2.4} /> : <ChevronUp size={16} strokeWidth={2.4} />}
                    <span className="h-2 w-2 shrink-0 rounded-full bg-[#1C1917]" />
                    <span className="min-w-0 truncate text-sm font-semibold text-[#1C1917]">
                      {formatFullDate(group.dateStr)}
                    </span>
                  </button>

                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-x-2 gap-y-0.5 text-[11px] text-[#78716C]">
                    <span className="font-semibold text-[#1C1917]">{group.tasks.length} việc</span>
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
                    className="w-full border border-dashed border-[#D4CEBF] bg-[#FAF8F3] px-3 py-2 text-left text-xs text-[#78716C] hover:border-[#262626] hover:text-[#1C1917]"
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
      {/* 1. Tiêu đề + thanh chuyển đổi chính */}
      <div className="space-y-3 select-none">
        <SketchTabs
          ariaLabel="Chuyển loại hạn định"
          size="md"
          className="w-full border-b-0 rounded-[6px] border-[1.5px] border-[#262626] bg-[#FAF8F3] p-1 pb-1 shadow-[2px_2px_0px_#262626] [&>button]:min-h-[44px] [&>button]:flex-1 [&>button]:justify-center"
          value={view}
          onChange={setView}
          items={[
            {
              key: "overdue",
              label: "Quá hạn",
              icon: <AlertTriangle size={13} strokeWidth={2.4} />,
              badge:
                overdueTasks.length > 0 ? (
                  <span className="min-w-[18px] border-[1px] border-[#FDA4AF] bg-[#FFE4E6] px-1 py-0.5 text-center font-mono text-[10px] leading-none text-[#BE123C]">
                    {overdueTasks.length}
                  </span>
                ) : undefined,
            },
            {
              key: "upcoming",
              label: "Sắp đến",
              icon: <BellRing size={13} strokeWidth={2.4} />,
              badge:
                upcomingTasks.length > 0 ? (
                  <span className="min-w-[18px] border-[1px] border-[#7DD3FC] bg-[#E0F2FE] px-1 py-0.5 text-center font-mono text-[10px] leading-none text-[#0369A1]">
                    {upcomingTasks.length}
                  </span>
                ) : undefined,
            },
          ]}
        />

      </div>

      {/* 2. Tiêu Đề Khu Vực (Đồng Bộ PlannerWeekView) */}
      <div className="flex items-center justify-between pb-2 border-b border-[#262626]/20 flex-wrap gap-2 pt-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[4px] bg-[#1C1917] border-[1.5px] border-[#262626] flex items-center justify-center text-white shadow-[1px_1px_0px_#262626]">
            {isOverdueView ? (
              <AlertTriangle size={14} strokeWidth={2.4} className="text-red-400" />
            ) : (
              <Hourglass size={14} strokeWidth={2.4} className="text-sky-300" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm sm:text-base text-[#1C1917]">
                {isOverdueView ? "Danh sách quá hạn" : "Hạn định sắp tới"}
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${
                  isOverdueView
                    ? "bg-red-50 text-red-700 border-red-300"
                    : "bg-sky-50 text-sky-700 border-sky-300"
                }`}
              >
                {isOverdueView ? "Cần xử lý" : "Hôm nay & Ngày mai"}
              </span>
            </div>
            <p className="text-xs text-[#78716C]">
              {isOverdueView
                ? `Có ${activeCount} công việc đã quá hạn hoàn thành hoặc lịch hẹn cũ`
                : `Có ${activeCount} công việc có hạn hoàn thành`}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Batch actions chỉ tác động lên danh sách đang xem và luôn có xác nhận. */}
      {activeTasks.length > 0 && (
        <section className="space-y-3 rounded-[6px] border-[1.5px] border-[#D4CEBF] bg-[#FAF8F3] p-3">
          <div>
            <h4 className="text-sm font-semibold text-[#1C1917]">Thao tác nhanh</h4>
            <p className="mt-0.5 text-[11px] text-[#78716C]">Áp dụng cho {activeCount} việc trong tab {isOverdueView ? "Quá hạn" : "Sắp đến"}.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => requestBulkAction("complete", activeTasks)}
              className="min-h-[40px] flex-1 border-[1.5px] border-[#262626] bg-[#BBF7D0] px-3 py-2 text-xs font-semibold text-[#14532D] shadow-[1px_1px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none sm:flex-none"
            >
              <CheckCheck size={14} className="mr-1.5 inline-block" />
              Hoàn thành tất cả
            </button>
            {isOverdueView && (
              <button
                type="button"
                onClick={() => requestBulkAction("reschedule", activeTasks)}
                className="min-h-[40px] flex-1 border-[1.5px] border-[#262626] bg-white px-3 py-2 text-xs font-semibold text-[#1C1917] shadow-[1px_1px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none sm:flex-none"
              >
                <ArrowRight size={14} className="mr-1.5 inline-block" />
                Dời sang ngày mai
              </button>
            )}
            {junkTasks.length > 0 && (
              <button
                type="button"
                onClick={() => requestBulkAction("delete", junkTasks)}
                className="min-h-[40px] flex-1 border-[1.5px] border-[#BE123C] bg-[#FFE4E6] px-3 py-2 text-xs font-semibold text-[#9F1239] shadow-[1px_1px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none sm:flex-none"
              >
                <Trash2 size={14} className="mr-1.5 inline-block" />
                Dọn task rác ({junkTasks.length})
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
