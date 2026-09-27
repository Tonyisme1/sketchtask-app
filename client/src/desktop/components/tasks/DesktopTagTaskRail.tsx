import React, { useMemo, useState } from "react";
import { CalendarDays, ChevronDown, Tag } from "lucide-react";
import { TaskDto } from "../../../types";
import { formatShortDayMonth } from "../../../utils/date";
import { getTaskEffectiveDate } from "../../../utils/taskSemantics";
import { TaskCard } from "../../../components/shared/common/TaskCard";

export interface DesktopTagTaskRailProps {
  title: string;
  tasks: TaskDto[];
  accentIndex?: number;
  activeTaskId?: string;
  onToggle: (taskId: string) => void;
  onOpenTask: (task: TaskDto) => void;
}

interface DateGroup {
  key: string;
  label: string;
  tasks: TaskDto[];
}

const sortTasksByTime = (tasks: TaskDto[]) =>
  [...tasks].sort((first, second) => {
    const firstTime = first.deadlineTime || first.startTime || "99:99";
    const secondTime = second.deadlineTime || second.startTime || "99:99";
    if (firstTime !== secondTime) return firstTime.localeCompare(secondTime);
    return first.title.localeCompare(second.title, "vi");
  });

/**
 * One tag is one column, mirroring a list board rather than turning tags into
 * stacked sections. Date labels organise the vertical contents of that column.
 */
export const DesktopTagTaskRail: React.FC<DesktopTagTaskRailProps> = ({
  title,
  tasks,
  accentIndex = 0,
  activeTaskId,
  onToggle,
  onOpenTask,
}) => {
  const [isCompletedOpen, setIsCompletedOpen] = useState(false);
  const { activeDateGroups, completedTasks } = useMemo(() => {
    const grouped = new Map<string, TaskDto[]>();
    const undated: TaskDto[] = [];
    const completed: TaskDto[] = [];

    tasks.forEach((task) => {
      if (task.completed) {
        completed.push(task);
        return;
      }

      const date = getTaskEffectiveDate(task);
      if (!date) {
        undated.push(task);
        return;
      }

      const items = grouped.get(date) || [];
      items.push(task);
      grouped.set(date, items);
    });

    const dated = [...grouped.entries()]
      .sort(([firstDate], [secondDate]) => firstDate.localeCompare(secondDate))
      .map(([date, items]) => ({
        key: date,
        label: formatShortDayMonth(date),
        tasks: sortTasksByTime(items),
      }));

    if (undated.length > 0) {
      dated.push({
        key: "undated",
        label: "Chưa đặt ngày",
        tasks: sortTasksByTime(undated),
      });
    }

    return { activeDateGroups: dated, completedTasks: sortTasksByTime(completed) };
  }, [tasks]);

  const accentClass =
    accentIndex % 3 === 1
      ? "bg-[var(--accent-blue)]"
      : accentIndex % 3 === 2
        ? "bg-[var(--accent-sky-strong)]"
        : "bg-[var(--text-muted)]";

  return (
    <section className="flex h-[min(720px,calc(100vh-194px))] min-h-[380px] w-[min(360px,calc(100vw-248px))] shrink-0 flex-col border-l border-[var(--border-ink-muted)] pl-5 pr-3 first:border-l-0 first:pl-0">
      {/* === PHẦN 1: Header lane phẳng, không tạo card bọc card === */}
      <header className="flex min-h-11 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${accentClass}`} aria-hidden="true" />
          <Tag size={15} className="shrink-0 text-[var(--text-muted)]" strokeWidth={2.2} />
          <h2 className="truncate text-base font-bold text-[var(--text-main)]">{title}</h2>
        </div>
        <span className="shrink-0 font-mono text-[10px] font-semibold text-[var(--text-muted)]">
          {tasks.length}
        </span>
      </header>

      {/* === PHẦN 2: Một lane cuộn dọc, phân nhóm bằng mốc ngày === */}
      <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-2 [scrollbar-color:var(--border-ink-muted)_transparent]">
        {activeDateGroups.length === 0 ? (
          <div className="px-2 py-10 text-center text-xs text-[var(--text-muted)]">
            Chưa có việc cần làm.
          </div>
        ) : (
          <div className="space-y-4">
            {activeDateGroups.map((group) => (
              <section key={group.key}>
                <div className="mb-2.5 flex min-h-7 items-center gap-2">
                  <CalendarDays size={14} className="shrink-0 text-[var(--accent-blue)]" strokeWidth={2.3} />
                  <h3 className="truncate text-[11px] font-bold text-[var(--text-muted)]">{group.label}</h3>
                  <span className="ml-auto shrink-0 font-mono text-[10px] text-[var(--text-muted)]">{group.tasks.length}</span>
                </div>
                <div className="space-y-2">
                  {group.tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggle={onToggle}
                      onEdit={onOpenTask}
                      onClick={onOpenTask}
                      hideDate
                      presentation="desktop"
                      isSelected={activeTaskId === task.id}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* === PHẦN 3: Việc đã xong luôn thu gọn ở đáy list === */}
      {completedTasks.length > 0 && (
        <div className="mt-4 shrink-0 pr-2">
          <button
            type="button"
            onClick={() => setIsCompletedOpen((open) => !open)}
            aria-expanded={isCompletedOpen}
            className="flex w-full items-center justify-between rounded-xl bg-[var(--bg-surface-muted)] px-3 py-2 text-left text-[11px] font-bold text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-interactive)] hover:text-[var(--text-main)]"
          >
            <span>Đã xong ({completedTasks.length})</span>
            <ChevronDown size={14} className={`transition-transform ${isCompletedOpen ? "rotate-180" : ""}`} />
          </button>
          {isCompletedOpen && (
            <div className="mt-2 max-h-52 space-y-2 overflow-y-auto pr-1">
              {completedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={onToggle}
                  onEdit={onOpenTask}
                  onClick={onOpenTask}
                  hideDate
                  presentation="desktop"
                  isSelected={activeTaskId === task.id}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
