import React, { useMemo } from "react";
import { TaskDto, TaskItemType } from "../../../types";
import { getTaskProgress } from "../../../utils/taskHierarchy";
import { useAppStore } from "../../../stores/appStore";
import { DesktopTaskGroup } from "../../../components/shared/common/DesktopTaskGroup";

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
  itemType?: TaskItemType;
}

const getDayFullLabel = (day: PlannerListDay) => {
  const parts = day.dateStr.split("-");
  if (parts.length === 3) return `${day.dayName}, ngày ${parts[2]}/${parts[1]}`;
  return `${day.dayName}, ${day.dayNum}`;
};

/** Desktop-only agenda: the date heading is separate from the task cards. */
export const DesktopPlannerListView: React.FC<DesktopPlannerListViewProps> = ({
  weekDays,
  getTasksForDate,
  onToggleTask,
  onDeleteTask,
  onOpenTask,
  itemType = "task",
}) => {
  const { openQuickTaskModal, moveTaskToTomorrow } = useAppStore();
  const isEventStream = itemType === "event";
  const dayEntries = useMemo(
    () => weekDays.map((day) => ({ day, tasks: getTasksForDate(day.dateStr) })),
    [weekDays, getTasksForDate],
  );
  const visibleDayEntries = isEventStream
    ? dayEntries.filter((entry) => entry.tasks.length > 0)
    : dayEntries;
  const { total: totalTaskCount, completed: completedCount } = getTaskProgress(
    dayEntries.flatMap((entry) => entry.tasks),
  );

  return (
    <section className="flex-1 min-h-0 overflow-y-auto bg-[var(--bg-canvas)] px-5 py-5 select-none">
      <div className="w-full max-w-none space-y-6 pb-16">
        {/* === PHẦN 1: Tóm tắt tuần === */}
        <header className="flex items-center justify-between gap-3 pb-2">
          <div className="flex min-w-0 items-center">
            <div className="min-w-0">
              <h2 className="truncate text-base font-extrabold text-[var(--text-main)]">
                {isEventStream ? "Dòng sự kiện trong tuần" : "Dòng công việc trong tuần"}
              </h2>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                <span>{totalTaskCount} {isEventStream ? "sự kiện" : "công việc"}</span>
                {!isEventStream && (
                  <>
                    <span>·</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {completedCount} đã hoàn thành
                    </span>
                  </>
                )}
                <span>·</span>
                <span>
                  {isEventStream
                    ? totalTaskCount
                    : Math.max(0, totalTaskCount - completedCount)} {isEventStream ? "sắp diễn ra" : "cần xử lý"}
                </span>
              </div>
            </div>
          </div>

          {!isEventStream && totalTaskCount > 0 && (
            <span className="font-mono text-xs font-bold text-[var(--text-muted)]">
              {Math.round((completedCount / totalTaskCount) * 100)}%
            </span>
          )}
        </header>

        {/* === PHẦN 2: Header ngày và card trực tiếp === */}
        {visibleDayEntries.map(({ day, tasks }) => {
          const dayCompletedCount = tasks.filter((task) => task.completed).length;
          const dayTotalCount = tasks.length;
          const isAllDone = dayTotalCount > 0 && dayCompletedCount === dayTotalCount;

          return (
            <DesktopTaskGroup
              key={day.dateStr}
              title={getDayFullLabel(day)}
              dateStr={day.dateStr}
              tasks={tasks}
              isToday={day.isToday}
              subtitle={`${dayCompletedCount}/${dayTotalCount} ${isEventStream ? "sự kiện" : "việc"}`}
              badge={
                isAllDone ? (
                  <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    Xong hết
                  </span>
                ) : undefined
              }
              emptyMessage={isEventStream ? "Chưa có sự kiện nào" : "Chưa có lịch trình hay công việc nào"}
              emptySubMessage={isEventStream ? "Bạn có thể thêm sự kiện cho ngày này." : "Bạn có thể thêm task cho ngày này."}
              variant="planner"
              onToggle={onToggleTask}
              onOpenTask={onOpenTask}
              onDelete={onDeleteTask}
              onMoveTomorrow={moveTaskToTomorrow}
              onAddTask={() => openQuickTaskModal({ dueDate: day.dateStr, itemType, lockItemType: true })}
              itemLabel={isEventStream ? "sự kiện" : "việc"}
              showCompletionSection={!isEventStream}
            />
          );
        })}

        {isEventStream && visibleDayEntries.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-sm font-semibold text-[var(--text-main)]">
              Chưa có sự kiện trong tuần này
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Thêm một sự kiện để bắt đầu xây dựng dòng thời gian.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
