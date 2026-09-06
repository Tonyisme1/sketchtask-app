import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { TaskDto } from "../../../types";
import { useAppStore } from "../../../stores/appStore";
import { useScrollLock } from "../../../hooks/useScrollLock";
import { useModalBackClose } from "../../../hooks/useModalBackClose";
import { QuickAddTaskComposer } from "../shared/QuickAddTaskComposer";
import { CustomSelect } from "../../ui/pickers/select/CustomSelect";
import { TimeSliderAdjuster } from "../../ui/pickers/time/TimeSliderAdjuster";
import { CalendarMonth } from "../../ui/pickers/time/CalendarMonth";
import { HandDrawnCheckbox } from "../../ui/core/HandDrawnCheckbox";
import { getTagStyle } from "../../../utils/tagColors";
import {
  getLocalTodayStr,
  getLocalTomorrowStr,
  formatShortDayMonth,
  formatFullDate,
} from "../../../utils/date";
import {
  getTaskEffectiveDate,
  normalizeTaskTimeType,
  getTaskParentCandidates,
  buildParentSelectOptions,
  getTaskTemporalState,
} from "../../../utils/taskSemantics";
import {
  Plus,
  ChevronRight,
  Layers,
  X,
  Edit3,
  Clock,
  Hourglass,
  Tag as TagIcon,
  BookOpen,
  Trash2,
  ArrowRight,
  CornerDownRight,
  Unlink,
  Calendar,
  Eye,
  CheckCircle2,
  Circle,
  Copy,
  Check,
  CalendarDays,
  ListTodo,
  Lock,
} from "lucide-react";

interface TodayComposerSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  context?: "today" | "notebook" | "planner";
  notebookId?: string;
  parentTask?: TaskDto | null;
  editingTask?: TaskDto | null;
  onSelectTask?: (task: TaskDto) => void;
  onClearParentTask?: () => void;
  onCancelEdit?: () => void;
  onTaskCreated?: (title: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onMoveTomorrow?: (taskId: string) => void;
  onAddSubtaskToTask?: (parentTask: TaskDto) => void;
}

export const TodayComposerSidebar: React.FC<TodayComposerSidebarProps> = ({
  isOpen,
  onToggle,
  context = "today",
  notebookId,
  parentTask,
  editingTask,
  onSelectTask,
  onClearParentTask,
  onCancelEdit,
  onTaskCreated,
  onDeleteTask,
  onMoveTomorrow,
  onAddSubtaskToTask,
}) => {
  const { notebooks, tasks, tags, addTag, deleteTag, updateTask, toggleTask, addTask, deleteTask } = useAppStore();
  const todayStr = getLocalTodayStr();
  const tomorrowStr = getLocalTomorrowStr();

  // Mobile detection for bottom-sheet modal popup
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 1024 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isModalActive = isMobile && (isOpen || Boolean(editingTask) || Boolean(parentTask));
  useScrollLock(isModalActive);
  useModalBackClose(isModalActive, () => {
    if (editingTask) onCancelEdit?.();
    else if (parentTask) onClearParentTask?.();
    else if (isOpen) onToggle();
  });

  // Mode: Khi có editingTask, mặc định ở View Mode (isEditing = false), bấm "Chỉnh sửa" mới sang Edit Mode (isEditing = true)
  const [isEditing, setIsEditing] = useState(false);
  const [prevTaskId, setPrevTaskId] = useState<string | null>(null);

  // Đồng bộ tức thì trong render phase để loại bỏ hoàn toàn 0ms chớp giật giữa Thêm việc và Xem việc
  if (editingTask && editingTask.id !== prevTaskId) {
    setPrevTaskId(editingTask.id);
    setIsEditing(false); // Mặc định mở ngay View Mode tức thì, không đợi useEffect!
  } else if (!editingTask && prevTaskId !== null) {
    setPrevTaskId(null);
    setIsEditing(false);
  }

  // State dành cho Edit Mode
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editNotebookId, setEditNotebookId] = useState("");
  const [editTag, setEditTag] = useState("");
  const [editParentTaskId, setEditParentTaskId] = useState("");
  const [editPriority, setEditPriority] = useState<"high" | "medium" | "low">("medium");

  const [editDate, setEditDate] = useState<string | undefined>(undefined);
  const [editTimeMode, setEditTimeMode] = useState<"scheduled" | "deadline" | "none">("none");
  const [editStartTime, setEditStartTime] = useState<string | undefined>(undefined);
  const [editEndTime, setEditEndTime] = useState<string | undefined>(undefined);
  const [editDeadlineTime, setEditDeadlineTime] = useState<string | undefined>(undefined);

  // Inline Sub-Pickers State trong Edit Mode
  const [isDatePickerInlineOpen, setIsDatePickerInlineOpen] = useState(false);
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());

  const [isTimePickerInlineOpen, setIsTimePickerInlineOpen] = useState(false);
  const [editingTimeTarget, setEditingTimeTarget] = useState<
    "start" | "end" | "deadline" | "subtask-start" | "subtask-end" | "subtask-deadline"
  >("start");
  const [sliderHour, setSliderHour] = useState(9);
  const [sliderMinute, setSliderMinute] = useState(0);

  // Tag creation trong Edit Mode
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");

  // Subtask creation nhanh trong View Mode
  const [quickSubtaskTitle, setQuickSubtaskTitle] = useState("");
  const [isSubtaskTimeOpen, setIsSubtaskTimeOpen] = useState(false);
  const [subtaskStartTime, setSubtaskStartTime] = useState("");
  const [subtaskEndTime, setSubtaskEndTime] = useState("");
  const [subtaskDeadlineTime, setSubtaskDeadlineTime] = useState("");
  const [isCopiedDesc, setIsCopiedDesc] = useState(false);

  // Nạp dữ liệu khi chuyển sang editingTask
  useEffect(() => {
    if (editingTask) {
      setEditTitle(editingTask.title || "");
      setEditDescription(editingTask.description || "");
      setEditNotebookId(editingTask.notebookId || "");
      setEditTag(editingTask.tag || "");
      setEditParentTaskId(editingTask.parentTaskId || "");
      setEditPriority(editingTask.priority || "medium");

      const normTime = normalizeTaskTimeType(editingTask);
      const effectiveDate = getTaskEffectiveDate(editingTask);
      setEditDate(effectiveDate);

      // Cập nhật tháng/năm hiển thị của Calendar
      if (effectiveDate) {
        const dateObj = new Date(effectiveDate);
        if (!isNaN(dateObj.getTime())) {
          setCalYear(dateObj.getFullYear());
          setCalMonth(dateObj.getMonth());
        }
      }

      if (normTime === "scheduled") {
        setEditTimeMode("scheduled");
        setEditStartTime(editingTask.startTime);
        setEditEndTime(editingTask.endTime);
        setEditDeadlineTime(undefined);
      } else if (normTime === "deadline") {
        setEditTimeMode("deadline");
        setEditDeadlineTime(editingTask.deadlineTime);
        setEditStartTime(undefined);
        setEditEndTime(undefined);
      } else {
        setEditTimeMode("none");
        setEditStartTime(undefined);
        setEditEndTime(undefined);
        setEditDeadlineTime(undefined);
      }

      setIsDatePickerInlineOpen(false);
      setIsTimePickerInlineOpen(false);
    }
  }, [editingTask, todayStr]);

  // Tính số ngày trễ gốc của task
  const initialOverdueDays = useMemo(() => {
    if (!editingTask) return 0;
    const origDate = getTaskEffectiveDate(editingTask);
    if (!origDate || origDate >= todayStr) return 0;
    const diffTime = new Date(todayStr).getTime() - new Date(origDate).getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }, [editingTask, todayStr]);

  // Click outside to cancel view/edit mode khi bấm vào khoảng không
  const sidebarRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!editingTask) return;

    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Nếu click bên trong sidebar -> Bỏ qua
      if (sidebarRef.current && sidebarRef.current.contains(target)) {
        return;
      }

      // Nếu click vào một nút bấm, input, card việc, subtask, icon hoặc menu thao tác -> Bỏ qua
      if (
        target.closest("[data-task-card]") ||
        target.closest("[data-task-id]") ||
        target.closest("[data-task-item]") ||
        target.closest(".task-card") ||
        target.closest("button") ||
        target.closest("input") ||
        target.closest("textarea") ||
        target.closest("a") ||
        target.closest("label") ||
        target.closest("[role='menu']") ||
        target.closest("[role='dialog']") ||
        target.closest("[role='button']")
      ) {
        return;
      }

      // Chỉ khi click vào khoảng trống nền trang thuần túy -> Mới thoát về Create Mode
      onCancelEdit?.();
    };

    document.addEventListener("mousedown", handleDocumentClick);
    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
    };
  }, [editingTask, onCancelEdit]);

  // Lưu chỉnh sửa (Đảm bảo 100% dữ liệu giờ hẹn & hạn chót được lưu chuẩn xác)
  const handleSaveEdit = () => {
    if (!editingTask || !editTitle.trim()) return;

    const targetDate = editDate || todayStr;

    if (editTimeMode === "scheduled") {
      const effectiveStart = editStartTime || "09:00";
      const effectiveEnd = editEndTime || undefined;
      updateTask(editingTask.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        notebookId: editNotebookId || undefined,
        tag: editTag || undefined,
        parentTaskId: editParentTaskId || undefined,
        priority: editPriority,
        dueDate: `${targetDate} ${effectiveStart}`,
        startTime: effectiveStart,
        endTime: effectiveEnd,
        deadlineDate: undefined,
        deadlineTime: undefined,
        timeType: "scheduled",
      });
    } else if (editTimeMode === "deadline") {
      const effectiveDeadline = editDeadlineTime || "17:00";
      updateTask(editingTask.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        notebookId: editNotebookId || undefined,
        tag: editTag || undefined,
        parentTaskId: editParentTaskId || undefined,
        priority: editPriority,
        dueDate: `${targetDate} ${effectiveDeadline}`,
        deadlineDate: targetDate,
        deadlineTime: effectiveDeadline,
        startTime: undefined,
        endTime: undefined,
        timeType: "deadline",
      });
    } else {
      updateTask(editingTask.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        notebookId: editNotebookId || undefined,
        tag: editTag || undefined,
        parentTaskId: editParentTaskId || undefined,
        priority: editPriority,
        dueDate: editDate,
        deadlineDate: undefined,
        deadlineTime: undefined,
        startTime: undefined,
        endTime: undefined,
        timeType: undefined,
      });
    }

    setIsEditing(false);
  };

  // Mở time slider inline ngay trong Sidebar
  const handleOpenTimeSliderInline = (
    target: "start" | "end" | "deadline" | "subtask-start" | "subtask-end" | "subtask-deadline",
    currentVal?: string,
  ) => {
    setEditingTimeTarget(target);
    if (currentVal) {
      const [h, m] = currentVal.split(":").map(Number);
      setSliderHour(isNaN(h) ? 9 : h);
      setSliderMinute(isNaN(m) ? 0 : m);
    } else {
      const now = new Date();
      setSliderHour(now.getHours());
      setSliderMinute(Math.floor(now.getMinutes() / 5) * 5);
    }
    setIsDatePickerInlineOpen(false);
    setIsTimePickerInlineOpen(true);
  };

  const handleApplyTimeSliderInline = () => {
    const timeStr = `${String(sliderHour).padStart(2, "0")}:${String(sliderMinute).padStart(2, "0")}`;
    if (editingTimeTarget === "start") {
      setEditStartTime(timeStr);
      setEditTimeMode("scheduled");
      setEditDeadlineTime(undefined);
    } else if (editingTimeTarget === "end") {
      setEditEndTime(timeStr);
      setEditTimeMode("scheduled");
      setEditDeadlineTime(undefined);
    } else if (editingTimeTarget === "deadline") {
      setEditDeadlineTime(timeStr);
      setEditTimeMode("deadline");
      setEditStartTime(undefined);
      setEditEndTime(undefined);
    } else if (editingTimeTarget === "subtask-start") {
      setSubtaskStartTime(timeStr);
    } else if (editingTimeTarget === "subtask-end") {
      setSubtaskEndTime(timeStr);
    } else if (editingTimeTarget === "subtask-deadline") {
      setSubtaskDeadlineTime(timeStr);
    }
    setIsTimePickerInlineOpen(false);
  };

  // Thêm nhanh subtask trong View Mode (Linh hoạt có hoặc không có thời gian)
  const handleAddQuickSubtask = () => {
    if (!editingTask || !quickSubtaskTitle.trim()) return;
    const effectiveDate = getTaskEffectiveDate(editingTask);

    let finalTimeType: "scheduled" | "deadline" | undefined = undefined;
    let finalStartTime: string | undefined = undefined;
    let finalEndTime: string | undefined = undefined;
    let finalDeadlineTime: string | undefined = undefined;

    if (subtaskStartTime) {
      finalTimeType = "scheduled";
      finalStartTime = subtaskStartTime;
      finalEndTime = subtaskEndTime || undefined;
    } else if (subtaskDeadlineTime) {
      finalTimeType = "deadline";
      finalDeadlineTime = subtaskDeadlineTime;
    } else {
      finalTimeType = undefined;
    }

    addTask({
      title: quickSubtaskTitle.trim(),
      parentTaskId: editingTask.id,
      dueDate: effectiveDate,
      timeType: finalTimeType,
      startTime: finalStartTime,
      endTime: finalEndTime,
      deadlineDate: finalTimeType === "deadline" ? effectiveDate : undefined,
      deadlineTime: finalDeadlineTime,
      notebookId: editingTask.notebookId,
      tag: editingTask.tag,
      priority: "medium",
    });

    setQuickSubtaskTitle("");
    setSubtaskStartTime("");
    setSubtaskEndTime("");
    setSubtaskDeadlineTime("");
    setIsSubtaskTimeOpen(false);
  };

  // Copy mô tả
  const handleCopyDescription = () => {
    if (editingTask?.description) {
      navigator.clipboard.writeText(editingTask.description);
      setIsCopiedDesc(true);
      setTimeout(() => setIsCopiedDesc(false), 2000);
    }
  };

  // Tìm danh sách việc con trực thuộc
  const childTasks = editingTask
    ? tasks.filter((t) => t.parentTaskId === editingTask.id)
    : [];
  const completedChildCount = childTasks.filter((c) => c.completed).length;
  const childProgressPercent = childTasks.length > 0 ? Math.round((completedChildCount / childTasks.length) * 100) : 0;

  // Lấy danh sách task cha hợp lệ để chuyển đổi phả hệ
  const parentCandidates = editingTask
    ? getTaskParentCandidates(tasks, editingTask.notebookId ? "notebook" : "planner", {
        taskId: editingTask.id,
        date: editDate || todayStr,
        notebookId: editingTask.notebookId,
      })
    : [];
  const parentSelectOptions = buildParentSelectOptions(
    parentCandidates,
    tasks,
    editingTask?.parentTaskId
  );

  // Tìm thông tin task cha hiện tại của editingTask
  const currentParentTask = editingTask?.parentTaskId
    ? tasks.find((t) => t.id === editingTask.parentTaskId)
    : null;

  // Tìm cuốn sổ hiện tại
  const currentNotebook = editingTask?.notebookId
    ? notebooks.find((n) => n.id === editingTask.notebookId)
    : null;

  // Trạng thái thời gian thực của task
  const temporalState = editingTask ? getTaskTemporalState(editingTask) : "active";

  const renderInnerPanel = () => (
    <>
      {/* Header Panel */}
      <div className="flex items-center justify-between pb-2 border-b border-[#262626]/20 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`hidden lg:flex w-6 h-6 rounded-[5px] items-center justify-center border-[1.5px] border-[#262626] shadow-[1px_1px_0px_#262626] shrink-0 ${
              editingTask ? (isEditing ? "bg-[#FEF08A]" : "bg-[#BAE6FD]") : "bg-[#BBF7D0]"
            }`}
          >
            {editingTask ? (
              isEditing ? (
                <Edit3 size={13} className="text-[#1C1917]" strokeWidth={2.4} />
              ) : (
                <Eye size={13} className="text-sky-950" strokeWidth={2.4} />
              )
            ) : (
              <Plus size={14} className="text-emerald-950" strokeWidth={2.6} />
            )}
          </div>
          <h3 className="font-bold text-sm sm:text-base text-[#1C1917] truncate">
            {editingTask
              ? isEditing
                ? "Chỉnh sửa công việc"
                : "Chi tiết công việc"
              : parentTask
              ? "Thêm việc con"
              : "Thêm việc mới"}
          </h3>
        </div>

        <div className="hidden lg:flex items-center gap-1 shrink-0">
          {editingTask && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="p-1 hover:bg-rose-50 rounded text-[#78716C] hover:text-rose-700 transition-colors"
              title="Đóng về thêm mới"
            >
              <X size={15} strokeWidth={2.4} />
            </button>
          )}
          <button
            type="button"
            onClick={onToggle}
            className="p-1 hover:bg-[#F3EFE6] rounded text-[#78716C] hover:text-[#1C1917] transition-colors cursor-pointer"
            title="Đóng"
          >
            <ChevronRight size={16} strokeWidth={2.4} />
          </button>
        </div>
      </div>

          {/* ========================================================= */}
          {/* TRƯỜNG HỢP 1: XEM CHI TIẾT CÔNG VIỆC (VIEW MODE TOÀN DIỆN) */}
          {/* ========================================================= */}
          {editingTask && !isEditing && (
            <div className="space-y-3 text-xs">
              {/* Card Chính: Tiêu Đề & Trạng Thái */}
              <div className="p-3 bg-white border-[1.5px] border-[#262626] rounded-[6px] shadow-[2px_2px_0px_#262626] space-y-2.5">
                {/* Trạng thái & Checkbox */}
                <div className="flex items-start gap-2.5">
                  <button
                    type="button"
                    onClick={() => toggleTask(editingTask.id)}
                    className="mt-0.5 shrink-0 transition-transform active:scale-95"
                    title={editingTask.completed ? "Đánh dấu chưa xong" : "Đánh dấu đã hoàn thành"}
                  >
                    {editingTask.completed ? (
                      <CheckCircle2 size={20} className="text-emerald-600 fill-emerald-100" />
                    ) : (
                      <Circle size={20} className="text-[#78716C] hover:text-[#1C1917]" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <h4
                      className={`font-black text-sm leading-snug break-words ${
                        editingTask.completed
                          ? "line-through text-[#A8A29E]"
                          : "text-[#1C1917]"
                      }`}
                    >
                      {editingTask.title}
                    </h4>
                    
                    {/* Badge trạng thái hoàn thành / quá hạn */}
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {editingTask.completed ? (
                        <span className="text-[10px] font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                          <span className="inline-flex items-center gap-1">
                            <Check size={10} strokeWidth={3} />
                            Đã hoàn thành
                          </span>
                        </span>
                      ) : temporalState === "overdue" ? (
                        <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded border border-rose-300">
                          Đã quá hạn {initialOverdueDays > 0 ? `${initialOverdueDays} ngày` : ""}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                          Đang thực hiện
                        </span>
                      )}

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
                          editingTask.priority === "high"
                            ? "bg-[#FECDD3] text-rose-900 border-[#262626]"
                            : editingTask.priority === "low"
                            ? "bg-[#BBF7D0] text-emerald-900 border-[#262626]"
                            : "bg-[#FEF08A] text-amber-900 border-[#262626]"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            editingTask.priority === "high"
                              ? "bg-rose-600"
                              : editingTask.priority === "low"
                              ? "bg-emerald-600"
                              : "bg-amber-500"
                          }`}
                        />
                        <span>
                          {editingTask.priority === "high"
                            ? "Ưu tiên cao"
                            : editingTask.priority === "low"
                            ? "Ưu tiên thấp"
                            : "Ưu tiên vừa"}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Khối Thông Tin Lịch Trình (Ngày & Giờ) */}
                <div className="p-2 bg-[#FAF8F3] border border-[#262626] rounded-[5px] space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 text-[#1C1917] font-bold">
                      <CalendarDays size={13} className="text-[#1C1917]" />
                      <span>{getTaskEffectiveDate(editingTask) ? formatFullDate(getTaskEffectiveDate(editingTask)!) : "Hộp chờ (Chưa đặt ngày)"}</span>
                    </div>
                  </div>

                  {(editingTask.startTime || editingTask.deadlineTime) && (
                    <div className="flex items-center gap-1.5 text-[11px] pt-1 border-t border-[#D4CEBF]/60 font-mono">
                      {editingTask.startTime && (
                        <div className="flex items-center gap-1 text-amber-950 font-bold bg-[#FEF08A] px-2 py-0.5 rounded border border-[#262626]">
                          <Clock size={11} />
                          <span>Lịch hẹn: {editingTask.startTime}{editingTask.endTime ? ` - ${editingTask.endTime}` : ""}</span>
                        </div>
                      )}
                      {editingTask.deadlineTime && (
                        <div className="flex items-center gap-1 text-rose-950 font-bold bg-[#FECDD3] px-2 py-0.5 rounded border border-[#262626]">
                          <Hourglass size={11} />
                          <span>Hạn chót: {editingTask.deadlineTime}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Sổ tay & Nhãn Tag */}
                {(currentNotebook || editingTask.tag) && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    {currentNotebook && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[3px] border border-[#262626] bg-white text-[10px] font-bold text-[#1C1917]">
                        <BookOpen size={10} />
                        <span>{currentNotebook.name}</span>
                      </span>
                    )}
                    {editingTask.tag && (
                      <span
                        style={getTagStyle(editingTask.tag)}
                        className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-[3px] border border-[#262626] text-[10px] font-bold"
                      >
                        <TagIcon size={9} />
                        <span>#{editingTask.tag}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Mô Tả Chi Tiết (Note Giấy Kẻ) */}
              <div className="p-3 bg-[#FFFDEB] border-[1.5px] border-[#262626] rounded-[6px] shadow-[1.5px_1.5px_0px_#262626] space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-[#1C1917] pb-1 border-b border-[#262626]/20">
                  <span className="flex items-center gap-1">
                    <Edit3 size={11} />
                    <span>Ghi chú chi tiết:</span>
                  </span>
                  {editingTask.description && (
                    <button
                      type="button"
                      onClick={handleCopyDescription}
                      className="text-[10px] text-[#78716C] hover:text-[#1C1917] flex items-center gap-0.5"
                      title="Sao chép ghi chú"
                    >
                      {isCopiedDesc ? <Check size={10} className="text-emerald-700" /> : <Copy size={10} />}
                      <span>{isCopiedDesc ? "Đã chép" : "Sao chép"}</span>
                    </button>
                  )}
                </div>

                {editingTask.description ? (
                  <p className="text-xs text-[#262626] whitespace-pre-wrap break-words leading-relaxed font-sans">
                    {editingTask.description}
                  </p>
                ) : (
                  <p className="text-xs text-[#A8A29E] italic">Chưa có ghi chú cho công việc này.</p>
                )}
              </div>

              {/* Thuộc Công Việc Cha (Nếu có) */}
              {currentParentTask && (
                <div className="p-2 bg-white border border-[#262626] rounded-[5px] flex items-center justify-between text-[11px] shadow-[1px_1px_0px_#262626]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Layers size={12} className="text-[#78716C] shrink-0" />
                    <span className="text-[#78716C] shrink-0">Thuộc việc cha:</span>
                    <strong className="font-bold text-[#1C1917] truncate">{currentParentTask.title}</strong>
                  </div>
                </div>
              )}

              {/* Khối Danh Sách Việc Con (Subtasks) & Thêm Nhanh Việc Con */}
              <div className="p-3 bg-white border-[1.5px] border-[#262626] rounded-[6px] shadow-[1.5px_1.5px_0px_#262626] space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-[#1C1917]">
                  <span className="flex items-center gap-1">
                    <ListTodo size={13} />
                    <span>Tiến độ việc con ({completedChildCount}/{childTasks.length})</span>
                  </span>
                  <span className="font-mono text-emerald-800">{childProgressPercent}%</span>
                </div>

                {/* Thanh tiến độ Progress Bar */}
                {childTasks.length > 0 && (
                  <div className="w-full h-1.5 bg-[#E7E5E4] rounded-full overflow-hidden border border-[#262626]/40">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${childProgressPercent}%` }}
                    />
                  </div>
                )}

                {/* Checklist việc con */}
                {childTasks.length > 0 && (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5 pt-1">
                    {childTasks.map((ct) => (
                      <div
                        key={ct.id}
                        className="flex items-center justify-between p-1.5 bg-[#FAF8F3] hover:bg-[#F3EFE6] border border-[#D4CEBF]/80 rounded-[4px] text-[11px] group transition-colors"
                      >
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <HandDrawnCheckbox
                            checked={ct.completed}
                            onChange={() => toggleTask(ct.id)}
                          />
                          <div className="min-w-0 flex-1">
                            <span className={`block truncate font-medium ${ct.completed ? "line-through text-[#A8A29E]" : "text-[#1C1917]"}`}>
                              {ct.title}
                            </span>
                            {/* Giờ hẹn của subtask nếu có */}
                            {(ct.startTime || ct.deadlineTime) && (
                              <div className="flex items-center gap-1 text-[10px] font-mono text-amber-950 font-bold">
                                {ct.startTime && <span>⏰ {ct.startTime}{ct.endTime ? ` - ${ct.endTime}` : ""}</span>}
                                {ct.deadlineTime && <span>⏳ Hạn {ct.deadlineTime}</span>}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Nút Xem/Sửa & Nút Xóa Việc Con */}
                        <div className="flex items-center gap-1 shrink-0 ml-1 opacity-80 group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => {
                              // Chuyển sang xem/sửa task con này
                              const fullTask = tasks.find((t) => t.id === ct.id);
                              if (fullTask) {
                                if (onSelectTask) {
                                  onSelectTask(fullTask);
                                } else {
                                  setEditTitle(fullTask.title || "");
                                  setEditDescription(fullTask.description || "");
                                  setEditNotebookId(fullTask.notebookId || "");
                                  setEditTag(fullTask.tag || "");
                                  setEditParentTaskId(fullTask.parentTaskId || "");
                                  setEditPriority(fullTask.priority || "medium");
                                  const normTime = normalizeTaskTimeType(fullTask);
                                  setEditDate(getTaskEffectiveDate(fullTask) || todayStr);
                                  if (normTime === "scheduled") {
                                    setEditTimeMode("scheduled");
                                    setEditStartTime(fullTask.startTime);
                                    setEditEndTime(fullTask.endTime);
                                  } else if (normTime === "deadline") {
                                    setEditTimeMode("deadline");
                                    setEditDeadlineTime(fullTask.deadlineTime);
                                  } else {
                                    setEditTimeMode("none");
                                  }
                                }
                                setIsEditing(true); // Mở thẳng form sửa task con!
                                setPrevTaskId(fullTask.id);
                              }
                            }}
                            className="p-1 hover:bg-white text-[#78716C] hover:text-[#1C1917] rounded border border-transparent hover:border-[#262626] transition-colors"
                            title="Chỉnh sửa việc con này"
                          >
                            <Edit3 size={11} strokeWidth={2.4} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteTask(ct.id)}
                            className="p-1 hover:bg-rose-100 text-rose-700 rounded border border-transparent hover:border-rose-400 transition-colors"
                            title="Xóa việc con này"
                          >
                            <Trash2 size={11} strokeWidth={2.4} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Form Thêm Việc Con Thích Ứng Đúng Bản Chất Của Task Cha (Khóa khi thuộc ngày quá khứ) */}
                {Boolean(editingTask && getTaskEffectiveDate(editingTask) && getTaskEffectiveDate(editingTask)! < todayStr) ? (
                  <div className="p-2.5 bg-amber-50 border-[1.5px] border-amber-300 rounded-[5px] text-[11px] text-amber-950 font-medium flex items-center gap-1.5 shadow-[1px_1px_0px_#262626] mt-1.5">
                    <Lock size={13} className="text-amber-800 shrink-0" strokeWidth={2.4} />
                    <span>Ngày đã qua, không thể tạo việc mới.</span>
                  </div>
                ) : (
                  <div className="space-y-1.5 pt-1.5 border-t border-[#D4CEBF]/60">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={quickSubtaskTitle}
                        onChange={(e) => setQuickSubtaskTitle(e.target.value)}
                        placeholder={
                          editingTask && (normalizeTaskTimeType(editingTask) === "scheduled" || editingTask.startTime)
                            ? "+ Thêm việc trong lịch hẹn này..."
                            : editingTask && (normalizeTaskTimeType(editingTask) === "deadline" || editingTask.deadlineTime)
                            ? "+ Thêm việc cần làm trước hạn này..."
                            : "+ Tên việc con mới..."
                        }
                        className="flex-1 p-1.5 bg-[#FAF8F3] border-[1.5px] border-[#262626] rounded-[4px] text-xs focus:bg-white focus:outline-none"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddQuickSubtask();
                          }
                        }}
                      />

                      {/* TRƯỜNG HỢP 1: Task cha là LỊCH HẸN -> Chỉ có duy nhất nút Giờ hẹn */}
                      {editingTask && (normalizeTaskTimeType(editingTask) === "scheduled" || editingTask.startTime) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSubtaskDeadlineTime("");
                            setIsSubtaskTimeOpen(!isSubtaskTimeOpen);
                          }}
                          className={`p-1.5 rounded-[4px] border-[1.5px] text-[10px] font-bold flex items-center gap-0.5 active:translate-x-[0.5px] active:translate-y-[0.5px] ${
                            subtaskStartTime
                              ? "bg-[#FEF08A] text-amber-950 border-[#262626] shadow-[1px_1px_0px_#262626]"
                              : "bg-white text-[#78716C] border-[#D4CEBF] hover:bg-[#FFFDEB]"
                          }`}
                          title="Đặt khung giờ hẹn cho việc con"
                        >
                          <Clock size={11} className="text-amber-900" />
                          <span>{subtaskStartTime ? `${subtaskStartTime}${subtaskEndTime ? ` - ${subtaskEndTime}` : ""}` : "Khung giờ"}</span>
                        </button>
                      )}

                      {/* TRƯỜNG HỢP 2: Task cha là HẠN CHÓT -> Chỉ có duy nhất nút Hạn chót */}
                      {editingTask && (normalizeTaskTimeType(editingTask) === "deadline" || editingTask.deadlineTime) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSubtaskStartTime("");
                            setSubtaskEndTime("");
                            setIsSubtaskTimeOpen(!isSubtaskTimeOpen);
                          }}
                          className={`p-1.5 rounded-[4px] border-[1.5px] text-[10px] font-bold flex items-center gap-0.5 active:translate-x-[0.5px] active:translate-y-[0.5px] ${
                            subtaskDeadlineTime
                              ? "bg-[#FECDD3] text-rose-950 border-[#262626] shadow-[1px_1px_0px_#262626]"
                              : "bg-white text-[#78716C] border-[#D4CEBF] hover:bg-rose-50"
                          }`}
                          title="Đặt hạn chót cho việc con"
                        >
                          <Hourglass size={11} className="text-rose-900" />
                          <span>{subtaskDeadlineTime ? `Hạn ${subtaskDeadlineTime}` : "Giờ hạn"}</span>
                        </button>
                      )}

                      {/* TRƯỜNG HỢP 3: Task cha là VIỆC THƯỜNG KHÔNG GIỜ -> Nút giờ tùy chọn */}
                      {editingTask && !editingTask.startTime && !editingTask.deadlineTime && normalizeTaskTimeType(editingTask) === "none" && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsSubtaskTimeOpen(!isSubtaskTimeOpen);
                          }}
                          className={`p-1.5 rounded-[4px] border-[1.5px] text-[10px] font-bold flex items-center gap-0.5 active:translate-x-[0.5px] active:translate-y-[0.5px] ${
                            subtaskStartTime || subtaskDeadlineTime
                              ? "bg-[#FEF08A] text-amber-950 border-[#262626] shadow-[1px_1px_0px_#262626]"
                              : "bg-white text-[#78716C] border-[#D4CEBF] hover:text-[#1C1917]"
                          }`}
                          title="Tùy chọn giờ cho việc con"
                        >
                          <Clock size={11} />
                          <span>{subtaskStartTime || subtaskDeadlineTime || "Giờ"}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleAddQuickSubtask}
                        disabled={!quickSubtaskTitle.trim()}
                        className="p-1.5 bg-[#BBF7D0] hover:bg-[#86EFAC] disabled:opacity-40 border-[1.5px] border-[#262626] rounded-[4px] font-bold text-xs shrink-0 shadow-[1px_1px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px]"
                        title="Thêm việc con"
                      >
                        <Plus size={13} strokeWidth={2.6} />
                      </button>
                    </div>

                    {/* Khung nhập giờ thích ứng theo đúng chức năng của Task Cha */}
                    {isSubtaskTimeOpen && (
                      <div className="p-2 bg-[#FAF8F3] border border-[#262626] rounded-[4px] space-y-1.5 animate-in slide-in-from-top-1 text-[11px]">
                        <div className="flex items-center justify-between text-[#78716C] font-bold text-[10px]">
                          <span>
                            {editingTask && (normalizeTaskTimeType(editingTask) === "deadline" || editingTask.deadlineTime)
                              ? "Hạn chót hoàn thành của việc con:"
                              : "Khung giờ thực hiện của việc con:"}
                          </span>
                          {(subtaskStartTime || subtaskDeadlineTime) && (
                            <button
                              type="button"
                              onClick={() => {
                                setSubtaskStartTime("");
                                setSubtaskEndTime("");
                                setSubtaskDeadlineTime("");
                                setIsSubtaskTimeOpen(false);
                              }}
                              className="text-rose-700 hover:underline"
                            >
                              Xóa giờ
                            </button>
                          )}
                        </div>
                        
                        {editingTask && (normalizeTaskTimeType(editingTask) === "deadline" || editingTask.deadlineTime) ? (
                          <div>
                            <label className="text-[10px] text-[#78716C] block mb-0.5">Phải xong trước:</label>
                            <button
                              type="button"
                              onClick={() => handleOpenTimeSliderInline("subtask-deadline", subtaskDeadlineTime || "17:00")}
                              className="w-full p-1.5 bg-white border border-[#262626] rounded text-left flex items-center justify-between shadow-[1px_1px_0px_#262626]"
                            >
                              <span className="font-mono font-bold text-xs text-[#1C1917]">
                                {subtaskDeadlineTime || "17:00"}
                              </span>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-[#FECDD3] border border-[#262626] rounded">
                                Chọn giờ
                              </span>
                            </button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-1.5">
                            <div>
                              <label className="text-[10px] text-[#78716C] block mb-0.5">Bắt đầu:</label>
                              <button
                                type="button"
                                onClick={() => handleOpenTimeSliderInline("subtask-start", subtaskStartTime || "09:00")}
                                className="w-full p-1.5 bg-white border border-[#262626] rounded text-left flex items-center justify-between shadow-[1px_1px_0px_#262626]"
                              >
                                <span className="font-mono font-bold text-xs text-[#1C1917]">
                                  {subtaskStartTime || "09:00"}
                                </span>
                                <span className="text-[9px] font-bold px-1 py-0.5 bg-[#FEF08A] border border-[#262626] rounded">
                                  Sửa
                                </span>
                              </button>
                            </div>
                            <div>
                              <label className="text-[10px] text-[#78716C] block mb-0.5">Kết thúc:</label>
                              <button
                                type="button"
                                onClick={() => handleOpenTimeSliderInline("subtask-end", subtaskEndTime || "10:00")}
                                className="w-full p-1.5 bg-white border border-[#262626] rounded text-left flex items-center justify-between shadow-[1px_1px_0px_#262626]"
                              >
                                <span className="font-mono font-bold text-xs text-[#1C1917]">
                                  {subtaskEndTime || "10:00"}
                                </span>
                                <span className="text-[9px] font-bold px-1 py-0.5 bg-[#FEF08A] border border-[#262626] rounded">
                                  Sửa
                                </span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Nút mở Form Thêm Việc Con Đầy Đủ */}
                    <button
                      type="button"
                      onClick={() => {
                        onAddSubtaskToTask?.(editingTask);
                      }}
                      className="w-full py-1 text-[10px] font-bold text-[#78716C] hover:text-[#1C1917] bg-[#FAF8F3] hover:bg-[#F3EFE6] border border-dashed border-[#D4CEBF] rounded flex items-center justify-center gap-1 transition-colors"
                    >
                      <CornerDownRight size={11} />
                      <span>Mở form thêm việc con đầy đủ chi tiết</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Bộ Phím Thao Tác Dưới Cùng Của View Mode */}
              <div className="space-y-1.5 pt-2 border-t border-[#262626]">
                {/* Nút Chỉnh Sửa Chính */}
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="w-full py-2 bg-[#FEF08A] hover:bg-[#FDE047] text-[#1C1917] border-[1.5px] border-[#262626] rounded-[6px] text-xs font-bold shadow-[2px_2px_0px_#262626] flex items-center justify-center gap-1.5 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all"
                >
                  <Edit3 size={14} strokeWidth={2.4} />
                  <span>Chỉnh sửa công việc này</span>
                </button>

                {/* Các nút phụ: Dời mai & Xóa việc */}
                <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      onMoveTomorrow?.(editingTask.id);
                    }}
                    className="py-1.5 px-2 bg-white hover:bg-[#FAF8F3] text-[#1C1917] border-[1.5px] border-[#262626] rounded-[4px] text-[11px] font-bold shadow-[1px_1px_0px_#262626] flex items-center justify-center gap-1 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
                  >
                    <ArrowRight size={11} strokeWidth={2.4} />
                    <span>Dời sang mai</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onDeleteTask?.(editingTask.id);
                    }}
                    className="py-1.5 px-2 bg-white hover:bg-rose-50 text-rose-700 border-[1.5px] border-[#262626] rounded-[4px] text-[11px] font-bold shadow-[1px_1px_0px_#262626] flex items-center justify-center gap-1 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
                  >
                    <Trash2 size={11} strokeWidth={2.4} />
                    <span>Xóa việc</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TRƯỜNG HỢP 2: CHỈNH SỬA CÔNG VIỆC (EDIT MODE) */}
          {/* ========================================================= */}
          {editingTask && isEditing && (
            <div className="space-y-3 text-xs animate-in fade-in duration-150">
              {/* Tiêu đề task */}
              <div>
                <label className="font-bold text-[#1C1917] text-[11px] block mb-1">
                  Tiêu đề công việc:
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Nhập tên việc..."
                  className="w-full p-2 bg-white border-[1.5px] border-[#262626] rounded-[4px] font-bold text-xs focus:ring-1 focus:ring-[#262626] focus:outline-none shadow-[1.5px_1.5px_0px_#262626]"
                  autoFocus
                />
              </div>

              {/* Ghi chú chi tiết */}
              <div>
                <label className="font-bold text-[#1C1917] text-[11px] block mb-1">
                  Ghi chú chi tiết:
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Thêm mô tả, link hoặc lưu ý..."
                  rows={2}
                  className="w-full p-2 bg-white border-[1.5px] border-[#262626] rounded-[4px] text-xs focus:ring-1 focus:ring-[#262626] focus:outline-none resize-none shadow-[1.5px_1.5px_0px_#262626]"
                />
              </div>

              {/* ---------------------------------------------------- */}
              {/* KHỐI CHỌN NGÀY & DỜI NGÀY THỐNG NHẤT (INLINE 100%) */}
              {/* ---------------------------------------------------- */}
              <div className="space-y-1.5 pt-1 border-t border-[#D4CEBF]/40">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#1C1917] text-[11px] flex items-center gap-1">
                    <Calendar size={11} className="text-[#1C1917]" />
                    <span>Ngày thực hiện:</span>
                  </label>
                  {initialOverdueDays === 1 ? (
                    <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300">
                      Việc hôm qua
                    </span>
                  ) : initialOverdueDays >= 2 ? (
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded border border-rose-300">
                      Trễ {initialOverdueDays} ngày
                    </span>
                  ) : null}
                </div>

                {/* Dòng các nút chọn/dời ngày theo đúng phân loại logic */}
                {initialOverdueDays >= 2 ? (
                  /* TRƯỜNG HỢP 1: Quá hạn >= 2 ngày -> Chỉ có nút [Hôm nay] và [Chọn ngày dời] */
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setEditDate(todayStr);
                        setIsDatePickerInlineOpen(false);
                      }}
                      className={`px-3 py-1.5 rounded-[4px] border font-bold text-xs transition-all flex items-center gap-1 ${
                        editDate === todayStr
                          ? "bg-[#262626] text-white border-[#262626] shadow-[1.5px_1.5px_0px_#262626]"
                          : "bg-white text-[#1C1917] border-[#262626] hover:bg-[#FAF8F3] shadow-[1px_1px_0px_#262626]"
                      }`}
                    >
                      <span></span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsTimePickerInlineOpen(false);
                        setIsDatePickerInlineOpen(!isDatePickerInlineOpen);
                      }}
                      className={`flex-1 py-1.5 px-2.5 rounded-[4px] border-[1.5px] font-bold text-xs transition-all flex items-center justify-between ${
                        isDatePickerInlineOpen || (editDate && editDate !== todayStr)
                          ? "bg-[#FEF08A] text-[#1C1917] border-[#262626] shadow-[1.5px_1.5px_0px_#262626]"
                          : "bg-white text-[#78716C] border-[#262626] hover:text-[#1C1917] shadow-[1px_1px_0px_#262626]"
                      }`}
                    >
                      <div className="flex items-center gap-1 truncate">
                        <Calendar size={12} strokeWidth={2.4} />
                        <span>{editDate && editDate !== todayStr ? `Đã chọn: ${formatShortDayMonth(editDate)}` : "Chọn ngày dời"}</span>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 bg-white/80 border border-[#262626] rounded ml-1 shrink-0">
                        {isDatePickerInlineOpen ? "Đóng" : "Chọn ngày"}
                      </span>
                    </button>
                  </div>
                ) : initialOverdueDays === 1 ? (
                  /* TRƯỜNG HỢP 2: Việc của hôm qua (trễ 1 ngày) */
                  <div className="flex items-center gap-1 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setEditDate(tomorrowStr);
                        setIsDatePickerInlineOpen(false);
                      }}
                      className={`px-2.5 py-1 rounded-[3px] border font-bold text-[10px] transition-all flex items-center gap-0.5 ${
                        editDate === tomorrowStr
                          ? "bg-[#262626] text-white border-[#262626] shadow-[1px_1px_0px_#262626]"
                          : "bg-[#FEF08A] text-[#1C1917] border-[#262626] shadow-[0.5px_0.5px_0px_#262626] hover:bg-[#FDE047]"
                      }`}
                    >
                      <ArrowRight size={10} strokeWidth={2.4} />
                      <span>Dời sang mai</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditDate(todayStr);
                        setIsDatePickerInlineOpen(false);
                      }}
                      className={`px-2 py-1 rounded-[3px] border font-bold text-[10px] transition-all flex items-center gap-0.5 ${
                        editDate === todayStr
                          ? "bg-[#262626] text-white border-[#262626] shadow-[1px_1px_0px_#262626]"
                          : "bg-white text-[#1C1917] border-[#D4CEBF] hover:bg-[#FAF8F3]"
                      }`}
                    >
                      <span>Về hôm nay</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsTimePickerInlineOpen(false);
                        setIsDatePickerInlineOpen(!isDatePickerInlineOpen);
                      }}
                      className={`px-2 py-1 rounded-[3px] border font-bold text-[10px] transition-all flex items-center gap-1 ml-auto ${
                        isDatePickerInlineOpen || (editDate && editDate !== todayStr && editDate !== tomorrowStr)
                          ? "bg-[#FEF08A] text-[#1C1917] border-[#262626] shadow-[1px_1px_0px_#262626]"
                          : "bg-white text-[#78716C] border-[#D4CEBF] hover:text-[#1C1917]"
                      }`}
                    >
                      <Calendar size={11} />
                      <span>{editDate && editDate >= todayStr ? formatShortDayMonth(editDate) : "Ngày khác"}</span>
                    </button>
                  </div>
                ) : (
                  /* TRƯỜNG HỢP 3: Ngày chính bình thường -> Chỉ có nút dời sang mai */
                  <div className="flex items-center justify-between p-1.5 bg-[#FAF8F3] border border-[#D4CEBF] rounded-[5px]">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-xs font-bold text-[#1C1917] truncate">
                        {editDate === todayStr ? "Hôm nay" : `Ngày ${formatShortDayMonth(editDate || todayStr)}`}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const targetTomorrow = tomorrowStr;
                        setEditDate(editDate === targetTomorrow ? (editingTask ? getTaskEffectiveDate(editingTask) || todayStr : todayStr) : targetTomorrow);
                      }}
                      className={`px-2.5 py-1 rounded-[3px] border font-bold text-[11px] transition-all flex items-center gap-1 shadow-[1px_1px_0px_#262626] active:translate-y-[0.5px] ${
                        editDate === tomorrowStr
                          ? "bg-[#262626] text-white border-[#262626]"
                          : "bg-white text-[#1C1917] border-[#262626] hover:bg-[#FEF08A]"
                      }`}
                    >
                      <ArrowRight size={11} strokeWidth={2.4} />
                      <span>{editDate === tomorrowStr ? "Đã dời sang mai" : "Dời sang mai"}</span>
                    </button>
                  </div>
                )}

                {/* Mini Calendar Inline trong Sidebar (Khóa Quá Khứ Tuyệt Đối) */}
                {isDatePickerInlineOpen && (
                  <div className="p-2 bg-white border-[1.5px] border-[#262626] rounded-[6px] shadow-[2px_2px_0px_#262626] animate-in slide-in-from-top-1 duration-150 space-y-1.5">
                    <div className="flex items-center justify-between pb-1 border-b border-[#262626]/20 text-[11px] font-bold text-[#1C1917]">
                      <span>Chọn ngày thực hiện (từ hôm nay trở đi)</span>
                      <button
                        type="button"
                        onClick={() => setIsDatePickerInlineOpen(false)}
                        className="p-0.5 hover:bg-rose-50 rounded"
                      >
                        <X size={12} />
                      </button>
                    </div>

                    <CalendarMonth
                      selectedDate={editDate || todayStr}
                      onSelectDate={(newDate) => {
                        setEditDate(newDate);
                        setIsDatePickerInlineOpen(false);
                      }}
                      viewYear={calYear}
                      viewMonth={calMonth}
                      onPrevMonth={() => {
                        if (calMonth === 0) {
                          setCalYear((prev) => prev - 1);
                          setCalMonth(11);
                        } else {
                          setCalMonth((prev) => prev - 1);
                        }
                      }}
                      onNextMonth={() => {
                        if (calMonth === 11) {
                          setCalYear((prev) => prev + 1);
                          setCalMonth(0);
                        } else {
                          setCalMonth((prev) => prev + 1);
                        }
                      }}
                      minDate={todayStr}
                      disablePastDates={true}
                    />
                  </div>
                )}
              </div>

              {/* Phả hệ công việc */}
              <div className="space-y-1.5 pt-1 border-t border-[#D4CEBF]/40">
                <label className="font-bold text-[#1C1917] text-[11px] flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Layers size={11} className="text-[#78716C]" />
                    <span>Thuộc công việc cha:</span>
                  </span>
                  {editParentTaskId && (
                    <button
                      type="button"
                      onClick={() => setEditParentTaskId("")}
                      className="text-[10px] font-bold text-rose-700 hover:underline flex items-center gap-0.5"
                    >
                      <Unlink size={10} />
                      <span>Tách độc lập</span>
                    </button>
                  )}
                </label>
                <CustomSelect
                  value={editParentTaskId}
                  onChange={setEditParentTaskId}
                  options={parentSelectOptions}
                  className="w-full"
                />
              </div>

              {/* Nhãn phân loại & Xóa tag */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-[#1C1917] text-[11px] flex items-center gap-1">
                    <TagIcon size={11} />
                    <span>Nhãn phân loại:</span>
                  </label>
                  {!isAddingTag && (
                    <button
                      type="button"
                      onClick={() => setIsAddingTag(true)}
                      className="text-[10px] font-bold text-[#78716C] hover:text-[#1C1917] underline"
                    >
                      + Tạo nhãn mới
                    </button>
                  )}
                </div>

                {isAddingTag ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      placeholder="Tên nhãn mới..."
                      className="flex-1 p-1 bg-white border border-[#262626] rounded text-xs"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (newTagInput.trim()) {
                            const clean = newTagInput.trim().replace(/^#/, "");
                            addTag(clean);
                            setEditTag(clean);
                            setNewTagInput("");
                            setIsAddingTag(false);
                          }
                        }
                      }}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newTagInput.trim()) {
                          const clean = newTagInput.trim().replace(/^#/, "");
                          addTag(clean);
                          setEditTag(clean);
                          setNewTagInput("");
                          setIsAddingTag(false);
                        }
                      }}
                      className="px-2 py-1 bg-[#BBF7D0] border border-[#262626] rounded font-bold text-[10px]"
                    >
                      Lưu
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingTag(false)}
                      className="p-1 hover:bg-rose-50 rounded"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {tags.map((tag) => (
                      <div
                        key={tag}
                        className="inline-flex items-center group/tag rounded-[3px] overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => setEditTag(editTag === tag ? "" : tag)}
                          style={getTagStyle(tag)}
                          className={`px-2 py-0.5 border font-bold text-[10px] transition-all ${
                            editTag === tag
                              ? "border-[#262626] shadow-[1px_1px_0px_#262626] scale-105"
                              : "border-dashed opacity-60 hover:opacity-100"
                          }`}
                        >
                          #{tag}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (editTag === tag) setEditTag("");
                            deleteTag(tag);
                          }}
                          className="px-1 py-0.5 bg-rose-100 hover:bg-rose-200 text-rose-800 text-[9px] font-bold border-y border-r border-[#262626] opacity-0 group-hover/tag:opacity-100 transition-opacity"
                          title={`Xóa nhãn #${tag}`}
                        >
                          <X size={9} strokeWidth={2.8} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sổ tay */}
              <div>
                <label className="font-bold text-[#1C1917] text-[11px] block mb-1 flex items-center gap-1">
                  <BookOpen size={11} className="text-[#78716C]" />
                  <span>Sổ tay:</span>
                </label>
                <CustomSelect
                  value={editNotebookId}
                  onChange={setEditNotebookId}
                  options={[
                    { value: "", label: "Không thuộc cuốn sổ" },
                    ...notebooks.map((nb) => ({
                      value: nb.id,
                      label: nb.name,
                      icon: nb.icon,
                    })),
                  ]}
                  className="w-full"
                />
              </div>

              {/* Giờ hẹn & Giờ chót (Tách riêng rẽ 100%) */}
              <div className="space-y-2 pt-1.5 border-t border-[#D4CEBF]/40">
                <label className="font-bold text-[#1C1917] text-[11px] block">
                  Thời gian thực hiện:
                </label>

                {/* 3 Tab phân loại rạch ròi */}
                <div className="grid grid-cols-3 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditTimeMode("none");
                      setEditStartTime(undefined);
                      setEditEndTime(undefined);
                      setEditDeadlineTime(undefined);
                      setIsTimePickerInlineOpen(false);
                    }}
                    className={`py-1.5 px-1 rounded-[4px] border font-bold text-[10px] transition-all flex items-center justify-center gap-1 ${
                      editTimeMode === "none"
                        ? "bg-[#262626] text-white border-[#262626] shadow-[1px_1px_0px_#262626]"
                        : "bg-white text-[#78716C] border-[#D4CEBF] hover:text-[#1C1917]"
                    }`}
                  >
                    <span>Trong ngày</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (editTimeMode !== "scheduled") {
                        setEditTimeMode("scheduled");
                        setEditDeadlineTime(undefined);
                        if (!editStartTime) handleOpenTimeSliderInline("start");
                      }
                    }}
                    className={`py-1.5 px-1 rounded-[4px] border font-bold text-[10px] transition-all flex items-center justify-center gap-1 ${
                      editTimeMode === "scheduled"
                        ? "bg-[#FEF08A] text-amber-950 border-[#262626] shadow-[1.5px_1.5px_0px_#262626]"
                        : "bg-white text-[#78716C] border-[#D4CEBF] hover:bg-[#FFFDEB]"
                    }`}
                  >
                    <Clock size={11} className="text-amber-900" />
                    <span>Giờ hẹn</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (editTimeMode !== "deadline") {
                        setEditTimeMode("deadline");
                        setEditStartTime(undefined);
                        setEditEndTime(undefined);
                        if (!editDeadlineTime) handleOpenTimeSliderInline("deadline");
                      }
                    }}
                    className={`py-1.5 px-1 rounded-[4px] border font-bold text-[10px] transition-all flex items-center justify-center gap-1 ${
                      editTimeMode === "deadline"
                        ? "bg-[#FECDD3] text-rose-950 border-[#262626] shadow-[1.5px_1.5px_0px_#262626]"
                        : "bg-white text-[#78716C] border-[#D4CEBF] hover:bg-rose-50"
                    }`}
                  >
                    <Hourglass size={11} className="text-rose-900" />
                    <span>Hạn chót</span>
                  </button>
                </div>

                {/* Khung Chi Tiết: KHUNG GIỜ HẸN */}
                {editTimeMode === "scheduled" && (
                  <div className="p-2 bg-[#FFFDEB] border-[1.5px] border-[#262626] rounded-[6px] space-y-1.5 shadow-[1px_1px_0px_#262626] animate-in slide-in-from-top-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-amber-950">
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        <span>Khung giờ hẹn thực hiện:</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditTimeMode("none");
                          setEditStartTime(undefined);
                          setEditEndTime(undefined);
                          setIsTimePickerInlineOpen(false);
                        }}
                        className="text-rose-700 hover:underline"
                      >
                        Hủy giờ hẹn
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenTimeSliderInline("start", editStartTime)}
                        className="p-1.5 bg-white border border-[#262626] rounded text-left flex items-center justify-between shadow-[1px_1px_0px_#262626]"
                      >
                        <span className="font-bold text-[11px] text-[#1C1917]">
                          {editStartTime ? `Bắt đầu: ${editStartTime}` : "Chọn giờ bắt đầu"}
                        </span>
                        <span className="text-[9px] font-bold px-1 bg-[#FEF08A] border border-[#262626] rounded">
                          {editStartTime ? "Đổi" : "+"}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenTimeSliderInline("end", editEndTime)}
                        className="p-1.5 bg-white border border-[#262626] rounded text-left flex items-center justify-between shadow-[1px_1px_0px_#262626]"
                      >
                        <span className="font-bold text-[11px] text-[#1C1917]">
                          {editEndTime ? `Kết thúc: ${editEndTime}` : "Chọn giờ kết thúc"}
                        </span>
                        <span className="text-[9px] font-bold px-1 bg-[#FEF08A] border border-[#262626] rounded">
                          {editEndTime ? "Đổi" : "+"}
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Khung Chi Tiết: HẠN CHÓT (DEADLINE) */}
                {editTimeMode === "deadline" && (
                  <div className="p-2 bg-rose-50 border-[1.5px] border-[#262626] rounded-[6px] space-y-1.5 shadow-[1px_1px_0px_#262626] animate-in slide-in-from-top-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-rose-950">
                      <span className="flex items-center gap-1">
                        <Hourglass size={11} />
                        <span>Hạn chót phải hoàn thành trước:</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditTimeMode("none");
                          setEditDeadlineTime(undefined);
                          setIsTimePickerInlineOpen(false);
                        }}
                        className="text-rose-700 hover:underline"
                      >
                        Hủy hạn chót
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenTimeSliderInline("deadline", editDeadlineTime)}
                      className="w-full p-1.5 bg-white border border-[#262626] rounded text-left flex items-center justify-between shadow-[1px_1px_0px_#262626]"
                    >
                      <div className="flex items-center gap-1.5">
                        <Hourglass size={12} className="text-rose-800" />
                        <span className="font-bold text-xs text-[#1C1917]">
                          Hoàn thành trước: {editDeadlineTime || "17:00"}
                        </span>
                      </div>
                      <span className="text-[9px] font-bold px-1.5 bg-[#FECDD3] border border-[#262626] rounded">
                        Đổi giờ
                      </span>
                    </button>
                  </div>
                )}

                {/* Time Slider Inline */}
                {isTimePickerInlineOpen && (
                  <div className="p-2.5 bg-[#FAF8F3] border-[1.5px] border-[#262626] rounded-[6px] shadow-[2px_2px_0px_#262626] space-y-2 animate-in slide-in-from-top-1 duration-150">
                    <div className="flex items-center justify-between pb-1 border-b border-[#262626]/20">
                      <span className="font-bold text-[11px] text-[#1C1917]">
                        {editingTimeTarget === "start"
                          ? "Chọn giờ bắt đầu"
                          : editingTimeTarget === "end"
                          ? "Chọn giờ kết thúc"
                          : "Chọn giờ chót"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsTimePickerInlineOpen(false)}
                        className="p-0.5 hover:bg-rose-50 rounded"
                      >
                        <X size={12} />
                      </button>
                    </div>

                    <TimeSliderAdjuster
                      hour={sliderHour}
                      minute={sliderMinute}
                      onHourChange={setSliderHour}
                      onMinuteChange={setSliderMinute}
                    />

                    <div className="flex justify-end gap-1.5 pt-1 border-t border-[#262626]/10">
                      <button
                        type="button"
                        onClick={() => setIsTimePickerInlineOpen(false)}
                        className="px-2 py-0.5 bg-white text-[10px] font-bold border border-[#262626] rounded"
                      >
                        Đóng
                      </button>
                      <button
                        type="button"
                        onClick={handleApplyTimeSliderInline}
                        className="px-3 py-0.5 bg-[#BBF7D0] text-emerald-950 text-[10px] font-bold border border-[#262626] rounded shadow-[1px_1px_0px_#262626]"
                      >
                        Áp dụng
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Ưu tiên */}
              <div className="space-y-1 pt-1 border-t border-[#D4CEBF]/40">
                <label className="font-bold text-[#1C1917] text-[11px] block">
                  Ưu tiên:
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEditPriority("high")}
                    className={`py-1 px-1 rounded-[4px] border font-bold text-[11px] transition-all flex items-center justify-center gap-1 ${
                      editPriority === "high"
                        ? "bg-[#FECDD3] text-rose-900 border-[#262626] shadow-[1px_1px_0px_#262626]"
                        : "bg-white text-[#78716C] border-[#D4CEBF]"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                    <span>Gấp</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditPriority("medium")}
                    className={`py-1 px-1 rounded-[4px] border font-bold text-[11px] transition-all flex items-center justify-center gap-1 ${
                      editPriority === "medium"
                        ? "bg-[#FEF08A] text-amber-900 border-[#262626] shadow-[1px_1px_0px_#262626]"
                        : "bg-white text-[#78716C] border-[#D4CEBF]"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>Vừa</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditPriority("low")}
                    className={`py-1 px-1 rounded-[4px] border font-bold text-[11px] transition-all flex items-center justify-center gap-1 ${
                      editPriority === "low"
                        ? "bg-[#BBF7D0] text-emerald-900 border-[#262626] shadow-[1px_1px_0px_#262626]"
                        : "bg-white text-[#78716C] border-[#D4CEBF]"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    <span>Thấp</span>
                  </button>
                </div>
              </div>

              {/* Nút Hành Động Cho Edit Mode: Hủy & Lưu */}
              <div className="pt-2 border-t border-[#262626] flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-1.5 bg-white hover:bg-[#FAF8F3] border-[1.5px] border-[#262626] rounded-[6px] text-xs font-bold text-[#1C1917] shadow-[1px_1px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
                >
                  Hủy sửa
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={!editTitle.trim()}
                  className="flex-1 py-1.5 bg-[#BBF7D0] hover:bg-[#86EFAC] disabled:opacity-50 border-[1.5px] border-[#262626] rounded-[6px] text-xs font-bold text-emerald-950 shadow-[1.5px_1.5px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TRƯỜNG HỢP 3: THÊM CÔNG VIỆC MỚI (CREATE MODE) */}
          {/* ========================================================= */}
          {!editingTask && (
            <>
              {/* Banner Context khi thêm việc con */}
              {parentTask && (
                <div className="p-2 bg-[#FAF8F3] border-[1.5px] border-[#262626] rounded-[6px] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <CornerDownRight size={13} className="text-[#78716C] shrink-0" />
                    <span className="text-[#78716C] shrink-0">Việc con cho:</span>
                    <strong className="font-bold text-[#1C1917] truncate">{parentTask.title}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={onClearParentTask}
                    className="text-[10px] font-bold text-rose-700 hover:underline shrink-0 ml-1"
                  >
                    Hủy
                  </button>
                </div>
              )}

              {/* Form Quick Add */}
              <QuickAddTaskComposer
                context={context}
                notebookId={notebookId}
                initialParentTaskId={parentTask?.id || ""}
                hideExpandToggle={true}
                onTaskCreated={(title) => {
                  onTaskCreated?.(title);
                  onClearParentTask?.();
                }}
                placeholder={
                  parentTask
                    ? `Việc con cho "${parentTask.title.substring(0, 18)}..."`
                    : context === "notebook"
                    ? "Nhập việc cần làm vào sổ..."
                    : "Nhập việc cần làm hôm nay..."
                }
              />
            </>
          )}
    </>
  );

  // 1. GIAO DIỆN MOBILE: Toàn bộ Xem / Sửa / Thêm hiển thị dạng Pop-up Bottom Sheet
  if (isMobile) {
    if (!isModalActive) return null;

    return createPortal(
      <div
        role="dialog"
        aria-modal="true"
        aria-label={
          editingTask
            ? isEditing
              ? "Chỉnh sửa công việc"
              : "Chi tiết công việc"
            : parentTask
            ? "Thêm việc con"
            : "Thêm việc mới"
        }
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99999,
          backgroundColor: "rgba(0, 0, 0, 0.65)",
        }}
        className="flex items-end sm:items-center justify-center p-0 sm:p-4 select-none animate-in fade-in duration-150 pointer-events-auto"
        onClick={() => {
          if (editingTask) onCancelEdit?.();
          else if (parentTask) onClearParentTask?.();
          else if (isOpen) onToggle();
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg bg-[#FFFDF8] border-t-[2px] sm:border-[2px] border-[#262626] rounded-t-[22px] sm:rounded-[12px] shadow-[0px_-4px_0px_#262626] sm:shadow-[6px_6px_0px_#262626] p-4 flex flex-col justify-between overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 max-h-[88dvh] touch-pan-y overscroll-contain"
        >
          {/* Mobile Grab Handle */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => {
              if (editingTask) onCancelEdit?.();
              else if (parentTask) onClearParentTask?.();
              else if (isOpen) onToggle();
            }}
            className="w-full pt-0 pb-2 flex items-center justify-center cursor-pointer sm:hidden min-h-[20px] active:opacity-60"
          >
            <div className="w-12 h-1.5 bg-[#D4CEBF] rounded-full pointer-events-none" />
          </div>

          <div className="overflow-y-auto space-y-3.5 flex-1 pr-0.5 touch-pan-y overscroll-contain">
            {renderInnerPanel()}
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // 2. GIAO DIỆN DESKTOP: Side Panel Cạnh Phải Chuẩn Canonical
  return (
    <aside
      ref={sidebarRef}
      className={`hidden lg:block transition-all duration-200 select-none ${
        isOpen ? "w-full sm:w-[320px] lg:w-[340px] max-w-[340px] shrink-0" : "w-10 lg:w-11"
      }`}
    >
      {isOpen ? (
        <div
          className={`bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] p-3.5 shadow-[3px_3px_0px_#262626] space-y-3.5 max-h-[calc(100dvh-5rem)] overflow-y-auto no-scrollbar ${
            editingTask
              ? isEditing
                ? "ring-2 ring-[#262626] bg-[#FFFDEB] shadow-[4px_4px_0px_#262626]"
                : "ring-1.5 ring-[#262626] bg-[#FCFBF8] shadow-[3px_3px_0px_#262626]"
              : ""
          }`}
        >
          {renderInnerPanel()}
        </div>
      ) : (
        <div className="bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] py-3 px-1.5 shadow-[2px_2px_0px_#262626] flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={onToggle}
            className="w-8 h-8 rounded-[6px] bg-[#BBF7D0] border-[1.5px] border-[#262626] flex items-center justify-center shadow-[1.5px_1.5px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:scale-105 transition-transform"
            title="Mở thêm việc mới (+)"
          >
            <Plus size={16} className="text-emerald-950" strokeWidth={2.8} />
          </button>
          <span
            style={{ writingMode: "vertical-rl" }}
            className="text-[10px] font-bold text-[#78716C] tracking-wider select-none"
          >
            {editingTask ? (isEditing ? "Chỉnh sửa" : "Chi tiết") : "Thêm việc"}
          </span>
        </div>
      )}
    </aside>
  );
};
