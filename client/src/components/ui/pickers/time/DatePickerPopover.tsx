import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { getLocalTodayStr } from "../../../../utils/date";

// ==========================================
// COMPONENT: DatePickerPopover (Popup Chọn Ngày Chuẩn TaskNotes & Neo-Brutalist)
// ==========================================

export interface DatePickerPopoverProps {
  value?: string; // Định dạng "YYYY-MM-DD" hoặc rỗng
  onChange: (dateStr: string) => void;
  placeholder?: string;
  className?: string;
  align?: "left" | "right";
  disabled?: boolean;
  showClear?: boolean;
}

const WEEKDAY_NAMES = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

/**
 * Format YYYY-MM-DD thành hiển thị kiểu "3 thg 9, 2026"
 */
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
  const containerRef = useRef<HTMLDivElement>(null);

  const todayStr = getLocalTodayStr();

  // Khởi tạo tháng/năm hiển thị từ value hoặc ngày hôm nay
  const initialDate = value ? new Date(value) : new Date();
  const [viewYear, setViewYear] = useState(
    isNaN(initialDate.getFullYear()) ? new Date().getFullYear() : initialDate.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(
    isNaN(initialDate.getMonth()) ? new Date().getMonth() : initialDate.getMonth()
  );

  // Khi value thay đổi, cập nhật lại view
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getFullYear())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  // Đóng khi click ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  // Ma trận các ngày trong tháng (bắt đầu từ Chủ Nhật)
  const getDaysMatrix = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDayOfWeek = firstDay.getDay(); // 0 = CN, 1 = T2, ...

    const days: { dayNum: number; dateStr: string; isCurrentMonth: boolean }[] = [];

    // Các ngày cuối của tháng trước
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevM = month === 0 ? 11 : month - 1;
      const prevY = month === 0 ? year - 1 : year;
      const dateStr = `${prevY}-${String(prevM + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({ dayNum: d, dateStr, isCurrentMonth: false });
    }

    // Các ngày trong tháng này
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({ dayNum: d, dateStr, isCurrentMonth: true });
    }

    // Các ngày đầu của tháng sau để đủ ô lưới 35 hoặc 42
    const totalCells = days.length <= 35 ? 35 : 42;
    const remaining = totalCells - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextM = month === 11 ? 0 : month + 1;
      const nextY = month === 11 ? year + 1 : year;
      const dateStr = `${nextY}-${String(nextM + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({ dayNum: d, dateStr, isCurrentMonth: false });
    }

    return days;
  };

  const daysList = getDaysMatrix(viewYear, viewMonth);

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

  const displayLabel = value ? formatDisplayDate(value) : placeholder;

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-1.5 px-2.5 py-1 rounded-[4px] border border-[#262626] bg-[#FAF8F3] hover:bg-white text-xs font-mono font-bold text-[#1C1917] transition-all cursor-pointer shadow-[1px_1px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none ${
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

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div
            className={`absolute top-full mt-1.5 z-[1000001] w-64 bg-[#FBF9F4] border-[1.5px] border-[#262626] rounded-[6px] shadow-[3px_3px_0px_#262626] overflow-hidden p-2.5 ${
            align === "right" ? "right-0" : "left-0"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Tháng/Năm */}
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

          {/* Hàng Tiêu Đề Thứ */}
          <div className="grid grid-cols-7 text-center font-mono text-[10px] font-bold text-[#78716C] mb-1">
            {WEEKDAY_NAMES.map((d) => (
              <div key={d} className="py-0.5">
                {d}
              </div>
            ))}
          </div>

          {/* Lưới Ngày */}
          <div className="grid grid-cols-7 gap-1">
            {daysList.map((item, idx) => {
              const isSelected = item.dateStr === value;
              const isToday = item.dateStr === todayStr;

              return (
                <button
                  key={`${item.dateStr}-${idx}`}
                  type="button"
                  onClick={() => handleSelectDate(item.dateStr)}
                  className={`h-7 rounded-[4px] text-xs font-mono font-bold flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#1C1917] text-white border border-[#1C1917] shadow-[1px_1px_0px_#262626] font-black"
                      : item.isCurrentMonth
                      ? "text-[#1C1917] hover:bg-white"
                      : "text-[#A8A29E] hover:bg-white/50"
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

          {/* Footer Tác Vụ */}
          <div
            className={`flex items-center ${showClear ? "justify-between" : "justify-end"} pt-2.5 mt-2 border-t border-[#262626]/20 text-xs font-mono font-bold`}
          >
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
      )}
    </div>
  );
};
