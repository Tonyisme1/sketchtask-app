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
    className={`relative bg-white border-[1.5px] border-[#262626] rounded-[6px] shadow-[1.5px_1.5px_0px_#262626] overflow-hidden ${
      open ? "z-30" : "z-0"
    }`}
  >
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
      <span className="text-sm sm:text-[15px] font-bold text-[#1C1917] flex items-center gap-2.5">
        <span className="w-6 h-6 rounded-[4px] bg-white border border-[#262626] text-[#1C1917] shadow-[0.5px_0.5px_0px_#262626] flex items-center justify-center shrink-0">
          {icon}
        </span>
        <span>{title}</span>
      </span>
      <span className="text-[#57534E] flex items-center justify-center shrink-0">
        {open ? <ChevronUp size={16} strokeWidth={2.4} /> : <ChevronDown size={16} strokeWidth={2.4} />}
      </span>
    </button>
    {open && <div className="p-3.5 space-y-3.5 bg-white">{children}</div>}
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
    <div className="fixed inset-0 z-[999999] flex items-end md:items-center lg:items-start justify-center p-0 md:p-4 lg:pt-8 bg-[#1C1917]/50 animate-in fade-in duration-150 select-none overflow-y-auto">
      {/* Backdrop click to close */}
      <div
        className="fixed inset-0"
        onClick={closeQuickTaskModal}
        aria-hidden="true"
      />

      {/* Modal Box */}
      <div
        className="relative z-[1000000] w-full max-w-lg bg-[#FBF9F4] border-[1.5px] border-[#262626] rounded-t-[18px] md:rounded-[8px] shadow-[0px_-4px_0px_#262626] md:shadow-[4px_4px_0px_#262626] overflow-visible flex flex-col max-h-[90dvh] md:max-h-[82vh] my-0 md:my-auto lg:my-0 animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-4 pb-2.5 flex items-start justify-between border-b border-[#262626]/15">
          <div>
            <span className="text-xs font-bold text-[#78716C] block">
              {contextName}
            </span>
            <h2 className="text-lg font-black text-[#1C1917] tracking-tight">
              Thêm công việc mới
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleOpenFullDetail}
              className="hidden md:inline-flex p-1 text-[#78716C] hover:text-[#1C1917] hover:bg-white rounded border border-transparent hover:border-[#262626] transition-all cursor-pointer"
              title="Mở toàn màn hình chi tiết"
            >
              <Maximize2 size={14} />
            </button>
            <button
              type="button"
              onClick={closeQuickTaskModal}
              className="p-1 text-[#78716C] hover:text-[#1C1917] hover:bg-white rounded border border-transparent hover:border-[#262626] transition-all cursor-pointer"
              title="Đóng"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Main Title Input Row */}
          <div className="flex items-center gap-2 pb-2 border-b-[1.5px] border-[#262626]">
            <div className="w-5 h-5 rounded-[3px] bg-[#1C1917] text-white flex items-center justify-center shrink-0">
              <Plus size={13} strokeWidth={3} />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Bạn cần làm gì?..."
              className="flex-1 min-w-0 bg-transparent text-sm sm:text-base font-bold text-[#1C1917] placeholder:text-[#78716C] focus:outline-none tracking-tight"
            />
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-2.5 py-1 bg-[#1C1917] text-white disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold rounded-[4px] border-[1.5px] border-[#1C1917] shadow-[1px_1px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer transition-all shrink-0"
            >
              Thêm
            </button>
          </div>

          {/* Sub Row: Plain task & Add details toggle */}
          <div className="flex items-center justify-between text-xs text-[#57534E] font-mono">
            <span>{showDetails ? "Chi tiết mở rộng" : "Công việc cơ bản"}</span>
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="font-medium text-[#1C1917] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{showDetails ? "Ẩn bớt chi tiết" : "+ Thêm chi tiết"}</span>
              {showDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>

          {/* Gợi ý khi chưa nhập */}
          {!showDetails && !title && (
            <p className="text-[11px] text-[#78716C] font-mono italic">
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
                <div className="flex items-center justify-between pb-1.5 border-b border-[#262626]/10 text-xs">
                  <span className="font-medium text-[#57534E] flex items-center gap-1">
                    <Calendar size={12} />
                    <span>Kiểu:</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsDateRange(false);
                        setEndDate("");
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
                          setStartDate(dueDate || todayStr);
                          const d = new Date(dueDate || todayStr);
                          d.setDate(d.getDate() + 2);
                          setEndDate(d.toISOString().split("T")[0]);
                        }
                      }}
                      className={`px-2 py-0.5 rounded-[3px] border font-medium text-xs transition-all cursor-pointer ${
                        isDateRange
                          ? "bg-[#1C1917] text-white border-[#1C1917]"
                          : "bg-[#FAF8F3] text-[#78716C] border-[#D4CEBF] hover:bg-white"
                      }`}
                    >
                      Khoảng ngày
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
                        onChange={setDueDate}
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
                            onChange={setStartTime}
                            placeholder="Bắt đầu"
                            className="flex-1 min-w-0"
                          />
                          <span className="text-xs font-mono font-medium text-[#78716C]">-</span>
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
                          onChange={setEndDate}
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
                            onChange={setStartTime}
                            placeholder="Bắt đầu"
                            className="flex-1 min-w-0"
                          />
                          <span className="text-xs font-mono font-medium text-[#78716C]">-</span>
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
                <div className="flex items-center gap-2 pt-1 border-t border-[#262626]/10 text-sm">
                  <span className="text-xs font-medium text-[#57534E]">Loại:</span>
                  <button
                    type="button"
                    onClick={() => setTimeType("deadline")}
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
                    onClick={() => setTimeType("scheduled")}
                    className={`px-2 py-0.5 rounded-[3px] border font-medium text-xs cursor-pointer ${
                      timeType === "scheduled"
                        ? "bg-[#1C1917] text-white border-[#1C1917]"
                        : "bg-[#FAF8F3] text-[#78716C] border-[#D4CEBF]"
                    }`}
                  >
                    Lịch hẹn
                  </button>
                </div>
              </QuickTaskAccordion>

              {/* SECTION 2: PHÂN LOẠI & ƯU TIÊN */}
              <QuickTaskAccordion
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
                          onClick={() => setPriority(p.key as TaskPriority)}
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

                  {/* Nhãn Tag (#) Đa Năng */}
                  <div className="pt-1 border-t border-[#262626]/10 space-y-1.5">
                    <span className="font-medium text-xs text-[#57534E] flex items-center gap-1">
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
                  className="w-full p-2.5 bg-white border-[1.5px] border-[#262626] rounded-[6px] shadow-[1.5px_1.5px_0px_#262626] text-sm font-medium text-[#1C1917] placeholder:text-[#57534E] focus:outline-none resize-none"
                />
              </QuickTaskAccordion>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#FAF8F3] border-t border-[#262626]/20 flex items-center justify-between">
          <button
            type="button"
            onClick={closeQuickTaskModal}
            className="px-3 py-1.5 rounded-[4px] bg-white hover:bg-slate-100 border border-[#262626] text-sm font-bold text-[#57534E] shadow-[1px_1px_0px_#262626] active:translate-y-[0.5px] cursor-pointer"
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="px-4 py-1.5 rounded-[4px] bg-[#1C1917] hover:bg-[#262626] disabled:opacity-30 disabled:cursor-not-allowed text-white border-[1.5px] border-[#1C1917] text-xs font-bold shadow-[1.5px_1.5px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer flex items-center gap-1.5 transition-all"
          >
            <Check size={14} strokeWidth={3} />
            <span>Tạo công việc</span>
          </button>
        </div>
      </div>
    </div>
  );
};
