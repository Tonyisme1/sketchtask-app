import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
} from "lucide-react";
import { getLocalTodayStr } from "../../utils/date";
import { registerBackHandler } from "../../utils/backNavigation";

// ==========================================
// COMPONENT: CustomDuePicker (Modal Chọn Ngày & Kéo Giờ Căn Giữa Nền Mờ Toàn Màn Hình)
// ==========================================

export interface CustomDuePickerProps {
  value?: string;
  onChange: (value: string | undefined) => void;
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
  onChange,
  mode = "datetime",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [dateViewMode, setDateViewMode] = useState<"days" | "months" | "years">("days");

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (value && value.includes("-")) {
      return value.split(" ")[0];
    }
    return getLocalTodayStr(now);
  });

  const [selectedHour, setSelectedHour] = useState<number>(() => {
    if (value && value.includes(":")) {
      const timePart = value.includes(" ") ? value.split(" ")[1] : value;
      return parseInt(timePart.split(":")[0], 10) || 9;
    }
    return 9;
  });

  const [selectedMinute, setSelectedMinute] = useState<number>(() => {
    if (value && value.includes(":")) {
      const timePart = value.includes(" ") ? value.split(" ")[1] : value;
      return parseInt(timePart.split(":")[1], 10) || 0;
    }
    return 0;
  });

  const [activeTab, setActiveTab] = useState<"date" | "time">(
    mode === "time-only" ? "time" : "date"
  );

  // Đồng bộ lại state nội bộ khi value bên ngoài thay đổi
  useEffect(() => {
    if (value && value.includes("-")) {
      setSelectedDate(value.split(" ")[0]);
    }
    if (value && value.includes(":")) {
      const timePart = value.includes(" ") ? value.split(" ")[1] : value;
      setSelectedHour(parseInt(timePart.split(":")[0], 10) || 9);
      setSelectedMinute(parseInt(timePart.split(":")[1], 10) || 0);
    }
  }, [value, isOpen]);

  // Đăng ký phím Back đóng bộ chọn thời gian
  useEffect(() => {
    if (isOpen) {
      const unregister = registerBackHandler(() => {
        setIsOpen(false);
        setDateViewMode("days");
        return true;
      });
      return unregister;
    }
  }, [isOpen]);

  // Khóa cuộn trang nền khi mở modal chọn ngày/giờ
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

  const formattedHour = String(selectedHour).padStart(2, "0");
  const formattedMinute = String(selectedMinute).padStart(2, "0");

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

  const handleApply = () => {
    if (mode === "time-only") {
      onChange(`${formattedHour}:${formattedMinute}`);
    } else {
      onChange(`${selectedDate} ${formattedHour}:${formattedMinute}`);
    }
    setIsOpen(false);
    setDateViewMode("days");
  };

  const handleClear = () => {
    onChange(undefined);
    setIsOpen(false);
    setDateViewMode("days");
  };

  const renderDisplayLabel = () => {
    if (!value) return mode === "time-only" ? "Giờ hẹn" : "Hạn chót";
    if (mode === "time-only") {
      return value.includes(" ") ? value.split(" ")[1] : value;
    }
    if (value.includes("-")) {
      const parts = value.split(" ");
      const dateParts = parts[0].split("-");
      const dateFormatted = `${dateParts[2]}/${dateParts[1]}`;
      return parts[1] ? `${dateFormatted} ${parts[1]}` : dateFormatted;
    }
    return value;
  };

  const yearList = Array.from({ length: 9 }, (_, i) => 2024 + i);

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button Nhỏ Gọn & Tinh Tế */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
          if (mode === "time-only") setActiveTab("time");
        }}
        className={`inline-flex items-center justify-between gap-1 px-2 py-1 h-7 text-[11px] rounded-[4px] border-[1.5px] transition-all select-none whitespace-nowrap ${
          value
            ? "bg-[#FEF08A] border-[#262626] text-[#1C1917] font-bold shadow-[1px_1px_0px_#262626]"
            : "bg-white border-[#D4CEBF] text-[#78716C] hover:border-[#262626] hover:text-[#1C1917] shadow-[1px_1px_0px_#D4CEBF]"
        } active:translate-x-[0.5px] active:translate-y-[0.5px]`}
      >
        <div className="flex items-center gap-1 min-w-0">
          {mode === "time-only" ? (
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

      {/* Full-Screen Modal Backdrop & Center Card (Chuẩn Nền Mờ Toàn Màn Hình Giống Cài Đặt) */}
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
              className="relative w-full max-w-[320px] bg-[#FBF9F4] border-[2px] border-[#262626] rounded-[8px] shadow-[6px_6px_0px_#262626] p-4 space-y-3 animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto no-scrollbar"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
                <div className="flex items-center gap-1.5">
                  <span className="p-1 bg-[#FEF08A] border border-[#262626] rounded-[3px]">
                    <Clock size={14} className="text-[#1C1917]" />
                  </span>
                  <h3 className="font-bold text-xs sm:text-sm text-[#1C1917]">
                    {mode === "time-only" ? "Chọn giờ hẹn" : "Chọn ngày & Giờ hẹn"}
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

              {/* Tab Switcher (Chỉ hiện khi ở mode datetime) */}
              {mode === "datetime" && (
                <div className="grid grid-cols-2 gap-1 p-0.5 bg-white border border-[#262626] rounded-[4px]">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("date");
                      setDateViewMode("days");
                    }}
                    className={`py-1 rounded-[2px] font-bold text-xs flex items-center justify-center gap-1 transition-all ${
                      activeTab === "date"
                        ? "bg-[#FEF08A] text-[#1C1917] shadow-[1px_1px_0px_#262626]"
                        : "text-[#78716C] hover:text-[#1C1917]"
                    }`}
                  >
                    <CalendarIcon size={12} />
                    <span>Ngày</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("time")}
                    className={`py-1 rounded-[2px] font-bold text-xs flex items-center justify-center gap-1 transition-all ${
                      activeTab === "time"
                        ? "bg-[#FEF08A] text-[#1C1917] shadow-[1px_1px_0px_#262626]"
                        : "text-[#78716C] hover:text-[#1C1917]"
                    }`}
                  >
                    <Clock size={12} />
                    <span>Giờ hẹn</span>
                  </button>
                </div>
              )}

              {/* ========================================== */}
              {/* TAB 1: BẢNG LỊCH CHỌN NGÀY */}
              {/* ========================================== */}
              {mode === "datetime" && activeTab === "date" && (
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
                          const isToday =
                            now.toISOString().split("T")[0] === item.dateStr;

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
              {/* TAB 2: 2 THANH KÉO THẢ GIỜ & PHÚT TRỰC QUAN */}
              {/* ========================================== */}
              {(mode === "time-only" || activeTab === "time") && (
                <div className="space-y-3">
                  {/* Màn hình Đồng Hồ Số Nổi Bật */}
                  <div className="flex items-center justify-center bg-[#FEF08A] border-[1.5px] border-[#262626] rounded-[4px] py-2 shadow-[1.5px_1.5px_0px_#262626]">
                    <span className="font-mono text-2xl font-bold tracking-wider text-[#1C1917]">
                      {formattedHour} : {formattedMinute}
                    </span>
                  </div>

                  {/* THANH KÉO 1: GIỜ (00 - 23h) */}
                  <div className="space-y-1 bg-white p-2 border border-[#262626] rounded-[4px]">
                    <div className="flex items-center justify-between text-xs font-bold text-[#1C1917]">
                      <span className="text-[11px] text-[#78716C]">Giờ:</span>
                      <span className="font-mono bg-[#FEF08A] px-1.5 py-0.2 rounded border border-[#262626]">
                        {formattedHour}h
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => setSelectedHour((prev) => Math.max(0, prev - 1))}
                        className="w-6 h-6 bg-[#FBF9F4] border border-[#262626] rounded font-bold text-xs flex items-center justify-center hover:bg-[#FEF08A] active:translate-y-[0.5px]"
                      >
                        -
                      </button>

                      <input
                        type="range"
                        min="0"
                        max="23"
                        step="1"
                        value={selectedHour}
                        onChange={(e) => setSelectedHour(parseInt(e.target.value, 10))}
                        className="flex-1 accent-[#262626] h-2 bg-[#F3EFE6] border border-[#262626] rounded-lg cursor-pointer"
                      />

                      <button
                        type="button"
                        onClick={() => setSelectedHour((prev) => Math.min(23, prev + 1))}
                        className="w-6 h-6 bg-[#FBF9F4] border border-[#262626] rounded font-bold text-xs flex items-center justify-center hover:bg-[#FEF08A] active:translate-y-[0.5px]"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex justify-between text-[9px] font-mono text-[#78716C] px-0.5">
                      <span>00h</span>
                      <span>06h</span>
                      <span>12h</span>
                      <span>18h</span>
                      <span>23h</span>
                    </div>
                  </div>

                  {/* THANH KÉO 2: PHÚT (00 - 59p) */}
                  <div className="space-y-1 bg-white p-2 border border-[#262626] rounded-[4px]">
                    <div className="flex items-center justify-between text-xs font-bold text-[#1C1917]">
                      <span className="text-[11px] text-[#78716C]">Phút:</span>
                      <span className="font-mono bg-[#BBF7D0] px-1.5 py-0.2 rounded border border-[#262626]">
                        :{formattedMinute}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => setSelectedMinute((prev) => Math.max(0, prev - 1))}
                        className="w-6 h-6 bg-[#FBF9F4] border border-[#262626] rounded font-bold text-xs flex items-center justify-center hover:bg-[#FEF08A] active:translate-y-[0.5px]"
                      >
                        -
                      </button>

                      <input
                        type="range"
                        min="0"
                        max="59"
                        step="1"
                        value={selectedMinute}
                        onChange={(e) => setSelectedMinute(parseInt(e.target.value, 10))}
                        className="flex-1 accent-[#262626] h-2 bg-[#F3EFE6] border border-[#262626] rounded-lg cursor-pointer"
                      />

                      <button
                        type="button"
                        onClick={() => setSelectedMinute((prev) => Math.min(59, prev + 1))}
                        className="w-6 h-6 bg-[#FBF9F4] border border-[#262626] rounded font-bold text-xs flex items-center justify-center hover:bg-[#FEF08A] active:translate-y-[0.5px]"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex justify-between text-[9px] font-mono text-[#78716C] px-0.5">
                      <span>:00</span>
                      <span>:15</span>
                      <span>:30</span>
                      <span>:45</span>
                      <span>:59</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions Bottom */}
              <div className="flex items-center justify-between pt-2 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs text-rose-600 hover:underline font-bold"
                >
                  Xóa hạn
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
