import React, { useState, useMemo } from "react";
import { ListTodo, Search, X } from "lucide-react";
import { useAppStore } from "../../shared/stores";
import { getLocalTodayStr, isTaskDueToday, normalizeTaskTimeType, getTaskTags } from "../../shared/utils";
import { TodayScheduleNotes } from "../../components/features/today/TodayScheduleNotes";
import { TodayFilterBar } from "../../components/features/today/TodayFilterBar";
import { TodayTaskList } from "../../components/features/today/TodayTaskList";
import { TodayProgressBar } from "../../components/features/today/TodayProgressBar";

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
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed">("all");
  const [timeTypeFilter, setTimeTypeFilter] = useState<"all" | "scheduled" | "deadline">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const todayList = useMemo(() => {
    return tasks.filter((task) => isTaskDueToday(task, now));
  }, [tasks, todayStr]);

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

  const scheduledTasks = useMemo(() => {
    return filteredTodayTasks.filter((task) => {
      if (task.parentTaskId) return false;
      return normalizeTaskTimeType(task) === "scheduled";
    });
  }, [filteredTodayTasks]);

  const taskListItems = useMemo(() => {
    return filteredTodayTasks.filter((task) => {
      return normalizeTaskTimeType(task) !== "scheduled";
    });
  }, [filteredTodayTasks]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (timeTypeFilter !== "all") count++;
    if (priorityFilter !== "all") count++;
    if (tagFilter !== "all") count++;
    return count;
  }, [timeTypeFilter, priorityFilter, tagFilter]);

  const completedTodayCount = todayList.filter((task) => task.completed).length;
  const totalTodayCount = todayList.length;

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
          className="w-full pl-10 pr-9 py-2.5 bg-white border-[1.5px] border-[#262626] rounded-[6px] shadow-[1.5px_1.5px_0px_#262626] text-sm text-[#1C1917] placeholder:text-[#A8A29E] font-sans focus:outline-none focus:ring-1 focus:ring-[#262626] transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#1C1917] p-1 rounded-full cursor-pointer"
            title="Xóa tìm kiếm"
          >
            <X size={14} strokeWidth={2.4} />
          </button>
        )}
      </div>

      {/* 2. Tiến độ tổng quan đặt trước bộ lọc để người dùng nắm trạng thái ngày */}
      <TodayProgressBar
        completedCount={completedTodayCount}
        totalCount={totalTodayCount}
      />

      {/* 3. Filter: người dùng thấy task ngay sau phần điều hướng */}
      <TodayFilterBar
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

      {/* 3. Tablet View: một danh sách dọc, không chia đôi màn hình */}
      <div className="space-y-4 w-full">
        {scheduledTasks.length > 0 && (
          <TodayScheduleNotes
            scheduledTasks={scheduledTasks}
            onToggle={toggleTask}
            onEdit={(task) => openTaskDetail(task.id)}
            onDelete={deleteTask}
            onMoveTomorrow={moveTaskToTomorrow}
            onClick={(task) => openTaskDetail(task.id)}
            activeTaskId={targetTaskId}
            title="Lịch hẹn"
          />
        )}

        <section className="min-w-0 space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-[#262626]/20">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#1C1917]">
              <ListTodo size={16} className="text-[#57534E]" strokeWidth={2.2} />
              <span>Công việc cần làm ({taskListItems.length})</span>
            </div>
          </div>

          <TodayTaskList
            tasks={taskListItems}
            onToggle={toggleTask}
            onEdit={(task) => openTaskDetail(task.id)}
            onDelete={deleteTask}
            onMoveTomorrow={moveTaskToTomorrow}
            onClick={(task) => openTaskDetail(task.id)}
            activeTaskId={targetTaskId}
            showQuickAdd={false}
          />
        </section>
      </div>
    </div>
  );
};
