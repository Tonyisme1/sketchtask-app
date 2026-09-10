import React, { useState, useMemo } from "react";
import { ListTodo } from "lucide-react";
import { useAppStore } from "../../../stores/appStore";
import { getLocalTodayStr } from "../../../utils/date";
import {
  isTaskDueToday,
  normalizeTaskTimeType,
} from "../../../utils/taskSemantics";
import { TodayHeader } from "./TodayHeader";
import { TodayScheduleNotes } from "./TodayScheduleNotes";
import { TodayFilterBar } from "./TodayFilterBar";
import { TodayTaskList } from "./TodayTaskList";

// ==========================================
// COMPONENT: TodayTab (Phân Tách Rõ Ràng: Lịch Hẹn Nằm Trên, Danh Sách Task Nằm Dưới)
// ==========================================

interface TodayTabProps {
  targetTaskId?: string;
  onClearTarget?: () => void;
}

export const TodayTab: React.FC<TodayTabProps> = ({ targetTaskId }) => {
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

  // Bộ lọc tinh gọn 2 tầng
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed">("all");
  const [timeTypeFilter, setTimeTypeFilter] = useState<"all" | "scheduled" | "deadline">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [notebookFilter, setNotebookFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Phân loại Task Hôm Nay
  const todayList = useMemo(() => {
    return tasks.filter((task) => isTaskDueToday(task, now));
  }, [tasks, todayStr]);

  // Áp dụng bộ lọc
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

  const completedTodayCount = todayList.filter((t) => t.completed).length;
  const totalTodayCount = todayList.length;
  return (
    <div className="w-full min-w-0 space-y-4 select-none animate-in fade-in duration-150">
      {/* 1. Header & Tiến Độ Glance */}
      <TodayHeader
        dayNum={now.getDate()}
        monthNum={now.getMonth() + 1}
        completedCount={completedTodayCount}
        totalCount={totalTodayCount}
      />

      {/* 2. Thanh Lọc 2 Tầng Tinh Gọn */}
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

      {/* 3. BỐ CỤC CHÍNH: KHU VỰC CÔNG VIỆC */}
      <div className="space-y-4 w-full">
        {/* (A) PHẦN TRÊN: LỊCH HẸN TRONG NGÀY (CHỈ CÁC CUỘC HẸN & KHUNG GIỜ) */}
        {scheduledTasks.length > 0 && (
          <TodayScheduleNotes
            scheduledTasks={scheduledTasks}
            onToggle={toggleTask}
            onEdit={(task) => openTaskDetail(task.id)}
            onDelete={deleteTask}
            onMoveTomorrow={moveTaskToTomorrow}
            onClick={(task) => openTaskDetail(task.id)}
            activeTaskId={targetTaskId}
          />
        )}

        {/* (B) PHẦN DƯỚI: DANH SÁCH CÔNG VIỆC CẦN LÀM (GỒM TASK DEADLINE & TASK NGÀY) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between pb-1 border-b border-[#262626]/20">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#1C1917]">
              <ListTodo size={14} className="text-[#57534E]" />
              <span>Công việc cần làm hôm nay ({taskListItems.length})</span>
            </div>
          </div>

          {/* Danh Sách Công Việc */}
          <TodayTaskList
            tasks={taskListItems}
            onToggle={toggleTask}
            onEdit={(task) => openTaskDetail(task.id)}
            onDelete={deleteTask}
            onMoveTomorrow={moveTaskToTomorrow}
            onClick={(task) => openTaskDetail(task.id)}
            activeTaskId={targetTaskId}
            onEmptyAction={() => openTaskDetail("new")}
          />
        </div>
      </div>
    </div>
  );
};
