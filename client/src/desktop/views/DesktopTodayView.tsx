import React, { useMemo } from "react";
import { CheckCircle2, ListTodo } from "lucide-react";
import { useAppStore } from "../../shared/stores";
import { getLocalTodayStr, getTaskItemType, isTaskDueToday, normalizeTaskTimeType } from "../../shared/utils";
import { TodayScheduleNotes } from "../../components/features/today/TodayScheduleNotes";
import { TaskListSection } from "../../components/features/shared/TaskListSection";
import { getTaskProgress } from "../../utils/taskHierarchy";

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

  // Tab Công việc chỉ nhận Task; Event thuộc workspace Lịch.
  const todayList = useMemo(() => {
    return tasks.filter(
      (task) => getTaskItemType(task) !== "event" && isTaskDueToday(task, now),
    );
  }, [tasks, todayStr]);

  const activeScheduledTasks = useMemo(() => {
    return todayList.filter((task) => {
      if (task.parentTaskId) return false;
      if (task.completed) return false;
      return normalizeTaskTimeType(task) === "scheduled" && getTaskItemType(task) !== "event";
    });
  }, [todayList]);

  // Task cần làm hôm nay (Chưa hoàn thành)
  const activeTaskListItems = useMemo(() => {
    return todayList.filter((task) => {
      if (task.completed) return false;
      return getTaskItemType(task) !== "event" && normalizeTaskTimeType(task) !== "scheduled";
    });
  }, [todayList]);

  // Toàn bộ công việc đã hoàn thành hôm nay
  const completedTodayTasks = useMemo(() => {
    if (hideCompletedTasks) return [];
    return todayList.filter((task) => task.completed && getTaskItemType(task) !== "event");
  }, [todayList, hideCompletedTasks]);

  // Thống kê
  const { completed: completedTodayCount, total: totalTodayCount } = useMemo(
    () => getTaskProgress(todayList),
    [todayList],
  );

  return (
    <div className="w-full min-w-0 space-y-6 select-none animate-in fade-in duration-150">
      {/* 1. Header: Tiêu Đề + Ngày + Tiến Độ */}
      <div className="space-y-3 pb-3 border-b border-[#18181B]/15 dark:border-[#2E2E34]">
        <div className="flex items-center gap-3.5 flex-wrap">
          <h1 className="text-2xl font-black text-[#09090B] dark:text-[#FFFFFF] tracking-tight">
            Hôm nay
          </h1>
          <div className="h-4 w-[1.5px] bg-[#E4E4E7] dark:bg-[#2E2E34] hidden sm:block" />
          <span className="text-xs font-mono font-medium text-[#71717A] dark:text-[#A1A1AA]">
            Thứ {now.getDay() === 0 ? "Chủ Nhật" : now.getDay() + 1}, {now.getDate()} thg {now.getMonth() + 1}
          </span>
          {totalTodayCount > 0 && (
            <div
              className="flex items-center gap-2 pl-1"
              title={`Đã hoàn thành ${completedTodayCount}/${totalTodayCount} việc (${Math.round((completedTodayCount / totalTodayCount) * 100)}%)`}
            >
              <div className="w-20 sm:w-28 h-2 bg-[#E4E4E7] dark:bg-[#2E2E34] border border-[#18181B] dark:border-[#3F3F46] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#09090B] dark:bg-white transition-all duration-300"
                  style={{ width: `${Math.round((completedTodayCount / totalTodayCount) * 100)}%` }}
                />
              </div>
              <span className="font-mono text-xs font-black text-[#09090B] dark:text-[#FFFFFF]">
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
          <div className="w-16 h-16 rounded-2xl border-[1.5px] border-[#18181B] dark:border-[#2E2E34] bg-white dark:bg-[#141417] flex items-center justify-center shadow-[2px_2px_0px_#18181B] dark:shadow-none">
            <ListTodo size={28} className="text-[#71717A] dark:text-[#A1A1AA]" strokeWidth={2} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#09090B] dark:text-[#FFFFFF]">
              Hôm nay chưa có công việc nào
            </h3>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] max-w-xs mx-auto">
              Hãy tận hưởng ngày thảnh thơi hoặc bắt đầu lên kế hoạch cho công việc mới
            </p>
          </div>
          <button
            type="button"
            onClick={() => openQuickTaskModal({ dueDate: todayStr })}
            className="px-4 py-2 rounded-xl bg-[#09090B] hover:bg-black dark:bg-white dark:hover:bg-[#F4F4F5] text-white dark:text-[#09090B] text-xs font-bold border border-[#18181B] dark:border-white shadow-[2px_2px_0px_#18181B] dark:shadow-none active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer"
          >
            + Thêm công việc mới
          </button>
        </div>
      ) : (
        /* Luồng công việc thống nhất */
        <div className="space-y-6 w-full">
          {/* Phần 1: Lịch hẹn theo giờ của task */}
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
                showEventTimeLabel
              />
            </div>
          )}

          {/* Phần 2: Công việc cần làm */}
          {activeTaskListItems.length > 0 && (
            <TaskListSection
              title="Công việc cần làm"
              tasks={activeTaskListItems}
              icon={<ListTodo size={16} strokeWidth={2.4} />}
              tone="info"
              onToggle={toggleTask}
              onEdit={(task) => openTaskDetail(task.id)}
              onDelete={deleteTask}
              onMoveTomorrow={moveTaskToTomorrow}
              onClick={(task) => openTaskDetail(task.id)}
              activeTaskId={targetTaskId}
              variant="today"
              hideDate={true}
              showQuickAdd={false}
            />
          )}

          {/* Phần 3: Công việc đã hoàn thành */}
          {completedTodayTasks.length > 0 && (
            <TaskListSection
              title="Đã hoàn thành"
              tasks={completedTodayTasks}
              icon={<CheckCircle2 size={16} strokeWidth={2.4} />}
              tone="success"
              defaultCollapsed
              onToggle={toggleTask}
              onEdit={(task) => openTaskDetail(task.id)}
              onDelete={deleteTask}
              onMoveTomorrow={moveTaskToTomorrow}
              onClick={(task) => openTaskDetail(task.id)}
              activeTaskId={targetTaskId}
              variant="today"
              hideDate={true}
              showQuickAdd={false}
            />
          )}
        </div>
      )}
    </div>
  );
};
