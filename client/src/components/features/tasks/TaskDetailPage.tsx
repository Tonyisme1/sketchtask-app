import React, { useState, useEffect, useRef } from "react";
import { useAppStore } from "../../../stores/appStore";
import { TaskPriority, TaskTimeType } from "../../../types";
import { getLocalTodayStr, getLocalTomorrowStr, formatFullDate, formatShortDayMonth } from "../../../utils/date";
import { normalizeTaskTimeType, getTaskTags, extractTagsFromTitle, getTaskTemporalState, isTaskDueToday, getTaskEffectiveTime } from "../../../utils/taskSemantics";
import { useResponsiveLayout } from "../../../shared/hooks";
import { isNativePlatform } from "../../../services/notificationService";
import { dispatchToast } from "../../../utils/toast";
import { HandDrawnCheckbox } from "../../ui/core/HandDrawnCheckbox";
import { TagInputSelector } from "../../ui/pickers/select/TagInputSelector";
import { TimePickerPopover } from "../../ui/pickers/time/TimePickerPopover";
import { DatePickerPopover, formatDisplayDate } from "../../ui/pickers/time/DatePickerPopover";
import { RescheduleDateModal } from "../../ui/overlays/RescheduleDateModal";
import {
  ArrowLeft,
  Trash2,
  Calendar,
  Check,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Edit3,
  Copy,
  ArrowRight,
  CheckSquare,
  CalendarPlus,
} from "lucide-react";

type TaskEditorSection = "status" | "timing" | "organize" | "notes" | "subtasks";

interface CollapsibleTaskSectionProps {
  title: string;
  open: boolean;
  onToggle: () => void;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}

const CollapsibleTaskSection: React.FC<CollapsibleTaskSectionProps> = ({
  title,
  open,
  onToggle,
  trailing,
  children,
}) => (
  <section className="bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-black rounded-xl shadow-2xs overflow-hidden transition-all">
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className={`w-full min-h-[36px] px-3 py-2 flex items-center justify-between gap-2 text-left cursor-pointer transition-colors ${
        open
          ? "bg-[#F2F2F7] dark:bg-[#2C2C2E]/60 border-b border-[#E5E5EA] dark:border-black text-[#1C1C1E] dark:text-[#F2F2F7]"
          : "bg-white dark:bg-[#1C1C1E] hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E] text-[#1C1C1E] dark:text-[#F2F2F7]"
      } focus-visible:outline-none`}
    >
      <span className="text-xs font-bold text-[#1C1C1E] dark:text-[#F2F2F7]">
        {title}
      </span>
      <span className="flex items-center gap-1.5 shrink-0">
        {trailing}
        <span className="text-[#8E8E93] dark:text-[#aeaeb2] flex items-center justify-center">
          {open ? <ChevronUp size={14} strokeWidth={2.4} /> : <ChevronDown size={14} strokeWidth={2.4} />}
        </span>
      </span>
    </button>
    {open && <div className="p-3 space-y-2.5 bg-white dark:bg-[#1C1C1E]">{children}</div>}
  </section>
);

export interface TaskDetailPageProps {
  taskId: string | "new";
  initialDate?: string;
  parentTaskId?: string;
  onBack: () => void;
}

const getEditorTimeType = (task: Parameters<typeof normalizeTaskTimeType>[0]): TaskTimeType => {
  return normalizeTaskTimeType(task) === "scheduled" ? "scheduled" : "deadline";
};

export const TaskDetailPage: React.FC<TaskDetailPageProps> = ({
  taskId,
  initialDate,
  parentTaskId,
  onBack,
}) => {
  const {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    activeTaskDetailInitialData,
  } = useAppStore();
  const { isMobile, isTablet } = useResponsiveLayout();

  const todayStr = getLocalTodayStr(new Date());

  // Chế độ: "view" (Chỉ xem) hoặc "edit" (Chỉnh sửa)
  const [mode, setMode] = useState<"view" | "edit">(taskId === "new" ? "edit" : "view");

  // Tìm task hiện tại nếu là task có sẵn
  const existingTask = taskId !== "new" ? tasks.find((t) => t.id === taskId) : null;

  // State cục bộ
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(existingTask ? existingTask.id : null);
  const [title, setTitle] = useState(existingTask?.title || activeTaskDetailInitialData?.title || "");
  const [description, setDescription] = useState(existingTask?.description || activeTaskDetailInitialData?.description || "");
  const [completed, setCompleted] = useState(existingTask ? existingTask.completed : false);
  const [dueDate, setDueDate] = useState(existingTask?.dueDate || activeTaskDetailInitialData?.dueDate || initialDate || todayStr);
  const [isDateRange, setIsDateRange] = useState<boolean>(Boolean(existingTask?.startDate && existingTask?.endDate) || Boolean(activeTaskDetailInitialData?.startDate && activeTaskDetailInitialData?.endDate));
  const [startDate, setStartDate] = useState(existingTask?.startDate || activeTaskDetailInitialData?.startDate || existingTask?.dueDate || initialDate || todayStr);
  const [endDate, setEndDate] = useState(existingTask?.endDate || activeTaskDetailInitialData?.endDate || "");
  const [timeType, setTimeType] = useState<TaskTimeType>(
    existingTask ? getEditorTimeType(existingTask) : activeTaskDetailInitialData?.timeType || "deadline",
  );
  const [startTime, setStartTime] = useState(existingTask?.startTime || activeTaskDetailInitialData?.startTime || "");
  const [endTime, setEndTime] = useState(existingTask?.endTime || activeTaskDetailInitialData?.endTime || "");
  const [deadlineTime, setDeadlineTime] = useState(existingTask?.deadlineTime || activeTaskDetailInitialData?.deadlineTime || "");
  const [priority, setPriority] = useState<TaskPriority>(existingTask?.priority || activeTaskDetailInitialData?.priority || "medium");
  const [selectedTags, setSelectedTags] = useState<string[]>(existingTask ? getTaskTags(existingTask) : activeTaskDetailInitialData?.tags || (activeTaskDetailInitialData?.tag ? [activeTaskDetailInitialData.tag] : []));
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [saveStatus, setSaveStatus] = useState<"saved" | "unsaved" | "saving">("saved");
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<TaskEditorSection, boolean>>({
    status: taskId !== "new",
    timing: true,
    organize: false,
    notes: false,
    subtasks: false,
  });

  const titleInputRef = useRef<HTMLInputElement>(null);
  const optionsMenuRef = useRef<HTMLDivElement>(null);

  // Đóng 3-dot dropdown khi click ra ngoài
  useEffect(() => {
    if (!isOptionsMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(e.target as Node)) {
        setIsOptionsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOptionsMenuOpen]);

  // Đồng bộ state khi taskId thay đổi
  useEffect(() => {
    const task = taskId !== "new" ? tasks.find((t) => t.id === taskId) : null;
    setCurrentTaskId(task ? task.id : null);
    setTitle(task?.title || activeTaskDetailInitialData?.title || "");
    setDescription(task?.description || activeTaskDetailInitialData?.description || "");
    setCompleted(task ? task.completed : false);
    const initialDue = task?.dueDate || activeTaskDetailInitialData?.dueDate || initialDate || todayStr;
    setDueDate(initialDue);
    setStartDate(task?.startDate || activeTaskDetailInitialData?.startDate || initialDue);
    setEndDate(task?.endDate || activeTaskDetailInitialData?.endDate || "");
    setIsDateRange(Boolean(task?.startDate && task?.endDate) || Boolean(activeTaskDetailInitialData?.startDate && activeTaskDetailInitialData?.endDate));
    setTimeType(task ? getEditorTimeType(task) : activeTaskDetailInitialData?.timeType || "deadline");
    setStartTime(task?.startTime || activeTaskDetailInitialData?.startTime || "");
    setEndTime(task?.endTime || activeTaskDetailInitialData?.endTime || "");
    setDeadlineTime(task?.deadlineTime || activeTaskDetailInitialData?.deadlineTime || "");
    setPriority(task?.priority || activeTaskDetailInitialData?.priority || "medium");
    setSelectedTags(task ? getTaskTags(task) : activeTaskDetailInitialData?.tags || (activeTaskDetailInitialData?.tag ? [activeTaskDetailInitialData.tag] : []));
    setSaveStatus("saved");
    setIsOptionsMenuOpen(false);
    setMode(taskId === "new" ? "edit" : "view");
    setOpenSections({
      status: taskId !== "new",
      timing: true,
      organize: false,
      notes: false,
      subtasks: false,
    });
  }, [taskId, initialDate, todayStr, activeTaskDetailInitialData]);

  // Autofocus khi ở chế độ edit
  useEffect(() => {
    if (mode === "edit") {
      titleInputRef.current?.focus();
    }
  }, [mode]);

  // Lắng nghe phím ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isOptionsMenuOpen) {
          setIsOptionsMenuOpen(false);
        } else if (mode === "edit" && taskId !== "new") {
          setMode("view");
        } else {
          onBack();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onBack, isOptionsMenuOpen, mode, taskId]);

  // Phân tích trạng thái thời gian theo ngữ cảnh
  const taskForTemporal = existingTask || {
    id: currentTaskId || "temp",
    title,
    dueDate,
    startDate,
    endDate,
    deadlineDate: dueDate,
    timeType,
    startTime,
    endTime,
    deadlineTime,
    completed,
    priority,
  };
  const temporal = getTaskTemporalState(taskForTemporal, new Date());
  const isOverdue = temporal === "overdue" || temporal === "pastScheduled";
  const isDueTodayTask = isTaskDueToday(taskForTemporal);
  const effectiveTime = getTaskEffectiveTime(taskForTemporal);

  const markDraftChanged = () => setSaveStatus("unsaved");

  const toggleSection = (section: TaskEditorSection) => {
    setOpenSections((current) => ({ ...current, [section]: !current[section] }));
  };

  const handleSave = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const { cleanTitle, extractedTags } = extractTagsFromTitle(trimmedTitle);
    const combinedTags = Array.from(new Set([...selectedTags, ...extractedTags]));

    setSaveStatus("saving");
    const taskData = {
      title: cleanTitle || trimmedTitle,
      description: description.trim() || undefined,
      dueDate: isDateRange ? (startDate || dueDate) : (dueDate || undefined),
      startDate: isDateRange ? (startDate || dueDate) : undefined,
      endDate: isDateRange && endDate ? endDate : undefined,
      deadlineDate:
        timeType === "deadline"
          ? isDateRange
            ? endDate || startDate || dueDate || undefined
            : dueDate || undefined
          : undefined,
      timeType,
      startTime: timeType === "scheduled" ? startTime || undefined : undefined,
      endTime: timeType === "scheduled" ? endTime || undefined : undefined,
      deadlineTime: timeType === "deadline" ? deadlineTime || undefined : undefined,
      priority,
      tag: combinedTags[0] || undefined,
      tags: combinedTags.length > 0 ? combinedTags : undefined,
      parentTaskId: parentTaskId || undefined,
    };

    if (!currentTaskId) {
      const created = addTask(taskData);
      setCurrentTaskId(created.id);
    } else {
      updateTask(currentTaskId, taskData);
    }

    setSaveStatus("saved");
    dispatchToast({ message: "Đã lưu thành công" });
  };

  const handleRescheduleToDate = (targetDate: string) => {
    setDueDate(targetDate);
    setStartDate(targetDate);
    if (isDateRange) {
      setEndDate(targetDate);
    }
    if (currentTaskId) {
      updateTask(currentTaskId, {
        dueDate: targetDate,
        startDate: isDateRange ? targetDate : undefined,
        endDate: isDateRange ? targetDate : undefined,
        deadlineDate: timeType === "deadline" ? targetDate : undefined,
      });
    }
    markDraftChanged();
    dispatchToast({ message: `Đã dời sang ${formatDisplayDate(targetDate)}` });
  };

  const handleDuplicateTask = () => {
    addTask({
      title: `${title.trim() || "Công việc"} (Bản sao)`,
      description: description.trim() || undefined,
      dueDate: dueDate || todayStr,
      startDate: isDateRange ? startDate : undefined,
      endDate: isDateRange ? endDate : undefined,
      deadlineDate: timeType === "deadline" ? dueDate : undefined,
      timeType,
      startTime: timeType === "scheduled" ? startTime : undefined,
      endTime: timeType === "scheduled" ? endTime : undefined,
      deadlineTime: timeType === "deadline" ? deadlineTime : undefined,
      priority,
      tag: selectedTags[0] || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
    });
    dispatchToast({ message: "Đã nhân bản công việc" });
    onBack();
  };

  const childSubtasks = currentTaskId ? tasks.filter((t) => t.parentTaskId === currentTaskId) : [];

  const handleAddSubtask = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = newSubtaskTitle.trim();
    if (!trimmed) return;

    let parentId = currentTaskId;
    if (!parentId) {
      const parentCreated = addTask({
        title: title.trim() || "Công việc mới",
        dueDate: dueDate || todayStr,
        timeType,
        priority,
        tag: selectedTags[0] || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
      });
      parentId = parentCreated.id;
      setCurrentTaskId(parentId);
    }

    addTask({
      title: trimmed,
      parentTaskId: parentId,
      dueDate: dueDate || todayStr,
      priority: "medium",
      timeType: "deadline",
    });

    setNewSubtaskTitle("");
  };

  const handleDeleteSelf = () => {
    if (currentTaskId) {
      deleteTask(currentTaskId);
    }
    onBack();
  };

  const handleToggleComplete = () => {
    const nextCompleted = !completed;
    setCompleted(nextCompleted);
    if (currentTaskId) {
      toggleTask(currentTaskId);
    }
  };

  return (
    <div className="task-detail-editor w-full h-full bg-[#FBF9F4] dark:bg-[#121214] text-[#1C1C1E] dark:text-[#F2F2F7] select-none flex flex-col overflow-y-auto">
      {/* 1. TOPBAR */}
      <div className={`shrink-0 z-30 sticky top-0 bg-white/92 dark:bg-[#1C1C1E]/92 backdrop-blur-xl border-b border-[#E5E5EA] dark:border-black px-3 sm:px-4 flex items-center justify-between min-h-[46px] sm:min-h-[48px] ${
        isMobile || isTablet
          ? isNativePlatform()
            ? "pt-10 pb-1.5"
            : "pt-[max(env(safe-area-inset-top),6px)] pb-1.5"
          : "py-1.5"
      }`}>
        {/* Nút Quay lại */}
        {mode === "view" ? (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-[#2C2C2E] hover:bg-[#F2F2F7] dark:hover:bg-[#3A3A3C] border border-[#E5E5EA] dark:border-black text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] shadow-2xs active:scale-95 cursor-pointer transition-all"
          >
            <ArrowLeft size={14} strokeWidth={2.4} />
            <span>Quay lại</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (taskId === "new") {
                onBack();
              } else {
                if (existingTask) {
                  setTitle(existingTask.title);
                  setDescription(existingTask.description || "");
                  setDueDate(existingTask.dueDate || todayStr);
                  setStartDate(existingTask.startDate || existingTask.dueDate || todayStr);
                  setEndDate(existingTask.endDate || "");
                  setTimeType(getEditorTimeType(existingTask));
                  setStartTime(existingTask.startTime || "");
                  setEndTime(existingTask.endTime || "");
                  setDeadlineTime(existingTask.deadlineTime || "");
                  setPriority(existingTask.priority || "medium");
                  setSelectedTags(getTaskTags(existingTask));
                }
                setMode("view");
              }
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-[#2C2C2E] hover:bg-[#F2F2F7] dark:hover:bg-[#3A3A3C] border border-[#E5E5EA] dark:border-black text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] shadow-2xs active:scale-95 cursor-pointer transition-all"
          >
            <ArrowLeft size={14} strokeWidth={2.4} />
            <span>{taskId === "new" ? "Hủy" : "Quay lại"}</span>
          </button>
        )}

        {/* Tiêu đề giữa khi ở chế độ sửa */}
        {mode === "edit" && (
          <span className="text-xs font-bold text-[#1C1C1E] dark:text-[#F2F2F7]">
            {taskId === "new" ? "Tạo việc" : "Chỉnh sửa"}
          </span>
        )}

        {/* Khối bên phải */}
        {mode === "view" ? (
          <div className="relative" ref={optionsMenuRef}>
            <button
              type="button"
              onClick={() => setIsOptionsMenuOpen(!isOptionsMenuOpen)}
              className="w-8 h-8 rounded-lg bg-white dark:bg-[#2C2C2E] hover:bg-[#F2F2F7] dark:hover:bg-[#3A3A3C] border border-[#E5E5EA] dark:border-black text-[#1C1C1E] dark:text-[#F2F2F7] shadow-2xs active:scale-95 cursor-pointer transition-all flex items-center justify-center"
              title="Tùy chọn"
              aria-label="Tùy chọn"
            >
              <MoreVertical size={15} strokeWidth={2.2} />
            </button>

            {/* Popup menu 3 chấm */}
            {isOptionsMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#1C1C1E] rounded-xl border border-[#E5E5EA] dark:border-black shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-150 select-none overflow-hidden">
                {/* Header trạng thái */}
                <div className="px-3 py-1 border-b border-[#E5E5EA] dark:border-black/50 bg-black/[0.02] dark:bg-white/[0.03]">
                  <span className={`text-[10px] font-bold ${
                    isOverdue
                      ? "text-[#BE123C] dark:text-rose-400"
                      : isDueTodayTask
                      ? "text-[#1D4ED8] dark:text-blue-300"
                      : "text-[#8E8E93] dark:text-[#aeaeb2]"
                  }`}>
                    {isOverdue ? "Quá hạn" : isDueTodayTask ? "Hôm nay" : "Sắp tới"}
                  </span>
                </div>

                {/* Sửa */}
                <button
                  type="button"
                  onClick={() => {
                    setIsOptionsMenuOpen(false);
                    setMode("edit");
                  }}
                  className="w-full px-3 py-1.5 text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.08] flex items-center gap-2 transition-colors cursor-pointer text-left"
                >
                  <Edit3 size={13} className="text-[#8E8E93]" />
                  <span>Chỉnh sửa</span>
                </button>

                <div className="my-0.5 border-t border-[#E5E5EA] dark:border-black/40" />

                {/* Dời ngày */}
                {isOverdue ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOptionsMenuOpen(false);
                        handleRescheduleToDate(todayStr);
                      }}
                      className="w-full px-3 py-1.5 text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.08] flex items-center gap-2 transition-colors cursor-pointer text-left"
                    >
                      <Calendar size={13} className="text-[#8E8E93]" />
                      <span>Dời sang Hôm nay</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOptionsMenuOpen(false);
                        handleRescheduleToDate(getLocalTomorrowStr());
                      }}
                      className="w-full px-3 py-1.5 text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.08] flex items-center gap-2 transition-colors cursor-pointer text-left"
                    >
                      <ArrowRight size={13} className="text-[#8E8E93]" />
                      <span>Dời sang Ngày mai</span>
                    </button>
                  </>
                ) : isDueTodayTask ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOptionsMenuOpen(false);
                      handleRescheduleToDate(getLocalTomorrowStr());
                    }}
                    className="w-full px-3 py-1.5 text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.08] flex items-center gap-2 transition-colors cursor-pointer text-left"
                  >
                    <ArrowRight size={13} className="text-[#8E8E93]" />
                    <span>Dời sang Ngày mai</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOptionsMenuOpen(false);
                        handleRescheduleToDate(todayStr);
                      }}
                      className="w-full px-3 py-1.5 text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.08] flex items-center gap-2 transition-colors cursor-pointer text-left"
                    >
                      <Calendar size={13} className="text-[#8E8E93]" />
                      <span>Dời sang Hôm nay</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOptionsMenuOpen(false);
                        handleRescheduleToDate(getLocalTomorrowStr());
                      }}
                      className="w-full px-3 py-1.5 text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.08] flex items-center gap-2 transition-colors cursor-pointer text-left"
                    >
                      <ArrowRight size={13} className="text-[#8E8E93]" />
                      <span>Dời sang Ngày mai</span>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsOptionsMenuOpen(false);
                    setIsRescheduleModalOpen(true);
                  }}
                  className="w-full px-3 py-1.5 text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.08] flex items-center gap-2 transition-colors cursor-pointer text-left"
                >
                  <CalendarPlus size={13} className="text-[#8E8E93]" />
                  <span>Chọn ngày khác...</span>
                </button>

                <div className="my-0.5 border-t border-[#E5E5EA] dark:border-black/40" />

                {/* Đổi trạng thái */}
                <button
                  type="button"
                  onClick={() => {
                    setIsOptionsMenuOpen(false);
                    handleToggleComplete();
                  }}
                  className="w-full px-3 py-1.5 text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.08] flex items-center gap-2 transition-colors cursor-pointer text-left"
                >
                  <CheckSquare size={13} className="text-[#8E8E93]" />
                  <span>{completed ? "Đánh dấu chưa xong" : "Đánh dấu đã xong"}</span>
                </button>

                {/* Nhân bản */}
                <button
                  type="button"
                  onClick={() => {
                    setIsOptionsMenuOpen(false);
                    handleDuplicateTask();
                  }}
                  className="w-full px-3 py-1.5 text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.08] flex items-center gap-2 transition-colors cursor-pointer text-left"
                >
                  <Copy size={13} className="text-[#8E8E93]" />
                  <span>Nhân bản việc</span>
                </button>

                <div className="my-0.5 border-t border-[#E5E5EA] dark:border-black/40" />

                {/* Xóa */}
                <button
                  type="button"
                  onClick={() => {
                    setIsOptionsMenuOpen(false);
                    handleDeleteSelf();
                  }}
                  className="w-full px-3 py-1.5 text-xs font-semibold text-[#FF3B30] dark:text-[#FF453A] hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 transition-colors cursor-pointer text-left"
                >
                  <Trash2 size={13} className="text-[#FF3B30] dark:text-[#FF453A]" />
                  <span>Xóa việc</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              handleSave();
              if (taskId !== "new") {
                setMode("view");
              } else {
                onBack();
              }
            }}
            disabled={!title.trim()}
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] text-xs font-bold active:scale-95 transition-all shadow-2xs cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Check size={14} strokeWidth={2.4} />
            <span>Lưu</span>
          </button>
        )}
      </div>

      {/* 2. BODY */}
      {mode === "view" ? (
        /* ================= CHẾ ĐỘ XEM (VIEW) ================= */
        <div className="flex-1 w-full px-3 py-2.5 sm:px-5 sm:py-3.5 pb-16 space-y-2.5 max-w-xl mx-auto">
          {/* Trạng thái & Ưu tiên */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`px-1.5 py-0.25 rounded text-[11px] font-bold border ${
              completed
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                : "bg-black/[0.04] dark:bg-white/[0.06] text-[#1C1C1E] dark:text-[#F2F2F7] border-[#E5E5EA] dark:border-black"
            }`}>
              {completed ? "Đã xong" : "Cần làm"}
            </span>

            {isOverdue && !completed && (
              <span className="px-1.5 py-0.25 rounded bg-rose-500/10 text-[#FF3B30] dark:text-[#FF453A] border border-rose-500/20 text-[11px] font-bold">
                Quá hạn
              </span>
            )}

            {isDueTodayTask && !completed && !isOverdue && (
              <span className="px-1.5 py-0.25 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[11px] font-bold">
                Hôm nay
              </span>
            )}

            {priority === "high" && (
              <span className="px-1.5 py-0.25 rounded bg-[#FFE4E6] dark:bg-rose-950/40 text-[#BE123C] dark:text-rose-400 border border-[#FDA4AF] dark:border-rose-900/40 text-[11px] font-bold">
                Gấp
              </span>
            )}
          </div>

          {/* Tiêu đề */}
          <div className="pt-0.5 pb-1.5 border-b border-[#E5E5EA] dark:border-[#2C2C2E]">
            <h1 className={`text-base sm:text-lg font-bold tracking-tight leading-snug break-words ${
              completed ? "line-through text-[#8E8E93] dark:text-[#aeaeb2] opacity-75" : "text-[#1C1C1E] dark:text-[#F2F2F7]"
            }`}>
              {title || "Chưa đặt tiêu đề"}
            </h1>
          </div>

          {/* Khối Thông tin Tinh Gọn (Thời gian & Nhãn) */}
          <div className="p-2.5 rounded-xl bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-black space-y-1.5 shadow-2xs text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[#8E8E93] dark:text-[#aeaeb2] font-medium text-[11px]">Thời gian:</span>
              <span className="font-bold text-[#1C1C1E] dark:text-[#F2F2F7] text-right">
                {isDateRange && startDate && endDate
                  ? `${formatShortDayMonth(startDate)} → ${formatShortDayMonth(endDate)}`
                  : dueDate
                  ? formatFullDate(dueDate)
                  : "Chưa đặt ngày"}
                {effectiveTime ? ` · ${timeType === "scheduled" ? `${startTime}${endTime ? `-${endTime}` : ""}` : effectiveTime}` : ""}
              </span>
            </div>

            {selectedTags.length > 0 && (
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#E5E5EA]/60 dark:border-black/60">
                <span className="text-[#8E8E93] dark:text-[#aeaeb2] font-medium text-[11px]">Nhãn:</span>
                <div className="flex flex-wrap gap-1 justify-end">
                  {selectedTags.map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.25 rounded bg-black/[0.04] dark:bg-white/[0.06] text-[11px] font-semibold text-[#1C1C1E] dark:text-[#F2F2F7]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Ghi chú */}
          {description && (
            <div className="p-2.5 rounded-xl bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-black space-y-1 shadow-2xs">
              <span className="text-[11px] font-bold text-[#8E8E93] dark:text-[#aeaeb2]">Ghi chú</span>
              <p className="text-xs text-[#1C1C1E] dark:text-[#F2F2F7] whitespace-pre-wrap leading-relaxed">
                {description}
              </p>
            </div>
          )}

          {/* Việc con */}
          {childSubtasks.length > 0 && (
            <div className="p-2.5 rounded-xl bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-black space-y-1.5 shadow-2xs">
              <span className="text-[11px] font-bold text-[#8E8E93] dark:text-[#aeaeb2]">
                Việc con ({childSubtasks.filter((c) => c.completed).length}/{childSubtasks.length})
              </span>
              <div className="space-y-1">
                {childSubtasks.map((child) => (
                  <div
                    key={child.id}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-[#E5E5EA] dark:border-black"
                  >
                    <HandDrawnCheckbox
                      checked={child.completed}
                      onChange={() => toggleTask(child.id)}
                    />
                    <span className={`text-xs font-medium ${
                      child.completed ? "line-through text-[#8E8E93] dark:text-[#aeaeb2]" : "text-[#1C1C1E] dark:text-[#F2F2F7]"
                    }`}>
                      {child.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nút Chỉnh sửa */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setMode("edit")}
              className="w-full py-2 px-3 rounded-xl bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] text-xs font-bold active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Edit3 size={13} strokeWidth={2.2} />
              <span>Chỉnh sửa</span>
            </button>
          </div>
        </div>
      ) : (
        /* ================= CHẾ ĐỘ SỬA (EDIT) ================= */
        <div className="flex-1 w-full px-3 py-2.5 sm:px-5 sm:py-3.5 pb-16 space-y-2 max-w-xl mx-auto">
          {/* Tiêu đề input */}
          <div className="space-y-0.5 pb-1.5 border-b border-[#E5E5EA] dark:border-[#2C2C2E]">
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => {
                const nextVal = e.target.value;
                setTitle(nextVal);
                markDraftChanged();
              }}
              placeholder="Tên công việc..."
              className="w-full bg-transparent px-1 py-0.5 text-base sm:text-lg font-bold text-[#1C1C1E] dark:text-[#F2F2F7] placeholder:text-[#8E8E93] focus:outline-none tracking-tight leading-snug rounded-none"
            />
          </div>

          {/* Mục 1: Trạng thái */}
          {taskId !== "new" && (
            <CollapsibleTaskSection
              title="Trạng thái"
              open={openSections.status}
              onToggle={() => toggleSection("status")}
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (completed) handleToggleComplete();
                  }}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                    !completed
                      ? "bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] border-transparent shadow-2xs"
                      : "bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#8E8E93] dark:text-[#aeaeb2] border-transparent hover:bg-[#E5E5EA] dark:hover:bg-[#3A3A3C]"
                  }`}
                >
                  <Circle size={13} strokeWidth={2.4} />
                  <span>Cần làm</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!completed) handleToggleComplete();
                  }}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                    completed
                      ? "bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] border-transparent shadow-2xs"
                      : "bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#8E8E93] dark:text-[#aeaeb2] border-transparent hover:bg-[#E5E5EA] dark:hover:bg-[#3A3A3C]"
                  }`}
                >
                  <CheckCircle2 size={13} strokeWidth={2.4} />
                  <span>Đã xong</span>
                </button>
              </div>
            </CollapsibleTaskSection>
          )}

          {/* Mục 2: Thời gian */}
          <CollapsibleTaskSection
            title="Thời gian"
            open={openSections.timing}
            onToggle={() => toggleSection("timing")}
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-[#E5E5EA] dark:border-[#2C2C2E] text-xs">
              <span className="font-medium text-[#8E8E93] dark:text-[#aeaeb2] text-[11px]">Kiểu ngày:</span>
              <div className="flex items-center gap-1 bg-[#F2F2F7] dark:bg-[#2C2C2E] p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setIsDateRange(false);
                    setEndDate("");
                    markDraftChanged();
                  }}
                  className={`px-2.5 py-0.5 rounded font-semibold text-[11px] transition-all cursor-pointer active:scale-95 ${
                    !isDateRange
                      ? "bg-white dark:bg-[#1C1C1E] text-[#1C1C1E] dark:text-white shadow-2xs"
                      : "text-[#8E8E93] dark:text-[#aeaeb2] hover:text-[#1C1C1E] dark:hover:text-white"
                  }`}
                >
                  Trong ngày
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsDateRange(true);
                    if (!endDate) {
                      const startVal = startDate || dueDate || todayStr;
                      setStartDate(startVal);
                      const d = new Date(startVal);
                      d.setDate(d.getDate() + 2);
                      setEndDate(d.toISOString().split("T")[0]);
                    }
                    markDraftChanged();
                  }}
                  className={`px-2.5 py-0.5 rounded font-semibold text-[11px] transition-all cursor-pointer active:scale-95 ${
                    isDateRange
                      ? "bg-white dark:bg-[#1C1C1E] text-[#1C1C1E] dark:text-white shadow-2xs"
                      : "text-[#8E8E93] dark:text-[#aeaeb2] hover:text-[#1C1C1E] dark:hover:text-white"
                  }`}
                >
                  Khoảng ngày
                </button>
              </div>
            </div>

            {!isDateRange ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#8E8E93] dark:text-[#aeaeb2]">
                    Ngày:
                  </label>
                  <DatePickerPopover
                    value={dueDate}
                    onChange={(val) => {
                      setDueDate(val);
                      markDraftChanged();
                    }}
                    placeholder="Chọn ngày"
                    className="w-full"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#8E8E93] dark:text-[#aeaeb2]">
                    Giờ:
                  </label>
                  {timeType === "scheduled" ? (
                    <div className="flex items-center gap-1.5">
                      <TimePickerPopover
                        value={startTime}
                        onChange={(val) => {
                          setStartTime(val);
                          markDraftChanged();
                        }}
                        placeholder="Bắt đầu"
                        className="flex-1 min-w-0"
                      />
                      <span className="text-xs font-mono font-medium text-[#8E8E93]">-</span>
                      <TimePickerPopover
                        value={endTime}
                        onChange={(val) => {
                          setEndTime(val);
                          markDraftChanged();
                        }}
                        placeholder="Kết thúc"
                        align="right"
                        className="flex-1 min-w-0"
                      />
                    </div>
                  ) : (
                    <TimePickerPopover
                      value={deadlineTime}
                      onChange={(val) => {
                        setDeadlineTime(val);
                        markDraftChanged();
                      }}
                      placeholder="Cả ngày"
                      align="right"
                      className="w-full"
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#8E8E93] dark:text-[#aeaeb2]">
                      Từ ngày:
                    </label>
                    <DatePickerPopover
                      value={startDate || dueDate}
                      onChange={(val) => {
                        setStartDate(val);
                        setDueDate(val);
                        markDraftChanged();
                      }}
                      placeholder="Ngày bắt đầu"
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#8E8E93] dark:text-[#aeaeb2]">
                      Đến ngày:
                    </label>
                    <DatePickerPopover
                      value={endDate}
                      onChange={(val) => {
                        setEndDate(val);
                        markDraftChanged();
                      }}
                      placeholder="Ngày kết thúc"
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#8E8E93] dark:text-[#aeaeb2]">
                    {timeType === "deadline" ? "Hạn chót:" : "Khung giờ:"}
                  </label>
                  {timeType === "scheduled" ? (
                    <div className="flex items-center gap-1.5">
                      <TimePickerPopover
                        value={startTime}
                        onChange={(val) => {
                          setStartTime(val);
                          markDraftChanged();
                        }}
                        placeholder="Bắt đầu"
                        className="flex-1 min-w-0"
                      />
                      <span className="text-xs font-mono font-medium text-[#8E8E93]">-</span>
                      <TimePickerPopover
                        value={endTime}
                        onChange={(val) => {
                          setEndTime(val);
                          markDraftChanged();
                        }}
                        placeholder="Kết thúc"
                        align="right"
                        className="flex-1 min-w-0"
                      />
                    </div>
                  ) : (
                    <TimePickerPopover
                      value={deadlineTime}
                      onChange={(val) => {
                        setDeadlineTime(val);
                        markDraftChanged();
                      }}
                      placeholder="Cả ngày"
                      align="right"
                      className="w-full"
                    />
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1.5 border-t border-[#E5E5EA] dark:border-[#2C2C2E] text-xs">
              <span className="text-[11px] font-medium text-[#8E8E93] dark:text-[#aeaeb2]">Loại:</span>
              <div className="flex items-center gap-1 bg-[#F2F2F7] dark:bg-[#2C2C2E] p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setTimeType("deadline");
                    markDraftChanged();
                  }}
                  className={`px-2.5 py-0.5 rounded font-semibold text-[11px] cursor-pointer active:scale-95 transition-all ${
                    timeType === "deadline"
                      ? "bg-white dark:bg-[#1C1C1E] text-[#1C1C1E] dark:text-white shadow-2xs"
                      : "text-[#8E8E93] dark:text-[#aeaeb2] hover:text-[#1C1C1E] dark:hover:text-white"
                  }`}
                >
                  Hạn chót
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTimeType("scheduled");
                    markDraftChanged();
                  }}
                  className={`px-2.5 py-0.5 rounded font-semibold text-[11px] cursor-pointer active:scale-95 transition-all ${
                    timeType === "scheduled"
                      ? "bg-white dark:bg-[#1C1C1E] text-[#1C1C1E] dark:text-white shadow-2xs"
                      : "text-[#8E8E93] dark:text-[#aeaeb2] hover:text-[#1C1C1E] dark:hover:text-white"
                  }`}
                >
                  Lịch hẹn
                </button>
              </div>
            </div>
          </CollapsibleTaskSection>

          {/* Mục 3: Phân loại */}
          <CollapsibleTaskSection
            title="Phân loại"
            open={openSections.organize}
            onToggle={() => toggleSection("organize")}
          >
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-[11px] text-[#8E8E93] dark:text-[#aeaeb2] shrink-0">
                  Ưu tiên:
                </span>
                <div className="flex items-center gap-1">
                  {[
                    { key: "high", label: "Gấp", sym: "●" },
                    { key: "medium", label: "Vừa", sym: "◐" },
                    { key: "low", label: "Thấp", sym: "○" },
                  ].map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => {
                        const nextP = p.key as TaskPriority;
                        setPriority(nextP);
                        markDraftChanged();
                      }}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all active:scale-95 ${
                        priority === p.key
                          ? "bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] border-transparent shadow-2xs"
                          : "bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#8E8E93] dark:text-[#aeaeb2] border-transparent hover:bg-[#E5E5EA] dark:hover:bg-[#3A3A3C]"
                      }`}
                    >
                      <span className="font-mono text-[10px]">{p.sym}</span>
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-1.5 border-t border-[#E5E5EA] dark:border-[#2C2C2E] space-y-1">
                <span className="font-medium text-[11px] text-[#8E8E93] dark:text-[#aeaeb2]">
                  Nhãn:
                </span>
                <TagInputSelector
                  selectedTags={selectedTags}
                  onChange={(newTags) => {
                    setSelectedTags(newTags);
                    markDraftChanged();
                  }}
                  placeholder="Thêm nhãn (vd: CongViec, Gap...)"
                />
              </div>
            </div>
          </CollapsibleTaskSection>

          {/* Mục 4: Ghi chú */}
          <CollapsibleTaskSection
            title="Ghi chú"
            open={openSections.notes}
            onToggle={() => toggleSection("notes")}
          >
            <textarea
              rows={2}
              value={description}
              onChange={(e) => {
                const nextVal = e.target.value;
                setDescription(nextVal);
                markDraftChanged();
              }}
              placeholder="Thêm ghi chú..."
              className="w-full p-2.5 bg-[#F2F2F7]/50 dark:bg-[#2C2C2E]/50 border border-[#E5E5EA] dark:border-[#2C2C2E] rounded-lg text-xs font-normal text-[#1C1C1E] dark:text-[#F2F2F7] placeholder:text-[#8E8E93] focus:outline-none focus:border-[#1C1C1E] dark:focus:border-white focus:bg-white dark:focus:bg-[#1C1C1E] resize-none transition-all min-h-[60px]"
            />
          </CollapsibleTaskSection>

          {/* Mục 5: Việc con */}
          <CollapsibleTaskSection
            title={`Việc con (${childSubtasks.filter((c) => c.completed).length}/${childSubtasks.length})`}
            open={openSections.subtasks}
            onToggle={() => toggleSection("subtasks")}
          >
            <div className="space-y-1">
              {childSubtasks.map((child) => (
                <div
                  key={child.id}
                  className="flex items-center justify-between gap-2 px-2.5 py-1 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-lg border border-transparent"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <HandDrawnCheckbox
                      checked={child.completed}
                      onChange={() => toggleTask(child.id)}
                    />
                    <span
                      className={`text-xs font-medium truncate ${
                        child.completed ? "line-through text-[#8E8E93] dark:text-[#aeaeb2] opacity-70" : "text-[#1C1C1E] dark:text-[#F2F2F7]"
                      }`}
                    >
                      {child.title}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteTask(child.id)}
                    className="p-1 text-[#8E8E93] hover:text-rose-600 rounded-lg cursor-pointer transition-colors"
                    title="Xóa việc con"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddSubtask} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="+ Thêm việc con..."
                className="flex-1 px-2.5 py-1.5 rounded-lg border border-[#E5E5EA] dark:border-[#2C2C2E] bg-white dark:bg-[#1C1C1E] text-xs font-medium focus:outline-none focus:border-[#1C1C1E] dark:focus:border-white transition-colors"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] rounded-lg text-xs font-bold active:scale-95 transition-all shadow-2xs cursor-pointer"
              >
                Thêm
              </button>
            </form>
          </CollapsibleTaskSection>
        </div>
      )}

      {/* Reschedule Date Modal */}
      {isRescheduleModalOpen && (
        <RescheduleDateModal
          isOpen={isRescheduleModalOpen}
          taskCount={1}
          taskTitle={title}
          initialDate={dueDate}
          onClose={() => setIsRescheduleModalOpen(false)}
          onConfirm={(newDate) => {
            handleRescheduleToDate(newDate);
            setIsRescheduleModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

