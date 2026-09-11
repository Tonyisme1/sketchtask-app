import React, { useState, useEffect, useRef } from "react";
import { useAppStore } from "../../../stores/appStore";
import { TaskPriority, TaskTimeType } from "../../../types";
import { getLocalTodayStr } from "../../../utils/date";
import { normalizeTaskTimeType, getTaskTags, extractTagsFromTitle } from "../../../utils/taskSemantics";
import { useResponsiveLayout } from "../../../shared/hooks";
import { isNativePlatform } from "../../../services/notificationService";
import { HandDrawnCheckbox } from "../../ui/core/HandDrawnCheckbox";
import { TagInputSelector } from "../../ui/pickers/select/TagInputSelector";
import { TimePickerPopover } from "../../ui/pickers/time/TimePickerPopover";
import { DatePickerPopover } from "../../ui/pickers/time/DatePickerPopover";
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
  <section className="bg-white border-[1.5px] border-[#262626] rounded-[6px] shadow-[1.5px_1.5px_0px_#262626] overflow-hidden transition-all">
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className={`w-full min-h-[42px] px-3.5 py-2.5 flex items-center justify-between gap-2 text-left cursor-pointer transition-colors ${
        open
          ? "bg-[#F3EFE6] border-b-[1.5px] border-[#262626] text-[#1C1917]"
          : "bg-white hover:bg-[#FAF8F3] text-[#1C1917]"
      } focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[#1C1917]`}
    >
      <span className="task-detail-section-title text-sm sm:text-[15px] font-bold text-[#1C1917] flex items-center gap-2.5">
        <span className="w-6 h-6 rounded-[4px] bg-white border border-[#262626] text-[#1C1917] shadow-[0.5px_0.5px_0px_#262626] flex items-center justify-center shrink-0">
          {icon}
        </span>
        <span>{title}</span>
      </span>
      <span className="flex items-center gap-2 shrink-0">
        {trailing}
        <span className="text-[#57534E] flex items-center justify-center">
          {open ? <ChevronUp size={16} strokeWidth={2.4} /> : <ChevronDown size={16} strokeWidth={2.4} />}
        </span>
      </span>
    </button>
    {open && <div className="p-3.5 space-y-3.5 bg-white">{children}</div>}
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
  const [openSections, setOpenSections] = useState<Record<TaskEditorSection, boolean>>({
    status: taskId !== "new",
    timing: true,
    organize: false,
    notes: false,
    subtasks: false,
  });

  const titleInputRef = useRef<HTMLInputElement>(null);

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
    setOpenSections({
      status: taskId !== "new",
      timing: true,
      organize: false,
      notes: false,
      subtasks: false,
    });
  }, [taskId, initialDate, todayStr, activeTaskDetailInitialData]);

  // Autofocus vào tiêu đề khi tạo task mới
  useEffect(() => {
    if (taskId === "new") {
      titleInputRef.current?.focus();
    }
  }, [taskId]);

  // Lắng nghe phím ESC để quay lại
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onBack();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onBack]);

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
    <div className="task-detail-editor w-full h-full bg-[#FBF9F4] text-[#1C1917] select-none flex flex-col overflow-y-auto">
      {/* 1. TOPBAR CỦA PANEL: Nút Quay Lại + Trạng Thái Lưu + Nút Xóa (Đồng bộ MobileHeader) */}
      <div className={`shrink-0 z-30 sticky top-0 bg-[#FBF9F4] border-b border-[#262626]/20 px-3.5 sm:px-5 flex items-center justify-between min-h-[56px] sm:min-h-[60px] ${
        isMobile || isTablet
          ? isNativePlatform()
            ? "pt-11 pb-2.5"
            : "pt-[max(env(safe-area-inset-top),10px)] pb-2.5"
          : "py-2.5"
      }`}>
        {/* Nút Quay Lại */}
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[4px] bg-white hover:bg-[#FAF8F3] border border-[#262626] shadow-[1px_1px_0px_#262626] text-sm font-bold active:translate-y-[0.5px] cursor-pointer transition-all"
        >
          <ArrowLeft size={14} strokeWidth={2.4} />
          <span>Quay lại</span>
        </button>

        {/* Trạng thái đã lưu & Xóa */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-mono font-bold text-[#57534E] flex items-center gap-1">
            {saveStatus === "saving" ? (
              <span>Đang lưu...</span>
            ) : saveStatus === "unsaved" ? (
              <span className="text-amber-700">Chưa lưu</span>
            ) : (
              <span className="text-emerald-700 flex items-center gap-1 font-medium">
                <Check size={12} strokeWidth={3} />
                Đã lưu
              </span>
            )}
          </span>

          {saveStatus === "unsaved" && (
            <button
              type="button"
              onClick={handleSave}
              disabled={!title.trim()}
              className="px-2.5 py-1 rounded-[4px] bg-[#FEF08A] hover:bg-[#FDE047] border border-[#262626] shadow-[1px_1px_0px_#262626] text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
            >
              Lưu
            </button>
          )}

          {currentTaskId && (
            <button
              type="button"
              onClick={handleDeleteSelf}
              className="p-1 rounded-[4px] bg-white hover:bg-rose-50 border border-[#262626] text-rose-700 hover:text-rose-900 shadow-[1px_1px_0px_#262626] active:translate-y-[0.5px] cursor-pointer transition-all"
              title="Xóa công việc này"
            >
              <Trash2 size={13} strokeWidth={2.2} />
            </button>
          )}
        </div>
      </div>

      {/* 2. NỘI DUNG CHÍNH (FORM GỌN GÀNG, ĐỒNG BỘ POPUP THÊM NHANH) */}
      <div className="flex-1 w-full px-3.5 py-4 sm:px-5 sm:py-5 pb-28 space-y-4">
        {/* TIÊU ĐỀ CÔNG VIỆC */}
        <div className="space-y-1 pb-2 border-b border-[#262626]/15">
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
            className="w-full bg-transparent text-lg sm:text-xl font-bold text-[#1C1917] placeholder:text-[#57534E] focus:outline-none tracking-tight leading-snug"
          />
        </div>

        {/* PHẦN 1: TRẠNG THÁI (STATUS) - CHỈ hiển thị khi XEM/SỬA task đã tồn tại, ẨN khi TẠO MỚI */}
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
                className={`flex-1 py-1.5 px-3 rounded-[4px] border-[1.5px] text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  !completed
                    ? "bg-[#1C1917] text-white border-[#1C1917] shadow-[1.5px_1.5px_0px_#262626]"
                    : "bg-white text-[#78716C] border-[#D4CEBF] hover:bg-[#FAF8F3]"
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
                className={`flex-1 py-1.5 px-3 rounded-[4px] border-[1.5px] text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  completed
                    ? "bg-[#1C1917] text-white border-[#1C1917] shadow-[1.5px_1.5px_0px_#262626]"
                    : "bg-white text-[#78716C] border-[#D4CEBF] hover:bg-[#FAF8F3]"
                }`}
              >
                <CheckCircle2 size={13} strokeWidth={2.4} />
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
          <div className="flex items-center justify-between pb-1.5 border-b border-[#262626]/10 text-xs">
            <span className="font-medium text-[#57534E] flex items-center gap-1">
              <Calendar size={12} />
              <span>Kiểu ngày:</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setIsDateRange(false);
                  setEndDate("");
                  markDraftChanged();
                }}
                className={`px-2 py-0.5 rounded-[3px] border font-medium text-xs transition-all cursor-pointer ${
                  !isDateRange
                    ? "bg-[#1C1917] text-white border-[#1C1917]"
                    : "bg-[#FAF8F3] text-[#78716C] border-[#D4CEBF] hover:bg-white"
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
                className={`px-2 py-0.5 rounded-[3px] border font-medium text-xs transition-all cursor-pointer ${
                  isDateRange
                    ? "bg-[#1C1917] text-white border-[#1C1917]"
                    : "bg-[#FAF8F3] text-[#78716C] border-[#D4CEBF] hover:bg-white"
                }`}
              >
                Khoảng ngày (Từ – Đến)
              </button>
            </div>
          </div>

          {!isDateRange ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {/* Ngày thực hiện / Hạn chót */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#57534E] flex items-center gap-1">
                  <Calendar size={12} />
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
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#57534E] flex items-center gap-1">
                  <Clock size={12} />
                  <span>Giờ / Khung giờ:</span>
                </label>
                {timeType === "scheduled" ? (
                  <div className="flex items-center gap-1">
                    <TimePickerPopover
                      value={startTime}
                      onChange={(val) => {
                        setStartTime(val);
                        markDraftChanged();
                      }}
                      placeholder="Bắt đầu"
                      className="flex-1 min-w-0"
                    />
                    <span className="text-xs font-mono font-medium text-[#78716C]">-</span>
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
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Từ ngày */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[#57534E] flex items-center gap-1">
                    <Calendar size={12} />
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
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[#57534E] flex items-center gap-1">
                    <Calendar size={12} />
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
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#57534E] flex items-center gap-1">
                  <Clock size={12} />
                  <span>{timeType === "deadline" ? "Giờ chót (ngày kết thúc):" : "Khung giờ diễn ra:"}</span>
                </label>
                {timeType === "scheduled" ? (
                  <div className="flex items-center gap-1">
                    <TimePickerPopover
                      value={startTime}
                      onChange={(val) => {
                        setStartTime(val);
                        markDraftChanged();
                      }}
                      placeholder="Bắt đầu"
                      className="flex-1 min-w-0"
                    />
                    <span className="text-xs font-mono font-medium text-[#78716C]">-</span>
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
          <div className="flex items-center gap-2 pt-1 border-t border-[#262626]/10 text-sm">
            <span className="text-xs font-medium text-[#57534E]">Loại:</span>
            <button
              type="button"
              onClick={() => {
                setTimeType("deadline");
                markDraftChanged();
              }}
              className={`px-2 py-0.5 rounded-[3px] border font-medium text-xs cursor-pointer ${
                timeType === "deadline"
                  ? "bg-[#1C1917] text-white border-[#1C1917]"
                  : "bg-[#FAF8F3] text-[#78716C] border-[#D4CEBF]"
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
              className={`px-2 py-0.5 rounded-[3px] border font-medium text-xs cursor-pointer ${
                timeType === "scheduled"
                  ? "bg-[#1C1917] text-white border-[#1C1917]"
                  : "bg-[#FAF8F3] text-[#78716C] border-[#D4CEBF]"
              }`}
            >
              Lịch hẹn
            </button>
          </div>
        </CollapsibleTaskSection>

        {/* PHẦN 3: PHÂN LOẠI & ƯU TIÊN */}
        <CollapsibleTaskSection
          title="Phân loại"
          icon={<Sparkles size={13} />}
          open={openSections.organize}
          onToggle={() => toggleSection("organize")}
        >
          <div className="space-y-2.5 text-sm">
            {/* Mức độ ưu tiên */}
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-xs text-[#57534E] flex items-center gap-1 shrink-0">
                <Sparkles size={12} />
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
                    className={`px-2.5 py-0.5 rounded-[3px] border font-medium text-xs flex items-center gap-1 cursor-pointer transition-all ${
                      priority === p.key
                        ? "bg-[#1C1917] text-white border-[#1C1917]"
                        : "bg-[#FAF8F3] text-[#78716C] border-[#D4CEBF] hover:bg-white"
                    }`}
                  >
                    <span className="font-mono text-[10px]">{p.sym}</span>
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Nhãn Tag (#Tag) Đa Năng */}
            <div className="pt-1 border-t border-[#262626]/10 space-y-1.5">
              <span className="font-medium text-xs text-[#57534E] flex items-center gap-1">
                <TagIcon size={12} />
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
            className="w-full p-2.5 bg-white border-[1.5px] border-[#262626] rounded-[6px] shadow-[1.5px_1.5px_0px_#262626] text-sm font-medium text-[#1C1917] placeholder:text-[#57534E] focus:outline-none resize-none"
          />
        </CollapsibleTaskSection>

        {/* MỤC 6: DANH SÁCH VIỆC CON (SUBTASKS / CHECKLIST) */}
        <CollapsibleTaskSection
          title={`Việc con (${childSubtasks.filter((c) => c.completed).length}/${childSubtasks.length})`}
          icon={<CheckCircle2 size={12} />}
          open={openSections.subtasks}
          onToggle={() => toggleSection("subtasks")}
        >

          {/* Render danh sách việc con */}
          <div className="space-y-1.5">
            {childSubtasks.map((child) => (
              <div
                key={child.id}
                className="flex items-center justify-between gap-2 px-3 py-1.5 bg-white border-[1.5px] border-[#262626] rounded-[4px] shadow-[1px_1px_0px_#262626]"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <HandDrawnCheckbox
                    checked={child.completed}
                    onChange={() => toggleTask(child.id)}
                  />
                  <span
                    className={`text-sm font-medium truncate ${
                      child.completed ? "line-through text-[#78716C] opacity-70" : "text-[#1C1917]"
                    }`}
                  >
                    {child.title}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => deleteTask(child.id)}
                  className="p-1 text-[#78716C] hover:text-rose-600 rounded cursor-pointer"
                  title="Xóa việc con"
                >
                  <Trash2 size={12} />
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
              className="flex-1 px-3 py-1.5 rounded-[4px] border-[1.5px] border-dashed border-[#262626] bg-white text-sm font-medium focus:outline-none focus:border-solid focus:border-[#1C1917]"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-[#1C1917] text-white border-[1.5px] border-[#1C1917] rounded-[4px] text-xs font-bold shadow-[1px_1px_0px_#262626] active:translate-y-[0.5px] cursor-pointer"
            >
              Thêm
            </button>
          </form>
        </CollapsibleTaskSection>
      </div>
    </div>
  );
};
