import React, { useState, useMemo } from "react";
import { NotebookDto, TaskDto, JournalEntryDto } from "../../../types";
import { NoteItem } from "../notes/NoteTypes";
import { DynamicIcon } from "../../ui";
import { TaskList } from "../shared/TaskList";
import { FilterBar } from "../shared/FilterBar";
import { TodayScheduleNotes } from "../today/TodayScheduleNotes";
import { NoteMasterDetailView } from "../notes/NoteMasterDetailView";
import { JournalBook } from "../journal/JournalBook";
import { useAppStore } from "../../../stores/appStore";
import { useResponsiveLayout } from "../../../shared/hooks";
import { normalizeTaskTimeType } from "../../../utils/taskSemantics";
import {
  ArrowLeft,
  Trash2,
  Edit2,
  CheckSquare,
  FileText,
  BookOpen,
  ListTodo,
} from "lucide-react";

// ==========================================
// COMPONENT: NotebookDetail (Chi Tiết Cuốn Sổ Tay Đầy Đủ)
// Tách biệt rõ ràng 3 phân khu: Công việc | Ghi chú | Nhật ký
// Toàn bộ 3 phân khu đồng bộ 100% với giao diện chuẩn của Today, Note Workspace & Journal
// ==========================================

export interface NotebookDetailProps {
  notebook: NotebookDto;
  tasks: TaskDto[];
  notes: NoteItem[];
  journalEntries: JournalEntryDto[];
  onBack: () => void;
  onEditNotebook: () => void;
  onRequestDeleteNotebook: (id: string) => void;
  // Task Actions
  onToggleTask: (taskId: string) => void;
  onEditTask: (task: TaskDto) => void;
  onDeleteTask: (taskId: string) => void;
  onMoveTomorrow: (taskId: string) => void;
  onClickTask: (task: TaskDto) => void;
  // Note Actions
  onCreateNote: (title: string, content: string) => void;
  onDeleteNote: (id: string) => void;
  onUpdateNote: (note: NoteItem) => void;
  // Journal Actions
  onAddJournalEntry: (content: string) => void;
  onDeleteJournalEntry: (id: string) => void;
}

export type NotebookSubSection = "tasks" | "notes" | "journal";

export const NotebookDetail: React.FC<NotebookDetailProps> = ({
  notebook,
  tasks,
  notes,
  journalEntries,
  onBack,
  onEditNotebook,
  onRequestDeleteNotebook,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onMoveTomorrow,
  onClickTask,
  onCreateNote,
  onDeleteNote,
  onUpdateNote,
}) => {
  const { hideCompletedTasks, notebooks, openTaskDetail, isMobileNoteDetailOpen } = useAppStore();
  const { isMobile } = useResponsiveLayout();
  const [activeSection, setActiveSection] = useState<NotebookSubSection>("tasks");

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

  // ==========================================
  // 2. STATE DÀNH CHO GHI CHÚ (NOTES)
  // ==========================================
  const [newlyCreatedNoteId, setNewlyCreatedNoteId] = useState<string | null>(null);

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

  // Lọc Ghi chú trong sổ
  const notebookNotes = useMemo(() => {
    return notes.filter((n) => n.notebookId === notebook.id);
  }, [notes, notebook.id]);

  // Handler tạo trang ghi chú mới trong sổ
  const handleCreateNewNoteInNotebook = () => {
    const newId = "note-" + Date.now();
    onCreateNote("", "");
    setNewlyCreatedNoteId(newId);
  };

  return (
    <div className={`w-full min-w-0 space-y-4 pb-12 select-none ${
      isMobile ? "mobile-panel-enter" : "animate-in fade-in duration-150"
    }`}>
      <div className={activeSection === "notes" && isMobileNoteDetailOpen ? "hidden md:block space-y-4" : "space-y-4"}>
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
            backgroundColor: notebook.color || "#FAF8F3",
          }}
          className="relative p-4 sm:p-5 border-[1.5px] border-[#262626] rounded-[8px] shadow-[3px_3px_0px_#262626] space-y-3"
        >
          <div className="flex items-start gap-3.5">
            <span
              className="w-10 h-10 rounded-[6px] border-[1.5px] border-[#262626] bg-white flex items-center justify-center shadow-[1.5px_1.5px_0px_#262626] shrink-0"
            >
              <DynamicIcon
                name={notebook.icon || "lucide:BookMarked"}
                size={22}
                strokeWidth={2.2}
              />
            </span>

            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-black text-[#1C1917] leading-tight break-words">
                {notebook.name}
              </h2>
              <p className="text-xs sm:text-sm text-[#262626]/85 font-medium mt-1 leading-relaxed">
                {notebook.description || "Chưa có mô tả cho cuốn sổ này..."}
              </p>
            </div>
          </div>

          {/* Hàng tóm tắt số liệu */}
          <div className="pt-2.5 border-t border-[#262626]/20 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-[#1C1917] flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="bg-white/90 px-2.5 py-1 rounded-[4px] border border-[#262626]/30 text-xs shadow-[0.5px_0.5px_0px_#262626]">
                  {totalCount} việc
                </span>
                <span className="bg-white/90 px-2.5 py-1 rounded-[4px] border border-[#262626]/30 text-xs shadow-[0.5px_0.5px_0px_#262626]">
                  {notebookNotes.length} ghi chú
                </span>
                {journalEntries.length > 0 && (
                  <span className="bg-white/90 px-2.5 py-1 rounded-[4px] border border-[#262626]/30 text-xs shadow-[0.5px_0.5px_0px_#262626]">
                    {journalEntries.length} nhật ký
                  </span>
                )}
              </div>

              <span className="font-bold text-xs">
                Tiến độ: {completedCount}/{totalCount} ({progressPercent}%)
              </span>
            </div>

            <div className="w-full h-2 bg-white/80 border border-[#262626] rounded-[3px] overflow-hidden">
              <div
                className="h-full bg-[#262626] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* 3. SEGMENTED SWITCH: 3 MỤC NỘI DUNG TRONG SỔ */}
        <div className="p-1.5 bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] shadow-[2px_2px_0px_#262626] flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            {[
              {
                key: "tasks" as NotebookSubSection,
                label: "Công việc",
                count: tasks.length,
                icon: CheckSquare,
              },
              {
                key: "notes" as NotebookSubSection,
                label: "Ghi chú",
                count: notebookNotes.length,
                icon: FileText,
              },
              {
                key: "journal" as NotebookSubSection,
                label: "Nhật ký",
                count: journalEntries.length,
                icon: BookOpen,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSection === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveSection(tab.key)}
                  className={`flex-1 sm:flex-initial h-9 px-3.5 py-1.5 rounded-[5px] border text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:translate-y-[0.5px] ${
                    isActive
                      ? "bg-[#262626] text-white border-[#262626] shadow-[1px_1px_0px_#262626]"
                      : "bg-white text-[#78716C] border-[#D4CEBF] hover:text-[#1C1917] hover:border-[#262626]"
                  }`}
                >
                  <Icon size={14} strokeWidth={2.4} />
                  <span>{tab.label}</span>
                  <span
                    className={`text-[11px] px-1.5 py-0.2 rounded font-mono font-bold ${
                      isActive ? "bg-white/20 text-white" : "bg-stone-100 text-[#78716C]"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. PHÂN KHU 1: CÔNG VIỆC TRONG SỔ (TASKS) - ĐỒNG BỘ 100% VỚI TODAY TAB
         ========================================================================= */}
      {activeSection === "tasks" && (
        <div className="space-y-4 animate-in fade-in duration-150">
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
      )}

      {/* =========================================================================
          5. PHÂN KHU 2: GHI CHÚ TRONG SỔ (NOTES) - ĐỒNG BỘ 100% VỚI TAB GHI CHÚ
         ========================================================================= */}
      {activeSection === "notes" && (
        <div className="space-y-3.5 animate-in fade-in duration-150">
          <NoteMasterDetailView
            notes={notebookNotes}
            notebooks={notebooks}
            newlyCreatedId={newlyCreatedNoteId}
            onUpdateNote={onUpdateNote}
            onDeleteNote={onDeleteNote}
            onCreateClick={handleCreateNewNoteInNotebook}
          />
        </div>
      )}

      {/* =========================================================================
          6. PHÂN KHU 3: NHẬT KÝ TRONG SỔ (JOURNAL) - ĐỒNG BỘ 100% VỚI TAB NHẬT KÝ
         ========================================================================= */}
      {activeSection === "journal" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <JournalBook notebookId={notebook.id} />
        </div>
      )}
    </div>
  );
};
