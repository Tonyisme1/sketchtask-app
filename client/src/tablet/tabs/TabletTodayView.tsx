import React, { useState, useMemo } from "react";
import { CheckCircle2, ChevronDown, ListTodo } from "lucide-react";
import { useAppStore } from "../../stores";
import { getLocalTodayStr, isTaskDueToday, normalizeTaskTimeType } from "../../utils";
import { TodayScheduleNotes } from "../../components/shared/today/TodayScheduleNotes";
import { TodayTaskList } from "../../components/shared/today/TodayTaskList";

export interface TabletTodayViewProps {
  targetTaskId?: string;
  onClearTarget?: () => void;
}

export const TabletTodayView: React.FC<TabletTodayViewProps> = ({
  targetTaskId,
}) => {
  const {
    tasks,
    toggleTask,
    deleteTask,
    moveTaskToTomorrow,
    hideCompletedTasks,
    openTaskDetail,
  } = useAppStore();

  const now = new Date();
  const todayStr = getLocalTodayStr(now);

  const [isCompletedSectionOpen, setIsCompletedSectionOpen] = useState(false);

  const todayList = useMemo(() => {
    return tasks.filter((task) => isTaskDueToday(task, now));
  }, [tasks, todayStr]);

  const activeScheduledTasks = useMemo(() => {
    return todayList.filter((task) => {
      if (task.parentTaskId) return false;
      if (task.completed) return false;
      return normalizeTaskTimeType(task) === "scheduled";
    });
  }, [todayList]);

  const activeTaskListItems = useMemo(() => {
    return todayList.filter((task) => {
      if (task.completed) return false;
      return normalizeTaskTimeType(task) !== "scheduled";
    });
  }, [todayList]);

  const completedTodayTasks = useMemo(() => {
    if (hideCompletedTasks) return [];
    return todayList.filter((task) => task.completed);
  }, [todayList, hideCompletedTasks]);

  return (
    <div className="w-full min-w-0 space-y-2.5 select-none pb-6">
      {/* Tablet uses the shared header search; keep this workspace focused on today's work. */}
      <div className="space-y-4 w-full">
        {/* Lịch hẹn chưa xong */}
        {activeScheduledTasks.length > 0 && (
          <TodayScheduleNotes
            scheduledTasks={activeScheduledTasks}
            onToggle={toggleTask}
            onEdit={(task) => openTaskDetail(task.id)}
            onDelete={deleteTask}
            onMoveTomorrow={moveTaskToTomorrow}
            onClick={(task) => openTaskDetail(task.id)}
            activeTaskId={targetTaskId}
            title="Lịch hẹn"
          />
        )}

        {/* Công việc cần làm (Chưa xong) */}
        <section className="min-w-0 space-y-2">
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#1C1917] dark:text-[#F2F2F7]">
              <ListTodo size={16} className="text-[#57534E] dark:text-[#aeaeb2]" strokeWidth={2.2} />
              <span>Công việc cần làm ({activeTaskListItems.length})</span>
            </div>
          </div>

          <TodayTaskList
            tasks={activeTaskListItems}
            onToggle={toggleTask}
            onEdit={(task) => openTaskDetail(task.id)}
            onDelete={deleteTask}
            onMoveTomorrow={moveTaskToTomorrow}
            onClick={(task) => openTaskDetail(task.id)}
            activeTaskId={targetTaskId}
            showQuickAdd={false}
          />
        </section>

        {/* Toàn bộ công việc đã hoàn thành */}
        {completedTodayTasks.length > 0 && (
          <div className="mt-6 pt-4 space-y-2.5">
            <button
              type="button"
              onClick={() => setIsCompletedSectionOpen((open) => !open)}
              className="flex w-full items-center justify-between pb-2 text-left text-sm font-semibold text-[#8E8E93] dark:text-[#aeaeb2]"
              aria-expanded={isCompletedSectionOpen}
            >
              <span className="flex items-center gap-2">
                <CheckCircle2 size={16} strokeWidth={2.2} className="text-emerald-500 shrink-0" />
                <span>Đã hoàn thành ({completedTodayTasks.length})</span>
              </span>
              <ChevronDown
                size={16}
                strokeWidth={2.2}
                className={`shrink-0 transition-transform duration-200 ${isCompletedSectionOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isCompletedSectionOpen && (
              <TodayTaskList
                tasks={completedTodayTasks}
                onToggle={toggleTask}
                onEdit={(task) => openTaskDetail(task.id)}
                onDelete={deleteTask}
                onMoveTomorrow={moveTaskToTomorrow}
                onClick={(task) => openTaskDetail(task.id)}
                activeTaskId={targetTaskId}
                showQuickAdd={false}
                showCompletionSection={false}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
