import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronLeft, ChevronRight, CalendarPlus, X, Check } from "lucide-react";
import { useScrollLock } from "../../../hooks/useScrollLock";
import {
  getLocalTodayStr,
  getLocalTomorrowStr,
  formatFullDate,
  formatShortDayMonth,
} from "../../../utils/date";

export interface RescheduleDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (targetDate: string) => void;
  taskCount?: number;
  taskTitle?: string;
  initialDate?: string;
}

const WEEKDAY_NAMES = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export const RescheduleDateModal: React.FC<RescheduleDateModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  taskCount = 1,
  taskTitle,
  initialDate,
}) => {
  const [mounted, setMounted] = useState(false);
  const todayStr = getLocalTodayStr(new Date());
  const tomorrowStr = getLocalTomorrowStr();

  const [selectedDate, setSelectedDate] = useState<string>(initialDate || todayStr);

  const initialParsed = selectedDate ? new Date(selectedDate) : new Date();
  const [viewYear, setViewYear] = useState(
    isNaN(initialParsed.getFullYear()) ? new Date().getFullYear() : initialParsed.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(
    isNaN(initialParsed.getMonth()) ? new Date().getMonth() : initialParsed.getMonth()
  );

  useScrollLock(isOpen);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const defaultDate = initialDate || todayStr;
      setSelectedDate(defaultDate);
      const parsed = new Date(defaultDate);
      if (!isNaN(parsed.getFullYear())) {
        setViewYear(parsed.getFullYear());
        setViewMonth(parsed.getMonth());
      }
    }
  }, [isOpen, initialDate, todayStr]);

  if (!isOpen || !mounted) return null;

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

  const getDaysMatrix = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const days: { dayNum: number; dateStr: string; isCurrentMonth: boolean }[] = [];

    const previousMonthLastDay = new Date(year, month, 0).getDate();
    for (let index = startDayOfWeek - 1; index >= 0; index -= 1) {
      const day = previousMonthLastDay - index;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
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

  const daysList = getDaysMatrix(viewYear, viewMonth);

  const handleSelectQuick = (dateStr: string) => {
    setSelectedDate(dateStr);
    const d = new Date(dateStr);
    if (!isNaN(d.getFullYear())) {
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  };

  const handleConfirm = () => {
    onConfirm(selectedDate);
    onClose();
  };

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100dvh",
        minHeight: "100vh",
        zIndex: 999999,
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Dời ngày công việc"
      className="bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white dark:bg-[#27272A] border-[1.5px] border-[#262626] dark:border-[#52525B] rounded-[8px] shadow-[4px_4px_0px_#262626] p-4 sm:p-5 space-y-3.5 relative z-[1000000] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#FEF08A] text-[#1C1917] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1px_1px_0px_#262626] flex items-center justify-center shrink-0">
              <CalendarPlus size={16} strokeWidth={2.4} />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-[#1C1917] dark:text-[#FAFAFA]">
                Chọn ngày dời lịch
              </h3>
              <p className="text-[11px] text-[#78716C] dark:text-[#A1A1AA] truncate max-w-[200px]">
                {taskTitle ? taskTitle : `${taskCount} việc quá hạn`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[4px] text-[#78716C] hover:text-[#1C1917] dark:hover:text-white hover:bg-[#FAF8F3] dark:hover:bg-[#3F3F46] cursor-pointer"
            title="Đóng"
          >
            <X size={16} strokeWidth={2.2} />
          </button>
        </div>

        {/* Quick Date Pills */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSelectQuick(todayStr)}
            className={`flex-1 py-1.5 px-2 rounded-[4px] text-xs font-semibold transition-all cursor-pointer flex flex-col items-center active:translate-x-[0.5px] active:translate-y-[0.5px] ${
              selectedDate === todayStr
                ? "bg-[#1C1917] dark:bg-[#FAFAFA] text-white dark:text-[#18181B] border-[1.5px] border-[#262626] shadow-[1px_1px_0px_#262626] font-bold"
                : "bg-[#FAF8F3] dark:bg-[#18181B] border-[1.5px] border-[#D4CEBF] dark:border-[#52525B] text-[#1C1917] dark:text-[#FAFAFA] hover:bg-[#F3EFE6]"
            }`}
          >
            <span>Hôm nay</span>
            <span className="text-[10px] opacity-75 font-mono">({formatShortDayMonth(todayStr)})</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectQuick(tomorrowStr)}
            className={`flex-1 py-1.5 px-2 rounded-[4px] text-xs font-semibold transition-all cursor-pointer flex flex-col items-center active:translate-x-[0.5px] active:translate-y-[0.5px] ${
              selectedDate === tomorrowStr
                ? "bg-[#1C1917] dark:bg-[#FAFAFA] text-white dark:text-[#18181B] border-[1.5px] border-[#262626] shadow-[1px_1px_0px_#262626] font-bold"
                : "bg-[#FAF8F3] dark:bg-[#18181B] border-[1.5px] border-[#D4CEBF] dark:border-[#52525B] text-[#1C1917] dark:text-[#FAFAFA] hover:bg-[#F3EFE6]"
            }`}
          >
            <span>Ngày mai</span>
            <span className="text-[10px] opacity-75 font-mono">({formatShortDayMonth(tomorrowStr)})</span>
          </button>
        </div>

        {/* Interactive Calendar Box */}
        <div className="p-3 bg-[#FAF8F3] dark:bg-[#18181B] border-[1.5px] border-[#262626] dark:border-[#52525B] rounded-[6px] space-y-2 shadow-[1px_1px_0px_#262626]">
          {/* Calendar Month Navigation */}
          <div className="flex items-center justify-between pb-1 border-b border-[#262626]/10 dark:border-white/10">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-[4px] hover:bg-white dark:hover:bg-[#2C2C2E] text-[#1C1917] dark:text-[#FAFAFA] cursor-pointer"
              title="Tháng trước"
            >
              <ChevronLeft size={16} strokeWidth={2.4} />
            </button>
            <span className="font-semibold text-xs text-[#1C1917] dark:text-[#FAFAFA]">
              Tháng {viewMonth + 1}, {viewYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-[4px] hover:bg-white dark:hover:bg-[#2C2C2E] text-[#1C1917] dark:text-[#FAFAFA] cursor-pointer"
              title="Tháng sau"
            >
              <ChevronRight size={16} strokeWidth={2.4} />
            </button>
          </div>

          {/* Weekdays */}
          <div className="grid grid-cols-7 text-center font-mono text-[10px] font-bold text-[#78716C] dark:text-[#A1A1AA]">
            {WEEKDAY_NAMES.map((day) => (
              <div key={day} className="py-0.5">{day}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {daysList.map((item, index) => {
              const isSelected = item.dateStr === selectedDate;
              const isToday = item.dateStr === todayStr;
              return (
                <button
                  key={`${item.dateStr}-${index}`}
                  type="button"
                  onClick={() => setSelectedDate(item.dateStr)}
                  className={`h-7 rounded-[4px] text-xs font-mono font-semibold flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#1C1917] dark:bg-[#FAFAFA] text-white dark:text-[#18181B] font-bold border border-[#262626] shadow-[1px_1px_0px_#262626]"
                      : item.isCurrentMonth
                      ? "text-[#1C1917] dark:text-[#FAFAFA] hover:bg-white dark:hover:bg-[#27272A]"
                      : "text-[#78716C]/40 dark:text-[#A1A1AA]/40 hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  <span>{item.dayNum}</span>
                  {isToday && (
                    <span className={`w-1 h-1 rounded-full absolute bottom-0.5 ${isSelected ? "bg-white dark:bg-[#1C1C1E]" : "bg-[#1C1917] dark:bg-[#FAFAFA]"}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected date preview and Actions */}
        <div className="flex items-center justify-between pt-1 border-t border-[#262626]/20 dark:border-white/10">
          <div className="text-xs">
            <span className="text-[#78716C] dark:text-[#A1A1AA]">Dời sang: </span>
            <span className="font-bold text-[#1C1917] dark:text-[#FAFAFA]">
              {formatFullDate(selectedDate)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1.5 text-xs font-semibold text-[#78716C] dark:text-[#A1A1AA] hover:text-[#1C1917] dark:hover:text-white rounded-[4px] transition-all cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-3.5 py-1.5 text-xs font-bold text-white dark:text-[#18181B] bg-[#1C1917] dark:bg-[#FAFAFA] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex items-center gap-1 cursor-pointer transition-all"
            >
              <Check size={13} strokeWidth={2.6} />
              <span>Xác nhận</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
