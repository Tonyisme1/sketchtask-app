import React, { useState, useMemo } from "react";
import { NotebookDto, TaskDto } from "../../../types";
import { DynamicIcon, CustomColorPicker, CustomEmojiPicker } from "../../ui";
import { TaskList } from "../shared/TaskList";
import { FilterBar } from "../shared/FilterBar";
import { TodayScheduleNotes } from "../today/TodayScheduleNotes";
import { useAppStore } from "../../../stores/appStore";
import { useResponsiveLayout } from "../../../shared/hooks";
import { normalizeTaskTimeType } from "../../../utils/taskSemantics";
import { getContextualColorPalette } from "../../../utils/colorContrast";
import {
  ArrowLeft,
  Trash2,
  Edit2,
  ListTodo,
} from "lucide-react";

// ==========================================
// COMPONENT: NotebookDetail (Chi Tiết Cuốn Sổ Tay)
// Sổ tay chỉ tập trung vào danh sách công việc thuộc cuốn sổ.
// ==========================================

export interface NotebookDetailProps {
  notebook: NotebookDto;
  tasks: TaskDto[];
  onBack: () => void;
  onEditNotebook: () => void;
  onRequestDeleteNotebook: (id: string) => void;
  // Task Actions
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onMoveTomorrow: (taskId: string) => void;
  isEditing?: boolean;
  editName?: string;
  editDescription?: string;
  editColor?: string;
  editIcon?: string;
  nameError?: boolean;
  onEditNameChange?: (value: string) => void;
  onEditDescriptionChange?: (value: string) => void;
  onEditColorChange?: (value: string) => void;
  onEditIconChange?: (value: string) => void;
  onSaveEdit?: () => void;
  onCancelEdit?: () => void;
}

export const NotebookDetail: React.FC<NotebookDetailProps> = ({
  notebook,
  tasks,
  onBack,
  onEditNotebook,
  onRequestDeleteNotebook,
  onToggleTask,
  onDeleteTask,
  onMoveTomorrow,
  isEditing = false,
  editName = "",
  editDescription = "",
  editColor = "#FEF08A",
  editIcon = "lucide:BookMarked",
  nameError = false,
  onEditNameChange,
  onEditDescriptionChange,
  onEditColorChange,
  onEditIconChange,
  onSaveEdit,
  onCancelEdit,
}) => {
  const { hideCompletedTasks, openTaskDetail } = useAppStore();
  const { isMobile } = useResponsiveLayout();

  // ==========================================
  // 1. STATE DÀNH CHO CÔNG VIỆC (TASKS)
  // ==========================================
  const [editingTask, setEditingTask] = useState<TaskDto | null>(null);
  const [subtaskParent, setSubtaskParent] = useState<TaskDto | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  // Bộ lọc 2 tầng trong sổ
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed">("all");
  const [timeTypeFilter, setTimeTypeFilter] = useState<"all" | "scheduled" | "deadline">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Thống kê task trong sổ
  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Lọc task theo bộ lọc 2 tầng
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (hideCompletedTasks && statusFilter === "all" && task.completed)
        return false;

      // 1. Trạng thái
      if (statusFilter === "active" && task.completed) return false;
      if (statusFilter === "completed" && !task.completed) return false;

      // 2. Loại thời gian
      const normTime = normalizeTaskTimeType(task);
      if (timeTypeFilter === "scheduled" && normTime !== "scheduled")
        return false;
      if (timeTypeFilter === "deadline" && normTime !== "deadline")
        return false;

      // 3. Ưu tiên
      if (priorityFilter !== "all" && task.priority !== priorityFilter)
        return false;

      // 4. Tag
      if (tagFilter !== "all" && task.tag !== tagFilter) return false;

      return true;
    });
  }, [tasks, statusFilter, timeTypeFilter, priorityFilter, tagFilter, hideCompletedTasks]);

  // (A) Lịch hẹn trong sổ
  const scheduledTasks = useMemo(() => {
    return filteredTasks.filter((task) => {
      const normTime = normalizeTaskTimeType(task);
      return normTime === "scheduled" || (Boolean(task.startTime) && normTime !== "deadline");
    });
  }, [filteredTasks]);

  // (B) Danh sách việc cần làm trong sổ
  const taskListItems = useMemo(() => {
    return filteredTasks.filter((task) => {
      const normTime = normalizeTaskTimeType(task);
      const isScheduled =
        normTime === "scheduled" || (Boolean(task.startTime) && normTime !== "deadline");
      return !isScheduled;
    });
  }, [filteredTasks]);

  // Đếm số lượng bộ lọc nâng cao active
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (timeTypeFilter !== "all") count++;
    if (priorityFilter !== "all") count++;
    if (tagFilter !== "all") count++;
    return count;
  }, [timeTypeFilter, priorityFilter, tagFilter]);

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

  const bannerBackground = isEditing ? editColor : notebook.color || "#FAF8F3";
  const bannerPalette = getContextualColorPalette(bannerBackground);

  return (
    <div className={`w-full min-w-0 space-y-4 pb-12 select-none ${
      isMobile ? "mobile-panel-enter" : ""
    }`}>
      <div className="space-y-4">
        {/* 1. THANH ĐIỀU HƯỚNG / BREADCRUMB */}
        <div className="flex items-center justify-between gap-2.5 pb-2.5 border-b-[1.5px] border-[#262626]/30">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              aria-label="Quay lại danh sách Kệ Sổ Tay"
              onClick={onBack}
              className="h-10 flex items-center gap-2 text-sm font-bold text-[#1C1917] hover:bg-[#FAF8F3] bg-white border-[1.5px] border-[#262626] rounded-[6px] px-3.5 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all shadow-[1.5px_1.5px_0px_#262626] cursor-pointer shrink-0"
            >
              <ArrowLeft size={16} strokeWidth={2.5} />
              <span>Quay lại Kệ Sổ</span>
            </button>
          </div>

          <div className="flex items-center gap-2 justify-end shrink-0">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={onCancelEdit}
                  className="h-10 px-3 text-xs sm:text-sm font-bold text-[#1C1917] bg-white border-[1.5px] border-[#262626] rounded-[6px] shadow-[1.5px_1.5px_0px_#262626] active:translate-y-[0.5px] active:shadow-none cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={onSaveEdit}
                  className="h-10 px-3 text-xs sm:text-sm font-bold text-white bg-[#1C1917] border-[1.5px] border-[#262626] rounded-[6px] shadow-[1.5px_1.5px_0px_#262626] active:translate-y-[0.5px] active:shadow-none cursor-pointer"
                >
                  Lưu
                </button>
              </>
            ) : (
              <button
                type="button"
                aria-label={`Chỉnh sửa thông tin sổ ${notebook.name}`}
                onClick={onEditNotebook}
                className="h-10 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold text-[#1C1917] hover:bg-[#FAF8F3] bg-white border-[1.5px] border-[#262626] rounded-[6px] px-3 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all shadow-[1.5px_1.5px_0px_#262626] cursor-pointer"
                title="Chỉnh sửa thông tin cuốn sổ"
              >
                <Edit2 size={14} strokeWidth={2.2} />
                <span className="hidden sm:inline">Sửa sổ</span>
              </button>
            )}

            <button
              type="button"
              aria-label={`Xóa cuốn sổ ${notebook.name}`}
              onClick={() => onRequestDeleteNotebook(notebook.id)}
              className="h-10 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold text-[#1C1917] hover:bg-rose-50 bg-white border-[1.5px] border-[#262626] rounded-[6px] px-3 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all shadow-[1.5px_1.5px_0px_#262626] cursor-pointer hover:text-rose-700"
              title="Xóa cuốn sổ này"
            >
              <Trash2 size={14} strokeWidth={2.2} />
              <span className="hidden sm:inline">Xóa sổ</span>
            </button>
          </div>
        </div>

        {/* 2. BANNER BÌA CUỐN SỔ (MÀU SẮC GỐC ĐẶC TRƯNG CỦA SỔ) */}
        <div
          style={{
            backgroundColor: bannerBackground,
            color: bannerPalette.primary,
          }}
          className="relative p-4 sm:p-5 border-[1.5px] border-[#262626] rounded-[8px] shadow-[3px_3px_0px_#262626] space-y-3"
        >
          <div className="flex items-start gap-3.5">
            {isEditing ? (
              <div className="shrink-0 pt-0.5">
                <CustomEmojiPicker value={editIcon} onChange={onEditIconChange ?? (() => {})} />
              </div>
            ) : (
              <span
                style={{
                  backgroundColor: bannerPalette.controlSurface,
                  borderColor: bannerPalette.controlSurface,
                  color: bannerPalette.controlText,
                }}
                className="w-10 h-10 rounded-[6px] border-[1.5px] flex items-center justify-center shadow-[1.5px_1.5px_0px_#262626] shrink-0"
              >
                <DynamicIcon
                  name={notebook.icon || "lucide:BookMarked"}
                  size={22}
                  strokeWidth={2.2}
                />
              </span>
            )}

            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={editName}
                    maxLength={30}
                    autoFocus
                    onChange={(event) => onEditNameChange?.(event.target.value)}
                    placeholder="Tên cuốn sổ"
                    className={`w-full px-2.5 py-1.5 text-base sm:text-lg font-black bg-white border-[1.5px] ${nameError ? "border-rose-600" : "border-[#262626]"} rounded-[4px] outline-none`}
                  />
                  {nameError && (
                    <p className="text-[11px] text-rose-700 font-bold">Vui lòng nhập tên cuốn sổ.</p>
                  )}
                  <input
                    type="text"
                    value={editDescription}
                    maxLength={80}
                    onChange={(event) => onEditDescriptionChange?.(event.target.value)}
                    placeholder="Mô tả ngắn cho cuốn sổ"
                    className="w-full px-2.5 py-1.5 text-xs sm:text-sm font-medium bg-white border-[1.5px] border-[#262626] rounded-[4px] outline-none"
                  />
                </div>
              ) : (
                <>
                  <h2
                    style={{ color: bannerPalette.primary }}
                    className="text-lg sm:text-xl font-black leading-tight break-words"
                  >
                    {notebook.name}
                  </h2>
                  <p
                    style={{ color: bannerPalette.secondary }}
                    className="text-xs sm:text-sm font-medium mt-1 leading-relaxed"
                  >
                    {notebook.description || "Chưa có mô tả cho cuốn sổ này..."}
                  </p>
                </>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="flex items-center gap-3 pt-2 border-t border-[#262626]/20">
              <div>
                <p className="text-[10px] font-bold text-[#57534E] mb-1">Màu bìa</p>
                <CustomColorPicker value={editColor} onChange={onEditColorChange ?? (() => {})} />
              </div>
              <p className="text-[11px] text-[#57534E] leading-relaxed">
                Chỉnh sửa trực tiếp trên cuốn sổ, không mở popup.
              </p>
            </div>
          )}

          {/* Hàng tóm tắt số liệu */}
          <div
            style={{ borderColor: bannerPalette.border }}
            className="pt-2.5 border-t space-y-2"
          >
            <div
              style={{ color: bannerPalette.primary }}
              className="flex items-center justify-between text-xs font-mono font-bold flex-wrap gap-2"
            >
              <div className="flex items-center gap-2">
                <span
                  style={{
                    backgroundColor: bannerPalette.surface,
                    borderColor: bannerPalette.border,
                    color: bannerPalette.primary,
                  }}
                  className="px-2.5 py-1 rounded-[4px] border text-xs shadow-[0.5px_0.5px_0px_#262626]"
                >
                  {totalCount} việc
                </span>
              </div>

              <span className="font-bold text-xs">
                Tiến độ: {completedCount}/{totalCount} ({progressPercent}%)
              </span>
            </div>

            <div
              style={{
                backgroundColor: bannerPalette.track,
                borderColor: bannerPalette.border,
              }}
              className="w-full h-2 border rounded-[3px] overflow-hidden"
            >
              <div
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: bannerPalette.primary,
                }}
                className="h-full transition-all duration-300"
              />
            </div>
          </div>
        </div>

      </div>

      {/* =========================================================================
          4. PHÂN KHU 1: CÔNG VIỆC TRONG SỔ (TASKS) - ĐỒNG BỘ 100% VỚI TODAY TAB
         ========================================================================= */}
      <div className="space-y-4">
          {/* 1. Bộ Lọc 2 Tầng Trên Đầu */}
          <FilterBar
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            timeTypeFilter={timeTypeFilter}
            onTimeTypeChange={setTimeTypeFilter}
            priorityFilter={priorityFilter}
            onPriorityChange={setPriorityFilter}
            notebookFilter="all"
            onNotebookChange={() => {}}
            tagFilter={tagFilter}
            onTagChange={setTagFilter}
            isDrawerOpen={isFilterDrawerOpen}
            onToggleDrawer={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
            onResetFilters={() => {
              setTimeTypeFilter("all");
              setStatusFilter("all");
              setPriorityFilter("all");
              setTagFilter("all");
            }}
            activeFilterCount={activeFilterCount}
            hideNotebookFilter={true}
          />

          {/* 2. Bố Cục Danh Sách / Lịch Hẹn */}
          <div className="space-y-4 w-full">
            {/* (A) PHẦN TRÊN: LỊCH HẸN TRONG SỔ (CÁC TASK CÓ GIỜ HẸN) */}
            {scheduledTasks.length > 0 && (
              <TodayScheduleNotes
                title="Lịch hẹn"
                scheduledTasks={scheduledTasks}
                onToggle={onToggleTask}
                onEdit={(task) => openTaskDetail(task.id)}
                onDelete={onDeleteTask}
                onClick={(task) => openTaskDetail(task.id)}
                hideNotebookBadge
              />
            )}

            {/* (B) PHẦN DƯỚI: DANH SÁCH CÔNG VIỆC TRONG SỔ */}
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-[#262626]/20">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#1C1917]">
                  <ListTodo size={14} className="text-[#57534E]" />
                  <span>Việc cần làm ({taskListItems.length})</span>
                </div>
              </div>

              <TaskList
                tasks={taskListItems}
                emptyMessage="Chưa có công việc nào trong cuốn sổ này"
                emptySubMessage="Dùng nút Tạo mới để thêm công việc vào sổ này."
                onToggle={onToggleTask}
                onEdit={(task) => openTaskDetail(task.id)}
                onDelete={onDeleteTask}
                onMoveTomorrow={onMoveTomorrow}
                onClick={(task) => openTaskDetail(task.id)}
                variant="notebook"
                hideNotebookBadge
                notebookId={notebook.id}
                showQuickAdd={false}
              />
            </div>
          </div>
      </div>
    </div>
  );
};
