import React, { useMemo } from "react";
import { CalendarDays, CheckCircle2, CircleDot, ListTodo, Plus } from "lucide-react";
import { TaskDto } from "../../../types";
import { TaskListSection } from "../shared/TaskListSection";
import { getTaskProgress } from "../../../utils/taskHierarchy";
import { getTaskItemType } from "../../../utils/taskSemantics";
import { useAppStore } from "../../../stores/appStore";

interface PlannerListDay {
  dateStr: string;
  dayName: string;
  dayNum: number;
  isToday: boolean;
}

interface DesktopPlannerListViewProps {
  weekDays: PlannerListDay[];
  getTasksForDate: (dateStr: string) => TaskDto[];
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenTask: (task: TaskDto) => void;
}

const getDayFullLabel = (day: PlannerListDay) => {
  const parts = day.dateStr.split("-");
  if (parts.length === 3) {
    return `${day.dayName}, ngày ${parts[2]}/${parts[1]}`;
  }
  return `${day.dayName}, ${day.dayNum}`;
};

/** Desktop-only agenda with balanced max width, clean cards and quick add */
export const DesktopPlannerListView: React.FC<DesktopPlannerListViewProps> = ({
  weekDays,
  getTasksForDate,
  onToggleTask,
  onDeleteTask,
  onOpenTask,
}) => {
  const { openQuickTaskModal } = useAppStore();
  const dayEntries = useMemo(
    () => weekDays.map((day) => ({ day, tasks: getTasksForDate(day.dateStr) })),
    [weekDays, getTasksForDate],
  );
  const { total: totalTaskCount, completed: completedCount } = getTaskProgress(
    dayEntries.flatMap((entry) => entry.tasks),
  );

  return (
    <section className="flex-1 min-h-0 overflow-y-auto bg-[var(--bg-canvas)] px-5 py-5 select-none">
      <div className="mx-auto w-full max-w-4xl space-y-4 pb-16">
        {/* A. Thẻ Tóm Tắt Tuần */}
        <header className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border-ink)] bg-[var(--bg-surface)] px-5 py-4 shadow-xs">
          <div className="flex min-w-0 items-center gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] dark:bg-[var(--accent-blue)]/20">
              <CalendarDays size={22} strokeWidth={2.2} />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-base font-extrabold text-[var(--text-main)]">
                Danh sách công việc trong tuần
              </h2>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                <span>{totalTaskCount} công việc</span>
                <span>·</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {completedCount} đã hoàn thành
                </span>
                <span>·</span>
                <span>{Math.max(0, totalTaskCount - completedCount)} cần xử lý</span>
              </div>
            </div>
          </div>

          {totalTaskCount > 0 && (
            <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-[var(--bg-surface-muted)] border border-[var(--border-ink)] shrink-0">
              <div className="w-16 h-1.5 bg-[var(--border-ink-muted)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.round((completedCount / totalTaskCount) * 100)}%` }}
                />
              </div>
              <span className="font-mono text-xs font-bold text-[var(--text-main)]">
                {Math.round((completedCount / totalTaskCount) * 100)}%
              </span>
            </div>
          )}
        </header>

        {/* B. Danh Sách Từng Ngày Trong Tuần */}
        {dayEntries.map(({ day, tasks }) => {
          const dayCompletedCount = tasks.filter((t) => t.completed).length;
          const dayTotalCount = tasks.length;
          const events = tasks.filter((task) => getTaskItemType(task) === "event");
          const taskItems = tasks.filter((task) => getTaskItemType(task) !== "event");
          const isAllDone = dayTotalCount > 0 && dayCompletedCount === dayTotalCount;

          const taskListProps = {
            variant: "planner" as const,
            hideDate: true,
            baseDateStr: day.dateStr,
            showQuickAdd: false,
            onToggle: onToggleTask,
            onDelete: onDeleteTask,
            onEdit: onOpenTask,
            onClick: onOpenTask,
            showEventTimeLabel: true,
          };

          return (
            <section
              key={day.dateStr}
              className={`overflow-hidden rounded-2xl border border-[var(--border-ink)] bg-[var(--bg-surface)] shadow-xs transition-all ${
                day.isToday ? "ring-2 ring-[var(--accent-blue)]/30 dark:ring-[var(--accent-blue)]/40" : ""
              }`}
            >
              <header className="flex items-center justify-between gap-3 border-b border-[var(--border-ink-muted)] px-4 py-3 bg-[var(--bg-surface)]">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-sm font-bold text-[var(--text-main)]">
                    {getDayFullLabel(day)}
                  </h3>
                  {day.isToday && (
                    <span className="rounded-md bg-[var(--accent-blue)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--accent-blue)] dark:bg-[var(--accent-blue)]/20">
                      Hôm nay
                    </span>
                  )}
                  {isAllDone && (
                    <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      ✓ Xong hết
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[var(--text-muted)] font-medium">
                    {dayCompletedCount}/{dayTotalCount} việc
                  </span>
                  <button
                    type="button"
                    onClick={() => openQuickTaskModal({ dueDate: day.dateStr })}
                    className="h-6 w-6 rounded-lg border border-[var(--border-ink)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-muted)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors active:scale-95 cursor-pointer"
                    title={`Thêm việc vào ${day.dayName}`}
                  >
                    <Plus size={12} strokeWidth={2.4} />
                  </button>
                </div>
              </header>

              {tasks.length === 0 ? (
                <div className="flex items-center justify-between px-4 py-4 text-xs text-[var(--text-muted)]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[var(--text-muted)] opacity-60" />
                    <span>Chưa có lịch trình hay công việc nào.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openQuickTaskModal({ dueDate: day.dateStr })}
                    className="text-xs font-bold text-[var(--accent-blue)] hover:underline cursor-pointer"
                  >
                    + Thêm việc
                  </button>
                </div>
              ) : (
                <div className="p-2.5 space-y-2.5">
                  {events.length > 0 && (
                    <TaskListSection
                      title="Sự kiện"
                      tasks={events}
                      icon={<CircleDot size={14} strokeWidth={2.2} />}
                      tone="info"
                      {...taskListProps}
                    />
                  )}

                  {taskItems.length > 0 && (
                    <TaskListSection
                      title="Công việc"
                      tasks={taskItems}
                      icon={<ListTodo size={14} strokeWidth={2.2} />}
                      tone="neutral"
                      {...taskListProps}
                    />
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </section>
  );
};
