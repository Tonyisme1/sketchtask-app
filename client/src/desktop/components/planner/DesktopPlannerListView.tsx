import React, { useMemo } from "react";
import { TaskDto, TaskItemType } from "../../../types";
import { useAppStore } from "../../../stores/appStore";
import { DesktopTaskGroup } from "../tasks/DesktopTaskGroup";

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
  const totalTaskCount = dayEntries.reduce((count, entry) => count + entry.tasks.length, 0);

  return (
    <section className="flex-1 min-h-0 overflow-y-auto bg-[var(--bg-canvas)] px-5 py-5 select-none">
      <div className="w-full max-w-none space-y-5 pb-16">
        {/* === PHẦN 1: Tóm tắt dòng thời gian === */}
        <header className="flex items-center justify-between gap-3 px-1 pb-1">
          <div className="flex min-w-0 items-center">
            <div className="min-w-0">
              <h2 className="truncate text-base font-extrabold text-[var(--text-main)]">
                {isEventStream ? "Dòng sự kiện trong tuần" : "Dòng công việc trong tuần"}
              </h2>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                <span>{totalTaskCount} {isEventStream ? "sự kiện đã xếp lịch" : "công việc trong tuần"}</span>
              </div>
            </div>
          </div>
        </header>

        {/* === PHẦN 2: Mỗi ngày là một block timeline có điểm nhấn riêng === */}
        {visibleDayEntries.map(({ day, tasks }, index) => {
          const dayTotalCount = tasks.length;

          return (
            <DesktopTaskGroup
              key={day.dateStr}
              title={getDayFullLabel(day)}
              dateStr={day.dateStr}
              tasks={tasks}
              isToday={day.isToday}
              subtitle={`${dayTotalCount} ${isEventStream ? "sự kiện" : "việc"}`}
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
              visualStyle={isEventStream ? "event" : "tag"}
              accentIndex={index}
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
