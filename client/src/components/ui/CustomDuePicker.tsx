import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Hourglass,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import { getLocalTodayStr } from "../../utils/date";
import { registerBackHandler } from "../../utils/backNavigation";

// ==========================================
// COMPONENT: CustomDuePicker (Bộ Chọn Thời Gian Chuẩn Kép 2 Chế Độ)
// Chế độ 1: 🕒 Lịch Hẹn (Ngày + Giờ bắt đầu + Tùy chọn Giờ kết thúc)
// Chế độ 2: ⏳ Hạn Chót (Ngày chót + Giờ chót)
// ==========================================

export interface TaskTimeValue {
  timeType?: "event" | "task";
  date?: string;
  startTime?: string;
  endTime?: string;
  deadlineDate?: string;
  deadlineTime?: string;
}

export interface CustomDuePickerProps {
  value?: string;
  timeData?: TaskTimeValue;
  onChange?: (value: string | undefined, timeData?: TaskTimeValue) => void;
  className?: string;
}

const MONTH_NAMES = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
  "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
  "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

const DAY_NAMES = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export const CustomDuePicker: React.FC<CustomDuePickerProps> = ({
  value,
  timeData,
  onChange,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const now = new Date();
  const todayStr = getLocalTodayStr(now);

  // Tab chế độ: "event" (Lịch hẹn) | "task" (Hạn chót)
  const [mode, setMode] = useState<"event" | "task">(() => {
    if (timeData?.timeType) return timeData.timeType;
    if (value && value.includes("-")) return "event";
    return "event";
  });

  // State cho Chế độ 1: Lịch Hẹn
  const [eventDate, setEventDate] = useState<string>(() => {
    if (timeData?.date) return timeData.date;
    if (value && value.includes("-")) return value.split(" ")[0];
    return todayStr;
  });
  const [eventStartHour, setEventStartHour] = useState<number>(() => {
    if (timeData?.startTime) return parseInt(timeData.startTime.split(":")[0], 10) || 9;
    if (value && value.includes(":")) {
      const t = value.includes(" ") ? value.split(" ")[1] : value;
      return parseInt(t.split(":")[0], 10) || 9;
    }
    return 9;
  });
  const [eventStartMinute, setEventStartMinute] = useState<number>(() => {
    if (timeData?.startTime) return parseInt(timeData.startTime.split(":")[1], 10) || 0;
    if (value && value.includes(":")) {
      const t = value.includes(" ") ? value.split(" ")[1] : value;
      return parseInt(t.split(":")[1], 10) || 0;
    }
    return 0;
  });
  const [hasEndTime, setHasEndTime] = useState<boolean>(() => !!timeData?.endTime);
  const [eventEndHour, setEventEndHour] = useState<number>(() => {
    if (timeData?.endTime) return parseInt(timeData.endTime.split(":")[0], 10) || 10;
    return 10;
  });
  const [eventEndMinute, setEventEndMinute] = useState<number>(() => {
    if (timeData?.endTime) return parseInt(timeData.endTime.split(":")[1], 10) || 30;
    return 30;
  });

  // State cho Chế độ 2: Hạn Chót
  const [deadlineDate, setDeadlineDate] = useState<string>(() => {
    if (timeData?.deadlineDate) return timeData.deadlineDate;
    if (value && value.includes("-")) return value.split(" ")[0];
    return todayStr;
  });
  const [deadlineHour, setDeadlineHour] = useState<number>(() => {
    if (timeData?.deadlineTime) return parseInt(timeData.deadlineTime.split(":")[0], 10) || 17;
    return 17;
  });
  const [deadlineMinute, setDeadlineMinute] = useState<number>(() => {
    if (timeData?.deadlineTime) return parseInt(timeData.deadlineTime.split(":")[1], 10) || 0;
    return 0;
  });

  // Lịch matrix
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  // Đăng ký phím Back phần cứng
  useEffect(() => {
    if (!isOpen) return;
    return registerBackHandler(() => {
      setIsOpen(false);
      return true;
    });
  }, [isOpen]);

  // Khóa cuộn trang nền khi mở modal
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Sinh ma trận ngày trong tháng
  const getDaysInMonthMatrix = (year: number, month: number) => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    let startDayOfWeek = firstDayOfMonth.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const totalDays = lastDayOfMonth.getDate();
    const days: { dayNum: number; dateStr: string; isCurrentMonth: boolean }[] = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({ dayNum: d, dateStr, isCurrentMonth: false });
    }

    for (let i = 1; i <= totalDays; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      days.push({ dayNum: i, dateStr, isCurrentMonth: true });
    }

    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      days.push({ dayNum: i, dateStr, isCurrentMonth: false });
    }

    return days;
  };

  const handleApply = () => {
    if (mode === "event") {
      const startTimeStr = `${String(eventStartHour).padStart(2, "0")}:${String(eventStartMinute).padStart(2, "0")}`;
      const endTimeStr = hasEndTime
        ? `${String(eventEndHour).padStart(2, "0")}:${String(eventEndMinute).padStart(2, "0")}`
        : undefined;
      const finalStr = `${eventDate} ${startTimeStr}`;
      onChange?.(finalStr, {
        timeType: "event",
        date: eventDate,
        startTime: startTimeStr,
        endTime: endTimeStr,
      });
    } else {
      const deadlineTimeStr = `${String(deadlineHour).padStart(2, "0")}:${String(deadlineMinute).padStart(2, "0")}`;
      const finalStr = `${deadlineDate} ${deadlineTimeStr}`;
      onChange?.(finalStr, {
        timeType: "task",
        deadlineDate,
        deadlineTime: deadlineTimeStr,
      });
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange?.(undefined, undefined);
    setIsOpen(false);
  };

  // Text hiển thị nút kích hoạt
  const renderTriggerLabel = () => {
    if (!value && !timeData?.startTime && !timeData?.deadlineDate) {
      return (
        <span className="flex items-center gap-1.5 text-[#78716C]">
          <Clock size={13} strokeWidth={2.2} />
          <span>Hẹn giờ / Hạn chót</span>
        </span>
      );
    }

    if (timeData?.timeType === "task" || mode === "task") {
      const d = timeData?.deadlineDate || deadlineDate;
      const t = timeData?.deadlineTime || `${String(deadlineHour).padStart(2, "0")}:${String(deadlineMinute).padStart(2, "0")}`;
      return (
        <span className="flex items-center gap-1.5 text-amber-900 font-bold">
          <Hourglass size={13} strokeWidth={2.2} className="text-amber-600" />
          <span>Hạn: {t} ({d.slice(5).replace("-", "/")})</span>
        </span>
      );
    }

    const d = timeData?.date || eventDate;
    const st = timeData?.startTime || `${String(eventStartHour).padStart(2, "0")}:${String(eventStartMinute).padStart(2, "0")}`;
    const et = timeData?.endTime ? ` - ${timeData.endTime}` : "";
    return (
      <span className="flex items-center gap-1.5 text-indigo-900 font-bold">
        <Clock size={13} strokeWidth={2.2} className="text-indigo-600" />
        <span>Lịch: {st}{et} ({d.slice(5).replace("-", "/")})</span>
      </span>
    );
  };

  const currentActiveDate = mode === "event" ? eventDate : deadlineDate;
  const setDateForCurrentMode = (d: string) => {
    if (mode === "event") setEventDate(d);
    else setDeadlineDate(d);
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Nút bấm kích hoạt mở Modal */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="due-picker-trigger px-2.5 py-1.5 bg-[#FCFBF9] hover:bg-white border-[1.5px] border-[#262626] rounded-[5px] shadow-[1.5px_1.5px_0px_#262626] text-xs font-medium flex items-center gap-1.5 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all"
      >
        {renderTriggerLabel()}
      </button>

      {/* Modal Chọn Thời Gian Căn Giữa Màn Hình Với Nền Mờ Sâu */}
      {isOpen &&
        createPortal(
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999999,
              backgroundColor: "rgba(0, 0, 0, 0.80)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              touchAction: "none",
            }}
            className="flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm bg-[#FBF9F4] border-[2px] border-[#262626] rounded-[8px] shadow-[6px_6px_0px_#262626] p-4 sm:p-5 flex flex-col justify-between overflow-hidden animate-in zoom-in-95 duration-200 max-h-[94vh]"
            >
              {/* Header Modal */}
              <div className="flex items-center justify-between pb-2.5 border-b border-[#262626] shrink-0">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-[#FEF08A] border border-[#262626] rounded-[4px] shadow-[1px_1px_0px_#262626]">
                    <CalendarDays size={16} strokeWidth={2.4} className="text-[#1C1917]" />
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-[#1C1917]">
                      Thiết lập thời gian
                    </h3>
                    <p className="text-[10px] text-[#78716C]">
                      Phân biệt Lịch hẹn làm việc & Hạn chót
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 rounded bg-white hover:bg-rose-50 border border-[#262626] flex items-center justify-center text-[#78716C] hover:text-rose-600 active:translate-y-[0.5px] transition-all"
                >
                  <X size={14} strokeWidth={2.4} />
                </button>
              </div>

              {/* Bộ Chuyển Đổi 2 Chế Độ (Segmented Tab) */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#ECE8DF] border border-[#262626] rounded-[6px] my-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setMode("event")}
                  className={`py-1.5 px-2 rounded-[4px] text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    mode === "event"
                      ? "bg-[#FEF08A] text-[#1C1917] border border-[#262626] shadow-[1.5px_1.5px_0px_#262626]"
                      : "text-[#78716C] hover:text-[#1C1917]"
                  }`}
                >
                  <Clock size={13} strokeWidth={2.2} />
                  <span>🕒 Lịch Hẹn</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode("task")}
                  className={`py-1.5 px-2 rounded-[4px] text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    mode === "task"
                      ? "bg-[#FECDD3] text-[#1C1917] border border-[#262626] shadow-[1.5px_1.5px_0px_#262626]"
                      : "text-[#78716C] hover:text-[#1C1917]"
                  }`}
                >
                  <Hourglass size={13} strokeWidth={2.2} />
                  <span>⏳ Hạn Chót</span>
                </button>
              </div>

              {/* Nội dung theo từng chế độ cuộn mượt */}
              <div className="overflow-y-auto no-scrollbar space-y-3 flex-1 pb-2">
                {/* 1. Lưới Chọn Ngày */}
                <div className="bg-white border border-[#262626] rounded-[6px] p-2.5 shadow-[1px_1px_0px_#262626]">
                  {/* Điều hướng Tháng/Năm */}
                  <div className="flex items-center justify-between mb-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (viewMonth === 0) {
                          setViewMonth(11);
                          setViewYear(viewYear - 1);
                        } else {
                          setViewMonth(viewMonth - 1);
                        }
                      }}
                      className="p-1 hover:bg-[#F5F3EF] rounded border border-[#D4CEBF]"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span className="font-bold text-xs text-[#1C1917]">
                      {MONTH_NAMES[viewMonth]}, {viewYear}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (viewMonth === 11) {
                          setViewMonth(0);
                          setViewYear(viewYear + 1);
                        } else {
                          setViewMonth(viewMonth + 1);
                        }
                      }}
                      className="p-1 hover:bg-[#F5F3EF] rounded border border-[#D4CEBF]"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  {/* Tên các thứ */}
                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-[#78716C] mb-1">
                    {DAY_NAMES.map((d) => (
                      <span key={d}>{d}</span>
                    ))}
                  </div>

                  {/* Lưới các ô ngày */}
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {getDaysInMonthMatrix(viewYear, viewMonth).map(
                      ({ dayNum, dateStr, isCurrentMonth }) => {
                        const isSelected = currentActiveDate === dateStr;
                        const isToday = dateStr === todayStr;

                        return (
                          <button
                            key={dateStr}
                            type="button"
                            onClick={() => setDateForCurrentMode(dateStr)}
                            className={`h-6 text-[11px] font-bold rounded flex items-center justify-center transition-all ${
                              isSelected
                                ? mode === "event"
                                  ? "bg-[#FEF08A] text-[#1C1917] border border-[#262626] shadow-[1px_1px_0px_#262626]"
                                  : "bg-[#FECDD3] text-[#1C1917] border border-[#262626] shadow-[1px_1px_0px_#262626]"
                                : isToday
                                  ? "border border-dashed border-[#262626] font-extrabold bg-amber-50"
                                  : isCurrentMonth
                                    ? "text-[#1C1917] hover:bg-[#F5F3EF]"
                                    : "text-[#D4CEBF]"
                            }`}
                          >
                            {dayNum}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* 2. Thiết lập Giờ theo Chế Độ */}
                {mode === "event" ? (
                  // CHẾ ĐỘ LỊCH HẸN
                  <div className="bg-white border border-[#262626] rounded-[6px] p-2.5 shadow-[1px_1px_0px_#262626] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#1C1917] flex items-center gap-1">
                        <Clock size={12} className="text-indigo-600" />
                        <span>Giờ bắt đầu cuộc hẹn:</span>
                      </span>
                      <div className="flex items-center gap-1 font-mono text-xs font-bold">
                        <select
                          value={eventStartHour}
                          onChange={(e) => setEventStartHour(Number(e.target.value))}
                          className="bg-[#FCFBF9] border border-[#262626] rounded px-1.5 py-1"
                        >
                          {Array.from({ length: 24 }).map((_, i) => (
                            <option key={i} value={i}>
                              {String(i).padStart(2, "0")}
                            </option>
                          ))}
                        </select>
                        <span>:</span>
                        <select
                          value={eventStartMinute}
                          onChange={(e) => setEventStartMinute(Number(e.target.value))}
                          className="bg-[#FCFBF9] border border-[#262626] rounded px-1.5 py-1"
                        >
                          {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                            <option key={m} value={m}>
                              {String(m).padStart(2, "0")}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Tùy chọn Có giờ kết thúc */}
                    <div className="pt-2 border-t border-[#E7E5E4] space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer text-[11px] font-medium text-[#1C1917]">
                        <input
                          type="checkbox"
                          checked={hasEndTime}
                          onChange={(e) => setHasEndTime(e.target.checked)}
                          className="w-3.5 h-3.5 accent-[#262626] rounded"
                        />
                        <span>Có giờ kết thúc cuộc hẹn</span>
                      </label>

                      {hasEndTime && (
                        <div className="flex items-center justify-between pl-5 animate-in fade-in duration-150">
                          <span className="text-[11px] text-[#78716C]">Đến lúc:</span>
                          <div className="flex items-center gap-1 font-mono text-xs font-bold">
                            <select
                              value={eventEndHour}
                              onChange={(e) => setEventEndHour(Number(e.target.value))}
                              className="bg-[#FCFBF9] border border-[#262626] rounded px-1.5 py-1"
                            >
                              {Array.from({ length: 24 }).map((_, i) => (
                                <option key={i} value={i}>
                                  {String(i).padStart(2, "0")}
                                </option>
                              ))}
                            </select>
                            <span>:</span>
                            <select
                              value={eventEndMinute}
                              onChange={(e) => setEventEndMinute(Number(e.target.value))}
                              className="bg-[#FCFBF9] border border-[#262626] rounded px-1.5 py-1"
                            >
                              {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                                <option key={m} value={m}>
                                  {String(m).padStart(2, "0")}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  // CHẾ ĐỘ HẠN CHÓT
                  <div className="bg-white border border-[#262626] rounded-[6px] p-2.5 shadow-[1px_1px_0px_#262626] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#1C1917] flex items-center gap-1">
                        <Hourglass size={12} className="text-amber-600" />
                        <span>Hoàn thành trước giờ:</span>
                      </span>
                      <div className="flex items-center gap-1 font-mono text-xs font-bold">
                        <select
                          value={deadlineHour}
                          onChange={(e) => setDeadlineHour(Number(e.target.value))}
                          className="bg-[#FCFBF9] border border-[#262626] rounded px-1.5 py-1"
                        >
                          {Array.from({ length: 24 }).map((_, i) => (
                            <option key={i} value={i}>
                              {String(i).padStart(2, "0")}
                            </option>
                          ))}
                        </select>
                        <span>:</span>
                        <select
                          value={deadlineMinute}
                          onChange={(e) => setDeadlineMinute(Number(e.target.value))}
                          className="bg-[#FCFBF9] border border-[#262626] rounded px-1.5 py-1"
                        >
                          {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                            <option key={m} value={m}>
                              {String(m).padStart(2, "0")}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <p className="text-[10px] text-[#78716C] leading-snug">
                      Hệ thống sẽ nhắc nhở trước thời điểm này để bạn không bị trễ hạn.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer Modal: Nút Hủy & Lưu */}
              <div className="flex items-center justify-between pt-3 border-t border-[#262626] shrink-0 gap-2">
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-3 py-1.5 bg-white hover:bg-rose-50 border border-[#262626] rounded-[5px] text-xs font-bold text-[#78716C] hover:text-rose-700 active:translate-y-[0.5px] transition-all"
                >
                  Xóa thời gian
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-3 py-1.5 bg-white hover:bg-gray-100 border border-[#262626] rounded-[5px] text-xs font-bold text-[#1C1917] active:translate-y-[0.5px] transition-all"
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    onClick={handleApply}
                    className="px-3.5 py-1.5 bg-[#FEF08A] hover:bg-[#FDE047] border-[1.5px] border-[#262626] rounded-[5px] text-xs font-bold text-[#1C1917] shadow-[2px_2px_0px_#262626] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center gap-1"
                  >
                    <Check size={13} strokeWidth={2.4} />
                    <span>Áp dụng</span>
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
