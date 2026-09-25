import React, { useState, useEffect, useRef } from "react";
import { useAppStore } from "../../../stores/appStore";
import { TaskItemType, TaskPriority } from "../../../types";
import { getLocalTodayStr } from "../../../utils/date";
import { TagInputSelector } from "../../ui/pickers/select/TagInputSelector";
import { TimePickerPopover } from "../../ui/pickers/time/TimePickerPopover";
import { DatePickerPopover } from "../../ui/pickers/time/DatePickerPopover";
import { useScrollLock } from "../../../hooks/useScrollLock";
import { normalizeEndTimeForStart } from "../../../utils/taskSemantics";
import {
  X,
  Plus,
  Calendar,
  Clock,
  Tag as TagIcon,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Check,
} from "lucide-react";

type QuickTaskSection = "timing" | "organize" | "notes";

interface QuickTaskSectionProps {
  title: string;
  icon: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const QuickTaskAccordion: React.FC<QuickTaskSectionProps> = ({
  title,
  icon,
  open,
  onToggle,
  children,
}) => (
  <section
    className={`relative bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden shadow-2xs ${
      open ? "z-30 shadow-xs" : "z-0"
    }`}
  >
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className={`w-full min-h-[42px] px-3.5 py-2.5 flex items-center justify-between gap-2 text-left cursor-pointer transition-colors ${
        open
          ? "bg-black/[0.03] dark:bg-white/[0.05] text-[#1C1C1E] dark:text-[#F2F2F7]"
          : "bg-white dark:bg-[#1E222A] hover:bg-black/[0.02] dark:hover:bg-white/[0.02] text-[#1C1C1E] dark:text-[#F2F2F7]"
      } focus-visible:outline-none`}
    >
      <span className="text-sm font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] flex items-center gap-2.5">
        <span className="w-6 h-6 rounded-xl bg-black/[0.05] dark:bg-white/[0.1] text-[#007AFF] dark:text-[#0A84FF] flex items-center justify-center shrink-0">
          {icon}
        </span>
        <span>{title}</span>
      </span>
      <span className="text-[#8E8E93] flex items-center justify-center shrink-0">
        {open ? <ChevronUp size={16} strokeWidth={2.2} /> : <ChevronDown size={16} strokeWidth={2.2} />}
      </span>
    </button>
    {open && <div className="p-3.5 space-y-3.5 bg-white dark:bg-[#1E222A]">{children}</div>}
  </section>
);

// ==========================================
// COMPONENT: QuickTaskModal (Hộp Thoại Thêm Nhanh Công Việc Chuẩn TaskNotes)
// ==========================================

export const QuickTaskModal: React.FC = () => {
  const {
    isQuickTaskModalOpen,
    quickTaskInitialData,
    closeQuickTaskModal,
    addTask,
    activeTaskSubTab,
    openTaskDetail,
  } = useAppStore();
  const isItemTypeLocked = Boolean(quickTaskInitialData?.lockItemType);

  const todayStr = getLocalTodayStr(new Date());

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(todayStr);
  const [isDateRange, setIsDateRange] = useState(false);
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState("");
  const [itemType, setItemType] = useState<TaskItemType>("task");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [showEndTime, setShowEndTime] = useState(false);
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [selectedTag, setSelectedTag] = useState<string | undefined>();
  const [showDetails, setShowDetails] = useState(false);
  const [openSections, setOpenSections] = useState<Record<QuickTaskSection, boolean>>({
    timing: true,
    organize: false,
    notes: false,
  });

  const inputRef = useRef<HTMLInputElement>(null);

  useScrollLock(isQuickTaskModalOpen);

  // Reset và nạp giá trị khi modal mở
  useEffect(() => {
    if (isQuickTaskModalOpen) {
      setTitle("");
      setDescription("");
      const initialDate = quickTaskInitialData?.dueDate || todayStr;
      setDueDate(initialDate);
      setIsDateRange(false);
      setStartDate(initialDate);
      setEndDate("");
      const initialItemType =
        quickTaskInitialData?.itemType ||
        (quickTaskInitialData?.timeType === "event" ? "event" : "task");
      setItemType(initialItemType);
      const initialStartTime = quickTaskInitialData?.startTime || "";
      const initialEndTime = quickTaskInitialData?.endTime || "";
      setStartTime(initialStartTime);
      setEndTime(normalizeEndTimeForStart(initialStartTime, initialEndTime) || "");
      setShowEndTime(
        initialItemType === "event" ||
          Boolean(initialEndTime) ||
          quickTaskInitialData?.timeType === "scheduled"
      );
      setPriority("medium");
      setSelectedTag(quickTaskInitialData?.tag);
      setShowDetails(false);
      setOpenSections({
        timing: true,
        organize: false,
        notes: false,
      });

      window.setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isQuickTaskModalOpen, quickTaskInitialData, todayStr]);

  // Phím tắt ESC để đóng modal
  useEffect(() => {
    if (!isQuickTaskModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeQuickTaskModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isQuickTaskModalOpen, closeQuickTaskModal]);

  if (!isQuickTaskModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const resolvedStartTime = !isDateRange ? startTime : "";
    const resolvedEndTime =
      !isDateRange && (itemType === "event" || showEndTime)
        ? normalizeEndTimeForStart(resolvedStartTime, endTime)
        : undefined;

    let resolvedTimeType: "event" | "scheduled" | "deadline" | "task" = "task";
    if (itemType === "event") {
      resolvedTimeType = "event";
    } else if (showEndTime && resolvedStartTime && resolvedEndTime) {
      resolvedTimeType = "scheduled";
    } else if (resolvedStartTime) {
      resolvedTimeType = "deadline";
    }

    addTask({
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate: isDateRange ? (startDate || todayStr) : (dueDate || todayStr),
      startDate: isDateRange ? (startDate || todayStr) : undefined,
      endDate: isDateRange ? (endDate || undefined) : undefined,
      itemType,
      timeType: resolvedTimeType,
      startTime: resolvedTimeType === "scheduled" || resolvedTimeType === "event" ? resolvedStartTime : undefined,
      endTime: resolvedTimeType === "scheduled" || resolvedTimeType === "event" ? resolvedEndTime : undefined,
      deadlineTime: resolvedTimeType === "deadline" ? resolvedStartTime : undefined,
      priority,
      tag: selectedTag,
    });

    closeQuickTaskModal();
  };

  const handleOpenFullDetail = () => {
    const resolvedStartTime = !isDateRange ? startTime : "";
    const resolvedEndTime =
      !isDateRange && (itemType === "event" || showEndTime)
        ? normalizeEndTimeForStart(resolvedStartTime, endTime)
        : undefined;

    let resolvedTimeType: "event" | "scheduled" | "deadline" | "task" = "task";
    if (itemType === "event") {
      resolvedTimeType = "event";
    } else if (showEndTime && resolvedStartTime && resolvedEndTime) {
      resolvedTimeType = "scheduled";
    } else if (resolvedStartTime) {
      resolvedTimeType = "deadline";
    }

    openTaskDetail("new", {
      title,
      description,
      dueDate: isDateRange ? startDate || todayStr : dueDate || todayStr,
      startDate: isDateRange ? startDate || todayStr : undefined,
      endDate: isDateRange ? endDate || undefined : undefined,
      tag: selectedTag,
      itemType,
      lockItemType: isItemTypeLocked,
      timeType: resolvedTimeType,
      startTime: resolvedTimeType === "scheduled" || resolvedTimeType === "event" ? resolvedStartTime : undefined,
      endTime: resolvedTimeType === "scheduled" || resolvedTimeType === "event" ? resolvedEndTime : undefined,
      deadlineTime: resolvedTimeType === "deadline" ? resolvedStartTime : undefined,
      priority,
    });
    closeQuickTaskModal();
  };

  const toggleSection = (section: QuickTaskSection) => {
    setOpenSections((current) => ({ ...current, [section]: !current[section] }));
  };

  // Xác định tên ngữ cảnh hiện tại
  const contextName =
    activeTaskSubTab === "today"
      ? "Hôm nay"
      : activeTaskSubTab === "planner"
      ? "Kế hoạch"
      : activeTaskSubTab === "deadlines"
      ? "Hạn định"
      : activeTaskSubTab === "all"
      ? "Công việc"
      : "Công việc";

  return (
    <div className="fixed inset-0 z-[999999] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150 select-none overflow-y-auto">
      {/* Backdrop click to close */}
      <div
        className="fixed inset-0"
        onClick={closeQuickTaskModal}
        aria-hidden="true"
      />

      {/* Bottom sheet mobile bo hai góc trên; desktop và tablet bo đủ bốn góc. */}
      <div
        className="relative z-[1000000] w-full max-w-lg bg-white dark:bg-[#1E222A] border border-black/[0.06] dark:border-white/[0.08] rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh] md:max-h-[82vh] my-0 md:my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-4 pb-3 flex items-start justify-between bg-white/80 dark:bg-[#1E222A]/90 backdrop-blur-xl shrink-0">
          <div>
            <span className="text-xs font-medium text-[#8E8E93] block">
              {contextName}
            </span>
            <h2 className="text-lg font-bold text-[#1C1917] dark:text-[#F2F2F7] tracking-tight">
              {itemType === "event" ? "Tạo sự kiện" : "Tạo công việc"}
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleOpenFullDetail}
              className="hidden md:inline-flex p-2 text-[#8E8E93] hover:text-[#1C1917] dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] rounded-2xl transition-all cursor-pointer shadow-xs"
              title="Mở toàn màn hình chi tiết"
            >
              <Maximize2 size={15} strokeWidth={2.2} />
            </button>
            <button
              type="button"
              onClick={closeQuickTaskModal}
              className="p-2 text-[#8E8E93] hover:text-[#1C1917] dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] rounded-2xl transition-all cursor-pointer shadow-xs"
              title="Đóng"
            >
              <X size={16} strokeWidth={2.2} />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Mobile/tablet giữ bộ chọn cũ; Desktop khóa loại theo workspace tạo mới. */}
          {!isItemTypeLocked && (
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#F2F2F7] dark:bg-[#2C2C2E] p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setItemType("task")}
              className={`flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                itemType === "task"
                  ? "bg-white dark:bg-[#1C1C1E] text-[#1C1C1E] dark:text-white shadow-xs"
                  : "text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white"
              }`}
            >
              <Check size={15} strokeWidth={2.4} />
              <span>Công việc</span>
            </button>
            <button
              type="button"
              onClick={() => setItemType("event")}
              className={`flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                itemType === "event"
                  ? "bg-white dark:bg-[#1C1C1E] text-[#1C1C1E] dark:text-white shadow-xs"
                  : "text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white"
              }`}
            >
              <Calendar size={15} strokeWidth={2.4} />
              <span>Sự kiện</span>
            </button>
          </div>
          )}

          {/* Main Title Input Row */}
          <div className="flex items-center gap-2 pb-2.5">
            <div className="w-7 h-7 rounded-2xl bg-[#007AFF] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Plus size={14} strokeWidth={2.6} />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={itemType === "event" ? "Nhập tên sự kiện..." : "Nhập tên việc..."}
              className="flex-1 min-w-0 bg-black/[0.03] dark:bg-white/[0.04] px-3 py-2 text-sm sm:text-base font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] placeholder:text-[#8E8E93] focus:outline-none tracking-tight rounded-2xl shadow-2xs"
            />
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-4 py-2 bg-[#1C1917] dark:bg-white text-white dark:text-[#1C1917] disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold rounded-2xl shadow-xs active:scale-95 cursor-pointer transition-all shrink-0"
            >
              {itemType === "event" ? "Tạo" : "Thêm"}
            </button>
          </div>

          {/* Sub Row: Add details toggle */}
          <div className="flex items-center justify-end text-xs">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="font-semibold text-[#007AFF] dark:text-[#0A84FF] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{showDetails ? "Thu gọn" : "+ Thêm chi tiết"}</span>
              {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {/* Expandable Detailed Sections */}
          {showDetails && (
            <div className="space-y-3 pt-1 animate-in fade-in duration-150">
              {/* SECTION 1: LỊCH HẸN & HẠN CHÓT */}
              <QuickTaskAccordion
                title="Thời gian"
                icon={<Calendar size={13} />}
                open={openSections.timing}
                onToggle={() => toggleSection("timing")}
              >

                {/* Chuyển đổi giữa Trong ngày & Khoảng ngày */}
                <div className="flex items-center justify-between pb-2 text-xs">
                  <span className="font-medium text-[#8E8E93] flex items-center gap-1.5">
                    <Calendar size={13} />
                    <span>Kiểu hiển thị:</span>
                  </span>
                  <div className="flex items-center gap-1 p-1 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setIsDateRange(false);
                        setEndDate("");
                      }}
                      className={`px-3 py-1 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
                        !isDateRange
                          ? "bg-white dark:bg-[#1C1C1E] text-[#1C1C1E] dark:text-white shadow-xs"
                          : "text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white"
                      }`}
                    >
                      Trong ngày
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDateRange(true);
                        setStartTime("");
                        setEndTime("");
                        if (!endDate) {
                          setStartDate(dueDate || todayStr);
                          const d = new Date(dueDate || todayStr);
                          d.setDate(d.getDate() + 2);
                          setEndDate(d.toISOString().split("T")[0]);
                        }
                      }}
                      className={`px-3 py-1 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
                        isDateRange
                          ? "bg-white dark:bg-[#1C1C1E] text-[#1C1C1E] dark:text-white shadow-xs"
                          : "text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white"
                      }`}
                    >
                      Khoảng ngày
                    </button>
                  </div>
                </div>

                {!isDateRange ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm">
                    {/* Ngày thực hiện / Hạn chót */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-[#8E8E93] flex items-center gap-1.5">
                        <Calendar size={12} />
                        <span>Ngày:</span>
                      </label>
                      <DatePickerPopover
                        value={dueDate}
                        onChange={setDueDate}
                        placeholder="Chọn ngày"
                        className="w-full"
                      />
                    </div>

                    {/* Bộ chọn giờ: Task mặc định 1 ô deadline + nút mở rộng; Event luôn là khung giờ */}
                    <div className="space-y-1">
                      {itemType === "task" && !showEndTime ? (
                        <>
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-[#8E8E93] flex items-center gap-1.5">
                              <Clock size={12} />
                              <span>Giờ hạn chót:</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setShowEndTime(true);
                                if (!endTime) {
                                  setEndTime(normalizeEndTimeForStart(startTime, "") || "");
                                }
                              }}
                              className="text-[11px] font-bold text-[var(--accent-blue)] hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Plus size={11} strokeWidth={2.6} />
                              <span>Thêm giờ kết thúc</span>
                            </button>
                          </div>
                          <TimePickerPopover
                            value={startTime}
                            onChange={(value) => {
                              setStartTime(value);
                              setEndTime((currentEndTime) =>
                                normalizeEndTimeForStart(value, currentEndTime) || ""
                              );
                            }}
                            placeholder="Chọn giờ hạn chót"
                            className="w-full"
                          />
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-[#8E8E93] flex items-center gap-1.5">
                              <Clock size={12} />
                              <span>Khung giờ:</span>
                            </label>
                            {itemType === "task" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setShowEndTime(false);
                                  setEndTime("");
                                }}
                                className="text-[11px] font-medium text-[#8E8E93] hover:text-[#FF3B30] flex items-center gap-0.5 cursor-pointer"
                                title="Thu về một mốc hạn chót"
                              >
                                <X size={11} strokeWidth={2.4} />
                                <span>Bỏ giờ kết thúc</span>
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <TimePickerPopover
                              value={startTime}
                              onChange={(value) => {
                                setStartTime(value);
                                setEndTime((currentEndTime) =>
                                  normalizeEndTimeForStart(value, currentEndTime) || ""
                                );
                              }}
                              placeholder="Bắt đầu"
                              className="flex-1 min-w-0"
                            />
                            <span className="text-xs font-medium text-[#8E8E93]">-</span>
                            <TimePickerPopover
                              value={endTime}
                              onChange={(value) =>
                                setEndTime(normalizeEndTimeForStart(startTime, value) || "")
                              }
                              minTime={startTime || undefined}
                              placeholder="Kết thúc"
                              align="right"
                              className="flex-1 min-w-0"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5 text-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Từ ngày */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-[#8E8E93] flex items-center gap-1.5">
                          <Calendar size={12} />
                          <span>Từ ngày:</span>
                        </label>
                        <DatePickerPopover
                          value={startDate || dueDate}
                          onChange={(val) => {
                            setStartDate(val);
                            setDueDate(val);
                          }}
                          placeholder="Ngày bắt đầu"
                          className="w-full"
                        />
                      </div>

                      {/* Đến ngày */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-[#8E8E93] flex items-center gap-1.5">
                          <Calendar size={12} />
                          <span>Đến ngày:</span>
                        </label>
                        <DatePickerPopover
                          value={endDate}
                          onChange={setEndDate}
                          placeholder="Ngày kết thúc"
                          className="w-full"
                        />
                      </div>
                    </div>

                    <p className="pt-2 text-xs font-medium text-[#8E8E93]">
                      Khoảng ngày là lịch cả ngày, không dùng giờ bắt đầu và kết thúc.
                    </p>
                  </div>
                )}

              </QuickTaskAccordion>

              {/* SECTION 2: PHÂN LOẠI & ƯU TIÊN */}
              <QuickTaskAccordion
                title="Phân loại"
                icon={<Sparkles size={13} />}
                open={openSections.organize}
                onToggle={() => toggleSection("organize")}
              >
                <div className="space-y-3 text-sm">
                  {/* Mức độ ưu tiên (Chỉ dành cho Task) */}
                  {itemType === "task" && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-xs text-[#8E8E93] flex items-center gap-1.5 shrink-0">
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
                            onClick={() => setPriority(p.key as TaskPriority)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 ${
                              priority === p.key
                                ? "bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] shadow-2xs font-bold"
                                : "bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white"
                            }`}
                          >
                            <span className="font-mono text-[10px]">{p.sym}</span>
                            <span>{p.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Một task chỉ thuộc một nhãn/danh sách. */}
                  <div className={`${itemType === "task" ? "pt-2" : ""} space-y-1.5`}>
                    <span className="font-medium text-xs text-[#8E8E93] flex items-center gap-1.5">
                      <TagIcon size={12} />
                      <span>Nhãn:</span>
                    </span>
                    <TagInputSelector
                      selectedTag={selectedTag}
                      onChange={setSelectedTag}
                      placeholder="Tạo nhãn (vd: Học tập)"
                    />
                  </div>
                </div>
              </QuickTaskAccordion>

              {/* SECTION 3: GHI CHÚ */}
              <QuickTaskAccordion
                title="Ghi chú"
                icon={<TagIcon size={13} />}
                open={openSections.notes}
                onToggle={() => toggleSection("notes")}
              >
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Thêm ghi chú chi tiết..."
                  className="w-full p-3 bg-black/[0.04] dark:bg-white/[0.06] rounded-2xl text-sm font-medium text-[#1C1C1E] dark:text-[#F2F2F7] placeholder:text-[#8E8E93] focus:outline-none shadow-2xs resize-none"
                />
              </QuickTaskAccordion>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-[#F2F2F7]/80 dark:bg-black/40 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={closeQuickTaskModal}
            className="px-4 py-2 rounded-2xl bg-white dark:bg-[#2C2C2E] hover:bg-[#F2F2F7] dark:hover:bg-[#3A3A3C] text-xs font-semibold text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white shadow-xs active:scale-95 cursor-pointer transition-all"
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="px-4 py-2 rounded-2xl bg-[#1C1917] dark:bg-white text-white dark:text-[#1C1917] disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold shadow-xs hover:opacity-90 active:scale-95 cursor-pointer flex items-center gap-1.5 transition-all"
          >
            <Check size={14} strokeWidth={2.4} />
            <span>{itemType === "event" ? "Tạo sự kiện" : "Tạo công việc"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
