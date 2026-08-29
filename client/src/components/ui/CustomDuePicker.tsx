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
} from "lucide-react";
import { getLocalTodayStr } from "../../utils/date";

// ==========================================
// COMPONENT: CustomDuePicker (Phân Biệt Lịch Làm Việc & Hạn Chót)
// ==========================================

export interface CustomScheduleValue {
  timeType?: "scheduled" | "deadline";
  dueDate?: string;
  startTime?: string;
  endTime?: string;
  deadlineDate?: string;
  deadlineTime?: string;
}

export interface CustomDuePickerProps {
  value?: string;
  timeType?: "scheduled" | "deadline";
  startTime?: string;
  endTime?: string;
  deadlineDate?: string;
  deadlineTime?: string;
  onChange?: (value: string | undefined) => void;
  onSaveSchedule?: (data: CustomScheduleValue) => void;
  mode?: "time-only" | "datetime";
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
  timeType: initialTimeType = "scheduled",
  startTime: initialStartTime,
  endTime: initialEndTime,
  deadlineDate: initialDeadlineDate,
  deadlineTime: initialDeadlineTime,
  onChange,
  onSaveSchedule,
  mode = "datetime",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const todayStr = getLocalTodayStr(now);

  // 1. Phân loại thời gian: Lịch làm (scheduled) vs Hạn chót (deadline)
  const [currentTimeType, setCurrentTimeType] = useState<"scheduled" | "deadline">(
    initialDeadlineDate || initialTimeType === "deadline" ? "deadline" : "scheduled"
  );

  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [dateViewMode, setDateViewMode] = useState<"days" | "months" | "years">("days");

  // Ngày được chọn
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (initialDeadlineDate) return initialDeadlineDate;
    if (value && value.includes("-")) return value.split(" ")[0];
    return todayStr;
  });

  // Giờ bắt đầu / Giờ hạn chót
  const [startHour, setStartHour] = useState<number>(() => {
    if (initialStartTime) return parseInt(initialStartTime.split(":")[0], 10) || 9;
    if (initialDeadlineTime) return parseInt(initialDeadlineTime.split(":")[0], 10) || 17;
    if (value && value.includes(":")) {
      const timePart = value.includes(" ") ? value.split(" ")[1] : value;
      return parseInt(timePart.split(":")[0], 10) || 9;
    }
    return 9;
  });

  const [startMinute, setStartMinute] = useState<number>(() => {
    if (initialStartTime) return parseInt(initialStartTime.split(":")[1], 10) || 0;
    if (initialDeadlineTime) return parseInt(initialDeadlineTime.split(":")[1], 10) || 0;
    if (value && value.includes(":")) {
      const timePart = value.includes(" ") ? value.split(" ")[1] : value;
      return parseInt(timePart.split(":")[1], 10) || 0;
    }
    return 0;
  });

  // Tùy chọn giờ kết thúc (Dành cho Lịch làm việc: ví dụ từ 09:00 đến 10:30)
  const [hasEndTime, setHasEndTime] = useState<boolean>(Boolean(initialEndTime));
  const [endHour, setEndHour] = useState<number>(() => {
    if (initialEndTime) return parseInt(initialEndTime.split(":")[0], 10) || 10;
    return 10;
  });
  const [endMinute, setEndMinute] = useState<number>(() => {
    if (initialEndTime) return parseInt(initialEndTime.split(":")[1], 10) || 30;
    return 30;
  });

  // Tab con bên trong: Chọn Ngày hay Chọn Giờ
  const [activeSubTab, setActiveSubTab] = useState<"date" | "time">(
    mode === "time-only" ? "time" : "date"
  );

  // Đồng bộ khi mở modal
  useEffect(() => {
    if (isOpen) {
      if (initialDeadlineDate) {
        setCurrentTimeType("deadline");
        setSelectedDate(initialDeadlineDate);
      } else if (value && value.includes("-")) {
        setSelectedDate(value.split(" ")[0]);
      }

      if (initialStartTime) {
        setStartHour(parseInt(initialStartTime.split(":")[0], 10) || 9);
        setStartMinute(parseInt(initialStartTime.split(":")[1], 10) || 0);
      } else if (initialDeadlineTime) {
        setStartHour(parseInt(initialDeadlineTime.split(":")[0], 10) || 17);
        setStartMinute(parseInt(initialDeadlineTime.split(":")[1], 10) || 0);
      } else if (value && value.includes(":")) {
        const timePart = value.includes(" ") ? value.split(" ")[1] : value;
        setStartHour(parseInt(timePart.split(":")[0], 10) || 9);
        setStartMinute(parseInt(timePart.split(":")[1], 10) || 0);
      }

      if (initialEndTime) {
        setHasEndTime(true);
        setEndHour(parseInt(initialEndTime.split(":")[0], 10) || 10);
        setEndMinute(parseInt(initialEndTime.split(":")[1], 10) || 30);
      }
    }
  }, [isOpen, value, initialDeadlineDate, initialStartTime, initialEndTime, initialDeadlineTime, initialTimeType]);

  // Khóa cuộn trang nền khi mở modal
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
      };
    }
  }, [isOpen]);

  const formattedStartHour = String(startHour).padStart(2, "0");
  const formattedStartMinute = String(startMinute).padStart(2, "0");
  const formattedStartTime = `${formattedStartHour}:${formattedStartMinute}`;

  const formattedEndHour = String(endHour).padStart(2, "0");
  const formattedEndMinute = String(endMinute).padStart(2, "0");
  const formattedEndTime = `${formattedEndHour}:${formattedEndMinute}`;

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

    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({ dayNum: d, dateStr, isCurrentMonth: true });
    }

    let nextDay = 1;
    while (days.length % 7 !== 0) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(nextDay).padStart(2, "0")}`;
      days.push({ dayNum: nextDay, dateStr, isCurrentMonth: false });
      nextDay++;
    }

    return days;
  };

  const daysMatrix = getDaysInMonthMatrix(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Xác nhận lưu
  const handleApply = () => {
    const finalStartTime = formattedStartTime;
    const finalEndTime = hasEndTime && currentTimeType === "scheduled" ? formattedEndTime : undefined;

    if (currentTimeType === "deadline") {
      const resultData: CustomScheduleValue = {
        timeType: "deadline",
        deadlineDate: mode === "time-only" ? todayStr : selectedDate,
        deadlineTime: finalStartTime,
        dueDate: mode === "time-only" ? `${todayStr} ${finalStartTime}` : `${selectedDate} ${finalStartTime}`,
      };

      if (onSaveSchedule) {
        onSaveSchedule(resultData);
      } else if (onChange) {
        onChange(resultData.dueDate);
      }
    } else {
      // Scheduled (Lịch làm việc)
      const resultData: CustomScheduleValue = {
        timeType: "scheduled",
        startTime: finalStartTime,
        endTime: finalEndTime,
        dueDate: mode === "time-only" ? finalStartTime : `${selectedDate} ${finalStartTime}`,
      };

      if (onSaveSchedule) {
        onSaveSchedule(resultData);
      } else if (onChange) {
        onChange(resultData.dueDate);
      }
    }

    setIsOpen(false);
    setDateViewMode("days");
  };

  const handleClear = () => {
    if (onSaveSchedule) {
      onSaveSchedule({
        timeType: undefined,
        dueDate: undefined,
        startTime: undefined,
        endTime: undefined,
        deadlineDate: undefined,
        deadlineTime: undefined,
      });
    }
    if (onChange) {
      onChange(undefined);
    }
    setIsOpen(false);
    setDateViewMode("days");
  };

  // Hiển thị nhãn trên Trigger Button
  const renderDisplayLabel = () => {
    if (initialDeadlineDate || currentTimeType === "deadline") {
      const datePart = initialDeadlineDate || (value?.includes("-") ? value.split(" ")[0] : "");
      const timePart = initialDeadlineTime || (value?.includes(":") ? (value.includes(" ") ? value.split(" ")[1] : value) : "");
      if (!datePart && !timePart) return "⏳ Hạn chót";
      const formattedDate = datePart ? datePart.split("-").slice(1).reverse().join("/") : "";
      return timePart ? `⏳ Hạn: ${formattedDate ? formattedDate + " " : ""}${timePart}` : `⏳ Hạn: ${formattedDate}`;
    }

    if (initialStartTime || (value && value.includes(":"))) {
      const timePart = initialStartTime || (value?.includes(" ") ? value.split(" ")[1] : value);
      const timeRange = initialEndTime && initialEndTime !== timePart ? `${timePart} - ${initialEndTime}` : timePart;
      if (mode === "time-only") return `🕒 ${timeRange}`;
      if (value?.includes("-")) {
        const dateParts = value.split(" ")[0].split("-");
        return `🕒 ${dateParts[2]}/${dateParts[1]} ${timeRange}`;
      }
      return `🕒 ${timeRange}`;
    }

    if (value && value.includes("-")) {
      const dateParts = value.split(" ")[0].split("-");
      return `📅 ${dateParts[2]}/${dateParts[1]}`;
    }

    return mode === "time-only" ? "Giờ hẹn" : "Lịch / Hạn chót";
  };

  const isHighlighted = Boolean(value || initialStartTime || initialDeadlineDate);
  const isDeadlineMode = currentTimeType === "deadline";
  const yearList = Array.from({ length: 9 }, (_, i) => 2024 + i);

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button Nhỏ Gọn & Tinh Tế */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
          if (mode === "time-only") setActiveSubTab("time");
        }}
        className={`inline-flex items-center justify-between gap-1 px-2 py-1 h-7 text-[11px] rounded-[4px] border-[1.5px] transition-all select-none whitespace-nowrap ${
          isHighlighted
            ? isDeadlineMode
              ? "bg-amber-100 border-[#262626] text-amber-900 font-bold shadow-[1px_1px_0px_#262626]"
              : "bg-[#FEF08A] border-[#262626] text-[#1C1917] font-bold shadow-[1px_1px_0px_#262626]"
            : "bg-white border-[#D4CEBF] text-[#78716C] hover:border-[#262626] hover:text-[#1C1917] shadow-[1px_1px_0px_#D4CEBF]"
        } active:translate-x-[0.5px] active:translate-y-[0.5px]`}
      >
        <div className="flex items-center gap-1 min-w-0">
          {isDeadlineMode ? (
            <Hourglass size={11} className="shrink-0 text-amber-800" strokeWidth={2.4} />
          ) : mode === "time-only" ? (
            <Clock size={11} className="shrink-0 text-[#1C1917]" strokeWidth={2.2} />
          ) : (
            <CalendarIcon size={11} className="shrink-0 text-[#1C1917]" strokeWidth={2.2} />
          )}
          <span className="font-mono text-[11px]">
            {renderDisplayLabel()}
          </span>
        </div>
        <span className="text-[9px] text-[#78716C] ml-0.5 shrink-0">▾</span>
      </button>

      {/* Full-Screen Modal Backdrop & Center Card */}
      {isOpen &&
        createPortal(
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 999999,
              backgroundColor: "rgba(0, 0, 0, 0.82)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              touchAction: "none",
            }}
            className="flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-200 pointer-events-auto"
            onClick={() => {
              setIsOpen(false);
              setDateViewMode("days");
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[340px] bg-[#FBF9F4] border-[2px] border-[#262626] rounded-[8px] shadow-[6px_6px_0px_#262626] p-4 space-y-3 animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto no-scrollbar"
            >
              {/* Header Modal */}
              <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
                <div className="flex items-center gap-1.5">
                  <span className={`p-1 border border-[#262626] rounded-[3px] ${isDeadlineMode ? "bg-amber-200" : "bg-[#FEF08A]"}`}>
                    {isDeadlineMode ? <Hourglass size={14} className="text-[#1C1917]" /> : <Clock size={14} className="text-[#1C1917]" />}
                  </span>
                  <h3 className="font-bold text-xs sm:text-sm text-[#1C1917]">
                    Cài đặt thời gian công việc
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setDateViewMode("days");
                  }}
                  className="w-6 h-6 rounded bg-white hover:bg-rose-50 border border-[#262626] flex items-center justify-center text-[#78716C] hover:text-rose-600 active:translate-y-[0.5px]"
                >
                  <X size={13} strokeWidth={2.4} />
                </button>
              </div>

              {/* 2 TAB LỚN PHÂN BIỆT RÕ RÀNG: LỊCH LÀM VIỆC vs HẠN CHÓT */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-white border-[1.5px] border-[#262626] rounded-[6px] shadow-[1.5px_1.5px_0px_#262626]">
                <button
                  type="button"
                  onClick={() => setCurrentTimeType("scheduled")}
                  className={`py-1.5 px-2 rounded-[4px] font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    currentTimeType === "scheduled"
                      ? "bg-[#FEF08A] text-[#1C1917] border border-[#262626] shadow-[1px_1px_0px_#262626]"
                      : "text-[#78716C] hover:text-[#1C1917]"
                  }`}
                >
                  <Clock size={13} strokeWidth={2.2} />
                  <span>🕒 Lịch làm việc</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentTimeType("deadline")}
                  className={`py-1.5 px-2 rounded-[4px] font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    currentTimeType === "deadline"
                      ? "bg-amber-200 text-amber-950 border border-[#262626] shadow-[1px_1px_0px_#262626]"
                      : "text-[#78716C] hover:text-[#1C1917]"
                  }`}
                >
                  <Hourglass size={13} strokeWidth={2.2} />
                  <span>⏳ Hạn chót</span>
                </button>
              </div>

              {/* Lời giải thích trực quan ngắn gọn */}
              <p className="text-[11px] text-[#78716C] italic bg-[#F3EFE6] p-1.5 rounded border border-[#D4CEBF]">
                {currentTimeType === "scheduled"
                  ? "📌 Lịch làm việc: Khung giờ thực hiện việc trong ngày (ví dụ từ 09:00 đến 10:30)."
                  : "⏳ Hạn chót: Mốc thời gian bắt buộc phải hoàn thành xong (qua mốc này sẽ báo Quá hạn)."}
              </p>

              {/* Tab Con: Chọn Ngày & Chọn Giờ */}
              {mode === "datetime" && (
                <div className="grid grid-cols-2 gap-1 p-0.5 bg-white border border-[#262626] rounded-[4px]">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSubTab("date");
                      setDateViewMode("days");
                    }}
                    className={`py-1 rounded-[2px] font-bold text-xs flex items-center justify-center gap-1 transition-all ${
                      activeSubTab === "date"
                        ? "bg-[#262626] text-white shadow-[1px_1px_0px_#262626]"
                        : "text-[#78716C] hover:text-[#1C1917]"
                    }`}
                  >
                    <CalendarIcon size={12} />
                    <span>{currentTimeType === "scheduled" ? "Ngày làm" : "Ngày hết hạn"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSubTab("time")}
                    className={`py-1 rounded-[2px] font-bold text-xs flex items-center justify-center gap-1 transition-all ${
                      activeSubTab === "time"
                        ? "bg-[#262626] text-white shadow-[1px_1px_0px_#262626]"
                        : "text-[#78716C] hover:text-[#1C1917]"
                    }`}
                  >
                    <Clock size={12} />
                    <span>{currentTimeType === "scheduled" ? "Khung giờ" : "Giờ hạn chót"}</span>
                  </button>
                </div>
              )}

              {/* ========================================== */}
              {/* TAB CON 1: BẢNG LỊCH CHỌN NGÀY */}
              {/* ========================================== */}
              {mode === "datetime" && activeSubTab === "date" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-white px-2 py-1 border border-[#262626] rounded-[4px]">
                    <button
                      type="button"
                      onClick={prevMonth}
                      className="px-1.5 py-0.5 hover:bg-[#F3EFE6] rounded font-bold text-xs"
                    >
                      <ChevronLeft size={14} />
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setDateViewMode(dateViewMode === "months" ? "days" : "months")
                        }
                        className="px-1.5 py-0.5 rounded text-xs font-bold hover:bg-[#FEF08A]"
                      >
                        {MONTH_NAMES[viewMonth]} ▾
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setDateViewMode(dateViewMode === "years" ? "days" : "years")
                        }
                        className="px-1.5 py-0.5 rounded text-xs font-bold hover:bg-[#FEF08A]"
                      >
                        {viewYear} ▾
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={nextMonth}
                      className="px-1.5 py-0.5 hover:bg-[#F3EFE6] rounded font-bold text-xs"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  {dateViewMode === "months" && (
                    <div className="grid grid-cols-3 gap-1 p-1 bg-white border border-[#262626] rounded-[4px]">
                      {MONTH_NAMES.map((name, mIdx) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => {
                            setViewMonth(mIdx);
                            setDateViewMode("days");
                          }}
                          className={`py-1.5 rounded text-[11px] font-medium ${
                            viewMonth === mIdx ? "bg-[#FEF08A] font-bold border border-[#262626]" : "hover:bg-[#F3EFE6]"
                          }`}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  )}

                  {dateViewMode === "years" && (
                    <div className="grid grid-cols-3 gap-1 p-1 bg-white border border-[#262626] rounded-[4px]">
                      {yearList.map((y) => (
                        <button
                          key={y}
                          type="button"
                          onClick={() => {
                            setViewYear(y);
                            setDateViewMode("days");
                          }}
                          className={`py-1.5 rounded font-mono text-[11px] font-medium ${
                            viewYear === y ? "bg-[#FEF08A] font-bold border border-[#262626]" : "hover:bg-[#F3EFE6]"
                          }`}
                        >
                          {y}
                        </button>
                      ))}
                    </div>
                  )}

                  {dateViewMode === "days" && (
                    <>
                      <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-[#78716C]">
                        {DAY_NAMES.map((d) => (
                          <div key={d}>{d}</div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-1">
                        {daysMatrix.map((item) => {
                          const isSelected = selectedDate === item.dateStr;
                          const isToday = todayStr === item.dateStr;

                          return (
                            <button
                              key={item.dateStr}
                              type="button"
                              onClick={() => setSelectedDate(item.dateStr)}
                              className={`h-6 rounded-[3px] border text-[11px] font-mono font-bold flex items-center justify-center transition-all ${
                                isSelected
                                  ? "bg-[#FEF08A] border-[#262626] shadow-[1px_1px_0px_#262626]"
                                  : isToday
                                  ? "bg-white border-[#262626] underline decoration-[#FEF08A]"
                                  : item.isCurrentMonth
                                  ? "bg-white border-[#D4CEBF] text-[#1C1917] hover:bg-[#F3EFE6]"
                                  : "border-transparent text-[#A8A29E]"
                              }`}
                            >
                              {item.dayNum}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ========================================== */}
              {/* TAB CON 2: KÉO THẢ GIỜ BẮT ĐẦU & KẾT THÚC */}
              {/* ========================================== */}
              {(mode === "time-only" || activeSubTab === "time") && (
                <div className="space-y-3">
                  {/* Màn hình Đồng Hồ Số */}
                  <div className={`flex items-center justify-center border-[1.5px] border-[#262626] rounded-[4px] py-2 shadow-[1.5px_1.5px_0px_#262626] ${isDeadlineMode ? "bg-amber-200" : "bg-[#FEF08A]"}`}>
                    <span className="font-mono text-2xl font-bold tracking-wider text-[#1C1917]">
                      {currentTimeType === "scheduled" && hasEndTime
                        ? `${formattedStartTime} ➔ ${formattedEndTime}`
                        : formattedStartTime}
                    </span>
                  </div>

                  {/* GIỜ BẮT ĐẦU / GIỜ HẠN CHÓT */}
                  <div className="space-y-1.5 bg-white p-2.5 border border-[#262626] rounded-[4px]">
                    <div className="flex items-center justify-between text-xs font-bold text-[#1C1917]">
                      <span className="text-[11px] text-[#78716C]">
                        {currentTimeType === "scheduled" ? "Giờ bắt đầu:" : "Giờ hết hạn:"}
                      </span>
                      <span className="font-mono bg-[#FEF08A] px-1.5 py-0.2 rounded border border-[#262626]">
                        {formattedStartTime}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="text-[10px] text-[#78716C] w-6">Giờ</span>
                      <input
                        type="range"
                        min="0"
                        max="23"
                        step="1"
                        value={startHour}
                        onChange={(e) => setStartHour(parseInt(e.target.value, 10))}
                        className="flex-1 accent-[#262626] h-2 bg-[#F3EFE6] border border-[#262626] rounded-lg cursor-pointer"
                      />
                      <span className="font-mono text-[11px] font-bold w-6 text-right">{formattedStartHour}h</span>
                    </div>

                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="text-[10px] text-[#78716C] w-6">Phút</span>
                      <input
                        type="range"
                        min="0"
                        max="59"
                        step="5"
                        value={startMinute}
                        onChange={(e) => setStartMinute(parseInt(e.target.value, 10))}
                        className="flex-1 accent-[#262626] h-2 bg-[#F3EFE6] border border-[#262626] rounded-lg cursor-pointer"
                      />
                      <span className="font-mono text-[11px] font-bold w-6 text-right">:{formattedStartMinute}</span>
                    </div>
                  </div>

                  {/* TÙY CHỌN KHUNG GIỜ KẾT THÚC (CHỈ HIỆN KHI Ở CHẾ ĐỘ LỊCH LÀM VIỆC) */}
                  {currentTimeType === "scheduled" && (
                    <div className="bg-white p-2.5 border border-[#262626] rounded-[4px] space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-[#1C1917]">
                          <input
                            type="checkbox"
                            checked={hasEndTime}
                            onChange={(e) => setHasEndTime(e.target.checked)}
                            className="w-3.5 h-3.5 accent-[#262626] rounded"
                          />
                          <span>Khung giờ kết thúc</span>
                        </label>
                        {hasEndTime && (
                          <span className="font-mono bg-[#BBF7D0] px-1.5 py-0.2 rounded border border-[#262626] text-[11px] font-bold">
                            Đến {formattedEndTime}
                          </span>
                        )}
                      </div>

                      {hasEndTime && (
                        <div className="space-y-1.5 pt-1 border-t border-[#D4CEBF]/60 animate-in fade-in">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-[#78716C] w-6">Giờ</span>
                            <input
                              type="range"
                              min="0"
                              max="23"
                              step="1"
                              value={endHour}
                              onChange={(e) => setEndHour(parseInt(e.target.value, 10))}
                              className="flex-1 accent-[#262626] h-2 bg-[#F3EFE6] border border-[#262626] rounded-lg cursor-pointer"
                            />
                            <span className="font-mono text-[11px] font-bold w-6 text-right">{formattedEndHour}h</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-[#78716C] w-6">Phút</span>
                            <input
                              type="range"
                              min="0"
                              max="59"
                              step="5"
                              value={endMinute}
                              onChange={(e) => setEndMinute(parseInt(e.target.value, 10))}
                              className="flex-1 accent-[#262626] h-2 bg-[#F3EFE6] border border-[#262626] rounded-lg cursor-pointer"
                            />
                            <span className="font-mono text-[11px] font-bold w-6 text-right">:{formattedEndMinute}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Actions Bottom */}
              <div className="flex items-center justify-between pt-2 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs text-rose-600 hover:underline font-bold"
                >
                  Xóa thời gian
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="px-4 py-1.5 bg-[#FEF08A] hover:bg-[#FDE047] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] font-bold text-xs active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex items-center gap-1"
                >
                  <Check size={13} strokeWidth={2.5} />
                  <span>Xác nhận</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
