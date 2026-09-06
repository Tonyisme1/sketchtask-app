import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { TaskDto } from "../../../types";
import { useAppStore } from "../../../stores/appStore";
import { AutoResizeTextarea } from "../core/AutoResizeTextarea";
import { Button } from "../core/Button";
import { CustomSelect } from "../pickers/select/CustomSelect";
import { CalendarMonth } from "../pickers/time/CalendarMonth";
import { TimeSliderAdjuster } from "../pickers/time/TimeSliderAdjuster";
import {
  Edit3,
  Check,
  Tag as TagIcon,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  X,
} from "lucide-react";
import { registerBackHandler } from "../../../utils/backNavigation";
import { useScrollLock } from "../../../hooks/useScrollLock";
import { formatFullDate, getLocalTodayStr, getLocalTomorrowStr } from "../../../utils/date";
import {
  getTaskEffectiveDate,
  getTaskEffectiveTime,
  normalizeTaskTimeType,
  getInheritedParentSchedule,
  getTaskParentCandidates,
} from "../../../utils/taskSemantics";
import type { TaskParentScope } from "../../../utils/taskSemantics";

// ==========================================
// COMPONENT: EditTaskModal (Thiết kế chuẩn xác Task 30 cập nhật)
// Thứ tự hiển thị:
// 1. Nội dung
// 2. Thuộc sổ nào
// 3. Nhãn/Tag
// 4. Thuộc công việc nào (Công việc cha)
// 5. Thiết lập thời gian (Ngày riêng biệt)
// 6. Giờ hẹn và giờ chót (Ẩn hiện thông minh & Slider kéo ngang)
// 7. Mức độ ưu tiên (Gấp / Vừa / Thấp)
// 8. Nút hành động (Lưu / Hủy - Bỏ nút X trên đầu)
// ==========================================

export interface EditTaskModalProps {
  task: TaskDto | null;
  isOpen: boolean;
  onClose: () => void;
  parentScope?: TaskParentScope;
}

type TimeTypeMode = "scheduled" | "deadline" | "none";

export const EditTaskModal: React.FC<EditTaskModalProps> = ({
  task,
  isOpen,
  onClose,
  parentScope = "notebook",
}) => {
  useScrollLock(isOpen);
  const { notebooks, tasks, tags, updateTask, addTag } = useAppStore();
  const todayStr = getLocalTodayStr();

  // 1. Form Fields
  const [title, setTitle] = useState("");
  const [notebookId, setNotebookId] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [parentTaskId, setParentTaskId] = useState("");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");

  // State thêm tag mới nhanh
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");

  // 2. Time & Date State
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [timeTypeMode, setTimeTypeMode] = useState<TimeTypeMode>("none");
  const [startTime, setStartTime] = useState<string | undefined>(undefined);
  const [endTime, setEndTime] = useState<string | undefined>(undefined);
  const [deadlineTime, setDeadlineTime] = useState<string | undefined>(undefined);

  // 3. Sub-Pickers State
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [editingTimeTarget, setEditingTimeTarget] = useState<"start" | "end" | "deadline">("start");

  // View state cho CalendarMonth
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());

  // Slider state cho TimeSliderAdjuster
  const [sliderHour, setSliderHour] = useState(9);
  const [sliderMinute, setSliderMinute] = useState(0);

  // 4. Khởi Tạo State Khi Mở Modal
  useEffect(() => {
    if (task && isOpen) {
      setTitle(task.title || "");
      setNotebookId(task.notebookId || "");
      setSelectedTag(task.tag || "");
      setParentTaskId(task.parentTaskId || "");
      setPriority((task.priority as any) || "medium");
      setIsAddingTag(false);
      setNewTagInput("");

      // Lấy ngày đã có trong task (nếu không có thì undefined, KHÔNG tự gán hôm nay)
      const existingDate = getTaskEffectiveDate(task);

      setSelectedDate(existingDate || undefined);

      // Xác định loại giờ
      const normalizedType = normalizeTaskTimeType(task);
      const isExplicitDeadline = normalizedType === "deadline";
      const isExplicitScheduled = normalizedType === "scheduled";

      if (isExplicitDeadline) {
        setTimeTypeMode("deadline");
        setDeadlineTime(getTaskEffectiveTime(task));
        setStartTime(undefined);
        setEndTime(undefined);
      } else if (isExplicitScheduled) {
        setTimeTypeMode("scheduled");
        setStartTime(getTaskEffectiveTime(task));
        setEndTime(task.endTime || undefined);
        setDeadlineTime(undefined);
      } else {
        // Chưa có loại giờ
        setTimeTypeMode("none");
        setStartTime(undefined);
        setEndTime(undefined);
        setDeadlineTime(undefined);
      }

      // Cập nhật tháng view ban đầu cho Calendar
      const d = existingDate ? new Date(existingDate) : new Date();
      if (!isNaN(d.getTime())) {
        setCalYear(d.getFullYear());
        setCalMonth(d.getMonth());
      }
    }
  }, [task, isOpen]);

  // Đăng ký phím Back phần cứng
  useEffect(() => {
    if (!isOpen) return;
    return registerBackHandler(() => {
      if (isTimePickerOpen) {
        setIsTimePickerOpen(false);
        return true;
      }
      if (isDatePickerOpen) {
        setIsDatePickerOpen(false);
        return true;
      }
      onClose();
      return true;
    });
  }, [isOpen, isDatePickerOpen, isTimePickerOpen, onClose]);

  // Mở Date Picker
  const handleOpenDatePicker = () => {
    const d = selectedDate ? new Date(selectedDate) : new Date();
    if (!isNaN(d.getTime())) {
      setCalYear(d.getFullYear());
      setCalMonth(d.getMonth());
    }
    setIsDatePickerOpen(true);
  };

  // Mở Time Picker với thanh kéo
  const handleOpenTimePicker = (target: "start" | "end" | "deadline") => {
    setEditingTimeTarget(target);
    let currentTimeStr =
      target === "start" ? startTime : target === "end" ? endTime : deadlineTime;

    if (currentTimeStr && currentTimeStr.includes(":")) {
      const [h, m] = currentTimeStr.split(":").map((num) => parseInt(num, 10));
      setSliderHour(isNaN(h) ? 9 : h);
      setSliderMinute(isNaN(m) ? 0 : m);
    } else {
      const now = new Date();
      setSliderHour(now.getHours());
      setSliderMinute(Math.floor(now.getMinutes() / 5) * 5);
    }
    setIsTimePickerOpen(true);
  };

  // Lưu giờ từ TimeSlider
  const handleSaveSliderTime = () => {
    const timeFormatted = `${String(sliderHour).padStart(2, "0")}:${String(
      sliderMinute
    ).padStart(2, "0")}`;

    if (editingTimeTarget === "start") {
      setStartTime(timeFormatted);
      setTimeTypeMode("scheduled");
    } else if (editingTimeTarget === "end") {
      setEndTime(timeFormatted);
      setTimeTypeMode("scheduled");
    } else {
      setDeadlineTime(timeFormatted);
      setTimeTypeMode("deadline");
    }
    setIsTimePickerOpen(false);
  };

  // Xóa giờ (chuyển về trạng thái chưa chọn loại giờ)
  const handleClearTime = () => {
    setStartTime(undefined);
    setEndTime(undefined);
    setDeadlineTime(undefined);
    setTimeTypeMode("none");
    setIsTimePickerOpen(false);
  };

  const handleParentChange = (value: string) => {
    setParentTaskId(value);
    if (!value) return;

    const parentTask = tasks.find((candidate) => candidate.id === value);
    if (!parentTask) return;

    const inherited = getInheritedParentSchedule(parentTask);
    const inheritedDate = inherited.deadlineDate || inherited.dueDate?.split(" ")[0];
    setSelectedDate(inheritedDate);

    if (inherited.timeType === "scheduled") {
      setTimeTypeMode("scheduled");
      setStartTime(inherited.startTime);
      setEndTime(inherited.endTime);
      setDeadlineTime(undefined);
    } else if (inherited.timeType === "deadline") {
      setTimeTypeMode("deadline");
      setDeadlineTime(inherited.deadlineTime);
      setStartTime(undefined);
      setEndTime(undefined);
    } else {
      setTimeTypeMode("none");
      setStartTime(undefined);
      setEndTime(undefined);
      setDeadlineTime(undefined);
    }
  };

  // 5. Xử Lý Lưu Toàn Bộ Dữ Liệu
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !task) return;

    const updates: Partial<TaskDto> = {
      title: title.trim(),
      notebookId: notebookId || undefined,
      parentTaskId: parentTaskId || undefined,
      priority,
      tag: selectedTag || undefined,
    };

    if (timeTypeMode === "scheduled") {
      updates.timeType = "scheduled";
      updates.dueDate = selectedDate
        ? startTime
          ? `${selectedDate} ${startTime}`
          : selectedDate
        : undefined;
      updates.startTime = startTime || undefined;
      updates.endTime = endTime || undefined;
      updates.deadlineDate = undefined;
      updates.deadlineTime = undefined;
    } else if (timeTypeMode === "deadline") {
      updates.timeType = "deadline";
      updates.deadlineDate = selectedDate || undefined;
      updates.deadlineTime = deadlineTime || undefined;
      updates.dueDate = selectedDate
        ? deadlineTime
          ? `${selectedDate} ${deadlineTime}`
          : selectedDate
        : undefined;
      updates.startTime = undefined;
      updates.endTime = undefined;
    } else {
      // timeTypeMode === "none" (Chưa chọn loại giờ)
      if (selectedDate) {
        // Đã có ngày nhưng chưa có giờ: giữ nguyên ngày vào dueDate
        updates.timeType = undefined;
        updates.dueDate = selectedDate;
        updates.startTime = undefined;
        updates.endTime = undefined;
        updates.deadlineDate = undefined;
        updates.deadlineTime = undefined;
      } else {
        // Hoàn toàn không có ngày và giờ (Chưa sắp lịch / Hộp chờ)
        updates.timeType = undefined;
        updates.dueDate = undefined;
        updates.startTime = undefined;
        updates.endTime = undefined;
        updates.deadlineDate = undefined;
        updates.deadlineTime = undefined;
      }
    }

    updateTask(task.id, updates);
    onClose();
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

  // Danh sách các task hợp lệ để làm task cha (loại trừ chính task đang sửa)
  const validParentTasks = getTaskParentCandidates(tasks, parentScope, {
    taskId: task?.id,
    date: parentScope === "notebook" ? undefined : getTaskEffectiveDate(task || ({} as TaskDto)),
    notebookId: parentScope === "notebook" ? notebookId : undefined,
  });

  if (!isOpen || !task) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        backgroundColor: "rgba(0, 0, 0, 0.82)",
        touchAction: "none",
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Chỉnh sửa công việc"
      className="flex items-end sm:items-center justify-center p-0 sm:p-4 select-none mobile-scrim-enter pointer-events-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-[#FBF9F4] border-t-[2px] sm:border-[2px] border-[#262626] rounded-t-[20px] sm:rounded-[8px] shadow-[0px_-4px_0px_#262626] sm:shadow-[6px_6px_0px_#262626] p-4 sm:p-5 flex flex-col justify-between overflow-hidden mobile-bottom-sheet-enter z-[1000000] max-h-[92vh]"
      >
        {/* Grab handle trên mobile */}
        <div className="w-12 h-1 bg-[#D4CEBF] rounded-full mx-auto mb-2.5 sm:hidden" />

        {/* Header Modal (BỎ HOÀN TOÀN NÚT X THEO ĐẶC TẢ TASK 30) */}
        <div className="flex items-center gap-2 pb-2.5 border-b border-[#262626] shrink-0">
          <span className="p-1.5 bg-[#FEF08A] border border-[#262626] rounded-[4px] shadow-[1px_1px_0px_#262626]">
            <Edit3 size={15} strokeWidth={2.4} className="text-[#1C1917]" />
          </span>
          <h3 className="font-bold text-sm sm:text-base text-[#1C1917]">
            Chỉnh sửa công việc
          </h3>
        </div>

        {/* Form Chỉnh Sửa Theo Thứ Tự Chuẩn Của Task 30 */}
        <form
          onSubmit={handleSave}
          className="space-y-3 text-xs overflow-y-auto no-scrollbar py-3 flex-1"
        >
          {/* 1. NỘI DUNG */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-[#1C1917] text-[11px]">
                1. Nội dung công việc:
              </label>
              <span className="text-[10px] font-mono text-[#78716C]">
                {title.length}/250
              </span>
            </div>
            <AutoResizeTextarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề việc cần làm..."
              minRows={2}
              maxRows={6}
              maxLength={250}
            />
          </div>

          {/* 2. THUỘC SỔ NÀO */}
          <div>
            <label className="font-bold text-[#1C1917] text-[11px] block mb-1">
              2. Thuộc cuốn sổ:
            </label>
            <CustomSelect
              value={notebookId}
              onChange={(val) => setNotebookId(val)}
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

          {/* 3. NHÃN / TAG */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-[#1C1917] text-[11px] flex items-center gap-1">
                <TagIcon size={12} strokeWidth={2.2} />
                <span>3. Nhãn phân loại:</span>
              </label>
              {!isAddingTag && (
                <button
                  type="button"
                  onClick={() => setIsAddingTag(true)}
                  className="text-[10px] font-bold text-[#78716C] hover:text-[#1C1917] flex items-center gap-0.5"
                >
                  <Plus size={11} />
                  <span>Tạo nhãn mới</span>
                </button>
              )}
            </div>

            {/* Tạo nhanh nhãn mới nếu bấm */}
            {isAddingTag && (
              <div className="flex items-center gap-1 mb-1.5 p-1 bg-white border border-[#262626] rounded">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  placeholder="Nhập tên nhãn..."
                  className="flex-1 px-1.5 py-0.5 text-[11px] border-none focus:outline-none bg-transparent"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateNewTag(e);
                    if (e.key === "Escape") setIsAddingTag(false);
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleCreateNewTag}
                  className="p-1 bg-[#BBF7D0] border border-[#262626] rounded text-[10px] font-bold"
                >
                  <Check size={10} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingTag(false)}
                  className="p-1 bg-white border border-[#262626] rounded text-[10px]"
                >
                  <X size={10} />
                </button>
              </div>
            )}

            {/* Dropdown Custom Chọn Nhãn/Tag Gọn Gàng */}
            <CustomSelect
              value={selectedTag}
              onChange={(val) => setSelectedTag(val)}
              options={[
                { value: "", label: "Không gắn nhãn" },
                ...tags.map((tg) => ({
                  value: tg,
                  label: `#${tg}`,
                })),
              ]}
              className="w-full"
            />
          </div>

          {/* 4. THUỘC CÔNG VIỆC NÀO (CÔNG VIỆC CHA - SUBTASK) */}
          <div>
            <label className="font-bold text-[#1C1917] text-[11px] block mb-1">
              4. Thuộc công việc nào (Công việc cha):
            </label>
            <CustomSelect
              value={parentTaskId}
              onChange={handleParentChange}
              options={[
                { value: "", label: "Không thuộc công việc nào" },
                ...validParentTasks.map((t) => ({
                  value: t.id,
                  label: t.title.length > 32 ? `${t.title.substring(0, 32)}...` : t.title,
                })),
              ]}
              className="w-full"
            />
          </div>

          {/* 5. THIẾT LẬP THỜI GIAN (NGÀY RIÊNG BIỆT) */}
          <div className="space-y-1 pt-1 border-t border-[#D4CEBF]/60">
            <div className="flex items-center justify-between">
              <label className="font-bold text-[#1C1917] text-[11px]">
                5. Thiết lập ngày:
              </label>
              {selectedDate && (
                <button
                  type="button"
                  onClick={() => setSelectedDate(undefined)}
                  className="text-[10px] font-bold text-rose-700 hover:underline flex items-center gap-0.5"
                >
                  <X size={10} />
                  <span>Xóa ngày</span>
                </button>
              )}
            </div>

            {/* Control Chọn Ngày */}
            <button
              type="button"
              onClick={handleOpenDatePicker}
              className={`w-full p-2.5 border-[1.5px] border-[#262626] rounded-[5px] text-left shadow-[1.5px_1.5px_0px_#262626] flex items-center justify-between transition-all active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none ${
                selectedDate
                  ? "bg-white hover:bg-amber-50/50"
                  : "bg-[#F5F2EA] hover:bg-[#EFEAE0]"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`w-7 h-7 rounded border border-[#262626] flex items-center justify-center shrink-0 ${
                    selectedDate
                      ? "bg-[#FEF08A] text-[#1C1917]"
                      : "bg-[#E7E5E4] text-[#78716C]"
                  }`}
                >
                  <CalendarIcon size={14} strokeWidth={2.4} />
                </span>
                <div className="min-w-0">
                  <p className="text-[9px] text-[#78716C] font-semibold">
                    {selectedDate ? "Ngày đã thiết lập:" : "Trạng thái ngày:"}
                  </p>
                  <p
                    className={`font-bold text-xs truncate ${
                      selectedDate ? "text-[#1C1917]" : "text-[#78716C] italic"
                    }`}
                  >
                    {selectedDate ? formatFullDate(selectedDate) : "Chưa thiết lập ngày"}
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-bold text-[#1C1917] bg-[#FCFBF9] border border-[#262626] px-2 py-0.5 rounded shadow-[1px_1px_0px_#262626] shrink-0">
                {selectedDate ? "Đổi ngày" : "Chọn ngày"}
              </span>
            </button>
          </div>

          {/* 6. GIỜ HẸN VÀ GIỜ CHÓT (ẨN HIỆN THÔNG MINH THEO YÊU CẦU TASK 30) */}
          <div className="space-y-1 pt-1 border-t border-[#D4CEBF]/60">
            <div className="flex items-center justify-between">
              <label className="font-bold text-[#1C1917] text-[11px]">
                6. Giờ hẹn & Giờ chót:
              </label>
              {timeTypeMode !== "none" && (
                <button
                  type="button"
                  onClick={handleClearTime}
                  className="text-[10px] font-bold text-rose-700 hover:underline flex items-center gap-0.5"
                >
                  <X size={10} />
                  <span>Xóa giờ</span>
                </button>
              )}
            </div>

            {/* TRƯỜNG HỢP A: ĐÃ CHỌN GIỜ HẸN (SCHEDULED) -> CHỈ HIỆN GIỜ HẸN, ẨN GIỜ CHÓT */}
            {timeTypeMode === "scheduled" && (
              <div className="p-2.5 bg-amber-50/60 border border-[#262626] rounded-[6px] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 border border-[#262626]" />
                    <span className="font-bold text-xs text-amber-950">Lịch hẹn</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTimeTypeMode("deadline");
                      setDeadlineTime(startTime);
                      setStartTime(undefined);
                      setEndTime(undefined);
                    }}
                    className="text-[10px] font-bold text-[#78716C] hover:text-[#1C1917] underline"
                  >
                    Đổi sang giờ chót
                  </button>
                </div>

                {/* Control Giờ Hẹn */}
                <button
                  type="button"
                  onClick={() => handleOpenTimePicker("start")}
                  className="w-full p-2 bg-white hover:bg-amber-100/40 border-[1.5px] border-[#262626] rounded-[5px] text-left shadow-[1.5px_1.5px_0px_#262626] flex items-center justify-between transition-all active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-amber-100 border border-[#262626] flex items-center justify-center text-amber-900">
                      <Clock size={13} strokeWidth={2.4} />
                    </span>
                    <div>
                      <p className="text-[9px] text-[#78716C] font-semibold">Giờ bắt đầu:</p>
                      <p className="font-bold text-xs text-[#1C1917]">
                        {startTime ? startTime : "Chọn giờ hẹn"}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#1C1917] bg-[#FCFBF9] border border-[#262626] px-2 py-0.5 rounded shadow-[1px_1px_0px_#262626]">
                    {startTime ? "Đổi giờ" : "Chọn giờ"}
                  </span>
                </button>

                {/* Tùy chọn giờ kết thúc */}
                <div className="flex items-center justify-between pt-1 border-t border-amber-200/60 text-[11px]">
                  {endTime ? (
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium text-amber-950">
                        Đến lúc: <strong className="font-mono">{endTime}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => setEndTime(undefined)}
                        className="text-[10px] font-bold text-rose-700 hover:underline"
                      >
                        Bỏ giờ kết thúc
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenTimePicker("end")}
                      className="text-[10px] font-bold text-amber-950 hover:text-black flex items-center gap-1 active:translate-y-[0.5px]"
                    >
                      <Plus size={11} strokeWidth={2.4} />
                      <span>Thêm giờ kết thúc</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* TRƯỜNG HỢP B: ĐÃ CHỌN GIỜ CHÓT (DEADLINE) -> CHỈ HIỆN GIỜ CHÓT, ẨN GIỜ HẸN */}
            {timeTypeMode === "deadline" && (
              <div className="p-2.5 bg-rose-50/60 border border-[#262626] rounded-[6px] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 border border-[#262626]" />
                    <span className="font-bold text-xs text-rose-950">Hạn chót hoàn thành</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTimeTypeMode("scheduled");
                      setStartTime(deadlineTime);
                      setDeadlineTime(undefined);
                      setEndTime(undefined);
                    }}
                    className="text-[10px] font-bold text-[#78716C] hover:text-[#1C1917] underline"
                  >
                    Đổi sang giờ hẹn
                  </button>
                </div>

                {/* Control Giờ Chót */}
                <button
                  type="button"
                  onClick={() => handleOpenTimePicker("deadline")}
                  className="w-full p-2 bg-white hover:bg-rose-100/40 border-[1.5px] border-[#262626] rounded-[5px] text-left shadow-[1.5px_1.5px_0px_#262626] flex items-center justify-between transition-all active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-rose-100 border border-[#262626] flex items-center justify-center text-rose-900">
                      <Clock size={13} strokeWidth={2.4} />
                    </span>
                    <div>
                      <p className="text-[9px] text-[#78716C] font-semibold">Hoàn thành trước:</p>
                      <p className="font-bold text-xs text-[#1C1917]">
                        {deadlineTime ? deadlineTime : "Chọn giờ chót"}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#1C1917] bg-[#FCFBF9] border border-[#262626] px-2 py-0.5 rounded shadow-[1px_1px_0px_#262626]">
                    {deadlineTime ? "Đổi giờ" : "Chọn giờ"}
                  </span>
                </button>
              </div>
            )}

            {/* TRƯỜNG HỢP C: CHƯA CÓ LOẠI GIỜ -> HIỆN 2 NÚT NẰM CẠNH NHAU */}
            {timeTypeMode === "none" && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenTimePicker("start")}
                  className="p-2 bg-white hover:bg-amber-50/50 border-[1.5px] border-[#262626] rounded-[5px] text-left shadow-[1.5px_1.5px_0px_#262626] flex items-center gap-2 transition-all active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
                >
                  <span className="w-6 h-6 rounded bg-amber-100 border border-[#262626] flex items-center justify-center text-amber-900 shrink-0">
                    <Clock size={12} strokeWidth={2.4} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-[#1C1917] truncate">
                      Chọn giờ hẹn
                    </p>
                    <p className="text-[9px] text-[#78716C] truncate">Lịch diễn ra</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenTimePicker("deadline")}
                  className="p-2 bg-white hover:bg-rose-50/50 border-[1.5px] border-[#262626] rounded-[5px] text-left shadow-[1.5px_1.5px_0px_#262626] flex items-center gap-2 transition-all active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
                >
                  <span className="w-6 h-6 rounded bg-rose-100 border border-[#262626] flex items-center justify-center text-rose-900 shrink-0">
                    <Clock size={12} strokeWidth={2.4} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-[#1C1917] truncate">
                      Chọn giờ chót
                    </p>
                    <p className="text-[9px] text-[#78716C] truncate">Hạn phải xong</p>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* 7. MỨC ĐỘ ƯU TIÊN */}
          <div className="space-y-1 pt-1 border-t border-[#D4CEBF]/60">
            <label className="font-bold text-[#1C1917] text-[11px] block">
              7. Mức độ ưu tiên:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPriority("high")}
                className={`py-1.5 px-2 rounded-[5px] border-[1.5px] font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  priority === "high"
                    ? "bg-[#FECDD3] text-rose-900 border-[#262626] shadow-[2px_2px_0px_#262626]"
                    : "bg-white text-[#78716C] border-[#D4CEBF] hover:border-[#262626]"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Gấp</span>
              </button>

              <button
                type="button"
                onClick={() => setPriority("medium")}
                className={`py-1.5 px-2 rounded-[5px] border-[1.5px] font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  priority === "medium"
                    ? "bg-[#FEF08A] text-amber-900 border-[#262626] shadow-[2px_2px_0px_#262626]"
                    : "bg-white text-[#78716C] border-[#D4CEBF] hover:border-[#262626]"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Vừa</span>
              </button>

              <button
                type="button"
                onClick={() => setPriority("low")}
                className={`py-1.5 px-2 rounded-[5px] border-[1.5px] font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  priority === "low"
                    ? "bg-[#BBF7D0] text-emerald-900 border-[#262626] shadow-[2px_2px_0px_#262626]"
                    : "bg-white text-[#78716C] border-[#D4CEBF] hover:border-[#262626]"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Thấp</span>
              </button>
            </div>
          </div>

          {/* 8. NÚT HÀNH ĐỘNG (LƯU THAY ĐỔI & HỦY) */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#262626] shrink-0">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="px-4 text-xs font-bold"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="px-5 text-xs font-bold shadow-[2px_2px_0px_#262626] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex items-center gap-1.5"
            >
              <Check size={14} strokeWidth={2.4} />
              <span>Lưu thay đổi</span>
            </Button>
          </div>
        </form>

        {/* SUB-MODAL 1: BỘ CHỌN NGÀY RIÊNG BIỆT (Date Picker Sheet) */}
        {isDatePickerOpen && (
          <div
            onClick={() => setIsDatePickerOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1000001,
              backgroundColor: "rgba(0, 0, 0, 0.75)",
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Chọn ngày cho công việc"
            className="flex items-end sm:items-center justify-center p-0 sm:p-4 select-none mobile-scrim-enter"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-[#FBF9F4] border-t-[2px] sm:border-[2px] border-[#262626] rounded-t-[18px] sm:rounded-[8px] p-4 shadow-[0px_-4px_0px_#262626] sm:shadow-[6px_6px_0px_#262626] space-y-3 mobile-bottom-sheet-enter"
            >
              {/* Header Date Picker */}
              <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
                <div className="flex items-center gap-1.5">
                  <CalendarIcon size={16} className="text-[#1C1917]" />
                  <h4 className="font-bold text-xs sm:text-sm text-[#1C1917]">
                    Chọn ngày cho công việc
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDatePickerOpen(false)}
                  className="w-6 h-6 rounded bg-white hover:bg-rose-50 border border-[#262626] flex items-center justify-center text-[#78716C]"
                >
                  <X size={13} strokeWidth={2.4} />
                </button>
              </div>

              {/* Lưới Lịch Tháng */}
              <CalendarMonth
                selectedDate={selectedDate || todayStr}
                onSelectDate={(dStr) => {
                  setSelectedDate(dStr);
                  setIsDatePickerOpen(false);
                }}
                viewYear={calYear}
                viewMonth={calMonth}
                onPrevMonth={() => {
                  if (calMonth === 0) {
                    setCalMonth(11);
                    setCalYear((y) => y - 1);
                  } else {
                    setCalMonth((m) => m - 1);
                  }
                }}
                onNextMonth={() => {
                  if (calMonth === 11) {
                    setCalMonth(0);
                    setCalYear((y) => y + 1);
                  } else {
                    setCalMonth((m) => m + 1);
                  }
                }}
                accentMode={timeTypeMode === "deadline" ? "deadline" : "scheduled"}
              />

              {/* Các nút chọn nhanh */}
              <div className="flex items-center justify-between gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate(todayStr);
                    setIsDatePickerOpen(false);
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold bg-white border border-[#262626] rounded hover:bg-[#FEF08A] shadow-[1px_1px_0px_#262626] transition-all"
                >
                  Hôm nay
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate(getLocalTomorrowStr());
                    setIsDatePickerOpen(false);
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold bg-white border border-[#262626] rounded hover:bg-[#BAE6FD] shadow-[1px_1px_0px_#262626] transition-all"
                >
                  Ngày mai
                </button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => setIsDatePickerOpen(false)}
                  className="text-[11px] font-bold px-3 py-1"
                >
                  Xong
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* SUB-MODAL 2: BỘ CHỌN GIỜ RIÊNG BIỆT VỚI THANH TRƯỢT (Time Slider Sheet) */}
        {isTimePickerOpen && (
          <div
            onClick={() => setIsTimePickerOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1000001,
              backgroundColor: "rgba(0, 0, 0, 0.75)",
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Chọn giờ cho công việc"
            className="flex items-end sm:items-center justify-center p-0 sm:p-4 select-none mobile-scrim-enter"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-[#FBF9F4] border-t-[2px] sm:border-[2px] border-[#262626] rounded-t-[18px] sm:rounded-[8px] p-4 shadow-[0px_-4px_0px_#262626] sm:shadow-[6px_6px_0px_#262626] space-y-3.5 mobile-bottom-sheet-enter"
            >
              {/* Grab handle mobile */}
              <div className="w-12 h-1 bg-[#D4CEBF] rounded-full mx-auto mb-1.5 sm:hidden" />

              {/* Header Time Picker */}
              <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
                <div className="flex items-center gap-1.5">
                  <Clock size={16} className="text-[#1C1917]" />
                  <h4 className="font-bold text-xs sm:text-sm text-[#1C1917]">
                    {editingTimeTarget === "start"
                      ? "Chọn giờ hẹn (Bắt đầu)"
                      : editingTimeTarget === "end"
                      ? "Chọn giờ kết thúc"
                      : "Chọn giờ chót"}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTimePickerOpen(false)}
                  className="w-6 h-6 rounded bg-white hover:bg-rose-50 border border-[#262626] flex items-center justify-center text-[#78716C]"
                >
                  <X size={13} strokeWidth={2.4} />
                </button>
              </div>

              {/* Thanh Kéo Giờ & Phút TimeSliderAdjuster */}
              <TimeSliderAdjuster
                hour={sliderHour}
                minute={sliderMinute}
                onHourChange={(h) => setSliderHour(h)}
                onMinuteChange={(m) => setSliderMinute(m)}
                accentColor={editingTimeTarget === "deadline" ? "#FECDD3" : "#FEF08A"}
              />

              {/* Footer Time Picker */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#D4CEBF]/80">
                <button
                  type="button"
                  onClick={handleClearTime}
                  className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-white hover:bg-rose-50 border border-[#262626] rounded shadow-[1px_1px_0px_#262626] transition-all"
                >
                  Xóa giờ
                </button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleSaveSliderTime}
                  className="px-5 text-xs font-bold shadow-[2px_2px_0px_#262626]"
                >
                  Xong
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
