import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
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
// Tích hợp Wheel / Drum Time Picker cuộn cảm ứng & phím mượt mà
// ==========================================

export interface TaskTimeValue {
  timeType?: "scheduled" | "deadline";
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
  mode?: string;
}

const MONTH_NAMES = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
  "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
  "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

const DAY_NAMES = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const ITEM_HEIGHT = 34; // Chiều cao mỗi dòng trong Wheel Picker (px)
const VISIBLE_COUNT = 3; // 3 dòng hiển thị: 1 trên, 1 giữa (chọn), 1 dưới

// ==========================================
// SUB-COMPONENT: WheelColumn (Cột Cuộn Bánh Xe Tinh Chỉnh Với ARIA Chuẩn)
// ==========================================
interface WheelColumnProps {
  items: number[];
  value: number;
  onChange: (val: number) => void;
  label: string;
  accentBg?: string;
  formatItem?: (val: number) => string;
}

const WheelColumn: React.FC<WheelColumnProps> = ({
  items,
  value,
  onChange,
  label,
  accentBg = "bg-[#FEF08A]/60",
  formatItem = (v) => String(v).padStart(2, "0"),
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Đảm bảo giá trị luôn nằm trong danh sách items
  const validItems = useMemo(() => {
    if (items.includes(value)) return items;
    // Tự động chèn nếu là giá trị lẻ chưa có và sắp xếp lại
    return [...items, value].sort((a, b) => a - b);
  }, [items, value]);

  // Cuộn container đến vị trí của giá trị hiện tại
  const scrollToValue = useCallback(
    (val: number, smooth = false) => {
      const idx = validItems.indexOf(val);
      if (idx !== -1 && containerRef.current) {
        const top = idx * ITEM_HEIGHT;
        if (smooth) {
          containerRef.current.scrollTo({ top, behavior: "smooth" });
        } else {
          containerRef.current.scrollTop = top;
        }
      }
    },
    [validItems]
  );

  // Đồng bộ vị trí cuộn khi mount hoặc khi value thay đổi từ bên ngoài
  useEffect(() => {
    if (!isScrollingRef.current) {
      scrollToValue(value, false);
    }
  }, [value, scrollToValue]);

  // Xử lý sự kiện onScroll để bắt phần tử nằm đúng tâm
  const handleScroll = () => {
    if (!containerRef.current) return;
    isScrollingRef.current = true;

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Debounce snap detection
    scrollTimeoutRef.current = setTimeout(() => {
      if (!containerRef.current) return;
      const scrollTop = containerRef.current.scrollTop;
      const nearestIndex = Math.max(
        0,
        Math.min(validItems.length - 1, Math.round(scrollTop / ITEM_HEIGHT))
      );
      const selectedValue = validItems[nearestIndex];

      if (selectedValue !== undefined && selectedValue !== value) {
        onChange(selectedValue);
      }

      // Đảm bảo dừng chính xác tại mốc
      containerRef.current.scrollTo({
        top: nearestIndex * ITEM_HEIGHT,
        behavior: "smooth",
      });

      isScrollingRef.current = false;
    }, 100);
  };

  // Điều khiển bằng bàn phím (ArrowUp, ArrowDown, PageUp, PageDown)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const currentIndex = validItems.indexOf(value);
    if (currentIndex === -1) return;

    if (e.key === "ArrowUp") {
      e.preventDefault();
      const nextIndex = Math.max(0, currentIndex - 1);
      onChange(validItems[nextIndex]);
      scrollToValue(validItems[nextIndex], true);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = Math.min(validItems.length - 1, currentIndex + 1);
      onChange(validItems[nextIndex]);
      scrollToValue(validItems[nextIndex], true);
    } else if (e.key === "PageUp") {
      e.preventDefault();
      const nextIndex = Math.max(0, currentIndex - 5);
      onChange(validItems[nextIndex]);
      scrollToValue(validItems[nextIndex], true);
    } else if (e.key === "PageDown") {
      e.preventDefault();
      const nextIndex = Math.min(validItems.length - 1, currentIndex + 5);
      onChange(validItems[nextIndex]);
      scrollToValue(validItems[nextIndex], true);
    } else if (e.key === "Home") {
      e.preventDefault();
      onChange(validItems[0]);
      scrollToValue(validItems[0], true);
    } else if (e.key === "End") {
      e.preventDefault();
      onChange(validItems[validItems.length - 1]);
      scrollToValue(validItems[validItems.length - 1], true);
    }
  };

  // Click trực tiếp vào một item để cuộn tới đó
  const handleItemClick = (item: number) => {
    onChange(item);
    scrollToValue(item, true);
  };

  // Bước nhảy tăng giảm nhanh qua nút mũi tên
  const stepUp = () => {
    const idx = validItems.indexOf(value);
    if (idx > 0) {
      const next = validItems[idx - 1];
      onChange(next);
      scrollToValue(next, true);
    }
  };

  const stepDown = () => {
    const idx = validItems.indexOf(value);
    if (idx < validItems.length - 1) {
      const next = validItems[idx + 1];
      onChange(next);
      scrollToValue(next, true);
    }
  };

  return (
    <div className="flex flex-col items-center flex-1">
      {/* Nhãn Cột */}
      <span className="text-[10px] font-bold text-[#78716C] uppercase tracking-wider mb-1">
        {label}
      </span>

      {/* Nút Nhỏ Điều Hướng Nhanh Lên */}
      <button
        type="button"
        onClick={stepUp}
        aria-label={`Tăng ${label}`}
        className="w-full py-0.5 mb-1 flex items-center justify-center text-[#A8A29E] hover:text-[#1C1917] hover:bg-[#F5F3EF] rounded border border-transparent hover:border-[#D4CEBF] transition-all"
      >
        <ChevronUp size={12} strokeWidth={2.4} />
      </button>

      {/* Khung Cuộn Wheel Drum Với ARIA Accessibility */}
      <div
        tabIndex={0}
        role="spinbutton"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={validItems[0]}
        aria-valuemax={validItems[validItems.length - 1]}
        aria-valuetext={`${value} ${label}`}
        onKeyDown={handleKeyDown}
        className="relative w-full border-[1.5px] border-[#262626] rounded-[6px] bg-[#FCFBF9] shadow-[1.5px_1.5px_0px_#262626] overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[#262626] focus-visible:ring-offset-1"
        style={{ height: `${ITEM_HEIGHT * VISIBLE_COUNT}px` }}
      >
        {/* Khung Kính Trọng Tâm (Center Selection Highlight Lens) */}
        <div
          className={`absolute left-1 right-1 pointer-events-none rounded-[4px] border-[1.5px] border-[#262626] shadow-[1px_1px_0px_#262626] ${accentBg}`}
          style={{
            top: `${ITEM_HEIGHT}px`,
            height: `${ITEM_HEIGHT}px`,
            zIndex: 1,
          }}
        />

        {/* Lớp Phủ Gradient Fade Đỉnh & Đáy */}
        <div
          className="absolute inset-x-0 top-0 pointer-events-none bg-gradient-to-b from-[#FCFBF9] via-[#FCFBF9]/70 to-transparent"
          style={{ height: `${ITEM_HEIGHT}px`, zIndex: 2 }}
        />
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none bg-gradient-to-t from-[#FCFBF9] via-[#FCFBF9]/70 to-transparent"
          style={{ height: `${ITEM_HEIGHT}px`, zIndex: 2 }}
        />

        {/* Danh Sách Cuộn Dọc */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          role="listbox"
          aria-label={`Danh sách chọn ${label}`}
          className="w-full h-full overflow-y-auto no-scrollbar snap-y snap-mandatory relative"
          style={{
            paddingTop: `${ITEM_HEIGHT}px`,
            paddingBottom: `${ITEM_HEIGHT}px`,
            touchAction: "pan-y",
          }}
        >
          {validItems.map((item) => {
            const isSelected = item === value;
            return (
              <div
                key={item}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleItemClick(item)}
                className={`snap-center flex items-center justify-center cursor-pointer transition-all ${
                  isSelected
                    ? "font-mono font-black text-sm text-[#1C1917] scale-110"
                    : "font-mono font-semibold text-xs text-[#A8A29E] hover:text-[#44403C] opacity-70"
                }`}
                style={{
                  height: `${ITEM_HEIGHT}px`,
                  zIndex: isSelected ? 3 : 0,
                  position: "relative",
                }}
              >
                {formatItem(item)}
              </div>
            );
          })}
        </div>
      </div>

      {/* Nút Nhỏ Điều Hướng Nhanh Xuống */}
      <button
        type="button"
        onClick={stepDown}
        aria-label={`Giảm ${label}`}
        className="w-full py-0.5 mt-1 flex items-center justify-center text-[#A8A29E] hover:text-[#1C1917] hover:bg-[#F5F3EF] rounded border border-transparent hover:border-[#D4CEBF] transition-all"
      >
        <ChevronDown size={12} strokeWidth={2.4} />
      </button>
    </div>
  );
};

// ==========================================
// SUB-COMPONENT: WheelTimePicker (Cụm 2 Cột Giờ & Toàn Bộ 60 Phút)
// ==========================================
interface WheelTimePickerProps {
  hour: number;
  minute: number;
  onHourChange: (h: number) => void;
  onMinuteChange: (m: number) => void;
  accentBg?: string;
}

const HOURS_LIST = Array.from({ length: 24 }, (_, i) => i);
// Đầy đủ 60 phút từ 00 đến 59, xử lý chuẩn xác 100% mọi phút cũ không chia hết cho 5
const ALL_MINUTES_LIST = Array.from({ length: 60 }, (_, i) => i);

const WheelTimePicker: React.FC<WheelTimePickerProps> = ({
  hour,
  minute,
  onHourChange,
  onMinuteChange,
  accentBg,
}) => {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 px-1.5 py-1 bg-[#F5F3EF] border border-[#262626]/20 rounded-[8px]">
        <WheelColumn
          items={HOURS_LIST}
          value={hour}
          onChange={onHourChange}
          label="Giờ"
          accentBg={accentBg}
        />
        <span className="font-mono font-black text-sm text-[#262626] pb-5 select-none">
          :
        </span>
        <WheelColumn
          items={ALL_MINUTES_LIST}
          value={minute}
          onChange={onMinuteChange}
          label="Phút"
          accentBg={accentBg}
        />
      </div>

      {/* Phím tắt chọn nhanh các mốc phút tròn 00, 15, 30, 45 */}
      <div className="flex items-center justify-center gap-1.5 pt-0.5">
        <span className="text-[10px] text-[#78716C]">Chọn nhanh:</span>
        {[0, 15, 30, 45].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onMinuteChange(m)}
            className={`px-1.5 py-0.5 text-[10px] font-mono rounded border transition-all ${
              minute === m
                ? "bg-[#262626] text-white border-[#262626] font-bold"
                : "bg-white text-[#78716C] border-[#D4CEBF] hover:border-[#262626]"
            }`}
          >
            :{String(m).padStart(2, "0")}
          </button>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// MAIN COMPONENT: CustomDuePicker
// ==========================================
export const CustomDuePicker: React.FC<CustomDuePickerProps> = ({
  value,
  timeData,
  onChange,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const now = new Date();
  const todayStr = getLocalTodayStr(now);

  // Tab chế độ: "scheduled" (Lịch làm việc) | "deadline" (Hạn chót)
  const [mode, setMode] = useState<"scheduled" | "deadline">(() => {
    if (
      timeData?.timeType === "scheduled" ||
      (timeData as any)?.timeType === "event"
    )
      return "scheduled";
    if (
      timeData?.timeType === "deadline" ||
      (timeData as any)?.timeType === "task"
    )
      return "deadline";
    if (value && value.includes("-")) return "scheduled";
    return "scheduled";
  });

  // State riêng biệt cho Chế độ 1: Lịch Hẹn (Bảo toàn dữ liệu khi chuyển tab)
  const [eventDate, setEventDate] = useState<string>(() => {
    if (timeData?.date) return timeData.date;
    if (value && value.includes("-")) return value.split(" ")[0];
    return todayStr;
  });
  const [eventStartHour, setEventStartHour] = useState<number>(() => {
    if (timeData?.startTime)
      return parseInt(timeData.startTime.split(":")[0], 10) || 9;
    if (value && value.includes(":")) {
      const t = value.includes(" ") ? value.split(" ")[1] : value;
      return parseInt(t.split(":")[0], 10) || 9;
    }
    return 9;
  });
  const [eventStartMinute, setEventStartMinute] = useState<number>(() => {
    if (timeData?.startTime)
      return parseInt(timeData.startTime.split(":")[1], 10) || 0;
    if (value && value.includes(":")) {
      const t = value.includes(" ") ? value.split(" ")[1] : value;
      return parseInt(t.split(":")[1], 10) || 0;
    }
    return 0;
  });
  const [hasEndTime, setHasEndTime] = useState<boolean>(
    () => !!timeData?.endTime
  );
  const [eventEndHour, setEventEndHour] = useState<number>(() => {
    if (timeData?.endTime)
      return parseInt(timeData.endTime.split(":")[0], 10) || 10;
    return 10;
  });
  const [eventEndMinute, setEventEndMinute] = useState<number>(() => {
    if (timeData?.endTime)
      return parseInt(timeData.endTime.split(":")[1], 10) || 30;
    return 30;
  });

  // State riêng biệt cho Chế độ 2: Hạn Chót (Bảo toàn dữ liệu khi chuyển tab)
  const [deadlineDate, setDeadlineDate] = useState<string>(() => {
    if (timeData?.deadlineDate) return timeData.deadlineDate;
    if (value && value.includes("-")) return value.split(" ")[0];
    return todayStr;
  });
  const [deadlineHour, setDeadlineHour] = useState<number>(() => {
    if (timeData?.deadlineTime)
      return parseInt(timeData.deadlineTime.split(":")[0], 10) || 17;
    return 17;
  });
  const [deadlineMinute, setDeadlineMinute] = useState<number>(() => {
    if (timeData?.deadlineTime)
      return parseInt(timeData.deadlineTime.split(":")[1], 10) || 0;
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

  // Giữ nguyên dữ liệu riêng khi chuyển tab (Không làm mất giá trị đã chọn ở mỗi chế độ)
  const handleModeSwitch = (newMode: "scheduled" | "deadline") => {
    setMode(newMode);
  };

  // Sinh ma trận ngày trong tháng
  const getDaysInMonthMatrix = (year: number, month: number) => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    let startDayOfWeek = firstDayOfMonth.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const totalDays = lastDayOfMonth.getDate();
    const days: { dayNum: number; dateStr: string; isCurrentMonth: boolean }[] =
      [];

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
    if (mode === "scheduled") {
      const startTimeStr = `${String(eventStartHour).padStart(2, "0")}:${String(eventStartMinute).padStart(2, "0")}`;
      const endTimeStr = hasEndTime
        ? `${String(eventEndHour).padStart(2, "0")}:${String(eventEndMinute).padStart(2, "0")}`
        : undefined;
      const finalStr = endTimeStr
        ? `${eventDate} ${startTimeStr} - ${endTimeStr}`
        : `${eventDate} ${startTimeStr}`;
      onChange?.(finalStr, {
        timeType: "scheduled",
        date: eventDate,
        startTime: startTimeStr,
        endTime: endTimeStr,
      });
    } else {
      const deadlineTimeStr = `${String(deadlineHour).padStart(2, "0")}:${String(deadlineMinute).padStart(2, "0")}`;
      const finalStr = `${deadlineDate} ${deadlineTimeStr}`;
      onChange?.(finalStr, {
        timeType: "deadline",
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

    if (timeData?.timeType === "deadline" || mode === "deadline") {
      const d = timeData?.deadlineDate || deadlineDate;
      const t =
        timeData?.deadlineTime ||
        `${String(deadlineHour).padStart(2, "0")}:${String(deadlineMinute).padStart(2, "0")}`;
      return (
        <span className="flex items-center gap-1.5 text-amber-900 font-bold">
          <Hourglass size={13} strokeWidth={2.2} className="text-amber-600" />
          <span>
            Hạn: {t} ({d.slice(5).replace("-", "/")})
          </span>
        </span>
      );
    }

    const d = timeData?.date || eventDate;
    const st =
      timeData?.startTime ||
      `${String(eventStartHour).padStart(2, "0")}:${String(eventStartMinute).padStart(2, "0")}`;
    const et = timeData?.endTime ? ` - ${timeData.endTime}` : "";
    return (
      <span className="flex items-center gap-1.5 text-indigo-900 font-bold">
        <Clock size={13} strokeWidth={2.2} className="text-indigo-600" />
        <span>
          Lịch: {st}
          {et} ({d.slice(5).replace("-", "/")})
        </span>
      </span>
    );
  };

  const currentActiveDate = mode === "scheduled" ? eventDate : deadlineDate;
  const setDateForCurrentMode = (d: string) => {
    if (mode === "scheduled") setEventDate(d);
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
            className="flex items-end sm:items-center justify-center p-0 sm:p-4 select-none animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm bg-[#FBF9F4] border-t-[2px] sm:border-[2px] border-[#262626] rounded-t-[20px] sm:rounded-[8px] shadow-[0px_-4px_0px_#262626] sm:shadow-[6px_6px_0px_#262626] p-4 sm:p-5 flex flex-col justify-between overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 max-h-[94vh]"
            >
              {/* Grab handle trên mobile */}
              <div className="w-12 h-1 bg-[#D4CEBF] rounded-full mx-auto mb-2 sm:hidden" />
              {/* Header Modal */}
              <div className="flex items-center justify-between pb-2.5 border-b border-[#262626] shrink-0">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-[#FEF08A] border border-[#262626] rounded-[4px] shadow-[1px_1px_0px_#262626]">
                    <CalendarDays
                      size={16}
                      strokeWidth={2.4}
                      className="text-[#1C1917]"
                    />
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
                  aria-label="Đóng bảng chọn thời gian"
                >
                  <X size={14} strokeWidth={2.4} />
                </button>
              </div>

              {/* Bộ Chuyển Đổi 2 Chế Độ (Segmented Tab) */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#ECE8DF] border border-[#262626] rounded-[6px] my-3 shrink-0">
                <button
                  type="button"
                  onClick={() => handleModeSwitch("scheduled")}
                  className={`py-1.5 px-2 rounded-[4px] text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    mode === "scheduled"
                      ? "bg-[#FEF08A] text-[#1C1917] border border-[#262626] shadow-[1.5px_1.5px_0px_#262626]"
                      : "text-[#78716C] hover:text-[#1C1917]"
                  }`}
                >
                  <Clock size={13} strokeWidth={2.2} />
                  <span>🕒 Lịch Làm Việc</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleModeSwitch("deadline")}
                  className={`py-1.5 px-2 rounded-[4px] text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    mode === "deadline"
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
                      aria-label="Tháng trước"
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
                      aria-label="Tháng sau"
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
                                ? mode === "scheduled"
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

                {/* 2. Thiết lập Giờ Cuộn Wheel Drum theo Chế Độ */}
                {mode === "scheduled" ? (
                  // CHẾ ĐỘ LỊCH LÀM VIỆC
                  <div className="bg-white border border-[#262626] rounded-[6px] p-3 shadow-[1px_1px_0px_#262626] space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold text-[#1C1917] flex items-center gap-1">
                          <Clock size={13} className="text-indigo-600" />
                          <span>Giờ bắt đầu cuộc hẹn:</span>
                        </span>
                        <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                          {String(eventStartHour).padStart(2, "0")}:
                          {String(eventStartMinute).padStart(2, "0")}
                        </span>
                      </div>
                      <WheelTimePicker
                        hour={eventStartHour}
                        minute={eventStartMinute}
                        onHourChange={setEventStartHour}
                        onMinuteChange={setEventStartMinute}
                        accentBg="bg-[#FEF08A]/70"
                      />
                    </div>

                    {/* Tùy chọn Có giờ kết thúc */}
                    <div className="pt-2.5 border-t border-[#E7E5E4] space-y-2.5">
                      <label className="flex items-center gap-2 cursor-pointer text-[11px] font-bold text-[#1C1917]">
                        <input
                          type="checkbox"
                          checked={hasEndTime}
                          onChange={(e) => setHasEndTime(e.target.checked)}
                          className="w-4 h-4 accent-[#262626] rounded border border-[#262626]"
                        />
                        <span>Có giờ kết thúc cuộc hẹn</span>
                      </label>

                      {hasEndTime && (
                        <div className="space-y-1.5 animate-in fade-in duration-150 pl-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-semibold text-[#78716C]">
                              Đến lúc:
                            </span>
                            <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                              {String(eventEndHour).padStart(2, "0")}:
                              {String(eventEndMinute).padStart(2, "0")}
                            </span>
                          </div>
                          <WheelTimePicker
                            hour={eventEndHour}
                            minute={eventEndMinute}
                            onHourChange={setEventEndHour}
                            onMinuteChange={setEventEndMinute}
                            accentBg="bg-[#FEF08A]/70"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  // CHẾ ĐỘ HẠN CHÓT
                  <div className="bg-white border border-[#262626] rounded-[6px] p-3 shadow-[1px_1px_0px_#262626] space-y-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-[#1C1917] flex items-center gap-1">
                        <Hourglass size={13} className="text-amber-600" />
                        <span>Hoàn thành trước giờ:</span>
                      </span>
                      <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                        {String(deadlineHour).padStart(2, "0")}:
                        {String(deadlineMinute).padStart(2, "0")}
                      </span>
                    </div>
                    <WheelTimePicker
                      hour={deadlineHour}
                      minute={deadlineMinute}
                      onHourChange={setDeadlineHour}
                      onMinuteChange={setDeadlineMinute}
                      accentBg="bg-[#FECDD3]/70"
                    />
                    <p className="text-[10px] text-[#78716C] leading-snug">
                      💡 Hệ thống sẽ nhắc nhở trước thời điểm này để bạn không bị trễ hạn.
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
