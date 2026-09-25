import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { getLocalTodayStr } from "../../../../utils/date";

// ==========================================
// COMPONENT: DatePickerPopover
// Popup ngày được portal ra khỏi form để không bị overflow-y-auto cắt mất.
// ==========================================

export interface DatePickerPopoverProps {
  value?: string;
  onChange: (dateStr: string) => void;
  placeholder?: string;
  className?: string;
  align?: "left" | "right";
  disabled?: boolean;
  showClear?: boolean;
}

const WEEKDAY_NAMES = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const PANEL_WIDTH = 256;
const VIEWPORT_GUTTER = 8;

type PanelPosition = {
  top: number;
  left: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/** Format YYYY-MM-DD thành hiển thị kiểu "3 thg 9, 2026" */
export const formatDisplayDate = (dateStr: string): string => {
  if (!dateStr) return "";
  const parts = dateStr.split(" ")[0].split("-");
  if (parts.length === 3) {
    const y = parts[0];
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    return `${d} thg ${m}, ${y}`;
  }
  return dateStr;
};

export const DatePickerPopover: React.FC<DatePickerPopoverProps> = ({
  value = "",
  onChange,
  placeholder = "Chọn ngày",
  className = "",
  align = "left",
  disabled = false,
  showClear = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [panelPosition, setPanelPosition] = useState<PanelPosition | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const todayStr = getLocalTodayStr();

  const initialDate = value ? new Date(value) : new Date();
  const [viewYear, setViewYear] = useState(
    isNaN(initialDate.getFullYear()) ? new Date().getFullYear() : initialDate.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(
    isNaN(initialDate.getMonth()) ? new Date().getMonth() : initialDate.getMonth()
  );

  const updatePanelPosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const panelWidth = Math.min(PANEL_WIDTH, window.innerWidth - VIEWPORT_GUTTER * 2);
    const estimatedPanelHeight = 310;
    const preferredLeft = align === "right" ? rect.right - panelWidth : rect.left;
    const left = clamp(
      preferredLeft,
      VIEWPORT_GUTTER,
      Math.max(VIEWPORT_GUTTER, window.innerWidth - panelWidth - VIEWPORT_GUTTER)
    );
    const fitsBelow = window.innerHeight - rect.bottom >= estimatedPanelHeight + VIEWPORT_GUTTER;
    const top = fitsBelow
      ? rect.bottom + 6
      : Math.max(VIEWPORT_GUTTER, rect.top - estimatedPanelHeight - 6);

    setPanelPosition({ top, left });
  };

  useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getFullYear())) {
        setViewYear(date.getFullYear());
        setViewMonth(date.getMonth());
      }
    }
  }, [value]);

  // Popup portal vẫn bám đúng trigger khi form hoặc viewport cuộn.
  useEffect(() => {
    if (!isOpen) return;
    updatePanelPosition();
    const handleViewportChange = () => updatePanelPosition();
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);
    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [isOpen]);

  // Chỉ đóng khi chạm ngoài cả trigger và panel đã portal.
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((previous) => previous - 1);
    } else {
      setViewMonth((previous) => previous - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((previous) => previous + 1);
    } else {
      setViewMonth((previous) => previous + 1);
    }
  };

  const getDaysMatrix = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const days: { dayNum: number; dateStr: string; isCurrentMonth: boolean }[] = [];

    const previousMonthLastDay = new Date(year, month, 0).getDate();
    for (let index = startDayOfWeek - 1; index >= 0; index -= 1) {
      const day = previousMonthLastDay - index;
      const previousMonth = month === 0 ? 11 : month - 1;
      const previousYear = month === 0 ? year - 1 : year;
      const dateStr = `${previousYear}-${String(previousMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      days.push({ dayNum: day, dateStr, isCurrentMonth: false });
    }

    for (let day = 1; day <= lastDay.getDate(); day += 1) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      days.push({ dayNum: day, dateStr, isCurrentMonth: true });
    }

    const totalCells = days.length <= 35 ? 35 : 42;
    const remaining = totalCells - days.length;
    for (let day = 1; day <= remaining; day += 1) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      days.push({ dayNum: day, dateStr, isCurrentMonth: false });
    }
    return days;
  };

  const handleSelectDate = (dateStr: string) => {
    onChange(dateStr);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    onChange(todayStr);
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setIsOpen(false);
  };

  const daysList = getDaysMatrix(viewYear, viewMonth);
  const displayLabel = value ? formatDisplayDate(value) : placeholder;

  const isMobileScreen = typeof window !== "undefined" && window.innerWidth < 768;

  const panel = isOpen && (panelPosition || isMobileScreen) ? (
    isMobileScreen ? (
      <div
        className="fixed inset-0 z-[1000005] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4 select-none animate-in fade-in duration-150"
        onClick={() => setIsOpen(false)}
      >
        <div
          ref={panelRef}
          className="w-full max-w-[310px] bg-[#FFFDF8] dark:bg-[#1C1C1E] rounded-3xl shadow-2xl overflow-hidden p-4 select-none animate-in fade-in duration-150"
          onClick={(event) => event.stopPropagation()}
        >
          {/* Header Tháng / Năm & Nút Đóng */}
          <div className="flex items-center justify-between pb-2 mb-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-[#1C1917] dark:text-[#F2F2F7] cursor-pointer transition-colors"
              title="Tháng trước"
            >
              <ChevronLeft size={16} strokeWidth={2.4} />
            </button>
            <span className="font-mono text-sm font-black text-[#1C1917] dark:text-[#F2F2F7]">
              Tháng {viewMonth + 1}, {viewYear}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-[#1C1917] dark:text-[#F2F2F7] cursor-pointer transition-colors"
                title="Tháng sau"
              >
                <ChevronRight size={16} strokeWidth={2.4} />
              </button>
            </div>
          </div>

          {/* Thứ trong tuần */}
          <div className="grid grid-cols-7 text-center font-mono text-[11px] font-bold text-[#78716C] dark:text-[#8E8E93] mb-1.5">
            {WEEKDAY_NAMES.map((day) => (
              <div key={day} className="py-0.5">{day}</div>
            ))}
          </div>

          {/* Lưới các ngày */}
          <div className="grid grid-cols-7 gap-1">
            {daysList.map((item, index) => {
              const isSelected = item.dateStr === value;
              const isToday = item.dateStr === todayStr;
              return (
                <button
                  key={`${item.dateStr}-${index}`}
                  type="button"
                  onClick={() => handleSelectDate(item.dateStr)}
                  className={`h-8 rounded-xl text-xs font-mono font-bold flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#1C1917] text-white dark:bg-white dark:text-[#1C1917] shadow-sm font-black scale-105"
                      : item.isCurrentMonth
                      ? "text-[#1C1917] dark:text-[#F2F2F7] hover:bg-black/5 dark:hover:bg-white/10"
                      : "text-[#A8A29E]/60 dark:text-[#636366] bg-transparent"
                  }`}
                >
                  <span>{item.dayNum}</span>
                  {isToday && (
                    <span className={`w-1.5 h-1.5 rounded-full absolute bottom-1 ${isSelected ? "bg-white dark:bg-[#1C1917]" : "bg-[#1C1917] dark:bg-white"}`} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Nút hành động đáy */}
          <div className="flex items-center justify-between pt-3 mt-2.5 text-xs font-mono font-bold">
            <button
              type="button"
              onClick={handleClear}
              className="px-2.5 py-1 text-[#78716C] dark:text-[#8E8E93] hover:text-rose-700 dark:hover:text-rose-400 hover:underline cursor-pointer"
            >
              Xóa ngày
            </button>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleSelectToday}
                className="px-3 py-1 bg-[#1C1917] dark:bg-white text-white dark:text-[#1C1917] rounded-xl text-xs shadow-xs active:scale-95 cursor-pointer"
              >
                Hôm nay
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-2.5 py-1 bg-black/[0.05] dark:bg-[#2C2C2E] text-[#1C1917] dark:text-[#F2F2F7] rounded-xl text-xs shadow-xs active:scale-95 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>
    ) : (
      <div
        ref={panelRef}
        className="fixed z-[1000001] max-w-[calc(100vw-1rem)] bg-[#FBF9F4] dark:bg-[#1C1C1E] rounded-3xl shadow-2xl overflow-hidden p-3 select-none"
        style={{
          top: panelPosition?.top,
          left: panelPosition?.left,
          width: `min(${PANEL_WIDTH}px, calc(100vw - ${VIEWPORT_GUTTER * 2}px))`,
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 mb-1.5">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1 rounded-xl hover:bg-white dark:hover:bg-[#2C2C2E] text-[#1C1917] dark:text-[#F2F2F7] cursor-pointer transition-colors"
            title="Tháng trước"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="font-mono text-xs font-black text-[#1C1917] dark:text-[#F2F2F7]">
            tháng {viewMonth + 1} năm {viewYear}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 rounded-xl hover:bg-white dark:hover:bg-[#2C2C2E] text-[#1C1917] dark:text-[#F2F2F7] cursor-pointer transition-colors"
            title="Tháng sau"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-7 text-center font-mono text-[10px] font-bold text-[#78716C] dark:text-[#8E8E93] mb-1">
          {WEEKDAY_NAMES.map((day) => (
            <div key={day} className="py-0.5">{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {daysList.map((item, index) => {
            const isSelected = item.dateStr === value;
            const isToday = item.dateStr === todayStr;
            return (
              <button
                key={`${item.dateStr}-${index}`}
                type="button"
                onClick={() => handleSelectDate(item.dateStr)}
                className={`h-7 rounded-xl text-xs font-mono font-bold flex flex-col items-center justify-center relative transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-[#1C1917] dark:bg-white text-white dark:text-[#1C1917] font-black shadow-xs"
                    : item.isCurrentMonth
                    ? "text-[#1C1917] dark:text-[#F2F2F7] hover:bg-white dark:hover:bg-[#2C2C2E]"
                    : "text-[#A8A29E] dark:text-[#636366] hover:bg-[#F5F3EF] dark:hover:bg-[#2C2C2E]/40"
                }`}
              >
                <span>{item.dayNum}</span>
                {isToday && (
                  <span className={`w-1 h-1 rounded-full absolute bottom-0.5 ${isSelected ? "bg-white dark:bg-[#1C1917]" : "bg-[#1C1917] dark:bg-white"}`} />
                )}
              </button>
            );
          })}
        </div>

        <div className={`flex items-center ${showClear ? "justify-between" : "justify-end"} pt-2.5 mt-2 text-xs font-mono font-bold`}>
          {showClear && (
            <button
              type="button"
              onClick={handleClear}
              className="text-[#78716C] dark:text-[#8E8E93] hover:text-rose-700 dark:hover:text-rose-400 hover:underline cursor-pointer"
            >
              Xóa
            </button>
          )}
          <button
            type="button"
            onClick={handleSelectToday}
            className="px-2.5 py-1 bg-[#1C1917] dark:bg-white text-white dark:text-[#1C1917] rounded-xl text-[11px] shadow-xs active:scale-95 cursor-pointer"
          >
            Hôm nay
          </button>
        </div>
      </div>
    )
  ) : null;

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((open) => !open)}
        className={`w-full flex items-center justify-between gap-1.5 px-3 py-1.5 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-muted)] text-sm font-mono font-bold text-[#1C1917] dark:text-[#F2F2F7] transition-all cursor-pointer shadow-xs active:scale-95 ${
          isOpen ? "ring-2 ring-[var(--accent-blue)]/30" : ""
        }`}
      >
        <div className="flex items-center gap-1.5 truncate">
          <Calendar size={13} className={value ? "text-[var(--accent-blue)]" : "text-[#78716C] dark:text-[#8E8E93]"} />
          <span className={value ? "text-[#1C1917] dark:text-[#F2F2F7]" : "text-[#78716C] dark:text-[#8E8E93] font-normal"}>
            {displayLabel}
          </span>
        </div>
      </button>
      {panel && createPortal(panel, document.body)}
    </div>
  );
};
