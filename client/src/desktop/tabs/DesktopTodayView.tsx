import React, { useMemo } from "react";
import { ListTodo } from "lucide-react";
import { useAppStore } from "../../stores";
import { getLocalTodayStr, getTaskItemType, isTaskDueToday } from "../../utils";
import { getTaskProgress } from "../../utils/taskHierarchy";
import { DesktopTaskGroup } from "../../components/shared/common/DesktopTaskGroup";

export interface DesktopTodayViewProps {
  targetTaskId?: string;
  onClearTarget?: () => void;
}

export const DesktopTodayView: React.FC<DesktopTodayViewProps> = ({ targetTaskId }) => {
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

  const todayList = useMemo(
    () =>
      tasks.filter(
        (task) => getTaskItemType(task) !== "event" && isTaskDueToday(task, now),
      ),
    [tasks, todayStr],
  );

  const visibleTodayTasks = useMemo(
    () => (hideCompletedTasks ? todayList.filter((task) => !task.completed) : todayList),
    [todayList, hideCompletedTasks],
  );

  const { completed: completedTodayCount, total: totalTodayCount } = useMemo(
    () => getTaskProgress(todayList),
    [todayList],
  );

  return (
    <div className="w-full min-w-0 space-y-6 select-none animate-in fade-in duration-150">
      {/* === PHẦN 1: Header ngày và tiến độ === */}
      <div className="space-y-3 pb-2">
        <div className="flex flex-wrap items-center gap-3.5">
          <h1 className="text-2xl font-black tracking-tight text-[#09090B] dark:text-[#FFFFFF]">
            Hôm nay
          </h1>
          <div className="hidden h-4 w-[1.5px] bg-[#E4E4E7] dark:bg-[#2E2E34] sm:block" />
          <span className="font-mono text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">
            Thứ {now.getDay() === 0 ? "Chủ Nhật" : now.getDay() + 1}, {now.getDate()} thg {now.getMonth() + 1}
          </span>
          {totalTodayCount > 0 && (
            <div
              className="flex items-center gap-2 pl-1"
              title={`Đã hoàn thành ${completedTodayCount}/${totalTodayCount} việc (${Math.round((completedTodayCount / totalTodayCount) * 100)}%)`}
            >
              <div className="h-2 w-20 overflow-hidden rounded-full bg-[#E4E4E7] dark:bg-[#2E2E34] sm:w-28">
                <div
                  className="h-full bg-[#09090B] transition-all duration-300 dark:bg-white rounded-full"
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

      {/* === PHẦN 2: Một danh sách Desktop thống nhất === */}
      {totalTodayCount === 0 ? (
        <div className="flex flex-col items-center justify-center space-y-4 py-20 text-center animate-in fade-in duration-200">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white shadow-sm dark:bg-[#141417]">
            <ListTodo size={28} className="text-[#71717A] dark:text-[#A1A1AA]" strokeWidth={2} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#09090B] dark:text-[#FFFFFF]">
              Hôm nay chưa có công việc nào
            </h3>
            <p className="mx-auto max-w-xs text-xs text-[#71717A] dark:text-[#A1A1AA]">
              Hãy tận hưởng ngày thảnh thơi hoặc bắt đầu lên kế hoạch cho công việc mới
            </p>
          </div>
          <button
            type="button"
            onClick={() => openQuickTaskModal({ dueDate: todayStr, itemType: "task", lockItemType: true })}
            className="cursor-pointer rounded-2xl bg-[#09090B] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-black active:scale-95 dark:bg-white dark:text-[#09090B] dark:hover:bg-[#F4F4F5]"
          >
            + Thêm công việc mới
          </button>
        </div>
      ) : (
        <DesktopTaskGroup
          title="Công việc hôm nay"
          tasks={visibleTodayTasks}
          subtitle={`${completedTodayCount} đã hoàn thành · ${Math.max(0, totalTodayCount - completedTodayCount)} cần xử lý`}
          isToday
          emptyMessage="Hôm nay chưa có công việc nào"
          emptySubMessage="Bạn có thể thêm task mới cho ngày hôm nay."
          onToggle={toggleTask}
          onOpenTask={(task) => openTaskDetail(task.id)}
          onDelete={deleteTask}
          onMoveTomorrow={moveTaskToTomorrow}
          activeTaskId={targetTaskId}
          onAddTask={() => openQuickTaskModal({ dueDate: todayStr, itemType: "task", lockItemType: true })}
        />
      )}
    </div>
  );
};
