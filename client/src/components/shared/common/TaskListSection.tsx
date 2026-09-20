import React, { ReactNode, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { TaskDto } from "../../../types";
import { TaskList, TaskListProps } from "./TaskList";

export interface TaskListSectionProps extends Omit<TaskListProps, "tasks"> {
  tasks: TaskDto[];
  title: string;
  count?: number;
  subtitle?: string;
  icon?: ReactNode;
  headerAction?: ReactNode;
  tone?: "neutral" | "info" | "danger" | "success";
  defaultCollapsed?: boolean;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  hideHeader?: boolean;
}

const toneStyles = {
  neutral: {
    icon: "text-[var(--text-muted)]",
    dot: "bg-[var(--text-muted)]",
  },
  info: {
    icon: "text-[var(--accent-blue)]",
    dot: "bg-[var(--accent-blue)]",
  },
  danger: {
    icon: "text-[var(--accent-coral)]",
    dot: "bg-[var(--accent-coral)]",
  },
  success: {
    icon: "text-[var(--accent-mint)]",
    dot: "bg-[var(--accent-mint)]",
  },
} as const;

export const TaskListSection: React.FC<TaskListSectionProps> = ({
  tasks,
  title,
  count = tasks.length,
  subtitle,
  icon,
  headerAction,
  tone = "neutral",
  defaultCollapsed = false,
  collapsed: controlledCollapsed,
  onCollapsedChange,
  hideHeader = false,
  ...taskListProps
}) => {
  const [localCollapsed, setLocalCollapsed] = useState(defaultCollapsed);
  const isCollapsed = controlledCollapsed ?? localCollapsed;
  const colors = toneStyles[tone];

  const setCollapsed = (nextCollapsed: boolean) => {
    if (controlledCollapsed === undefined) {
      setLocalCollapsed(nextCollapsed);
    }
    onCollapsedChange?.(nextCollapsed);
  };

  if (hideHeader) {
    return <TaskList tasks={tasks} {...taskListProps} />;
  }

  return (
    <section className="overflow-hidden rounded-3xl bg-[var(--bg-surface)] shadow-xs">
      <div className="flex min-h-12 items-center gap-2 px-4 py-1">
        <button
          type="button"
          onClick={() => setCollapsed(!isCollapsed)}
          aria-expanded={!isCollapsed}
          className="flex min-w-0 flex-1 items-center gap-2.5 py-2 text-left transition-colors hover:text-[var(--text-main)] active:scale-[0.99] cursor-pointer"
        >
          {isCollapsed ? <ChevronDown size={16} strokeWidth={2.3} /> : <ChevronUp size={16} strokeWidth={2.3} />}
          <span className={`shrink-0 ${colors.icon}`}>{icon}</span>
          <span className={`h-2 w-2 shrink-0 rounded-full opacity-75 ${colors.dot}`} />
          <span className="min-w-0 truncate text-sm font-bold text-[var(--text-main)]">{title}</span>
          <span className="shrink-0 font-mono text-[11px] font-semibold text-[var(--text-muted)]">{count}</span>
          {subtitle && (
            <span className="hidden min-w-0 truncate text-[11px] text-[var(--text-muted)] md:inline">
              {subtitle}
            </span>
          )}
        </button>
        {headerAction && <div className="flex shrink-0 items-center gap-1.5">{headerAction}</div>}
      </div>

      {isCollapsed ? (
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="w-full px-3 py-3 text-left text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text-main)]"
        >
          Nhóm đang thu gọn. Bấm để xem {count} việc.
        </button>
      ) : (
        <div className="px-3 pb-3">
          <TaskList tasks={tasks} {...taskListProps} />
        </div>
      )}
    </section>
  );
};
