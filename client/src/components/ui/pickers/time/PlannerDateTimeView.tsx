import React from "react";
import { Clock, Hourglass } from "lucide-react";
import { CalendarMonth } from "./CalendarMonth";
import { WheelTimePicker } from "./WheelTimePicker";

// ==========================================
// SUB-COMPONENT: PlannerDateTimeView (Giao Diện Chọn Ngày & Giờ Kế Hoạch - Tinh Gọn)
// Phân biệt rõ ràng Lịch hẹn (Ngày & thời gian diễn ra) và Hạn hoàn thành (Ngày & thời điểm phải xong)
// ==========================================

export interface PlannerDateTimeViewProps {
  mode: "scheduled" | "deadline";
  onModeSwitch: (mode: "scheduled" | "deadline") => void;
  forcedMode?: "scheduled" | "deadline";
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  viewYear: number;
  viewMonth: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  eventStartHour: number;
  eventStartMinute: number;
  onEventStartHourChange: (h: number) => void;
  onEventStartMinuteChange: (m: number) => void;
  hasEndTime: boolean;
  onHasEndTimeChange: (val: boolean) => void;
  eventEndHour: number;
  eventEndMinute: number;
  onEventEndHourChange: (h: number) => void;
  onEventEndMinuteChange: (m: number) => void;
  deadlineHour: number;
  deadlineMinute: number;
  onDeadlineHourChange: (h: number) => void;
  onDeadlineMinuteChange: (m: number) => void;
}

export const PlannerDateTimeView: React.FC<PlannerDateTimeViewProps> = ({
  mode,
  onModeSwitch,
  forcedMode,
  selectedDate,
  onSelectDate,
  viewYear,
  viewMonth,
  onPrevMonth,
  onNextMonth,
  eventStartHour,
  eventStartMinute,
  onEventStartHourChange,
  onEventStartMinuteChange,
  hasEndTime,
  onHasEndTimeChange,
  eventEndHour,
  eventEndMinute,
  onEventEndHourChange,
  onEventEndMinuteChange,
  deadlineHour,
  deadlineMinute,
  onDeadlineHourChange,
  onDeadlineMinuteChange,
}) => {
  // Format ngày dạng DD/MM/YYYY cho tiêu đề trực quan
  const getFormattedSelectedDate = (dStr: string) => {
    const parts = dStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dStr;
  };

  return (
    <div className="space-y-2.5 py-1">
      {/* 1. Thanh Chế Độ (Chỉ cho phép chuyển đổi nếu KHÔNG BỊ FORCED MODE) */}
      {!forcedMode ? (
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#FAF8F3] border border-[#262626] rounded-[6px]">
          <button
            type="button"
            onClick={() => onModeSwitch("scheduled")}
            className={`py-1.5 px-2 rounded-[4px] text-xs font-bold flex flex-col items-center justify-center transition-all ${
              mode === "scheduled"
                ? "bg-[#1C1917] text-white border border-[#262626] shadow-[1.5px_1.5px_0px_#262626]"
                : "text-[#78716C] hover:text-[#1C1917]"
            }`}
          >
            <span className="flex items-center gap-1">
              <Clock size={13} strokeWidth={2.2} />
              <span>Lịch hẹn</span>
            </span>
            <span className="text-[9px] font-normal opacity-80">
              Thời gian diễn ra
            </span>
          </button>

          <button
            type="button"
            onClick={() => onModeSwitch("deadline")}
            className={`py-1.5 px-2 rounded-[4px] text-xs font-bold flex flex-col items-center justify-center transition-all ${
              mode === "deadline"
                ? "bg-[#1C1917] text-white border border-[#262626] shadow-[1.5px_1.5px_0px_#262626]"
                : "text-[#78716C] hover:text-[#1C1917]"
            }`}
          >
            <span className="flex items-center gap-1">
              <Hourglass size={13} strokeWidth={2.2} />
              <span>Hạn hoàn thành</span>
            </span>
            <span className="text-[9px] font-normal opacity-80">
              Thời điểm phải xong
            </span>
          </button>
        </div>
      ) : (
        // Khi bị forcedMode: Hiển thị badge tiêu điểm duy nhất rõ ràng, không có 2 khối cạnh tranh
        <div
          className="px-2.5 py-1.5 rounded-[5px] border border-[#262626] flex items-center justify-between shadow-[1px_1px_0px_#262626] bg-[#FAF8F3] text-[#1C1917]"
        >
          <div className="flex items-center gap-1.5 text-xs font-bold">
            {mode === "scheduled" ? (
              <>
                <Clock size={14} strokeWidth={2.4} className="text-[#1C1917]" />
                <span>Lịch hẹn công việc</span>
              </>
            ) : (
              <>
                <Hourglass size={14} strokeWidth={2.4} className="text-[#1C1917]" />
                <span>Hạn hoàn thành công việc</span>
              </>
            )}
          </div>
          <span className="text-[10px] font-mono font-bold bg-white px-1.5 py-0.2 rounded border border-[#262626]">
            {getFormattedSelectedDate(selectedDate)}
          </span>
        </div>
      )}

      {/* 2. Lưới Chọn Ngày: Nhãn Ngày Diễn Ra / Ngày Phải Hoàn Thành */}
      <div className="space-y-1 bg-white border border-[#262626] rounded-[5px] p-1.5 shadow-[1px_1px_0px_#262626]">
        <div className="flex items-center justify-between px-1 pb-1 border-b border-[#E7E5E4]">
          <span className="text-[10px] font-bold text-[#1C1917] flex items-center gap-1">
            {mode === "scheduled" ? (
              <>
                <Clock size={11} className="text-[#1C1917]" strokeWidth={2.2} />
                <span>Ngày diễn ra:</span>
              </>
            ) : (
              <>
                <Hourglass size={11} className="text-[#1C1917]" strokeWidth={2.2} />
                <span>Ngày phải hoàn thành:</span>
              </>
            )}
          </span>
          <span className="text-[11px] font-mono font-bold text-[#1C1917] bg-[#FAF8F3] px-1.5 py-0.2 rounded border border-[#262626]">
            {getFormattedSelectedDate(selectedDate)}
          </span>
        </div>
        <CalendarMonth
          selectedDate={selectedDate}
          onSelectDate={onSelectDate}
          viewYear={viewYear}
          viewMonth={viewMonth}
          onPrevMonth={onPrevMonth}
          onNextMonth={onNextMonth}
          accentMode={mode}
        />
      </div>

      {/* 3. Thiết lập Giờ Cuộn Wheel Drum theo Chế Độ */}
      {mode === "scheduled" ? (
        // CHẾ ĐỘ LỊCH HẸN
        <div className="bg-white border border-[#262626] rounded-[5px] p-2 shadow-[1px_1px_0px_#262626] space-y-1.5">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-[#1C1917] flex items-center gap-1">
                <Clock size={11} className="text-[#1C1917]" strokeWidth={2.2} />
                <span>Giờ bắt đầu hẹn:</span>
              </span>
              <span className="text-xs font-mono font-bold text-[#1C1917] bg-[#FAF8F3] px-1.5 py-0.2 rounded border border-[#262626]">
                {String(eventStartHour).padStart(2, "0")}:
                {String(eventStartMinute).padStart(2, "0")}
              </span>
            </div>
            <WheelTimePicker
              hour={eventStartHour}
              minute={eventStartMinute}
              onHourChange={onEventStartHourChange}
              onMinuteChange={onEventStartMinuteChange}
              accentBg="bg-[#FAF8F3]"
            />
          </div>

          {/* Tùy chọn Có giờ kết thúc */}
          <div className="pt-2 border-t border-[#E7E5E4] space-y-1.5">
            <label className="flex items-center gap-2 cursor-pointer text-[11px] font-bold text-[#1C1917]">
              <input
                type="checkbox"
                checked={hasEndTime}
                onChange={(e) => onHasEndTimeChange(e.target.checked)}
                className="w-3.5 h-3.5 accent-[#262626] rounded border border-[#262626]"
              />
              <span>Có giờ kết thúc cuộc hẹn</span>
            </label>

            {hasEndTime && (
              <div className="space-y-1 animate-in fade-in duration-150 pl-1 pt-1">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] font-bold text-[#78716C]">
                    Đến lúc:
                  </span>
                  <span className="text-xs font-mono font-bold text-[#1C1917] bg-[#FAF8F3] px-2 py-0.5 rounded border border-[#262626]">
                    {String(eventEndHour).padStart(2, "0")}:
                    {String(eventEndMinute).padStart(2, "0")}
                  </span>
                </div>
                <WheelTimePicker
                  hour={eventEndHour}
                  minute={eventEndMinute}
                  onHourChange={onEventEndHourChange}
                  onMinuteChange={onEventEndMinuteChange}
                  accentBg="bg-[#FAF8F3]"
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        // CHẾ ĐỘ HẠN HOÀN THÀNH
        <div className="bg-white border border-[#262626] rounded-[5px] p-2 shadow-[1px_1px_0px_#262626] space-y-1.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-[#1C1917] flex items-center gap-1">
              <Hourglass size={11} className="text-[#1C1917]" strokeWidth={2.2} />
              <span>Phải hoàn thành trước:</span>
            </span>
            <span className="text-xs font-mono font-bold text-[#1C1917] bg-[#FAF8F3] px-1.5 py-0.2 rounded border border-[#262626]">
              {String(deadlineHour).padStart(2, "0")}:
              {String(deadlineMinute).padStart(2, "0")}
            </span>
          </div>
          <WheelTimePicker
            hour={deadlineHour}
            minute={deadlineMinute}
            onHourChange={onDeadlineHourChange}
            onMinuteChange={onDeadlineMinuteChange}
            accentBg="bg-[#FAF8F3]"
          />
        </div>
      )}
    </div>
  );
};
