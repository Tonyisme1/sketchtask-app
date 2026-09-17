import React, { useMemo } from "react";
import { CheckCircle2, ListTodo } from "lucide-react";
import { useAppStore } from "../../shared/stores";
import { getLocalTodayStr, isTaskDueToday, normalizeTaskTimeType } from "../../shared/utils";
import { TodayScheduleNotes } from "../../components/features/today/TodayScheduleNotes";
import { TodayTaskList } from "../../components/features/today/TodayTaskList";

export interface DesktopTodayViewProps {
  targetTaskId?: string;
  onClearTarget?: () => void;
}

export const DesktopTodayView: React.FC<DesktopTodayViewProps> = ({
  targetTaskId,
}) => {
  const {
    tasks,
    toggleTask,
    deleteTask,
    moveTaskToTomorrow,
    hideCompletedTasks,
    openTaskDetail,
    openQuickTaskModal,
  } = useAppStore();

  const now = new Date();
  const todayStr = getLocalTodayStr(now);

  // Phân loại Task Hôm Nay
  const todayList = useMemo(() => {
    return tasks.filter((task) => isTaskDueToday(task, now));
  }, [tasks, todayStr]);

  // Lịch hẹn hôm nay (Chưa hoàn thành)
  const activeScheduledTasks = useMemo(() => {
    return todayList.filter((task) => {
      if (task.parentTaskId) return false;
      if (task.completed) return false;
      return normalizeTaskTimeType(task) === "scheduled";
    });
  }, [todayList]);

  // Task cần làm hôm nay (Chưa hoàn thành)
  const activeTaskListItems = useMemo(() => {
    return todayList.filter((task) => {
      if (task.completed) return false;
      return normalizeTaskTimeType(task) !== "scheduled";
    });
  }, [todayList]);

  // Toàn bộ công việc đã hoàn thành hôm nay
  const completedTodayTasks = useMemo(() => {
    if (hideCompletedTasks) return [];
    return todayList.filter((task) => task.completed);
  }, [todayList, hideCompletedTasks]);

  // Thống kê
  const completedTodayCount = todayList.filter((t) => t.completed).length;
  const totalTodayCount = todayList.length;

  return (
    <div className="w-full min-w-0 space-y-6 select-none animate-in fade-in duration-150">
      {/* 1. Header: Tiêu Đề + Ngày + Tiến Độ */}
      <div className="space-y-3 pb-3 border-b border-[#262626]/20 dark:border-transparent">
        <div className="flex items-center gap-3.5 flex-wrap">
          <h1 className="text-2xl font-black text-[#1C1917] dark:text-[#F2F2F7] tracking-tight">
            Hôm nay
          </h1>
          <div className="h-4 w-[1.5px] bg-[#D4CEBF] dark:bg-[#3A3A3C] hidden sm:block" />
          <span className="text-xs font-mono font-medium text-[#78716C] dark:text-[#A1A1AA]">
            Thứ {now.getDay() === 0 ? "Chủ Nhật" : now.getDay() + 1}, {now.getDate()} thg {now.getMonth() + 1}
          </span>
          {totalTodayCount > 0 && (
            <div
              className="flex items-center gap-2 pl-1"
              title={`Đã hoàn thành ${completedTodayCount}/${totalTodayCount} việc (${Math.round((completedTodayCount / totalTodayCount) * 100)}%)`}
            >
              <div className="w-20 sm:w-28 h-2 bg-[#F3EFE6] dark:bg-[#2C2C2E] border border-[#262626] dark:border-[#48484A] rounded-[3px] overflow-hidden">
                <div
                  className="h-full bg-[#1C1917] dark:bg-white transition-all duration-300"
                  style={{ width: `${Math.round((completedTodayCount / totalTodayCount) * 100)}%` }}
                />
              </div>
              <span className="font-mono text-xs font-black text-[#1C1917] dark:text-[#F2F2F7]">
                {completedTodayCount}/{totalTodayCount}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Nội dung chính: Luồng công việc thống nhất 1 cột */}
      <div className="space-y-6 max-w-4xl">
        {/* Phần 1: Lịch hẹn theo giờ (nếu có) */}
        {activeScheduledTasks.length > 0 && (
          <div className="space-y-3">
            <TodayScheduleNotes
              scheduledTasks={activeScheduledTasks}
              onToggle={toggleTask}
              onEdit={(task) => openTaskDetail(task.id)}
              onDelete={deleteTask}
              onMoveTomorrow={moveTaskToTomorrow}
              onClick={(task) => openTaskDetail(task.id)}
              activeTaskId={targetTaskId}
            />
          </div>
        )}

        {/* Phần 2: Công việc cần làm */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#262626]/20 dark:border-transparent">
            <div className="flex items-center gap-2 text-sm font-bold text-[#1C1917] dark:text-white">
              <ListTodo size={16} strokeWidth={2.4} className="text-[#1C1917] dark:text-white" />
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
            onEmptyAction={() => openQuickTaskModal({ dueDate: todayStr })}
          />
        </div>

        {/* Phần 3: Công việc đã hoàn thành */}
        {completedTodayTasks.length > 0 && (
          <div className="pt-4 border-t border-[#262626]/15 dark:border-transparent space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#262626]/15 dark:border-transparent">
              <div className="flex items-center gap-2 text-sm font-bold text-[#78716C] dark:text-[#A1A1AA]">
                <CheckCircle2 size={16} strokeWidth={2.4} className="text-emerald-500 shrink-0" />
                <span>Đã hoàn thành ({completedTodayTasks.length})</span>
              </div>
            </div>

            <TodayTaskList
              tasks={completedTodayTasks}
              onToggle={toggleTask}
              onEdit={(task) => openTaskDetail(task.id)}
              onDelete={deleteTask}
              onMoveTomorrow={moveTaskToTomorrow}
              onClick={(task) => openTaskDetail(task.id)}
              activeTaskId={targetTaskId}
              showQuickAdd={false}
            />
          </div>
        )}
      </div>
    </div>
  );
};
