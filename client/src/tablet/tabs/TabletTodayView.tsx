import React, { useState, useMemo } from "react";
import { CheckCircle2, ChevronDown, ListTodo, Search, X } from "lucide-react";
import { useAppStore } from "../../stores";
import { getLocalTodayStr, isTaskDueToday, normalizeTaskTimeType, getTaskTags } from "../../utils";
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

  const [searchQuery, setSearchQuery] = useState("");
  const [isCompletedSectionOpen, setIsCompletedSectionOpen] = useState(false);

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

  return (
    <div className="w-full min-w-0 space-y-2.5 select-none pb-6">
      {/* 1. Thanh tìm kiếm trên cùng */}
      <div className="flex min-w-0 items-center gap-2.5 rounded-2xl border-none bg-white dark:bg-[#1C1C20] px-3.5 shadow-xs">
        <Search size={14} strokeWidth={2.4} className="shrink-0 text-[#78716C] dark:text-[#A1A1AA]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Tìm kiếm..."
          className="w-full bg-transparent py-2 pl-1 text-xs text-[#1C1917] dark:text-[#ECECF1] placeholder:text-[#A8A29E] dark:placeholder:text-[#71717A] focus:outline-none sm:text-sm"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="shrink-0 text-[#78716C] dark:text-[#A1A1AA] hover:text-[#1C1917] dark:hover:text-[#ECECF1] cursor-pointer"
            title="Xóa tìm kiếm"
          >
            <X size={13} strokeWidth={2.4} />
          </button>
        )}
      </div>

      {/* 2. Tablet View: danh sách dọc */}
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
          <div className="flex items-center justify-between pb-2 border-b border-black/[0.04] dark:border-white/[0.06]">
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
          <div className="mt-6 pt-4 border-t border-black/[0.04] dark:border-white/[0.06] space-y-2.5">
            <button
              type="button"
              onClick={() => setIsCompletedSectionOpen((open) => !open)}
              className="flex w-full items-center justify-between border-b border-black/[0.04] dark:border-white/[0.06] pb-2 text-left text-sm font-semibold text-[#8E8E93] dark:text-[#aeaeb2]"
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
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
