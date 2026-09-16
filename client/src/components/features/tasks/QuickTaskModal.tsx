import React, { useState, useEffect, useRef } from "react";
import { useAppStore } from "../../../stores/appStore";
import { TaskPriority, TaskTimeType } from "../../../types";
import { getLocalTodayStr } from "../../../utils/date";
import { TagInputSelector } from "../../ui/pickers/select/TagInputSelector";
import { TimePickerPopover } from "../../ui/pickers/time/TimePickerPopover";
import { DatePickerPopover } from "../../ui/pickers/time/DatePickerPopover";
import { useScrollLock } from "../../../hooks/useScrollLock";
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
    className={`relative bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-[#2C2C2E] rounded-xl overflow-hidden ${
      open ? "z-30 shadow-xs" : "z-0"
    }`}
  >
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className={`w-full min-h-[42px] px-3.5 py-2.5 flex items-center justify-between gap-2 text-left cursor-pointer transition-colors ${
        open
          ? "bg-black/[0.03] dark:bg-white/[0.05] border-b border-[#E5E5EA] dark:border-[#2C2C2E] text-[#1C1C1E] dark:text-[#F2F2F7]"
          : "bg-white dark:bg-[#1C1C1E] hover:bg-black/[0.02] dark:hover:bg-white/[0.02] text-[#1C1C1E] dark:text-[#F2F2F7]"
      } focus-visible:outline-none`}
    >
      <span className="text-sm font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] flex items-center gap-2.5">
        <span className="w-6 h-6 rounded-lg bg-black/[0.05] dark:bg-white/[0.1] text-[#007AFF] dark:text-[#0A84FF] flex items-center justify-center shrink-0">
          {icon}
        </span>
        <span>{title}</span>
      </span>
      <span className="text-[#8E8E93] flex items-center justify-center shrink-0">
        {open ? <ChevronUp size={16} strokeWidth={2.2} /> : <ChevronDown size={16} strokeWidth={2.2} />}
      </span>
    </button>
    {open && <div className="p-3.5 space-y-3.5 bg-white dark:bg-[#1C1C1E]">{children}</div>}
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

  const todayStr = getLocalTodayStr(new Date());

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(todayStr);
  const [isDateRange, setIsDateRange] = useState(false);
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState("");
  const [timeType, setTimeType] = useState<TaskTimeType>("deadline");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [deadlineTime, setDeadlineTime] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
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
      const initialTimeType = quickTaskInitialData?.timeType || "deadline";
      setTimeType(initialTimeType);
      setStartTime(quickTaskInitialData?.startTime || "");
      setEndTime(quickTaskInitialData?.endTime || "");
      setDeadlineTime(initialTimeType === "deadline" ? quickTaskInitialData?.startTime || "" : "");
      setPriority("medium");
      setSelectedTags(quickTaskInitialData?.tag ? [quickTaskInitialData.tag] : []);
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

    addTask({
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate: isDateRange ? (startDate || todayStr) : (dueDate || todayStr),
      startDate: isDateRange ? (startDate || todayStr) : undefined,
      endDate: isDateRange ? (endDate || undefined) : undefined,
      deadlineDate:
        timeType === "deadline"
          ? isDateRange
            ? endDate || startDate || todayStr
            : dueDate || todayStr
          : undefined,
      timeType,
      startTime: timeType === "scheduled" ? startTime || undefined : undefined,
      endTime: timeType === "scheduled" ? endTime || undefined : undefined,
      deadlineTime: timeType === "deadline" ? deadlineTime || undefined : undefined,
      priority,
      tags: selectedTags,
    });

    closeQuickTaskModal();
  };

  const handleOpenFullDetail = () => {
    openTaskDetail("new", {
      title,
      description,
      dueDate: isDateRange ? startDate || todayStr : dueDate || todayStr,
      startDate: isDateRange ? startDate || todayStr : undefined,
      endDate: isDateRange ? endDate || undefined : undefined,
      tag: selectedTags[0],
      timeType,
      startTime: timeType === "scheduled" ? startTime || undefined : undefined,
      endTime: timeType === "scheduled" ? endTime || undefined : undefined,
      deadlineTime: timeType === "deadline" ? deadlineTime || undefined : undefined,
      priority,
      tags: selectedTags,
    });
    closeQuickTaskModal();
  };

  const toggleSection = (section: QuickTaskSection) => {
    setOpenSections((current) => ({ ...current, [section]: !current[section] }));
  };

  // Xác định tên ngữ cảnh hiện tại (Chữ thường in đậm, không viết hoa toàn bộ)
  const contextName =
    activeTaskSubTab === "today"
      ? "Hôm nay (Today)"
      : activeTaskSubTab === "planner"
      ? "Kế hoạch (Planner)"
      : activeTaskSubTab === "deadlines"
      ? "Hạn định (Deadlines)"
      : "Công việc mới";

  return (
    <div className="fixed inset-0 z-[999999] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150 select-none overflow-y-auto">
      {/* Backdrop click to close */}
      <div
        className="fixed inset-0"
        onClick={closeQuickTaskModal}
        aria-hidden="true"
      />

      {/* Modal Box: Desktop/Tablet bo tròn 4 góc (md:rounded-2xl), Mobile không bo 4 góc (rounded-none) */}
      <div
        className="relative z-[1000000] w-full max-w-lg bg-white dark:bg-[#1C1C1E] border-t md:border border-[#E5E5EA] dark:border-[#2C2C2E] rounded-none md:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh] md:max-h-[82vh] my-0 md:my-auto animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-4 pb-3 flex items-start justify-between border-b border-[#E5E5EA] dark:border-[#2C2C2E] bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl shrink-0">
          <div>
            <span className="text-xs font-medium text-[#8E8E93] block">
              {contextName}
            </span>
            <h2 className="text-lg font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] tracking-tight">
              Thêm công việc mới
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleOpenFullDetail}
              className="hidden md:inline-flex p-1.5 text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] rounded-xl transition-all cursor-pointer"
              title="Mở toàn màn hình chi tiết"
            >
              <Maximize2 size={15} strokeWidth={2.2} />
            </button>
            <button
              type="button"
              onClick={closeQuickTaskModal}
              className="p-1.5 text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] rounded-xl transition-all cursor-pointer"
              title="Đóng"
            >
              <X size={16} strokeWidth={2.2} />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Main Title Input Row */}
          <div className="flex items-center gap-2 pb-2.5 border-b border-[#E5E5EA] dark:border-[#2C2C2E]">
            <div className="w-6 h-6 rounded-lg bg-[#007AFF] text-white flex items-center justify-center shrink-0">
              <Plus size={14} strokeWidth={2.6} />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Bạn cần làm gì?..."
              className="flex-1 min-w-0 bg-transparent px-1.5 text-sm sm:text-base font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] placeholder:text-[#8E8E93] focus:outline-none tracking-tight rounded-none"
            />
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-3 py-1.5 bg-[#1C1917] dark:bg-white text-white dark:text-[#1C1917] disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold rounded-xl shadow-xs active:scale-95 cursor-pointer transition-all shrink-0"
            >
              Thêm
            </button>
          </div>

          {/* Sub Row: Plain task & Add details toggle */}
          <div className="flex items-center justify-between text-xs text-[#8E8E93]">
            <span>{showDetails ? "Chi tiết mở rộng" : "Công việc cơ bản"}</span>
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="font-medium text-[#007AFF] dark:text-[#0A84FF] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{showDetails ? "Ẩn bớt chi tiết" : "+ Thêm chi tiết"}</span>
              {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {/* Gợi ý khi chưa nhập */}
          {!showDetails && !title && (
            <p className="text-[11px] text-[#8E8E93] italic">
              💡 Gợi ý: Nhập tên công việc rồi bấm Thêm để tạo nhanh.
            </p>
          )}

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
                <div className="flex items-center justify-between pb-2 border-b border-[#E5E5EA] dark:border-[#2C2C2E] text-xs">
                  <span className="font-medium text-[#8E8E93] flex items-center gap-1.5">
                    <Calendar size={13} />
                    <span>Kiểu hiển thị:</span>
                  </span>
                  <div className="flex items-center gap-1 p-0.5 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-lg">
                    <button
                      type="button"
                      onClick={() => {
                        setIsDateRange(false);
                        setEndDate("");
                      }}
                      className={`px-2.5 py-1 rounded-md font-medium text-xs transition-all cursor-pointer ${
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
                        if (!endDate) {
                          setStartDate(dueDate || todayStr);
                          const d = new Date(dueDate || todayStr);
                          d.setDate(d.getDate() + 2);
                          setEndDate(d.toISOString().split("T")[0]);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-md font-medium text-xs transition-all cursor-pointer ${
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

                    {/* Giờ hạn chót hoặc khung giờ */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-[#8E8E93] flex items-center gap-1.5">
                        <Clock size={12} />
                        <span>Giờ / Khung giờ:</span>
                      </label>
                      {timeType === "scheduled" ? (
                        <div className="flex items-center gap-1">
                          <TimePickerPopover
                            value={startTime}
                            onChange={setStartTime}
                            placeholder="Bắt đầu"
                            className="flex-1 min-w-0"
                          />
                          <span className="text-xs font-medium text-[#8E8E93]">-</span>
                          <TimePickerPopover
                            value={endTime}
                            onChange={setEndTime}
                            placeholder="Kết thúc"
                            align="right"
                            className="flex-1 min-w-0"
                          />
                        </div>
                      ) : (
                        <TimePickerPopover
                          value={deadlineTime}
                          onChange={setDeadlineTime}
                          placeholder="Không đặt giờ (Cả ngày)"
                          align="right"
                          className="w-full"
                        />
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

                    {/* Giờ chót hoặc khung giờ trong khoảng ngày */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-[#8E8E93] flex items-center gap-1.5">
                        <Clock size={12} />
                        <span>{timeType === "deadline" ? "Giờ chót (ngày kết thúc):" : "Khung giờ diễn ra:"}</span>
                      </label>
                      {timeType === "scheduled" ? (
                        <div className="flex items-center gap-1">
                          <TimePickerPopover
                            value={startTime}
                            onChange={setStartTime}
                            placeholder="Bắt đầu"
                            className="flex-1 min-w-0"
                          />
                          <span className="text-xs font-medium text-[#8E8E93]">-</span>
                          <TimePickerPopover
                            value={endTime}
                            onChange={setEndTime}
                            placeholder="Kết thúc"
                            align="right"
                            className="flex-1 min-w-0"
                          />
                        </div>
                      ) : (
                        <TimePickerPopover
                          value={deadlineTime}
                          onChange={setDeadlineTime}
                          placeholder="Không đặt giờ (Cả ngày)"
                          align="right"
                          className="w-full"
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Chế độ thời gian */}
                <div className="flex items-center justify-between pt-2 border-t border-[#E5E5EA] dark:border-[#2C2C2E] text-xs">
                  <span className="font-medium text-[#8E8E93] flex items-center gap-1.5">
                    <Clock size={13} />
                    <span>Loại thời gian:</span>
                  </span>
                  <div className="flex items-center gap-1 p-0.5 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-lg">
                    <button
                      type="button"
                      onClick={() => setTimeType("deadline")}
                      className={`px-2.5 py-1 rounded-md font-medium text-xs transition-all cursor-pointer ${
                        timeType === "deadline"
                          ? "bg-white dark:bg-[#1C1C1E] text-[#1C1C1E] dark:text-white shadow-xs"
                          : "text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white"
                      }`}
                    >
                      Hạn chót
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimeType("scheduled")}
                      className={`px-2.5 py-1 rounded-md font-medium text-xs transition-all cursor-pointer ${
                        timeType === "scheduled"
                          ? "bg-white dark:bg-[#1C1C1E] text-[#1C1C1E] dark:text-white shadow-xs"
                          : "text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white"
                      }`}
                    >
                      Lịch hẹn
                    </button>
                  </div>
                </div>
              </QuickTaskAccordion>

              {/* SECTION 2: PHÂN LOẠI & ƯU TIÊN */}
              <QuickTaskAccordion
                title="Phân loại"
                icon={<Sparkles size={13} />}
                open={openSections.organize}
                onToggle={() => toggleSection("organize")}
              >
                <div className="space-y-3 text-sm">
                  {/* Mức độ ưu tiên */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-xs text-[#8E8E93] flex items-center gap-1.5 shrink-0">
                      <Sparkles size={12} />
                      <span>Ưu tiên:</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      {[
                        { key: "high", label: "Gấp", color: "text-[#FF3B30] bg-[#FF3B30]/10 border-[#FF3B30]/30" },
                        { key: "medium", label: "Vừa", color: "text-[#FF9500] bg-[#FF9500]/10 border-[#FF9500]/30" },
                        { key: "low", label: "Thấp", color: "text-[#34C759] bg-[#34C759]/10 border-[#34C759]/30" },
                      ].map((p) => (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => setPriority(p.key as TaskPriority)}
                          className={`px-3 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                            priority === p.key
                              ? `${p.color} ring-1 ring-black/10 dark:ring-white/20 font-bold`
                              : "bg-[#F2F2F7] dark:bg-[#2C2C2E] border-transparent text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white"
                          }`}
                        >
                          <span>{p.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Nhãn Tag (#) Đa Năng */}
                  <div className="pt-2 border-t border-[#E5E5EA] dark:border-[#2C2C2E] space-y-1.5">
                    <span className="font-medium text-xs text-[#8E8E93] flex items-center gap-1.5">
                      <TagIcon size={12} />
                      <span>Nhãn (#Tag):</span>
                    </span>
                    <TagInputSelector
                      selectedTags={selectedTags}
                      onChange={setSelectedTags}
                      placeholder="Thêm nhãn (vd: CongViec, Gap...)"
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
                  className="w-full p-2.5 bg-[#F2F2F7]/50 dark:bg-black/30 border border-[#E5E5EA] dark:border-[#2C2C2E] rounded-none text-sm font-medium text-[#1C1C1E] dark:text-[#F2F2F7] placeholder:text-[#8E8E93] focus:outline-none focus:border-[#007AFF] resize-none"
                />
              </QuickTaskAccordion>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-[#F2F2F7]/60 dark:bg-black/40 border-t border-[#E5E5EA] dark:border-[#2C2C2E] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={closeQuickTaskModal}
            className="px-4 py-2 rounded-xl bg-white dark:bg-[#2C2C2E] hover:bg-[#F2F2F7] dark:hover:bg-[#3A3A3C] border border-[#E5E5EA] dark:border-[#2C2C2E] text-xs font-semibold text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white shadow-xs active:scale-95 cursor-pointer transition-all"
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="px-4 py-2 rounded-xl bg-[#1C1917] dark:bg-white text-white dark:text-[#1C1917] disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold shadow-sm hover:opacity-90 active:scale-95 cursor-pointer flex items-center gap-1.5 transition-all"
          >
            <Check size={14} strokeWidth={2.4} />
            <span>Tạo công việc</span>
          </button>
        </div>
      </div>
    </div>
  );
};
