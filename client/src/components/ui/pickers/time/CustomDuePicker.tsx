import React, { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronRight,
  Hourglass,
} from "lucide-react";
import { getLocalTodayStr } from "../../../../utils/date";
import {
  CustomDuePickerProps,
  TaskTimeValue,
} from "./TimePicker.types";
import { TimePickerSheet } from "./TimePickerSheet";
import { TodayTimeView } from "./TodayTimeView";
import { PlannerDateTimeView } from "./PlannerDateTimeView";
import { DateTimeView } from "./DateTimeView";

export type { TaskTimeValue, CustomDuePickerProps };

// ==========================================
// COMPONENT: CustomDuePicker (Bộ Chọn Thời Gian Đa Ngữ Cảnh - Tinh Gọn)
// Hỗ trợ truyền đúng Mode từ bên ngoài: "scheduled" (Lịch hẹn) hoặc "deadline" (Hạn hoàn thành)
// 1. "today": Dành riêng cho Tab Hôm Nay (Khóa ngày hôm nay, chỉ chọn giờ siêu nhanh)
// 2. "planner": Dành cho Tab Kế Hoạch (Lịch tháng chọn ngày + Wheel picker, nhận ngày đang chọn qua initialDate/selectedDate)
// 3. "datetime": Dành cho EditTaskModal & Sổ tay (Đầy đủ chọn ngày & giờ)
// ==========================================

export const CustomDuePicker: React.FC<CustomDuePickerProps> = ({
  value,
  timeData,
  onChange,
  className = "",
  variant = "datetime",
  initialMode,
  forcedMode,
  initialDate,
  selectedDate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const now = new Date();
  const todayStr = getLocalTodayStr(now);

  const baseDate = selectedDate || initialDate || todayStr;

  // Tab chế độ: "scheduled" (Lịch hẹn) | "deadline" (Hạn hoàn thành)
  const [mode, setMode] = useState<"scheduled" | "deadline">(() => {
    if (forcedMode) return forcedMode;
    if (initialMode) return initialMode;
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

  // State riêng biệt cho Chế độ 1: Lịch Hẹn
  const [eventDate, setEventDate] = useState<string>(() => {
    if (variant === "today") return todayStr;
    if (timeData?.date) return timeData.date;
    if (value && value.includes("-")) return value.split(" ")[0];
    return baseDate;
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
    () => !variant && !!timeData?.endTime ? true : !!timeData?.endTime
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

  // State riêng biệt cho Chế độ 2: Hạn Hoàn Thành
  const [deadlineDate, setDeadlineDate] = useState<string>(() => {
    if (variant === "today") return todayStr;
    if (timeData?.deadlineDate) return timeData.deadlineDate;
    if (value && value.includes("-")) return value.split(" ")[0];
    return baseDate;
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

  // State điều hướng tháng / năm của Lưới chọn ngày
  const [viewYear, setViewYear] = useState<number>(() => {
    const activeD = mode === "scheduled" ? eventDate : deadlineDate;
    const dObj = new Date(activeD);
    return isNaN(dObj.getFullYear()) ? now.getFullYear() : dObj.getFullYear();
  });

  const [viewMonth, setViewMonth] = useState<number>(() => {
    const activeD = mode === "scheduled" ? eventDate : deadlineDate;
    const dObj = new Date(activeD);
    return isNaN(dObj.getMonth()) ? now.getMonth() : dObj.getMonth();
  });

  // Cập nhật lại state khi props từ ngoài thay đổi hoặc khi mở modal
  useEffect(() => {
    if (forcedMode) {
      setMode(forcedMode);
    } else if (initialMode && !timeData?.timeType) {
      setMode(initialMode);
    } else if (timeData) {
      if (timeData.timeType === "deadline") {
        setMode("deadline");
      } else if (timeData.timeType === "scheduled") {
        setMode("scheduled");
      }
    }

    if (timeData) {
      if (timeData.timeType === "deadline") {
        if (timeData.deadlineDate) {
          const d = variant === "today" ? todayStr : timeData.deadlineDate;
          setDeadlineDate(d);
          const dObj = new Date(d);
          if (!isNaN(dObj.getFullYear())) {
            setViewYear(dObj.getFullYear());
            setViewMonth(dObj.getMonth());
          }
        }
        if (timeData.deadlineTime) {
          const parts = timeData.deadlineTime.split(":");
          setDeadlineHour(parseInt(parts[0], 10) || 17);
          setDeadlineMinute(parseInt(parts[1], 10) || 0);
        }
      } else {
        if (timeData.date) {
          const d = variant === "today" ? todayStr : timeData.date;
          setEventDate(d);
          const dObj = new Date(d);
          if (!isNaN(dObj.getFullYear())) {
            setViewYear(dObj.getFullYear());
            setViewMonth(dObj.getMonth());
          }
        }
        if (timeData.startTime) {
          const parts = timeData.startTime.split(":");
          setEventStartHour(parseInt(parts[0], 10) || 9);
          setEventStartMinute(parseInt(parts[1], 10) || 0);
        }
        if (timeData.endTime) {
          setHasEndTime(true);
          const parts = timeData.endTime.split(":");
          setEventEndHour(parseInt(parts[0], 10) || 10);
          setEventEndMinute(parseInt(parts[1], 10) || 30);
        }
      }
    } else if (value) {
      const parts = value.trim().split(" ");
      if (parts[0] && parts[0].includes("-")) {
        const d = variant === "today" ? todayStr : parts[0];
        setEventDate(d);
        setDeadlineDate(d);
        const dObj = new Date(d);
        if (!isNaN(dObj.getFullYear())) {
          setViewYear(dObj.getFullYear());
          setViewMonth(dObj.getMonth());
        }
      }
      if (parts[1] && parts[1].includes(":")) {
        const tParts = parts[1].split(":");
        const h = parseInt(tParts[0], 10) || 9;
        const m = parseInt(tParts[1], 10) || 0;
        setEventStartHour(h);
        setEventStartMinute(m);
        setDeadlineHour(h);
        setDeadlineMinute(m);
      }
    } else {
      // Khi không có value/timeData, dùng baseDate từ Planner
      if (variant !== "today" && baseDate) {
        setEventDate(baseDate);
        setDeadlineDate(baseDate);
        const dObj = new Date(baseDate);
        if (!isNaN(dObj.getFullYear())) {
          setViewYear(dObj.getFullYear());
          setViewMonth(dObj.getMonth());
        }
      }
    }
  }, [value, timeData, isOpen, variant, todayStr, forcedMode, initialMode, baseDate]);

  // Chuyển đổi tab chế độ (chỉ chạy khi không có forcedMode)
  const handleModeSwitch = (newMode: "scheduled" | "deadline") => {
    setMode(newMode);
    if (variant !== "today") {
      const targetDate = newMode === "scheduled" ? eventDate : deadlineDate;
      const d = new Date(targetDate);
      if (!isNaN(d.getFullYear())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  };

  // Xử lý lưu cấu hình khi bấm [Áp dụng]
  const handleApply = () => {
    if (mode === "scheduled") {
      const effectiveDate = variant === "today" ? todayStr : (eventDate || baseDate);
      const startTimeStr = `${String(eventStartHour).padStart(2, "0")}:${String(eventStartMinute).padStart(2, "0")}`;
      const endTimeStr = hasEndTime
        ? `${String(eventEndHour).padStart(2, "0")}:${String(eventEndMinute).padStart(2, "0")}`
        : undefined;

      const finalTimeData: TaskTimeValue = {
        timeType: "scheduled",
        date: effectiveDate,
        startTime: startTimeStr,
        endTime: endTimeStr,
      };

      const finalDueDate = variant === "today"
        ? startTimeStr
        : `${effectiveDate} ${startTimeStr}`;

      onChange?.(finalDueDate, finalTimeData);
    } else {
      const effectiveDate = variant === "today" ? todayStr : (deadlineDate || baseDate);
      const deadlineTimeStr = `${String(deadlineHour).padStart(2, "0")}:${String(deadlineMinute).padStart(2, "0")}`;

      const finalTimeData: TaskTimeValue = {
        timeType: "deadline",
        deadlineDate: effectiveDate,
        deadlineTime: deadlineTimeStr,
      };

      const finalDueDate = variant === "today"
        ? deadlineTimeStr
        : `${effectiveDate} ${deadlineTimeStr}`;

      onChange?.(finalDueDate, finalTimeData);
    }

    setIsOpen(false);
  };

  // Xử lý Xóa thời gian
  const handleClear = () => {
    onChange?.(undefined, undefined);
    setIsOpen(false);
  };

  // Render Label hiển thị trên nút Trigger
  const renderTriggerLabel = () => {
    if (!value && !timeData?.startTime && !timeData?.deadlineTime) {
      return (
        <span className="text-[#78716C] flex items-center gap-1">
          {forcedMode === "scheduled" || initialMode === "scheduled" ? (
            <>
              <Clock size={12} strokeWidth={2.2} />
              <span>Giờ hẹn...</span>
            </>
          ) : forcedMode === "deadline" || initialMode === "deadline" ? (
            <>
              <Hourglass size={12} strokeWidth={2.2} />
              <span>Hạn chót...</span>
            </>
          ) : variant === "today" ? (
            <>
              <Clock size={12} strokeWidth={2.2} />
              <span>Đặt giờ...</span>
            </>
          ) : (
            <>
              <CalendarIcon size={12} strokeWidth={2.2} />
              <span>Thời gian...</span>
            </>
          )}
        </span>
      );
    }

    // Trường hợp Lịch hẹn (Scheduled)
    if (
      timeData?.timeType === "scheduled" ||
      (!timeData?.timeType && timeData?.startTime)
    ) {
      const datePart = (variant === "today" ? todayStr : timeData?.date || value?.split(" ")[0] || "").trim();
      const timeStr = timeData?.endTime
        ? `${timeData.startTime} - ${timeData.endTime}`
        : timeData?.startTime || (value?.includes(" ") ? value.split(" ")[1] : value || "");

      const isToday = datePart === todayStr || variant === "today";

      return (
        <span className="text-[#1C1917] font-mono font-bold flex items-center gap-1">
          <Clock size={12} className="text-amber-800" strokeWidth={2.4} />
          <span>
            {variant === "today" || isToday
              ? timeStr || "Hôm nay"
              : `${datePart.slice(5).replace("-", "/")} ${timeStr}`}
          </span>
        </span>
      );
    }

    // Trường hợp Hạn hoàn thành (Deadline)
    if (timeData?.timeType === "deadline" || (!timeData && value)) {
      const datePart = (variant === "today" ? todayStr : timeData?.deadlineDate || value?.split(" ")[0] || "").trim();
      const timeStr = timeData?.deadlineTime || (value?.includes(" ") ? value.split(" ")[1] : value || "");
      const isToday = datePart === todayStr || variant === "today";

      return (
        <span className="text-[#1C1917] font-mono font-bold flex items-center gap-1">
          <Hourglass size={12} className="text-rose-700" strokeWidth={2.4} />
          <span>
            {variant === "today" || isToday
              ? timeStr ? `Hạn ${timeStr}` : "Hạn hôm nay"
              : `Hạn ${datePart.slice(5).replace("-", "/")}${timeStr ? ` ${timeStr}` : ""}`}
          </span>
        </span>
      );
    }

    return (
      <span className="text-[#1C1917] font-mono font-bold flex items-center gap-1">
        <Clock size={12} />
        <span>{value}</span>
      </span>
    );
  };

  const currentActiveDate = mode === "scheduled" ? eventDate : deadlineDate;
  const setDateForCurrentMode = (dateStr: string) => {
    if (mode === "scheduled") {
      setEventDate(dateStr);
    } else {
      setDeadlineDate(dateStr);
    }
  };

  // Tiêu đề và icon chính xác theo mode
  const isScheduledMode = mode === "scheduled";
  const modalTitle = isScheduledMode
    ? "Thiết lập lịch hẹn"
    : "Thiết lập hạn hoàn thành";
  const modalSubtitle = isScheduledMode
    ? "Chọn thời gian công việc diễn ra"
    : "Chọn thời điểm công việc phải xong";
  const modalIcon = isScheduledMode ? (
    <Clock size={14} strokeWidth={2.4} className="text-amber-800" />
  ) : (
    <Hourglass size={14} strokeWidth={2.4} className="text-rose-700" />
  );

  return (
    <div className={`relative w-full min-w-0 ${className}`}>
      {/* Nút bấm kích hoạt mở Modal */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="due-picker-trigger px-2.5 py-1.5 bg-[#FCFBF9] hover:bg-white border-[1.5px] border-[#262626] rounded-[5px] shadow-[1.5px_1.5px_0px_#262626] text-xs font-medium flex items-center gap-1.5 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all w-full justify-between"
      >
        <div className="flex items-center gap-1.5 truncate">
          {renderTriggerLabel()}
        </div>
        <ChevronRight size={13} strokeWidth={2.2} className="text-[#78716C] shrink-0" />
      </button>

      {/* Modal / Bottom Sheet */}
      <TimePickerSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onApply={handleApply}
        onClear={handleClear}
        title={modalTitle}
        subtitle={modalSubtitle}
        icon={modalIcon}
      >
        {variant === "today" ? (
          <TodayTimeView
            mode={mode}
            eventStartHour={eventStartHour}
            eventStartMinute={eventStartMinute}
            onEventStartHourChange={setEventStartHour}
            onEventStartMinuteChange={setEventStartMinute}
            hasEndTime={hasEndTime}
            onHasEndTimeChange={setHasEndTime}
            eventEndHour={eventEndHour}
            eventEndMinute={eventEndMinute}
            onEventEndHourChange={setEventEndHour}
            onEventEndMinuteChange={setEventEndMinute}
            deadlineHour={deadlineHour}
            deadlineMinute={deadlineMinute}
            onDeadlineHourChange={setDeadlineHour}
            onDeadlineMinuteChange={setDeadlineMinute}
          />
        ) : variant === "planner" ? (
          <PlannerDateTimeView
            mode={mode}
            onModeSwitch={handleModeSwitch}
            forcedMode={forcedMode}
            selectedDate={currentActiveDate}
            onSelectDate={setDateForCurrentMode}
            viewYear={viewYear}
            viewMonth={viewMonth}
            onPrevMonth={() => {
              if (viewMonth === 0) {
                setViewMonth(11);
                setViewYear(viewYear - 1);
              } else {
                setViewMonth(viewMonth - 1);
              }
            }}
            onNextMonth={() => {
              if (viewMonth === 11) {
                setViewMonth(0);
                setViewYear(viewYear + 1);
              } else {
                setViewMonth(viewMonth + 1);
              }
            }}
            eventStartHour={eventStartHour}
            eventStartMinute={eventStartMinute}
            onEventStartHourChange={setEventStartHour}
            onEventStartMinuteChange={setEventStartMinute}
            hasEndTime={hasEndTime}
            onHasEndTimeChange={setHasEndTime}
            eventEndHour={eventEndHour}
            eventEndMinute={eventEndMinute}
            onEventEndHourChange={setEventEndHour}
            onEventEndMinuteChange={setEventEndMinute}
            deadlineHour={deadlineHour}
            deadlineMinute={deadlineMinute}
            onDeadlineHourChange={setDeadlineHour}
            onDeadlineMinuteChange={setDeadlineMinute}
          />
        ) : (
          <DateTimeView
            mode={mode}
            onModeSwitch={handleModeSwitch}
            forcedMode={forcedMode}
            selectedDate={currentActiveDate}
            onSelectDate={setDateForCurrentMode}
            viewYear={viewYear}
            viewMonth={viewMonth}
            onPrevMonth={() => {
              if (viewMonth === 0) {
                setViewMonth(11);
                setViewYear(viewYear - 1);
              } else {
                setViewMonth(viewMonth - 1);
              }
            }}
            onNextMonth={() => {
              if (viewMonth === 11) {
                setViewMonth(0);
                setViewYear(viewYear + 1);
              } else {
                setViewMonth(viewMonth + 1);
              }
            }}
            eventStartHour={eventStartHour}
            eventStartMinute={eventStartMinute}
            onEventStartHourChange={setEventStartHour}
            onEventStartMinuteChange={setEventStartMinute}
            hasEndTime={hasEndTime}
            onHasEndTimeChange={setHasEndTime}
            eventEndHour={eventEndHour}
            eventEndMinute={eventEndMinute}
            onEventEndHourChange={setEventEndHour}
            onEventEndMinuteChange={setEventEndMinute}
            deadlineHour={deadlineHour}
            deadlineMinute={deadlineMinute}
            onDeadlineHourChange={setDeadlineHour}
            onDeadlineMinuteChange={setDeadlineMinute}
          />
        )}
      </TimePickerSheet>
    </div>
  );
};
