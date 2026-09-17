import React, { useState, useMemo } from "react";
import { CheckCircle2, ListTodo } from "lucide-react";
import { useAppStore } from "../../shared/stores";
import { getLocalTodayStr } from "../../shared/utils";
import { isTaskDueToday, normalizeTaskTimeType, getTaskTags } from "../../shared/utils";
import { TodayScheduleNotes } from "../../components/features/today/TodayScheduleNotes";
import { TodayFilterBar } from "../../components/features/today/TodayFilterBar";
import { TodayTaskList } from "../../components/features/today/TodayTaskList";
import { TodayProgressBar } from "../../components/features/today/TodayProgressBar";

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

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed">("all");
  const [timeTypeFilter, setTimeTypeFilter] = useState<"all" | "scheduled" | "deadline">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Phân loại Task Hôm Nay
  const todayList = useMemo(() => {
    return tasks.filter((task) => isTaskDueToday(task, now));
  }, [tasks, todayStr]);

  // Áp dụng bộ lọc cho task Hôm nay
  const filteredTodayTasks = useMemo(() => {
    return todayList.filter((task) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesTag = getTaskTags(task).some((t) => t.toLowerCase().includes(q));
        const matchesNote = task.description?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesTag && !matchesNote) return false;
      }

      if (hideCompletedTasks && statusFilter === "all" && task.completed)
        return false;

      if (statusFilter === "active" && task.completed) return false;
      if (statusFilter === "completed" && !task.completed) return false;

      const normTime = normalizeTaskTimeType(task);
      if (timeTypeFilter === "scheduled" && normTime !== "scheduled")
        return false;
      if (timeTypeFilter === "deadline" && normTime !== "deadline")
        return false;

      if (priorityFilter !== "all" && task.priority !== priorityFilter)
        return false;

      if (tagFilter !== "all" && !getTaskTags(task).includes(tagFilter)) return false;

      return true;
    });
  }, [
    todayList,
    searchQuery,
    statusFilter,
    timeTypeFilter,
    priorityFilter,
    tagFilter,
    hideCompletedTasks,
  ]);

  // Lịch hẹn hôm nay (Chưa hoàn thành)
  const activeScheduledTasks = useMemo(() => {
    return filteredTodayTasks.filter((task) => {
      if (task.parentTaskId) return false;
      if (task.completed) return false;
      return normalizeTaskTimeType(task) === "scheduled";
    });
  }, [filteredTodayTasks]);

  // Task cần làm hôm nay (Chưa hoàn thành)
  const activeTaskListItems = useMemo(() => {
    return filteredTodayTasks.filter((task) => {
      if (task.completed) return false;
      return normalizeTaskTimeType(task) !== "scheduled";
    });
  }, [filteredTodayTasks]);

  // Toàn bộ công việc đã hoàn thành hôm nay
  const completedTodayTasks = useMemo(() => {
    return filteredTodayTasks.filter((task) => task.completed);
  }, [filteredTodayTasks]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (timeTypeFilter !== "all") count++;
    if (priorityFilter !== "all") count++;
    if (tagFilter !== "all") count++;
    return count;
  }, [timeTypeFilter, priorityFilter, tagFilter]);

  // Thống kê
  const completedTodayCount = todayList.filter((t) => t.completed).length;
  const totalTodayCount = todayList.length;

  const deadlineCount = useMemo(() => {
    return todayList.filter(
      (t) => normalizeTaskTimeType(t) === "deadline" && !t.completed
    ).length;
  }, [todayList]);

  return (
    <div className="w-full min-w-0 space-y-6 select-none animate-in fade-in duration-150">
      {/* 1. Header Cùng 1 Hàng: Tiêu Đề + Ngày + Tiến Độ + Bộ Lọc */}
      <div className="space-y-3 pb-3 border-b border-[#262626]/20 dark:border-transparent">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          {/* Trái: Tiêu đề + Ngày + Tiến độ mini */}
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

          {/* Phải: Bộ Lọc Phân Tầng */}
          <div className="shrink-0">
            <TodayFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              timeTypeFilter={timeTypeFilter}
              onTimeTypeChange={setTimeTypeFilter}
              priorityFilter={priorityFilter}
              onPriorityChange={setPriorityFilter}
              tagFilter={tagFilter}
              onTagChange={setTagFilter}
              isFilterDrawerOpen={isFilterDrawerOpen}
              onToggleFilterDrawer={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
              onResetFilters={() => {
                setSearchQuery("");
                setTimeTypeFilter("all");
                setStatusFilter("all");
                setPriorityFilter("all");
                setTagFilter("all");
              }}
              activeFilterCount={activeFilterCount}
            />
          </div>
        </div>
      </div>

      {/* 2. Nội dung chính: Luồng công việc thống nhất 1 cột */}
      <div className="space-y-6 max-w-4xl">
        {/* Phần 1: Lịch hẹn theo giờ (nếu có) */}
        {statusFilter !== "completed" && activeScheduledTasks.length > 0 && (
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
        {statusFilter !== "completed" && (
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
        {statusFilter !== "active" && completedTodayTasks.length > 0 && (
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
