import React, { useState, useMemo, useEffect } from "react";
import { ListTodo } from "lucide-react";
import { useAppStore } from "../../../stores/appStore";
import { TaskDto } from "../../../types";
import { getLocalTodayStr } from "../../../utils/date";
import {
  isTaskDueToday,
  normalizeTaskTimeType,
} from "../../../utils/taskSemantics";
import { TodayHeader } from "./TodayHeader";
import { TodayDailyGlance } from "./TodayDailyGlance";
import { TodayComposerSidebar } from "./TodayComposerSidebar";
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

export const TodayTab: React.FC<TodayTabProps> = ({ targetTaskId, onClearTarget }) => {
  const {
    tasks,
    toggleTask,
    deleteTask,
    moveTaskToTomorrow,
    hideCompletedTasks,
  } = useAppStore();

  const now = new Date();
  const todayStr = getLocalTodayStr(now);

  // State Task đang chỉnh sửa & Xóa task
  const [editingTask, setEditingTask] = useState<TaskDto | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  // State Khung thêm việc cạnh phải (Mặc định đóng, chỉ mở khi bấm thêm hoặc chọn task)
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [subtaskParent, setSubtaskParent] = useState<TaskDto | null>(null);

  useEffect(() => {
    if (!targetTaskId) return;
    const targetTask = tasks.find((task) => task.id === targetTaskId);
    if (targetTask) {
      setSubtaskParent(null);
      setEditingTask(targetTask);
      setIsComposerOpen(true);
    }
    onClearTarget?.();
  }, [targetTaskId, tasks, onClearTarget]);

  // Bộ lọc tinh gọn 2 tầng
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed">("all");
  const [timeTypeFilter, setTimeTypeFilter] = useState<"all" | "scheduled" | "deadline">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [notebookFilter, setNotebookFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // 1. Phân loại Task Hôm Nay: Lấy toàn bộ task của ngày hôm nay (kể cả quá giờ, giữ nguyên trong Hôm nay)
  const todayList = useMemo(() => {
    return tasks.filter((task) => isTaskDueToday(task, now));
  }, [tasks, todayStr]);

  // Áp dụng bộ lọc cho toàn bộ task Hôm nay
  const filteredTodayTasks = useMemo(() => {
    return todayList.filter((task) => {
      if (hideCompletedTasks && statusFilter === "all" && task.completed)
        return false;

      // 1. Lọc theo trạng thái
      if (statusFilter === "active" && task.completed) return false;
      if (statusFilter === "completed" && !task.completed) return false;

      // 2. Lọc theo loại thời gian
      const normTime = normalizeTaskTimeType(task);
      if (timeTypeFilter === "scheduled" && normTime !== "scheduled")
        return false;
      if (timeTypeFilter === "deadline" && normTime !== "deadline")
        return false;

      // 3. Lọc theo độ ưu tiên
      if (priorityFilter !== "all" && task.priority !== priorityFilter)
        return false;

      // 4. Lọc theo sổ tay
      if (notebookFilter !== "all") {
        if (notebookFilter === "inbox") {
          if (task.notebookId) return false;
        } else if (task.notebookId !== notebookFilter) {
          return false;
        }
      }

      // 5. Lọc theo Tag
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

  // (A) KHỐI TRÊN: LỊCH HẸN TRONG NGÀY (Chỉ lấy task gốc/độc lập, task con sẽ nằm bên trong thẻ cha)
  const scheduledTasks = useMemo(() => {
    return filteredTodayTasks.filter((task) => {
      // Nếu là task con (đã có cha), chỉ hiển thị bên trong thẻ cha, không tạo thẻ riêng trên lưới
      if (task.parentTaskId) return false;
      return normalizeTaskTimeType(task) === "scheduled";
    });
  }, [filteredTodayTasks]);

  // (B) KHỐI DƯỚI: DANH SÁCH CÔNG VIỆC CẦN LÀM HÔM NAY (Bao gồm Deadline hôm nay & Task cả ngày)
  const taskListItems = useMemo(() => {
    return filteredTodayTasks.filter((task) => {
      return normalizeTaskTimeType(task) !== "scheduled";
    });
  }, [filteredTodayTasks]);

  // Đếm số lượng bộ lọc nâng cao đang active
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (timeTypeFilter !== "all") count++;
    if (priorityFilter !== "all") count++;
    if (notebookFilter !== "all") count++;
    if (tagFilter !== "all") count++;
    return count;
  }, [timeTypeFilter, priorityFilter, notebookFilter, tagFilter]);

  // Thống kê hoàn thành
  const completedTodayCount = todayList.filter((t) => t.completed).length;
  const totalTodayCount = todayList.length;
  const progressPercent =
    totalTodayCount > 0
      ? Math.round((completedTodayCount / totalTodayCount) * 100)
      : 0;

  // Handler khi bấm nút "+" trên task card để thêm task con
  const handleAddSubtask = (parentTask: TaskDto) => {
    setEditingTask(null);
    setSubtaskParent(parentTask);
    setIsComposerOpen(true);
  };

  // Handler khi bấm nút "✏️" hoặc click task để chỉnh sửa trực tiếp trên panel phải
  const handleStartEdit = (task: TaskDto) => {
    setSubtaskParent(null);
    setEditingTask(task);
    setIsComposerOpen(true);
  };

  const deadlineCount = useMemo(() => {
    return todayList.filter(
      (t) => normalizeTaskTimeType(t) === "deadline" && !t.completed
    ).length;
  }, [todayList]);

  return (
    <div className="space-y-4 w-full min-w-0 pb-16 select-none animate-in fade-in duration-150">
      {/* 1. Tổng quan Hôm nay (Con lai Dashboard: Lời báo tình hình, 4 thẻ tóm tắt, Cảm xúc & Thói quen) */}
      <TodayDailyGlance
        todayTasks={todayList}
        scheduledTasksCount={scheduledTasks.length}
        deadlineTasksCount={deadlineCount}
        completedTasksCount={completedTodayCount}
        totalTasksCount={totalTodayCount}
        progressPercent={progressPercent}
      />

      {/* 2. BỘ LỌC ĐƯỢC ĐƯA LÊN TRÊN ĐẦU TOÀN TRANG */}
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

      {/* 3. BỐ CỤC CHÍNH: KHU VỰC CÔNG VIỆC (TRÁI) & PANEL THÊM/SỬA VIỆC (PHẢI) */}
      <div className="flex flex-col lg:flex-row gap-4 items-start w-full">
        {/* KHU VỰC TRÁI: (A) Lịch Hẹn Nằm Trên -> (B) Danh Sách Task Nằm Dưới */}
        <div className="flex-1 min-w-0 space-y-4 w-full">
          {/* (A) PHẦN TRÊN: LỊCH HẸN TRONG NGÀY (CHỈ CÁC CUỘC HẸN & KHUNG GIỜ) */}
          {scheduledTasks.length > 0 && (
            <TodayScheduleNotes
              scheduledTasks={scheduledTasks}
              onToggle={toggleTask}
              onEdit={handleStartEdit}
              onDelete={deleteTask}
              onAddSubtask={handleAddSubtask}
              onClick={handleStartEdit}
              activeTaskId={editingTask?.id}
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
              onEdit={handleStartEdit}
              onDelete={deleteTask}
              onMoveTomorrow={moveTaskToTomorrow}
              onAddSubtask={handleAddSubtask}
              onClick={handleStartEdit}
              activeTaskId={editingTask?.id}
              onEmptyAction={() => {
                setSubtaskParent(null);
                setEditingTask(null);
                setIsComposerOpen(true);
              }}
            />
          </div>
        </div>

        {/* CỘT CẠNH PHẢI: Panel Thao Tác Thêm & Sửa Việc (Đồng Bộ 100%) */}
        <div className="shrink-0 sticky top-16 self-start w-full sm:w-auto">
          <TodayComposerSidebar
            isOpen={isComposerOpen}
            onToggle={() => {
              setIsComposerOpen(!isComposerOpen);
              if (isComposerOpen) {
                setSubtaskParent(null);
                setEditingTask(null);
              }
            }}
            parentTask={subtaskParent}
            editingTask={editingTask}
            onSelectTask={handleStartEdit}
            onClearParentTask={() => setSubtaskParent(null)}
            onCancelEdit={() => setEditingTask(null)}
            onDeleteTask={(id) => {
              deleteTask(id);
              if (editingTask?.id === id) setEditingTask(null);
            }}
            onMoveTomorrow={(id) => {
              moveTaskToTomorrow(id);
              setEditingTask(null);
            }}
            onAddSubtaskToTask={handleAddSubtask}
          />
        </div>
      </div>
    </div>
  );
};
