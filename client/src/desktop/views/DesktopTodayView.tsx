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
    <div className="w-full max-w-4xl xl:max-w-5xl mx-auto min-w-0 space-y-6 select-none animate-in fade-in duration-150">
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

      {/* 2. Nội dung chính */}
      {totalTodayCount === 0 ? (
        /* Trạng thái trống: Căn chính giữa */
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-2xl border-[1.5px] border-[#262626] bg-[#FAF8F3] dark:bg-[#2C2C2E] flex items-center justify-center shadow-[2px_2px_0px_#262626]">
            <ListTodo size={28} className="text-[#78716C] dark:text-[#A1A1AA]" strokeWidth={2} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#1C1917] dark:text-[#F2F2F7]">
              Hôm nay chưa có công việc nào
            </h3>
            <p className="text-xs text-[#78716C] dark:text-[#8E8E93] max-w-xs mx-auto">
              Hãy tận hưởng ngày thảnh thơi hoặc bắt đầu lên kế hoạch cho công việc mới
            </p>
          </div>
          <button
            type="button"
            onClick={() => openQuickTaskModal({ dueDate: todayStr })}
            className="px-4 py-2 rounded-xl bg-[#1C1917] hover:bg-black dark:bg-white dark:hover:bg-[#F2F2F7] text-white dark:text-[#1C1917] text-xs font-bold shadow-[2px_2px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer"
          >
            + Thêm công việc mới
          </button>
        </div>
      ) : (
        /* Luồng công việc thống nhất */
        <div className="space-y-6 w-full">
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
          {activeTaskListItems.length > 0 && (
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
          )}

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
      )}
    </div>
  );
};
