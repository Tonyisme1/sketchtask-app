import React, { useState, useMemo } from "react";
import { ListTodo } from "lucide-react";
import { useAppStore } from "../../shared/stores";
import { getLocalTodayStr, isTaskDueToday, normalizeTaskTimeType } from "../../shared/utils";
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

  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed">("all");
  const [timeTypeFilter, setTimeTypeFilter] = useState<"all" | "scheduled" | "deadline">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [notebookFilter, setNotebookFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const todayList = useMemo(() => {
    return tasks.filter((task) => isTaskDueToday(task, now));
  }, [tasks, todayStr]);

  const filteredTodayTasks = useMemo(() => {
    return todayList.filter((task) => {
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

      if (notebookFilter !== "all") {
        if (notebookFilter === "inbox") {
          if (task.notebookId) return false;
        } else if (task.notebookId !== notebookFilter) {
          return false;
        }
      }

      if (tagFilter !== "all" && task.tag !== tagFilter) return false;

      return true;
    });
  }, [
    todayList,
    statusFilter,
    timeTypeFilter,
    priorityFilter,
    notebookFilter,
    tagFilter,
    hideCompletedTasks,
  ]);

  const scheduledTasks = useMemo(() => {
    return filteredTodayTasks.filter((task) => {
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
    if (notebookFilter !== "all") count++;
    if (tagFilter !== "all") count++;
    return count;
  }, [timeTypeFilter, priorityFilter, notebookFilter, tagFilter]);

  const completedTodayCount = todayList.filter((task) => task.completed).length;
  const totalTodayCount = todayList.length;

  return (
    <div className="w-full min-w-0 space-y-4 select-none animate-in fade-in duration-150">
      {/* 1. Tiến độ tổng quan đặt trước bộ lọc để người dùng nắm trạng thái ngày */}
      <TodayProgressBar
        completedCount={completedTodayCount}
        totalCount={totalTodayCount}
      />

      {/* 2. Filter: người dùng thấy task ngay sau phần điều hướng */}
      <TodayFilterBar
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        timeTypeFilter={timeTypeFilter}
        onTimeTypeChange={setTimeTypeFilter}
        priorityFilter={priorityFilter}
        onPriorityChange={setPriorityFilter}
        notebookFilter={notebookFilter}
        onNotebookChange={setNotebookFilter}
        tagFilter={tagFilter}
        onTagChange={setTagFilter}
        isFilterDrawerOpen={isFilterDrawerOpen}
        onToggleFilterDrawer={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
        onResetFilters={() => {
          setTimeTypeFilter("all");
          setStatusFilter("all");
          setPriorityFilter("all");
          setNotebookFilter("all");
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
