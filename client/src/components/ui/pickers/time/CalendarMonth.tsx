import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MONTH_NAMES, DAY_NAMES } from "./TimePicker.types";
import { getLocalTodayStr } from "../../../../utils/date";

// ==========================================
// SUB-COMPONENT: CalendarMonth (Lưới Chọn Ngày Lịch Tháng)
// ==========================================

export interface CalendarMonthProps {
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  viewYear: number;
  viewMonth: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  accentMode?: "scheduled" | "deadline";
  minDate?: string; // Khóa toàn bộ các ngày trước minDate (YYYY-MM-DD)
  disablePastDates?: boolean; // Tự động khóa toàn bộ ngày quá khứ (< today)
}

export const CalendarMonth: React.FC<CalendarMonthProps> = ({
  selectedDate,
  onSelectDate,
  viewYear,
  viewMonth,
  onPrevMonth,
  onNextMonth,
  accentMode = "scheduled",
  minDate,
  disablePastDates = false,
}) => {
  const todayStr = getLocalTodayStr();
  const effectiveMinDate = minDate || (disablePastDates ? todayStr : undefined);

  // Helper tạo ma trận ngày trong tháng
  const getDaysInMonthMatrix = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days: { dayNum: number; dateStr: string; isCurrentMonth: boolean }[] = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevM = month === 0 ? 11 : month - 1;
      const prevY = month === 0 ? year - 1 : year;
      const dateStr = `${prevY}-${String(prevM + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({ dayNum: d, dateStr, isCurrentMonth: false });
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({ dayNum: d, dateStr, isCurrentMonth: true });
    }

    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextM = month === 11 ? 0 : month + 1;
      const nextY = month === 11 ? year + 1 : year;
      const dateStr = `${nextY}-${String(nextM + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({ dayNum: d, dateStr, isCurrentMonth: false });
    }

    return days;
  };

  const daysMatrix = getDaysInMonthMatrix(viewYear, viewMonth);

  return (
    <div className="bg-white border border-[#262626] rounded-[5px] p-1.5 shadow-[1px_1px_0px_#262626] select-none w-full max-w-full overflow-hidden">
      {/* Điều hướng Tháng/Năm */}
      <div className="flex items-center justify-between mb-1 pb-1 border-b border-[#D4CEBF]/60">
        <button
          type="button"
          onClick={onPrevMonth}
          className="p-0.5 hover:bg-[#F5F3EF] rounded border border-[#262626] shadow-[1px_1px_0px_#262626] active:translate-y-[0.5px] active:shadow-none"
          aria-label="Tháng trước"
        >
          <ChevronLeft size={12} strokeWidth={2.4} />
        </button>
        <span className="font-bold text-[11px] font-mono text-[#1C1917]">
          {MONTH_NAMES[viewMonth]}, {viewYear}
        </span>
        <button
          type="button"
          onClick={onNextMonth}
          className="p-0.5 hover:bg-[#F5F3EF] rounded border border-[#262626] shadow-[1px_1px_0px_#262626] active:translate-y-[0.5px] active:shadow-none"
          aria-label="Tháng sau"
        >
          <ChevronRight size={12} strokeWidth={2.4} />
        </button>
      </div>

      {/* Tên các thứ */}
      <div className="grid grid-cols-7 gap-0.5 text-center text-[9px] font-bold text-[#78716C] mb-0.5">
        {DAY_NAMES.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      {/* Lưới các ô ngày */}
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {daysMatrix.map(({ dayNum, dateStr, isCurrentMonth }) => {
          const isSelected = selectedDate === dateStr;
          const isToday = dateStr === todayStr;
          const isDisabled = Boolean(
            effectiveMinDate && dateStr < effectiveMinDate
          );

          return (
            <button
              key={dateStr}
              type="button"
              disabled={isDisabled}
              onClick={() => {
                if (!isDisabled) onSelectDate(dateStr);
              }}
              className={`h-5.5 sm:h-6 text-[10px] sm:text-[11px] font-bold rounded flex items-center justify-center transition-all ${
                isDisabled
                  ? "text-[#D4CEBF] bg-[#F5F2EA]/30 opacity-40 cursor-not-allowed line-through"
                  : isSelected
                  ? "bg-[#1C1917] text-white border border-[#262626] shadow-[1px_1px_0px_#262626]"
                  : isToday
                  ? "border border-[#262626] font-black bg-[#FAF8F3] text-[#1C1917]"
                  : isCurrentMonth
                  ? "text-[#1C1917] hover:bg-[#FAF8F3]"
                  : "text-[#D4CEBF] hover:bg-[#FAF8F3]"
              }`}
            >
              {dayNum}
            </button>
          );
        })}
      </div>
    </div>
  );
};
