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

  const panel = isOpen && panelPosition ? (
    <div
      ref={panelRef}
      className="fixed z-[1000001] max-w-[calc(100vw-1rem)] bg-[#FBF9F4] border-[1.5px] border-[#262626] rounded-[6px] shadow-[3px_3px_0px_#262626] overflow-hidden p-2.5"
      style={{
        top: panelPosition.top,
        left: panelPosition.left,
        width: `min(${PANEL_WIDTH}px, calc(100vw - ${VIEWPORT_GUTTER * 2}px))`,
      }}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-[#262626]/20">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1 rounded hover:bg-white border border-transparent hover:border-[#262626] text-[#1C1917] cursor-pointer active:translate-y-[0.5px]"
          title="Tháng trước"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="font-mono text-xs font-black text-[#1C1917]">
          tháng {viewMonth + 1} năm {viewYear}
        </span>
        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1 rounded hover:bg-white border border-transparent hover:border-[#262626] text-[#1C1917] cursor-pointer active:translate-y-[0.5px]"
          title="Tháng sau"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="grid grid-cols-7 text-center font-mono text-[10px] font-bold text-[#78716C] mb-1">
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
              className={`h-7 rounded-[4px] text-xs font-mono font-bold flex flex-col items-center justify-center relative transition-colors cursor-pointer ${
                isSelected
                  ? "bg-[#1C1917] text-white border border-[#1C1917] shadow-[1px_1px_0px_#262626] font-black"
                  : item.isCurrentMonth
                  ? "text-[#1C1917] hover:bg-white"
                  : "text-[#A8A29E] hover:bg-[#F5F3EF]"
              }`}
            >
              <span>{item.dayNum}</span>
              {isToday && (
                <span className={`w-1 h-1 rounded-full absolute bottom-0.5 ${isSelected ? "bg-white" : "bg-[#1C1917]"}`} />
              )}
            </button>
          );
        })}
      </div>

      <div className={`flex items-center ${showClear ? "justify-between" : "justify-end"} pt-2.5 mt-2 border-t border-[#262626]/20 text-xs font-mono font-bold`}>
        {showClear && (
          <button
            type="button"
            onClick={handleClear}
            className="text-[#78716C] hover:text-rose-700 hover:underline cursor-pointer"
          >
            Xóa
          </button>
        )}
        <button
          type="button"
          onClick={handleSelectToday}
          className="px-2 py-0.5 bg-[#1C1917] text-white rounded text-[11px] border border-[#1C1917] shadow-[1px_1px_0px_#262626] active:translate-y-[0.5px] cursor-pointer"
        >
          Hôm nay
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((open) => !open)}
        className={`w-full flex items-center justify-between gap-1.5 px-2.5 py-1 rounded-[4px] border border-[#262626] bg-[#FAF8F3] hover:bg-white text-sm font-mono font-bold text-[#1C1917] transition-all cursor-pointer shadow-[1px_1px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none ${
          isOpen ? "bg-white ring-1 ring-[#1C1917]" : ""
        }`}
      >
        <div className="flex items-center gap-1.5 truncate">
          <Calendar size={12} className={value ? "text-[#1C1917]" : "text-[#78716C]"} />
          <span className={value ? "text-[#1C1917]" : "text-[#78716C] font-normal"}>
            {displayLabel}
          </span>
        </div>
      </button>
      {panel && createPortal(panel, document.body)}
    </div>
  );
};
