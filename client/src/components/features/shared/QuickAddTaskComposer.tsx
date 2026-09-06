import React, { useState, useEffect, useMemo } from "react";
import { useAppStore } from "../../../stores/appStore";
import { CustomSelect } from "../../ui/pickers/select/CustomSelect";
import { CalendarMonth } from "../../ui/pickers/time/CalendarMonth";
import { TimeSliderAdjuster } from "../../ui/pickers/time/TimeSliderAdjuster";
import { getTagStyle } from "../../../utils/tagColors";
import {
  getLocalTodayStr,
  getLocalTomorrowStr,
  formatShortDayMonth,
} from "../../../utils/date";
import {
  Plus,
  Clock,
  Hourglass,
  Calendar as CalendarIcon,
  X,
  Tag as TagIcon,
  Layers,
  BookOpen,
} from "lucide-react";
import {
  getInheritedParentSchedule,
  getTaskParentCandidates,
  getTaskEffectiveDate,
  buildParentSelectOptions,
} from "../../../utils/taskSemantics";

// ==========================================
// COMPONENT: QuickAddTaskComposer (Đồng Bộ 100% UI Với Edit Mode - Không Popup)
// ==========================================

export type QuickAddContext = "today" | "planner" | "notebook" | "global";

export interface QuickAddTaskComposerProps {
  context: QuickAddContext;
  selectedDate?: string; // Dành cho planner
  notebookId?: string; // Dành cho notebook
  initialParentTaskId?: string; // Dành cho khi mở từ nút + trên task
  hideExpandToggle?: boolean; // Ẩn nút toggle, luôn hiển thị đầy đủ các trường
  autoExpand?: boolean;
  placeholder?: string;
  onTaskCreated?: (title: string) => void;
  className?: string;
}

type TimeTypeMode = "scheduled" | "deadline" | "none";

export const QuickAddTaskComposer: React.FC<QuickAddTaskComposerProps> = ({
  context,
  selectedDate,
  notebookId,
  initialParentTaskId,
  placeholder,
  onTaskCreated,
  className = "",
}) => {
  const { addTask, notebooks, tasks, tags, addTag, deleteTag } = useAppStore();

  const todayStr = getLocalTodayStr();
  const tomorrowStr = getLocalTomorrowStr();
  const plannerEffectiveDate = selectedDate || todayStr;

  // 1. Core State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [inputError, setInputError] = useState(false);

  // 2. Metadata State
  const [selectedNotebookId, setSelectedNotebookId] = useState(
    context === "notebook" && notebookId ? notebookId : ""
  );
  const [selectedTag, setSelectedTag] = useState("");
  const [parentTaskId, setParentTaskId] = useState("");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");

  // Tag creation state
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");

  // 3. Date & Time State
  const initialDate =
    context === "today" || context === "global"
      ? todayStr
      : context === "planner"
      ? plannerEffectiveDate
      : undefined;

  const [dateVal, setDateVal] = useState<string | undefined>(initialDate);
  const [timeMode, setTimeMode] = useState<TimeTypeMode>("none");
  const [startTime, setStartTime] = useState<string | undefined>(undefined);
  const [endTime, setEndTime] = useState<string | undefined>(undefined);
  const [deadlineTime, setDeadlineTime] = useState<string | undefined>(undefined);

  // 4. Inline Sub-Pickers State (Không dùng modal popup)
  const [isDatePickerInlineOpen, setIsDatePickerInlineOpen] = useState(false);
  const [isTimePickerInlineOpen, setIsTimePickerInlineOpen] = useState(false);
  const [editingTimeTarget, setEditingTimeTarget] = useState<"start" | "end" | "deadline">("start");

  // View state Calendar
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());

  // Slider state Time
  const [sliderHour, setSliderHour] = useState(9);
  const [sliderMinute, setSliderMinute] = useState(0);

  // Đồng bộ khi prop thay đổi
  useEffect(() => {
    if (context === "planner" && selectedDate) {
      setDateVal(selectedDate);
    }
  }, [context, selectedDate]);

  useEffect(() => {
    if (context === "notebook" && notebookId) {
      setSelectedNotebookId(notebookId);
    }
  }, [context, notebookId]);

  useEffect(() => {
    if (initialParentTaskId !== undefined) {
      setParentTaskId(initialParentTaskId);
      if (initialParentTaskId) {
        const parent = tasks.find((t) => t.id === initialParentTaskId);
        if (parent) {
          const parentDate = getTaskEffectiveDate(parent);
          if (parentDate) setDateVal(parentDate);
          if (parent.notebookId) setSelectedNotebookId(parent.notebookId);
          if (parent.tag) setSelectedTag(parent.tag);
        }
      }
    }
  }, [initialParentTaskId, tasks]);

  // Handler mở Time Picker Inline
  const handleOpenTimePickerInline = (target: "start" | "end" | "deadline", currentVal?: string) => {
    if ((context === "notebook" || context === "global") && !dateVal) {
      setDateVal(todayStr);
    }

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
    const timeFormatted = `${String(sliderHour).padStart(2, "0")}:${String(
      sliderMinute
    ).padStart(2, "0")}`;

    if (editingTimeTarget === "start") {
      setStartTime(timeFormatted);
      setTimeMode("scheduled");
      setDeadlineTime(undefined);
    } else if (editingTimeTarget === "end") {
      setEndTime(timeFormatted);
      setTimeMode("scheduled");
      setDeadlineTime(undefined);
    } else {
      setDeadlineTime(timeFormatted);
      setTimeMode("deadline");
      setStartTime(undefined);
      setEndTime(undefined);
    }
    setIsTimePickerInlineOpen(false);
  };

  const handleParentChange = (value: string) => {
    setParentTaskId(value);
    if (!value) return;

    const parentTask = tasks.find((candidate) => candidate.id === value);
    if (!parentTask) return;

    const inherited = getInheritedParentSchedule(parentTask);
    const inheritedDate = inherited.deadlineDate || inherited.dueDate?.split(" ")[0];
    setDateVal(inheritedDate);

    if (inherited.timeType === "scheduled") {
      setTimeMode("scheduled");
      setStartTime(inherited.startTime);
      setEndTime(inherited.endTime);
      setDeadlineTime(undefined);
    } else if (inherited.timeType === "deadline") {
      setTimeMode("deadline");
      setDeadlineTime(inherited.deadlineTime);
      setStartTime(undefined);
      setEndTime(undefined);
    } else {
      setTimeMode("none");
      setStartTime(undefined);
      setEndTime(undefined);
      setDeadlineTime(undefined);
    }
  };

  // Submit Tạo Task
  const handleSubmitTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      setInputError(true);
      return;
    }

    const finalNotebookId =
      context === "notebook"
        ? notebookId || selectedNotebookId || undefined
        : selectedNotebookId || undefined;

    const finalTag = selectedTag || undefined;
    const finalParentTaskId = parentTaskId || undefined;

    // A. SCHEDULED MODE (Khung giờ hẹn)
    if (timeMode === "scheduled") {
      const effectiveDate = dateVal || todayStr;
      const effectiveStart = startTime || "09:00";
      const effectiveEnd = endTime || undefined;
      const formattedDueDate = `${effectiveDate} ${effectiveStart}`;

      addTask({
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: formattedDueDate,
        startTime: effectiveStart,
        endTime: effectiveEnd,
        notebookId: finalNotebookId,
        tag: finalTag,
        parentTaskId: finalParentTaskId,
        timeType: "scheduled",
        priority: priority,
      });
    }
    // B. DEADLINE MODE (Hạn chót)
    else if (timeMode === "deadline") {
      const effectiveDeadlineDate = dateVal || todayStr;
      const effectiveDeadlineTime = deadlineTime || "17:00";
      const formattedDueDate = `${effectiveDeadlineDate} ${effectiveDeadlineTime}`;

      addTask({
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: formattedDueDate,
        deadlineDate: effectiveDeadlineDate,
        deadlineTime: effectiveDeadlineTime,
        notebookId: finalNotebookId,
        tag: finalTag,
        parentTaskId: finalParentTaskId,
        timeType: "deadline",
        priority: priority,
      });
    }
    // C. NORMAL / TASK MODE
    else {
      addTask({
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: dateVal,
        notebookId: finalNotebookId,
        tag: finalTag,
        parentTaskId: finalParentTaskId,
        // A date without a time is date-only, not a deadline.
        timeType: undefined,
        priority: priority,
      });
    }

    if (onTaskCreated) {
      onTaskCreated(title.trim());
    }

    // Reset Form
    setTitle("");
    setDescription("");
    setInputError(false);
    setSelectedTag("");
    setParentTaskId("");
    setPriority("medium");
    setTimeMode("none");
    setStartTime(undefined);
    setEndTime(undefined);
    setDeadlineTime(undefined);
    setIsDatePickerInlineOpen(false);
    setIsTimePickerInlineOpen(false);

    if (context === "notebook") {
      setDateVal(undefined);
    } else if (context === "today") {
      setDateVal(todayStr);
    } else {
      setDateVal(plannerEffectiveDate);
    }
  };

  const handleCreateNewTag = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (newTagInput.trim()) {
      const cleanTag = newTagInput.trim().replace(/^#/, "");
      addTag(cleanTag);
      setSelectedTag(cleanTag);
      setNewTagInput("");
    }
    setIsAddingTag(false);
  };

  // Danh sách các task hợp lệ làm task cha
  const parentSelectOptions = useMemo(() => {
    const targetDate = context === "notebook" || context === "global"
      ? undefined
      : (dateVal || plannerEffectiveDate || todayStr);
    const parentScope = context === "notebook"
      ? "notebook"
      : context === "global"
      ? "global"
      : "planner";
    const list = getTaskParentCandidates(tasks, parentScope, {
      date: targetDate,
      notebookId: context === "notebook" ? notebookId || selectedNotebookId : undefined,
    });

    return buildParentSelectOptions(list, tasks, parentTaskId);
  }, [tasks, context, dateVal, plannerEffectiveDate, todayStr, notebookId, selectedNotebookId, parentTaskId]);

  return (
    <div className={`space-y-3 text-xs select-none animate-in fade-in duration-150 ${className}`}>
      {/* 1. Tiêu đề task */}
      <div>
        <label className="font-bold text-[#1C1917] text-[11px] block mb-1">
          Tiêu đề công việc:
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (inputError) setInputError(false);
          }}
          placeholder={placeholder || (context === "today" ? "Nhập tên việc cần làm hôm nay..." : "Nhập tên công việc mới...")}
          className={`w-full p-2 bg-white border-[1.5px] border-[#262626] rounded-[4px] font-bold text-xs focus:ring-1 focus:ring-[#262626] focus:outline-none shadow-[1.5px_1.5px_0px_#262626] ${
            inputError ? "border-rose-500 bg-rose-50/50" : ""
          }`}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmitTask();
            }
          }}
          autoFocus
        />
      </div>

      {/* 2. Ghi chú chi tiết */}
      <div>
        <label className="font-bold text-[#1C1917] text-[11px] block mb-1">
          Ghi chú chi tiết:
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Thêm mô tả, link hoặc lưu ý..."
          rows={2}
          className="w-full p-2 bg-white border-[1.5px] border-[#262626] rounded-[4px] text-xs focus:ring-1 focus:ring-[#262626] focus:outline-none resize-none shadow-[1.5px_1.5px_0px_#262626]"
        />
      </div>

      {/* 3. THIẾT LẬP NGÀY (CHỈ DÀNH CHO CONTEXT SỔ TAY ĐỂ GÁN NGÀY HOẶC HỘP CHỜ) */}
      {(context === "notebook" || context === "global") && (
        <div className="space-y-1.5 pt-1 border-t border-[#D4CEBF]/40">
          <div className="flex items-center justify-between">
            <label className="font-bold text-[#1C1917] text-[11px] flex items-center gap-1">
              <CalendarIcon size={11} className="text-[#1C1917]" />
              <span>Thiết lập ngày:</span>
            </label>
            {dateVal && (
              <button
                type="button"
                onClick={() => setDateVal(undefined)}
                className="text-[10px] font-bold text-rose-700 hover:underline flex items-center gap-0.5"
              >
                <X size={10} />
                <span>Lưu vào Hộp chờ</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setIsTimePickerInlineOpen(false);
              setIsDatePickerInlineOpen(!isDatePickerInlineOpen);
            }}
            className={`w-full py-1.5 px-2.5 rounded-[4px] border-[1.5px] font-bold text-xs transition-all flex items-center justify-between active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none ${
              dateVal
                ? "bg-[#FEF08A] text-[#1C1917] border-[#262626] shadow-[1px_1px_0px_#262626]"
                : "bg-white text-[#78716C] border-[#262626] hover:text-[#1C1917]"
            }`}
          >
            <div className="flex items-center gap-1.5 truncate">
              <CalendarIcon size={12} strokeWidth={2.4} />
              <span>{dateVal ? `Ngày: ${formatShortDayMonth(dateVal)}` : "Chưa đặt ngày (Hộp chờ)"}</span>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.2 bg-white/80 border border-[#262626] rounded ml-1 shrink-0">
              {isDatePickerInlineOpen ? "Đóng" : dateVal ? "Đổi ngày" : "Chọn ngày"}
            </span>
          </button>

          {/* Mini Calendar Inline trong Sổ Tay */}
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
                selectedDate={dateVal || todayStr}
                onSelectDate={(newDate) => {
                  setDateVal(newDate);
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
      )}

      {/* 4. Phả hệ công việc (Công việc cha) */}
      <div className="space-y-1.5 pt-1 border-t border-[#D4CEBF]/40">
        <label className="font-bold text-[#1C1917] text-[11px] flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Layers size={11} className="text-[#78716C]" />
            <span>Thuộc việc:</span>
          </span>
          {parentTaskId && (
            <button
              type="button"
              onClick={() => setParentTaskId("")}
              className="text-[10px] font-bold text-rose-700 hover:underline flex items-center gap-0.5"
            >
              <X size={10} />
              <span>Bỏ chọn</span>
            </button>
          )}
        </label>
        <CustomSelect
          value={parentTaskId}
          onChange={handleParentChange}
          options={parentSelectOptions}
          className="w-full"
        />
      </div>

      {/* 5. Nhãn phân loại */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="font-bold text-[#1C1917] text-[11px] flex items-center gap-1">
            <TagIcon size={11} />
            <span>Nhãn:</span>
          </label>
          {!isAddingTag && (
            <button
              type="button"
              onClick={() => setIsAddingTag(true)}
              className="text-[10px] font-bold text-[#78716C] hover:text-[#1C1917] underline"
            >
              + Thêm nhãn
            </button>
          )}
        </div>

        {isAddingTag ? (
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              placeholder="Tên nhãn..."
              className="flex-1 p-1 bg-white border border-[#262626] rounded text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreateNewTag(e);
                }
              }}
              autoFocus
            />
            <button
              type="button"
              onClick={handleCreateNewTag}
              className="px-2 py-1 bg-[#BBF7D0] hover:bg-[#86EFAC] border-[1.5px] border-[#262626] rounded font-bold text-[10px] shadow-[1px_1px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
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
                  onClick={() => setSelectedTag(selectedTag === tag ? "" : tag)}
                  style={getTagStyle(tag)}
                  className={`px-2 py-0.5 border font-bold text-[10px] transition-all ${
                    selectedTag === tag
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
                    if (selectedTag === tag) setSelectedTag("");
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

      {/* 6. Sổ tay */}
      {context !== "notebook" && (
        <div>
          <label className="font-bold text-[#1C1917] text-[11px] block mb-1 flex items-center gap-1">
            <BookOpen size={11} className="text-[#78716C]" />
            <span>Sổ tay:</span>
          </label>
          <CustomSelect
            value={selectedNotebookId}
            onChange={setSelectedNotebookId}
            options={[
              { value: "", label: "Không chọn" },
              ...notebooks.map((nb) => ({
                value: nb.id,
                label: nb.name,
                icon: nb.icon,
              })),
            ]}
            className="w-full"
          />
        </div>
      )}

      {/* 7. Thiết lập thời gian (Tách riêng Giờ hẹn vs Hạn chót 100%) */}
      <div className="space-y-2 pt-1.5 border-t border-[#D4CEBF]/40">
        <label className="font-bold text-[#1C1917] text-[11px] block">
          Thời gian:
        </label>

        {/* 3 Tab phân loại rạch ròi */}
        <div className="grid grid-cols-3 gap-1">
          <button
            type="button"
            onClick={() => {
              setTimeMode("none");
              setStartTime(undefined);
              setEndTime(undefined);
              setDeadlineTime(undefined);
              setIsTimePickerInlineOpen(false);
            }}
            className={`py-1.5 px-1 rounded-[4px] border-[1.5px] font-bold text-[10px] transition-all flex items-center justify-center gap-1 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none ${
              timeMode === "none"
                ? "bg-[#262626] text-white border-[#262626] shadow-[1px_1px_0px_#262626]"
                : "bg-white text-[#78716C] border-[#D4CEBF] hover:text-[#1C1917]"
            }`}
          >
            <span>Trong ngày</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (timeMode !== "scheduled") {
                setTimeMode("scheduled");
                setDeadlineTime(undefined);
                if (!startTime) handleOpenTimePickerInline("start");
              }
            }}
            className={`py-1.5 px-1 rounded-[4px] border-[1.5px] font-bold text-[10px] transition-all flex items-center justify-center gap-1 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none ${
              timeMode === "scheduled"
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
              if (timeMode !== "deadline") {
                setTimeMode("deadline");
                setStartTime(undefined);
                setEndTime(undefined);
                if (!deadlineTime) handleOpenTimePickerInline("deadline");
              }
            }}
            className={`py-1.5 px-1 rounded-[4px] border-[1.5px] font-bold text-[10px] transition-all flex items-center justify-center gap-1 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none ${
              timeMode === "deadline"
                ? "bg-[#FECDD3] text-rose-950 border-[#262626] shadow-[1.5px_1.5px_0px_#262626]"
                : "bg-white text-[#78716C] border-[#D4CEBF] hover:bg-rose-50"
            }`}
          >
            <Hourglass size={11} className="text-rose-900" />
            <span>Hạn chót</span>
          </button>
        </div>

        {/* Khung Chi Tiết: KHUNG GIỜ HẸN */}
        {timeMode === "scheduled" && (
          <div className="p-2 bg-[#FFFDEB] border-[1.5px] border-[#262626] rounded-[6px] space-y-1.5 shadow-[1px_1px_0px_#262626] animate-in slide-in-from-top-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-amber-950">
              <span className="flex items-center gap-1">
                <Clock size={11} />
                <span>Giờ hẹn:</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setTimeMode("none");
                  setStartTime(undefined);
                  setEndTime(undefined);
                  setIsTimePickerInlineOpen(false);
                }}
                className="text-rose-700 hover:underline"
              >
                Hủy
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleOpenTimePickerInline("start", startTime)}
                className="p-1.5 bg-white border-[1.5px] border-[#262626] rounded-[4px] text-left flex items-center justify-between shadow-[1px_1px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
              >
                <span className="font-bold text-[11px] text-[#1C1917]">
                  {startTime ? `Bắt đầu: ${startTime}` : "Giờ bắt đầu"}
                </span>
                <span className="text-[9px] font-bold px-1 bg-[#FEF08A] border border-[#262626] rounded">
                  {startTime ? "Đổi" : "+"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenTimePickerInline("end", endTime)}
                className="p-1.5 bg-white border-[1.5px] border-[#262626] rounded-[4px] text-left flex items-center justify-between shadow-[1px_1px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
              >
                <span className="font-bold text-[11px] text-[#1C1917]">
                  {endTime ? `Kết thúc: ${endTime}` : "Giờ kết thúc"}
                </span>
                <span className="text-[9px] font-bold px-1 bg-[#FEF08A] border border-[#262626] rounded">
                  {endTime ? "Đổi" : "+"}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Khung Chi Tiết: HẠN CHÓT (DEADLINE) */}
        {timeMode === "deadline" && (
          <div className="p-2 bg-rose-50 border-[1.5px] border-[#262626] rounded-[6px] space-y-1.5 shadow-[1px_1px_0px_#262626] animate-in slide-in-from-top-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-rose-950">
              <span className="flex items-center gap-1">
                <Hourglass size={11} />
                <span>Hạn chót:</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setTimeMode("none");
                  setDeadlineTime(undefined);
                  setIsTimePickerInlineOpen(false);
                }}
                className="text-rose-700 hover:underline"
              >
                Hủy
              </button>
            </div>
            <button
              type="button"
              onClick={() => handleOpenTimePickerInline("deadline", deadlineTime)}
              className="w-full p-1.5 bg-white border-[1.5px] border-[#262626] rounded-[4px] text-left flex items-center justify-between shadow-[1px_1px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
            >
              <div className="flex items-center gap-1.5">
                <Hourglass size={12} className="text-rose-800" />
                <span className="font-bold text-xs text-[#1C1917]">
                  Hạn trước: {deadlineTime || "17:00"}
                </span>
              </div>
              <span className="text-[9px] font-bold px-1.5 bg-[#FECDD3] border border-[#262626] rounded">
                Đổi giờ
              </span>
            </button>
          </div>
        )}

        {/* Khung Time Slider INLINE trong Form Tạo (Không popup đen) */}
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
                className="px-2 py-0.5 bg-white text-[10px] font-bold border border-[#262626] rounded active:translate-x-[0.5px] active:translate-y-[0.5px]"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleApplyTimeSliderInline}
                className="px-3 py-0.5 bg-[#BBF7D0] text-emerald-950 text-[10px] font-bold border-[1.5px] border-[#262626] rounded shadow-[1px_1px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
              >
                Áp dụng
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 8. Ưu tiên */}
      <div className="space-y-1 pt-1 border-t border-[#D4CEBF]/40">
        <label className="font-bold text-[#1C1917] text-[11px] block">
          Ưu tiên:
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => setPriority("high")}
            className={`py-1 px-1 rounded-[4px] border-[1.5px] font-bold text-[11px] transition-all flex items-center justify-center gap-1 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none ${
              priority === "high"
                ? "bg-[#FECDD3] text-rose-900 border-[#262626] shadow-[1.5px_1.5px_0px_#262626]"
                : "bg-white text-[#78716C] border-[#262626]/30 hover:border-[#262626]"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            <span>Gấp</span>
          </button>
          <button
            type="button"
            onClick={() => setPriority("medium")}
            className={`py-1 px-1 rounded-[4px] border-[1.5px] font-bold text-[11px] transition-all flex items-center justify-center gap-1 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none ${
              priority === "medium"
                ? "bg-[#FEF08A] text-amber-900 border-[#262626] shadow-[1.5px_1.5px_0px_#262626]"
                : "bg-white text-[#78716C] border-[#262626]/30 hover:border-[#262626]"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Vừa</span>
          </button>
          <button
            type="button"
            onClick={() => setPriority("low")}
            className={`py-1 px-1 rounded-[4px] border-[1.5px] font-bold text-[11px] transition-all flex items-center justify-center gap-1 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none ${
              priority === "low"
                ? "bg-[#BBF7D0] text-emerald-900 border-[#262626] shadow-[1.5px_1.5px_0px_#262626]"
                : "bg-white text-[#78716C] border-[#262626]/30 hover:border-[#262626]"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span>Thấp</span>
          </button>
        </div>
      </div>

      {/* 9. Nút Submit Thêm Việc */}
      <div className="pt-2 border-t border-[#262626]">
        <button
          type="button"
          onClick={() => handleSubmitTask()}
          disabled={!title.trim()}
          className="w-full py-2 bg-[#BBF7D0] hover:bg-[#86EFAC] disabled:opacity-50 disabled:hover:bg-[#BBF7D0] border-[1.5px] border-[#262626] rounded-[6px] text-xs font-bold text-emerald-950 shadow-[2px_2px_0px_#262626] flex items-center justify-center gap-1.5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
        >
          <Plus size={15} strokeWidth={2.8} />
          <span>Thêm công việc</span>
        </button>
      </div>
    </div>
  );
};
