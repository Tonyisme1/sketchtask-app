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
      {/* 1. Header Thoáng Đãng: Tiêu Đề + Bộ Lọc Chuẩn TaskNotes */}
      <div className="space-y-3 pb-4 border-b border-[#262626]/20 dark:border-transparent">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-[#1C1917] tracking-tight">
                Hôm nay
              </h1>
              {totalTodayCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-[4px] bg-white text-[#1C1917] font-mono text-xs font-black border border-[#262626] shadow-[1px_1px_0px_#262626]">
                  {completedTodayCount}/{totalTodayCount} xong
                </span>
              )}
            </div>
            <p className="text-xs font-mono text-[#78716C] mt-1 font-medium">
              Thứ {now.getDay() === 0 ? "Chủ Nhật" : now.getDay() + 1}, {now.getDate()} thg {now.getMonth() + 1}, {now.getFullYear()} · {activeScheduledTasks.length} lịch hẹn, {deadlineCount} hạn chót
            </p>
          </div>
        </div>

        <TodayProgressBar
          completedCount={completedTodayCount}
          totalCount={totalTodayCount}
        />

        {/* Thanh Lọc Phân Tầng Tinh Gọn */}
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

      {/* 3. Phần Lịch Hẹn Theo Khung Giờ (Chưa hoàn thành) */}
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

      {/* 4. Phần Danh Sách Công Việc Cần Làm (Chưa hoàn thành) */}
      {statusFilter !== "completed" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#262626]/20 dark:border-transparent">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#1C1917]">
              <ListTodo size={16} className="text-[#1C1917]" />
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

      {/* 5. MỘT KHU VỰC DUY NHẤT CHO TOÀN BỘ CÔNG VIỆC ĐÃ HOÀN THÀNH */}
      {statusFilter !== "active" && completedTodayTasks.length > 0 && (
        <div className="mt-8 pt-5 border-t border-[#E5E5EA] dark:border-transparent space-y-3">
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
  );
};
