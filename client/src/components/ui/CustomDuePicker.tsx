import React, { useState, useRef, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
} from "lucide-react";
import { getLocalTodayStr } from "../../utils/date";

// ==========================================
// COMPONENT: CustomDuePicker (Bộ Chọn Giờ & Phút Bằng 2 Thanh Kéo Thả Trực Quan)
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

  // Đóng khi click ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setDateViewMode("days");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  // Khóa cuộn màn hình phía sau khi mở bộ chọn ngày/giờ
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
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
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
    if (!value) return mode === "time-only" ? "Chọn giờ" : "Chọn hạn";
    if (mode === "time-only") {
      return value.includes(" ") ? value.split(" ")[1] : value;
    }
    if (value.includes("-")) {
      const parts = value.split(" ");
      const dateParts = parts[0].split("-");
      const dateFormatted = `${dateParts[2]}/${dateParts[1]}`;
      return parts[1] ? `${dateFormatted} • ${parts[1]}` : dateFormatted;
    }
    return value;
  };

  const yearList = Array.from({ length: 9 }, (_, i) => 2024 + i);

  return (
    <div ref={containerRef} className={`relative w-full min-w-0 ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (mode === "time-only") setActiveTab("time");
        }}
        className="w-full min-w-0 flex items-center justify-between gap-1 px-2.5 py-1 text-xs bg-white border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] hover:-translate-y-[0.5px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all select-none text-[#1C1917]"
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
          <Clock size={12} strokeWidth={2.2} className="shrink-0 text-[#78716C]" />
          <span className="truncate font-mono text-[11px] font-medium text-left block min-w-0 flex-1">
            {renderDisplayLabel()}
          </span>
        </div>
        <span className="text-[10px] text-[#78716C] ml-1 shrink-0">▾</span>
      </button>

      {/* Popover Custom Box (Mobile: Modal Centered An Toàn 100% Không Bị Che - Desktop: Absolute) */}
      {isOpen && (
        <>
          <div
            onClick={() => {
              setIsOpen(false);
              setDateViewMode("days");
            }}
            className="fixed inset-0 bg-black/40 z-[999998] backdrop-blur-[2px] sm:hidden"
          />
          <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 sm:absolute sm:top-full sm:mt-1.5 sm:left-auto sm:right-0 sm:translate-x-0 sm:translate-y-0 w-[275px] max-w-[calc(100vw-32px)] max-h-[85vh] overflow-y-auto no-scrollbar bg-[#FBF9F4] border-[2px] sm:border-[1.5px] border-[#262626] rounded-[8px] sm:rounded-[6px] shadow-[4px_4px_0px_#262626] sm:shadow-[3px_3px_0px_#262626] z-[999999] p-3.5 sm:p-3 space-y-2.5 animate-in fade-in zoom-in-95 text-xs text-[#1C1917] select-none"
          >
          {/* Header */}
          <div className="flex items-center justify-between pb-1.5 border-b border-[#262626]">
            <span className="font-bold text-xs flex items-center gap-1.5">
              <Clock size={13} strokeWidth={2.2} className="text-[#1C1917]" />
              <span>{mode === "time-only" ? "KÉO CHỌN GIỜ" : "CHỌN HẠN"}</span>
            </span>
            <button
              onClick={() => {
                setIsOpen(false);
                setDateViewMode("days");
              }}
              className="text-[#78716C] hover:text-[#1C1917] font-bold text-xs"
            >
              ✕
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
                className={`py-1 rounded-[2px] font-bold text-center transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === "date"
                    ? "bg-[#FEF08A] text-[#1C1917] shadow-[1px_1px_0px_#262626]"
                    : "text-[#78716C]"
                }`}
              >
                <CalendarIcon size={13} strokeWidth={2.2} />
                <span>Ngày</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("time")}
                className={`py-1 rounded-[2px] font-bold text-center transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === "time"
                    ? "bg-[#FEF08A] text-[#1C1917] shadow-[1px_1px_0px_#262626]"
                    : "text-[#78716C]"
                }`}
              >
                <Clock size={13} strokeWidth={2.2} />
                <span>Giờ</span>
              </button>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 1: BẢNG LỊCH CHỌN NGÀY */}
          {/* ========================================== */}
          {mode === "datetime" && activeTab === "date" && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between bg-white px-2 py-0.5 border border-[#D4CEBF] rounded-[3px]">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="px-1.5 py-0.5 hover:bg-[#F3EFE6] rounded font-bold text-xs"
                >
                  ←
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setDateViewMode(dateViewMode === "months" ? "days" : "months")
                    }
                    className="px-1.5 py-0.5 rounded text-[11px] font-bold hover:bg-[#FEF08A]"
                  >
                    {MONTH_NAMES[viewMonth]} ▾
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setDateViewMode(dateViewMode === "years" ? "days" : "years")
                    }
                    className="px-1.5 py-0.5 rounded text-[11px] font-bold hover:bg-[#FEF08A]"
                  >
                    {viewYear} ▾
                  </button>
                </div>

                <button
                  type="button"
                  onClick={nextMonth}
                  className="px-1.5 py-0.5 hover:bg-[#F3EFE6] rounded font-bold text-xs"
                >
                  →
                </button>
              </div>

              {dateViewMode === "months" && (
                <div className="grid grid-cols-3 gap-1 p-1 bg-white border border-[#262626] rounded">
                  {MONTH_NAMES.map((name, mIdx) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        setViewMonth(mIdx);
                        setDateViewMode("days");
                      }}
                      className={`py-1 rounded text-[10px] ${
                        viewMonth === mIdx ? "bg-[#FEF08A] font-bold" : "hover:bg-[#F3EFE6]"
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}

              {dateViewMode === "years" && (
                <div className="grid grid-cols-3 gap-1 p-1 bg-white border border-[#262626] rounded">
                  {yearList.map((y) => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => {
                        setViewYear(y);
                        setDateViewMode("days");
                      }}
                      className={`py-1 rounded font-mono text-[10px] ${
                        viewYear === y ? "bg-[#FEF08A] font-bold" : "hover:bg-[#F3EFE6]"
                      }`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              )}

              {dateViewMode === "days" && (
                <>
                  <div className="grid grid-cols-7 gap-1 text-center font-bold text-[9px] text-[#78716C]">
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
                          className={`h-5 rounded-[2px] border text-[10px] font-mono font-bold flex items-center justify-center ${
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
              <div className="flex items-center justify-center bg-[#FEF08A] border-[1.5px] border-[#262626] rounded-[4px] py-1.5 shadow-[1.5px_1.5px_0px_#262626]">
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
                    className="w-5 h-5 bg-[#FBF9F4] border border-[#262626] rounded font-bold text-xs flex items-center justify-center hover:bg-[#FEF08A] active:translate-y-[0.5px]"
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
                    className="w-5 h-5 bg-[#FBF9F4] border border-[#262626] rounded font-bold text-xs flex items-center justify-center hover:bg-[#FEF08A] active:translate-y-[0.5px]"
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
                    className="w-5 h-5 bg-[#FBF9F4] border border-[#262626] rounded font-bold text-xs flex items-center justify-center hover:bg-[#FEF08A] active:translate-y-[0.5px]"
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
                    className="w-5 h-5 bg-[#FBF9F4] border border-[#262626] rounded font-bold text-xs flex items-center justify-center hover:bg-[#FEF08A] active:translate-y-[0.5px]"
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
          <div className="flex items-center justify-between pt-1.5 border-t border-[#D4CEBF]">
            <button
              type="button"
              onClick={handleClear}
              className="text-[11px] text-red-600 hover:underline font-medium"
            >
              Gỡ
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-3.5 py-1 bg-[#FEF08A] border-[1.5px] border-[#262626] rounded-[3px] shadow-[1px_1px_0px_#262626] font-bold text-xs active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            >
              ✓ Xác nhận
            </button>
          </div>
        </div>
        </>
      )}
    </div>
  );
};
