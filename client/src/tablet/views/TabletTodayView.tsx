import React, { useState, useMemo } from "react";
import { CheckCircle2, ListTodo, Search, X } from "lucide-react";
import { useAppStore } from "../../shared/stores";
import { getLocalTodayStr, isTaskDueToday, normalizeTaskTimeType, getTaskTags } from "../../shared/utils";
import { TodayScheduleNotes } from "../../components/features/today/TodayScheduleNotes";
import { TodayTaskList } from "../../components/features/today/TodayTaskList";
import { TodayProgressBar } from "../../components/features/today/TodayProgressBar";
import { getTaskProgress } from "../../utils/taskHierarchy";

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

  const [searchQuery, setSearchQuery] = useState("");

  const todayList = useMemo(() => {
    return tasks.filter((task) => isTaskDueToday(task, now));
  }, [tasks, todayStr]);

  const filteredTodayTasks = useMemo(() => {
    if (!searchQuery.trim()) return todayList;
    const q = searchQuery.toLowerCase().trim();
    return todayList.filter((task) => {
      const matchesTitle = task.title.toLowerCase().includes(q);
      const matchesTag = getTaskTags(task).some((t) => t.toLowerCase().includes(q));
      const matchesNote = task.description?.toLowerCase().includes(q);
      return matchesTitle || matchesTag || matchesNote;
    });
  }, [todayList, searchQuery]);

  const activeScheduledTasks = useMemo(() => {
    return filteredTodayTasks.filter((task) => {
      if (task.parentTaskId) return false;
      if (task.completed) return false;
      return normalizeTaskTimeType(task) === "scheduled";
    });
  }, [filteredTodayTasks]);

  const activeTaskListItems = useMemo(() => {
    return filteredTodayTasks.filter((task) => {
      if (task.completed) return false;
      return normalizeTaskTimeType(task) !== "scheduled";
    });
  }, [filteredTodayTasks]);

  const completedTodayTasks = useMemo(() => {
    if (hideCompletedTasks) return [];
    return filteredTodayTasks.filter((task) => task.completed);
  }, [filteredTodayTasks, hideCompletedTasks]);

  const { completed: completedTodayCount, total: totalTodayCount } = useMemo(
    () => getTaskProgress(todayList),
    [todayList],
  );

  return (
    <div className="w-full min-w-0 space-y-3.5 select-none animate-in fade-in duration-150">
      {/* 1. Ô Tìm kiếm trên cùng */}
      <div className="relative">
        <Search
          size={15}
          strokeWidth={2.4}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#78716C] pointer-events-none"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm kiếm công việc hôm nay..."
          className="w-full pl-10 pr-9 py-2.5 bg-white dark:bg-[#1C1C1E] border-[1.5px] border-[#262626] dark:border-[#3A3A3C] rounded-xl shadow-[1.5px_1.5px_0px_#262626] text-sm text-[#1C1917] dark:text-[#F2F2F7] placeholder:text-[#A8A29E] font-sans focus:outline-none focus:ring-1 focus:ring-[#262626] transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#1C1917] dark:hover:text-white p-1 rounded-full cursor-pointer"
            title="Xóa tìm kiếm"
          >
            <X size={14} strokeWidth={2.4} />
          </button>
        )}
      </div>

      {/* 2. Tiến độ tổng quan */}
      <TodayProgressBar
        completedCount={completedTodayCount}
        totalCount={totalTodayCount}
      />

      {/* 3. Tablet View: danh sách dọc */}
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
          <div className="flex items-center justify-between pb-2 border-b border-[#262626]/20 dark:border-transparent">
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
          <div className="mt-6 pt-4 border-t border-[#E5E5EA] dark:border-transparent space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#262626]/15 dark:border-transparent">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#8E8E93] dark:text-[#aeaeb2]">
                <CheckCircle2 size={16} strokeWidth={2.2} className="text-emerald-500 shrink-0" />
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
