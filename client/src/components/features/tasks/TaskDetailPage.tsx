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
  Clock,
  Tag as TagIcon,
  Check,
  Sparkles,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Edit3,
  Copy,
  ArrowRight,
  CheckSquare,
  AlertTriangle,
  CalendarPlus,
  FileText,
  ListTodo,
} from "lucide-react";

type TaskEditorSection = "status" | "timing" | "organize" | "notes" | "subtasks";

interface CollapsibleTaskSectionProps {
  title: string;
  icon?: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}

const CollapsibleTaskSection: React.FC<CollapsibleTaskSectionProps> = ({
  title,
  icon,
  open,
  onToggle,
  trailing,
  children,
}) => (
  <section className="bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-[#2C2C2E] rounded-2xl shadow-xs overflow-hidden transition-all">
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className={`w-full min-h-[44px] px-4 py-3 flex items-center justify-between gap-2 text-left cursor-pointer transition-colors ${
        open
          ? "bg-[#F2F2F7] dark:bg-[#2C2C2E]/60 border-b border-[#E5E5EA] dark:border-[#2C2C2E] text-[#1C1C1E] dark:text-[#F2F2F7]"
          : "bg-white dark:bg-[#1C1C1E] hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E] text-[#1C1C1E] dark:text-[#F2F2F7]"
      } focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[#1C1C1E] dark:focus-visible:ring-white`}
    >
      <span className="task-detail-section-title text-sm sm:text-[15px] font-bold text-[#1C1C1E] dark:text-[#F2F2F7] flex items-center gap-2.5">
        <span className="w-6 h-6 rounded-lg bg-black/5 dark:bg-white/10 text-[#1C1C1E] dark:text-[#F2F2F7] flex items-center justify-center shrink-0">
          {icon}
        </span>
        <span>{title}</span>
      </span>
      <span className="flex items-center gap-2 shrink-0">
        {trailing}
        <span className="text-[#8E8E93] dark:text-[#aeaeb2] flex items-center justify-center">
          {open ? <ChevronUp size={16} strokeWidth={2.4} /> : <ChevronDown size={16} strokeWidth={2.4} />}
        </span>
      </span>
    </button>
    {open && <div className="p-4 space-y-4 bg-white dark:bg-[#1C1C1E]">{children}</div>}
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

  // State cục bộ (được khởi tạo từ task có sẵn hoặc tạo mới)
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

  // Đồng bộ state khi taskId thay đổi (người dùng bấm task khác trên danh sách)
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

  // Autofocus vào tiêu đề khi ở chế độ edit
  useEffect(() => {
    if (mode === "edit") {
      titleInputRef.current?.focus();
    }
  }, [mode]);

  // Lắng nghe phím ESC để quay lại hoặc chuyển mode
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

  // Phân tích trạng thái thời gian theo ngữ cảnh (Quá hạn vs Hôm nay vs Tương lai)
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

  // Task detail giữ draft cục bộ; chỉ ghi vào store khi người dùng bấm Lưu.
  const markDraftChanged = () => setSaveStatus("unsaved");

  const toggleSection = (section: TaskEditorSection) => {
    setOpenSections((current) => ({ ...current, [section]: !current[section] }));
  };

  const handleSave = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    // Bóc tách tự động nếu người dùng gõ #tag trong tiêu đề
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
    dispatchToast({ message: "Đã lưu thay đổi thành công!" });
  };

  // Quick Reschedule to a date
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
    dispatchToast({ message: `Đã dời công việc sang ${formatDisplayDate(targetDate)}` });
  };

  // Duplicate task
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
    dispatchToast({ message: "Đã nhân bản công việc thành công!" });
    onBack();
  };

  // Danh sách việc con (Subtasks) của task này
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
      {/* ========================================================================= */}
      {/* 1. TOPBAR: CHẾ ĐỘ XEM (VIEW) vs CHẾ ĐỘ SỬA (EDIT) */}
      {/* ========================================================================= */}
      <div className={`shrink-0 z-30 sticky top-0 bg-white/92 dark:bg-[#1C1C1E]/92 backdrop-blur-xl border-b border-[#E5E5EA] dark:border-[#2C2C2E] px-3.5 sm:px-5 flex items-center justify-between min-h-[56px] sm:min-h-[60px] ${
        isMobile || isTablet
          ? isNativePlatform()
            ? "pt-11 pb-2.5"
            : "pt-[max(env(safe-area-inset-top),10px)] pb-2.5"
          : "py-2.5"
      }`}>
        {/* NÚT QUAY LẠI / TRỞ VỀ XEM */}
        {mode === "view" ? (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#2C2C2E] hover:bg-[#F2F2F7] dark:hover:bg-[#3A3A3C] border border-[#E5E5EA] dark:border-[#2C2C2E] text-xs sm:text-sm font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] shadow-sm active:scale-95 cursor-pointer transition-all"
          >
            <ArrowLeft size={16} strokeWidth={2.4} />
            <span>Quay lại</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (taskId === "new") {
                onBack();
              } else {
                // Khôi phục lại dữ liệu gốc nếu hủy sửa và quay về tab xem
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#2C2C2E] hover:bg-[#F2F2F7] dark:hover:bg-[#3A3A3C] border border-[#E5E5EA] dark:border-[#2C2C2E] text-xs sm:text-sm font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] shadow-sm active:scale-95 cursor-pointer transition-all"
          >
            <ArrowLeft size={16} strokeWidth={2.4} />
            <span>{taskId === "new" ? "Quay lại" : "Trở về xem"}</span>
          </button>
        )}

        {/* TIÊU ĐỀ CHÍNH GIỮA (NẾU ĐANG Ở CHẾ ĐỘ SỬA) */}
        {mode === "edit" && (
          <h3 className="text-xs sm:text-sm font-bold text-[#1C1C1E] dark:text-[#F2F2F7]">
            {taskId === "new" ? "Tạo công việc mới" : "Chỉnh sửa công việc"}
          </h3>
        )}

        {/* KHỐI NÚT BÊN PHẢI */}
        {mode === "view" ? (
          /* TRONG CHẾ ĐỘ XEM: CHỈ HIỂN THỊ NÚT 3 CHẤM (OPTIONS MENU) */
          <div className="relative" ref={optionsMenuRef}>
            <button
              type="button"
              onClick={() => setIsOptionsMenuOpen(!isOptionsMenuOpen)}
              className="w-9 h-9 rounded-xl bg-white dark:bg-[#2C2C2E] hover:bg-[#F2F2F7] dark:hover:bg-[#3A3A3C] border border-[#E5E5EA] dark:border-[#2C2C2E] text-[#1C1C1E] dark:text-[#F2F2F7] shadow-sm active:scale-95 cursor-pointer transition-all flex items-center justify-center"
              title="Tùy chọn công việc"
              aria-label="Tùy chọn công việc"
            >
              <MoreVertical size={16} strokeWidth={2.2} />
            </button>

            {/* POPUP MENU 3 CHẤM (PHÂN BIỆT RÕ QUÁ HẠN VS HIỆN TẠI/TƯƠNG LAI) */}
            {isOptionsMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-60 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-[#E5E5EA] dark:border-black shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 select-none overflow-hidden">
                {/* 1. Header Phân Biệt Ngữ Cảnh Thời Gian */}
                <div className="px-3.5 py-2 border-b border-[#E5E5EA] dark:border-black/50 bg-black/[0.02] dark:bg-white/[0.03]">
                  <div className="flex items-center gap-1.5">
                    {isOverdue ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FFE4E6] dark:bg-rose-950/50 text-[#BE123C] dark:text-rose-400 font-bold text-[10px]">
                        <AlertTriangle size={11} strokeWidth={2.4} />
                        <span>Công việc Quá hạn</span>
                      </span>
                    ) : isDueTodayTask ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#DBEAFE] dark:bg-blue-950/50 text-[#1D4ED8] dark:text-blue-300 font-bold text-[10px]">
                        <Clock size={11} strokeWidth={2.4} />
                        <span>Hạn hôm nay</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/[0.04] dark:bg-white/[0.08] text-[#1C1C1E] dark:text-[#F2F2F7] font-semibold text-[10px]">
                        <Calendar size={11} strokeWidth={2.2} />
                        <span>Kế hoạch tương lai</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. Chuyển sang Chế Độ Chỉnh Sửa (Edit Mode) */}
                <button
                  type="button"
                  onClick={() => {
                    setIsOptionsMenuOpen(false);
                    setMode("edit");
                  }}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.08] flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                >
                  <Edit3 size={15} strokeWidth={2.2} className="text-[#8E8E93]" />
                  <span>Chỉnh sửa công việc</span>
                </button>

                <div className="my-1 border-t border-[#E5E5EA] dark:border-black/40" />

                {/* 3. Thao Tác Dời Ngày Theo Ngữ Cảnh */}
                {isOverdue ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOptionsMenuOpen(false);
                        handleRescheduleToDate(todayStr);
                      }}
                      className="w-full px-3.5 py-2.5 text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.08] flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                    >
                      <Calendar size={15} strokeWidth={2.2} className="text-[#8E8E93]" />
                      <span>Dời sang Hôm nay (Khắc phục)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsOptionsMenuOpen(false);
                        const tomorrow = getLocalTomorrowStr();
                        handleRescheduleToDate(tomorrow);
                      }}
                      className="w-full px-3.5 py-2.5 text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.08] flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                    >
                      <ArrowRight size={15} strokeWidth={2.2} className="text-[#8E8E93]" />
                      <span>Dời sang Ngày mai</span>
                    </button>
                  </>
                ) : isDueTodayTask ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOptionsMenuOpen(false);
                      const tomorrow = getLocalTomorrowStr();
                      handleRescheduleToDate(tomorrow);
                    }}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.08] flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                  >
                    <ArrowRight size={15} strokeWidth={2.2} className="text-[#8E8E93]" />
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
                      className="w-full px-3.5 py-2.5 text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.08] flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                    >
                      <Calendar size={15} strokeWidth={2.2} className="text-[#8E8E93]" />
                      <span>Đẩy sớm: Dời về Hôm nay</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsOptionsMenuOpen(false);
                        const tomorrow = getLocalTomorrowStr();
                        handleRescheduleToDate(tomorrow);
                      }}
                      className="w-full px-3.5 py-2.5 text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.08] flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                    >
                      <ArrowRight size={15} strokeWidth={2.2} className="text-[#8E8E93]" />
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
                  className="w-full px-3.5 py-2.5 text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.08] flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                >
                  <CalendarPlus size={15} strokeWidth={2.2} className="text-[#8E8E93]" />
                  <span>Chọn ngày khác...</span>
                </button>

                <div className="my-1 border-t border-[#E5E5EA] dark:border-black/40" />

                {/* 4. Đổi trạng thái Hoàn thành / Cần làm */}
                <button
                  type="button"
                  onClick={() => {
                    setIsOptionsMenuOpen(false);
                    handleToggleComplete();
                  }}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.08] flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                >
                  <CheckSquare size={15} strokeWidth={2.2} className="text-[#8E8E93]" />
                  <span>{completed ? "Đánh dấu Chưa xong" : "Đánh dấu Đã xong"}</span>
                </button>

                {/* 5. Nhân bản công việc */}
                <button
                  type="button"
                  onClick={() => {
                    setIsOptionsMenuOpen(false);
                    handleDuplicateTask();
                  }}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.08] flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                >
                  <Copy size={15} strokeWidth={2.2} className="text-[#8E8E93]" />
                  <span>Nhân bản công việc</span>
                </button>

                <div className="my-1 border-t border-[#E5E5EA] dark:border-black/40" />

                {/* 6. Xóa công việc */}
                <button
                  type="button"
                  onClick={() => {
                    setIsOptionsMenuOpen(false);
                    handleDeleteSelf();
                  }}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold text-[#FF3B30] dark:text-[#FF453A] hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                >
                  <Trash2 size={15} strokeWidth={2.2} className="text-[#FF3B30] dark:text-[#FF453A]" />
                  <span>Xóa công việc</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* TRONG CHẾ ĐỘ SỬA: CHỈ HIỂN THỊ NÚT LƯU */
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] text-xs sm:text-sm font-bold active:scale-95 transition-all shadow-xs cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Check size={16} strokeWidth={2.4} />
            <span>Lưu</span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. NỘI DUNG CHÍNH (CHẾ ĐỘ XEM vs CHẾ ĐỘ CHỈNH SỬA) */}
      {/* ========================================================================= */}
      {mode === "view" ? (
        /* ----------------------------------------------------------------------- */
        /* CHẾ ĐỘ XEM (VIEW MODE - CHỈ XEM, BỐ CỤC ĐƠN SẮC TRANG NHÃ) */
        /* ----------------------------------------------------------------------- */
        <div className="flex-1 w-full px-3.5 py-4 sm:px-6 sm:py-6 pb-28 space-y-4 max-w-2xl mx-auto">
          {/* 1. Trạng Thái & Cảnh Báo Quá Hạn */}
          <div className="flex items-center gap-2 flex-wrap">
            {completed ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                <CheckCircle2 size={14} strokeWidth={2.4} />
                <span>Đã hoàn thành</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] text-[#1C1C1E] dark:text-[#F2F2F7] border border-[#E5E5EA] dark:border-black text-xs font-bold">
                <Circle size={14} strokeWidth={2.4} />
                <span>Đang thực hiện</span>
              </span>
            )}

            {isOverdue && !completed && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 text-[#FF3B30] dark:text-[#FF453A] border border-rose-500/20 text-xs font-bold">
                <AlertTriangle size={13} strokeWidth={2.2} />
                <span>Quá hạn</span>
              </span>
            )}

            {isDueTodayTask && !completed && !isOverdue && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-bold">
                <Clock size={13} strokeWidth={2.2} />
                <span>Đến hạn hôm nay</span>
              </span>
            )}

            {priority === "high" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FFE4E6] dark:bg-rose-950/40 text-[#BE123C] dark:text-rose-400 border border-[#FDA4AF] dark:border-rose-900/40 text-xs font-bold">
                🔴 Ưu tiên gấp
              </span>
            )}
          </div>

          {/* 2. Tiêu Đề Task Lớn */}
          <div className="pt-1 pb-3 border-b border-[#E5E5EA] dark:border-[#2C2C2E]">
            <h1 className={`text-xl sm:text-2xl font-bold tracking-tight leading-snug break-words ${
              completed ? "line-through text-[#8E8E93] dark:text-[#aeaeb2] opacity-75" : "text-[#1C1C1E] dark:text-[#F2F2F7]"
            }`}>
              {title || "Chưa đặt tiêu đề"}
            </h1>
          </div>

          {/* 3. Thẻ Thông Tin Chi Tiết (Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Card Thời Gian */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-black space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs font-medium text-[#8E8E93] dark:text-[#aeaeb2]">
                <Calendar size={13} strokeWidth={2.2} />
                <span>Thời gian & Hạn định</span>
              </div>
              <p className="text-sm font-bold text-[#1C1C1E] dark:text-[#F2F2F7]">
                {isDateRange && startDate && endDate
                  ? `${formatShortDayMonth(startDate)} → ${formatShortDayMonth(endDate)}`
                  : dueDate
                  ? formatFullDate(dueDate)
                  : "Chưa đặt ngày"}
              </p>
              {effectiveTime && (
                <p className="text-xs font-mono text-[#8E8E93] dark:text-[#aeaeb2]">
                  {timeType === "scheduled"
                    ? `Lịch hẹn: ${startTime}${endTime ? ` - ${endTime}` : ""}`
                    : `Hạn chót: lúc ${effectiveTime}`}
                </p>
              )}
            </div>

            {/* Card Phân Loại & Tag */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-black space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs font-medium text-[#8E8E93] dark:text-[#aeaeb2]">
                <TagIcon size={13} strokeWidth={2.2} />
                <span>Nhãn phân loại</span>
              </div>
              {selectedTags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {selectedTags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md bg-black/[0.05] dark:bg-white/[0.08] text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#8E8E93] dark:text-[#aeaeb2] italic">Chưa gắn nhãn</p>
              )}
            </div>
          </div>

          {/* 4. Khối Ghi Chú */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-black space-y-2 shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#1C1C1E] dark:text-[#F2F2F7]">
              <FileText size={14} strokeWidth={2.2} />
              <span>Ghi chú chi tiết</span>
            </div>
            {description ? (
              <p className="text-xs sm:text-sm text-[#1C1C1E] dark:text-[#F2F2F7] whitespace-pre-wrap leading-relaxed">
                {description}
              </p>
            ) : (
              <p className="text-xs text-[#8E8E93] dark:text-[#aeaeb2] italic">
                Chưa có ghi chú nào cho công việc này.
              </p>
            )}
          </div>

          {/* 5. Khối Việc Con (Checklist) */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-black space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1C1C1E] dark:text-[#F2F2F7]">
                <ListTodo size={14} strokeWidth={2.2} />
                <span>Việc con ({childSubtasks.filter((c) => c.completed).length}/{childSubtasks.length})</span>
              </div>
            </div>

            {childSubtasks.length > 0 ? (
              <div className="space-y-1.5">
                {childSubtasks.map((child) => (
                  <div
                    key={child.id}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-[#E5E5EA] dark:border-black"
                  >
                    <HandDrawnCheckbox
                      checked={child.completed}
                      onChange={() => toggleTask(child.id)}
                    />
                    <span className={`text-xs sm:text-sm font-medium ${
                      child.completed ? "line-through text-[#8E8E93] dark:text-[#aeaeb2]" : "text-[#1C1C1E] dark:text-[#F2F2F7]"
                    }`}>
                      {child.title}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#8E8E93] dark:text-[#aeaeb2] italic">
                Không có việc con nào.
              </p>
            )}
          </div>

          {/* Nút Chuyển Nhanh Sang Chế Độ Chỉnh Sửa */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setMode("edit")}
              className="w-full py-3 px-4 rounded-2xl bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] text-xs sm:text-sm font-bold active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
            >
              <Edit3 size={15} strokeWidth={2.2} />
              <span>Chỉnh sửa công việc này</span>
            </button>
          </div>
        </div>
      ) : (
        /* ----------------------------------------------------------------------- */
        /* CHẾ ĐỘ CHỈNH SỬA (EDIT MODE - FORM NHẬP LIỆU ĐẦY ĐỦ) */
        /* ----------------------------------------------------------------------- */
        <div className="flex-1 w-full px-3.5 py-4 sm:px-5 sm:py-5 pb-28 space-y-4">
          {/* TIÊU ĐỀ CÔNG VIỆC */}
          <div className="space-y-1 pb-2 border-b border-[#E5E5EA] dark:border-[#2C2C2E]">
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
              className="w-full bg-transparent px-1.5 py-1 text-lg sm:text-xl font-bold text-[#1C1C1E] dark:text-[#F2F2F7] placeholder:text-[#8E8E93] focus:outline-none tracking-tight leading-snug rounded-none"
            />
          </div>

          {/* PHẦN 1: TRẠNG THÁI (STATUS) */}
          {taskId !== "new" && (
            <CollapsibleTaskSection
              title="Trạng thái"
              icon={<CheckCircle2 size={13} />}
              open={openSections.status}
              onToggle={() => toggleSection("status")}
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (completed) handleToggleComplete();
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                    !completed
                      ? "bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] border-transparent shadow-sm"
                      : "bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#8E8E93] dark:text-[#aeaeb2] border-transparent hover:bg-[#E5E5EA] dark:hover:bg-[#3A3A3C]"
                  }`}
                >
                  <Circle size={14} strokeWidth={2.4} />
                  <span>Cần làm</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!completed) handleToggleComplete();
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                    completed
                      ? "bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] border-transparent shadow-sm"
                      : "bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#8E8E93] dark:text-[#aeaeb2] border-transparent hover:bg-[#E5E5EA] dark:hover:bg-[#3A3A3C]"
                  }`}
                >
                  <CheckCircle2 size={14} strokeWidth={2.4} />
                  <span>Đã xong</span>
                </button>
              </div>
            </CollapsibleTaskSection>
          )}

          {/* PHẦN 2: THỜI GIAN (LỊCH HẸN & HẠN CHÓT) */}
          <CollapsibleTaskSection
            title="Thời gian"
            icon={<Calendar size={13} />}
            open={openSections.timing}
            onToggle={() => toggleSection("timing")}
          >
            {/* Kiểu ngày: Trong ngày vs Khoảng ngày (Từ - Đến) */}
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E5EA] dark:border-[#2C2C2E] text-xs">
              <span className="font-medium text-[#8E8E93] dark:text-[#aeaeb2] flex items-center gap-1">
                <Calendar size={13} />
                <span>Kiểu ngày:</span>
              </span>
              <div className="flex items-center gap-1 bg-[#F2F2F7] dark:bg-[#2C2C2E] p-0.5 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setIsDateRange(false);
                    setEndDate("");
                    markDraftChanged();
                  }}
                  className={`px-3 py-1 rounded-lg font-semibold text-xs transition-all cursor-pointer active:scale-95 ${
                    !isDateRange
                      ? "bg-white dark:bg-[#1C1C1E] text-[#1C1C1E] dark:text-white shadow-xs"
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
                  className={`px-3 py-1 rounded-lg font-semibold text-xs transition-all cursor-pointer active:scale-95 ${
                    isDateRange
                      ? "bg-white dark:bg-[#1C1C1E] text-[#1C1C1E] dark:text-white shadow-xs"
                      : "text-[#8E8E93] dark:text-[#aeaeb2] hover:text-[#1C1C1E] dark:hover:text-white"
                  }`}
                >
                  Khoảng ngày (Từ – Đến)
                </button>
              </div>
            </div>

            {!isDateRange ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {/* Ngày thực hiện / Hạn chót */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#8E8E93] dark:text-[#aeaeb2] flex items-center gap-1">
                    <Calendar size={13} />
                    <span>Ngày:</span>
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

                {/* Giờ hạn chót hoặc khung giờ */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#8E8E93] dark:text-[#aeaeb2] flex items-center gap-1">
                    <Clock size={13} />
                    <span>Giờ / Khung giờ:</span>
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
                      placeholder="Không đặt giờ (Cả ngày)"
                      align="right"
                      className="w-full"
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Từ ngày */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#8E8E93] dark:text-[#aeaeb2] flex items-center gap-1">
                      <Calendar size={13} />
                      <span>Từ ngày:</span>
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

                  {/* Đến ngày */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#8E8E93] dark:text-[#aeaeb2] flex items-center gap-1">
                      <Calendar size={13} />
                      <span>Đến ngày:</span>
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

                {/* Giờ chót hoặc khung giờ trong khoảng ngày */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#8E8E93] dark:text-[#aeaeb2] flex items-center gap-1">
                    <Clock size={13} />
                    <span>{timeType === "deadline" ? "Giờ chót (ngày kết thúc):" : "Khung giờ diễn ra:"}</span>
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
                      placeholder="Không đặt giờ (Cả ngày)"
                      align="right"
                      className="w-full"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Chế độ thời gian */}
            <div className="flex items-center gap-2 pt-2 border-t border-[#E5E5EA] dark:border-[#2C2C2E] text-sm">
              <span className="text-xs font-medium text-[#8E8E93] dark:text-[#aeaeb2]">Loại:</span>
              <div className="flex items-center gap-1 bg-[#F2F2F7] dark:bg-[#2C2C2E] p-0.5 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setTimeType("deadline");
                    markDraftChanged();
                  }}
                  className={`px-3 py-1 rounded-lg font-semibold text-xs cursor-pointer active:scale-95 transition-all ${
                    timeType === "deadline"
                      ? "bg-white dark:bg-[#1C1C1E] text-[#1C1C1E] dark:text-white shadow-xs"
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
                  className={`px-3 py-1 rounded-lg font-semibold text-xs cursor-pointer active:scale-95 transition-all ${
                    timeType === "scheduled"
                      ? "bg-white dark:bg-[#1C1C1E] text-[#1C1C1E] dark:text-white shadow-xs"
                      : "text-[#8E8E93] dark:text-[#aeaeb2] hover:text-[#1C1C1E] dark:hover:text-white"
                  }`}
                >
                  Lịch hẹn
                </button>
              </div>
            </div>
          </CollapsibleTaskSection>

          {/* PHẦN 3: PHÂN LOẠI & ƯU TIÊN */}
          <CollapsibleTaskSection
            title="Phân loại"
            icon={<Sparkles size={13} />}
            open={openSections.organize}
            onToggle={() => toggleSection("organize")}
          >
            <div className="space-y-3 text-sm">
              {/* Mức độ ưu tiên */}
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-xs text-[#8E8E93] dark:text-[#aeaeb2] flex items-center gap-1 shrink-0">
                  <Sparkles size={13} />
                  <span>Ưu tiên:</span>
                </span>
                <div className="flex items-center gap-1.5">
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
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all active:scale-95 ${
                        priority === p.key
                          ? "bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] border-transparent shadow-xs"
                          : "bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#8E8E93] dark:text-[#aeaeb2] border-transparent hover:bg-[#E5E5EA] dark:hover:bg-[#3A3A3C]"
                      }`}
                    >
                      <span className="font-mono text-[10px]">{p.sym}</span>
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Nhãn Tag (#Tag) Đa Năng */}
              <div className="pt-2 border-t border-[#E5E5EA] dark:border-[#2C2C2E] space-y-1.5">
                <span className="font-medium text-xs text-[#8E8E93] dark:text-[#aeaeb2] flex items-center gap-1">
                  <TagIcon size={13} />
                  <span>Nhãn (#Tag):</span>
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

          {/* PHẦN 4: GHI CHÚ & CHI TIẾT */}
          <CollapsibleTaskSection
            title="Ghi chú"
            icon={<TagIcon size={13} />}
            open={openSections.notes}
            onToggle={() => toggleSection("notes")}
          >
            <textarea
              rows={3}
              value={description}
              onChange={(e) => {
                const nextVal = e.target.value;
                setDescription(nextVal);
                markDraftChanged();
              }}
              placeholder="Thêm ghi chú chi tiết..."
              className="w-full p-3 bg-[#F2F2F7]/50 dark:bg-[#2C2C2E]/50 border border-[#E5E5EA] dark:border-[#2C2C2E] rounded-xl text-sm font-normal text-[#1C1C1E] dark:text-[#F2F2F7] placeholder:text-[#8E8E93] focus:outline-none focus:border-[#1C1C1E] dark:focus:border-white focus:bg-white dark:focus:bg-[#1C1C1E] resize-none transition-all"
            />
          </CollapsibleTaskSection>

          {/* MỤC 6: DANH SÁCH VIỆC CON (SUBTASKS / CHECKLIST) */}
          <CollapsibleTaskSection
            title={`Việc con (${childSubtasks.filter((c) => c.completed).length}/${childSubtasks.length})`}
            icon={<CheckCircle2 size={13} />}
            open={openSections.subtasks}
            onToggle={() => toggleSection("subtasks")}
          >
            {/* Render danh sách việc con */}
            <div className="space-y-1.5">
              {childSubtasks.map((child) => (
                <div
                  key={child.id}
                  className="flex items-center justify-between gap-2 px-3 py-2 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-xl border border-transparent"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <HandDrawnCheckbox
                      checked={child.completed}
                      onChange={() => toggleTask(child.id)}
                    />
                    <span
                      className={`text-sm font-medium truncate ${
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
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Form thêm việc con */}
            <form onSubmit={handleAddSubtask} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="+ Thêm việc con..."
                className="flex-1 px-3.5 py-2 rounded-xl border border-[#E5E5EA] dark:border-[#2C2C2E] bg-white dark:bg-[#1C1C1E] text-sm font-medium focus:outline-none focus:border-[#1C1C1E] dark:focus:border-white transition-colors"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] rounded-xl text-xs font-bold active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                Thêm
              </button>
            </form>
          </CollapsibleTaskSection>
        </div>
      )}

      {/* Reschedule Date Modal cho popup 3 chấm */}
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
