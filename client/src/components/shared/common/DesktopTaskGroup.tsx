import React, { ReactNode, useState } from "react";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { TaskDto } from "../../../types";
import { TaskList } from "./TaskList";
import { sortDesktopTasks } from "./desktopTaskListUtils";

export interface DesktopTaskGroupProps {
  title: string;
  tasks: TaskDto[];
  dateStr?: string;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  subtitle?: string;
  badge?: ReactNode;
  headerAction?: ReactNode;
  isToday?: boolean;
  emptyMessage?: string;
  emptySubMessage?: string;
  variant?: "today" | "planner" | "overdue";
  hideDate?: boolean;
  activeTaskId?: string;
  showEventTimeLabel?: boolean;
  onToggle: (taskId: string) => void;
  onOpenTask: (task: TaskDto) => void;
  onDelete: (taskId: string) => void;
  onMoveTomorrow?: (taskId: string) => void;
  onAddSubtask?: (parentTask: TaskDto) => void;
  onAddTask?: () => void;
  itemLabel?: "việc" | "sự kiện";
  showCompletionSection?: boolean;
  visualStyle?: "plain" | "tag" | "event";
  accentIndex?: number;
}

export const DesktopTaskGroup: React.FC<DesktopTaskGroupProps> = ({
  title,
  tasks,
  dateStr,
  collapsed,
  onCollapsedChange,
  subtitle,
  badge,
  headerAction,
  isToday = false,
  emptyMessage = "Chưa có công việc",
  emptySubMessage,
  variant = "today",
  hideDate = true,
  activeTaskId,
  showEventTimeLabel = true,
  onToggle,
  onOpenTask,
  onDelete,
  onMoveTomorrow,
  onAddSubtask,
  onAddTask,
  itemLabel = "việc",
  showCompletionSection = true,
  visualStyle = "plain",
  accentIndex = 0,
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = collapsed ?? internalCollapsed;
  const orderedTasks = sortDesktopTasks(tasks);
  const isCollection = visualStyle !== "plain";
  const accentClass =
    visualStyle === "event"
      ? "bg-[var(--accent-blue)]"
      : accentIndex % 3 === 1
        ? "bg-[var(--accent-blue)]"
        : accentIndex % 3 === 2
          ? "bg-[var(--text-muted)]"
          : "bg-[var(--accent-sky-strong)]";

  const setCollapsed = (nextCollapsed: boolean) => {
    onCollapsedChange?.(nextCollapsed);
    if (collapsed === undefined) setInternalCollapsed(nextCollapsed);
  };

  return (
    <section
      className={`w-full min-w-0 ${
        isCollection ? "rounded-2xl bg-[var(--bg-surface)] p-3 md:p-4" : ""
      }`}
    >
      {/* === PHẦN 1: Nhận diện nhóm bằng bề mặt và điểm nhấn, không dùng divider === */}
      <header
        className={`flex min-h-10 items-center justify-between gap-3 ${
          isCollection ? "rounded-xl bg-[var(--bg-surface-muted)] px-3 py-2" : "px-1 py-2"
        }`}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <button
            type="button"
            onClick={() => setCollapsed(!isCollapsed)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-surface-muted)] hover:text-[var(--text-main)] cursor-pointer"
            aria-label={isCollapsed ? `Mở ${title}` : `Thu gọn ${title}`}
            title={isCollapsed ? "Mở nhóm" : "Thu gọn nhóm"}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
          </button>
          {isCollection && <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${accentClass}`} aria-hidden="true" />}
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <h2 className="truncate text-sm font-bold text-[var(--text-main)]">{title}</h2>
              {isToday && (
                <span className="shrink-0 rounded-full bg-[var(--accent-blue)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--accent-blue)]">
                  Hôm nay
                </span>
              )}
              {badge}
            </div>
            {(subtitle || dateStr) && (
              <p className="mt-0.5 truncate text-[11px] text-[var(--text-muted)]">
                {subtitle || dateStr}
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="font-mono text-[11px] font-semibold text-[var(--text-muted)]">
            {tasks.length} {itemLabel}
          </span>
          {headerAction}
          {onAddTask && (
            <button
              type="button"
              onClick={onAddTask}
              className="flex h-7 w-7 items-center justify-center rounded-xl text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-surface-muted)] hover:text-[var(--text-main)] cursor-pointer"
              aria-label={`Thêm ${itemLabel} vào ${title}`}
              title={`Thêm ${itemLabel}`}
            >
              <Plus size={15} strokeWidth={2.3} />
            </button>
          )}
        </div>
      </header>

      {/* === PHẦN 2: Nội dung của nhóm giữ nhịp bằng khoảng cách, không thêm đường kẻ === */}
      {!isCollapsed && (
        <div className={isCollection ? "pt-3" : "pt-2"}>
          <TaskList
            tasks={orderedTasks}
            emptyMessage={emptyMessage}
            emptySubMessage={emptySubMessage}
            onToggle={onToggle}
            onEdit={onOpenTask}
            onDelete={onDelete}
            onMoveTomorrow={onMoveTomorrow}
            onAddSubtask={onAddSubtask}
            onClick={onOpenTask}
            variant={variant}
            hideDate={hideDate}
            baseDateStr={dateStr}
            activeTaskId={activeTaskId}
            showQuickAdd={false}
            showEventTimeLabel={showEventTimeLabel}
            presentation="desktop"
            showCompletionSection={showCompletionSection}
          />
        </div>
      )}
    </section>
  );
};
