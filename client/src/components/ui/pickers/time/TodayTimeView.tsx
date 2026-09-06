import React from "react";
import { TimeSliderAdjuster } from "./TimeSliderAdjuster";

// ==========================================
// SUB-COMPONENT: TodayTimeView (Giao Diện Chọn Giờ Hôm Nay Dùng Thanh Kéo)
// Mở thẳng đúng mode (Lịch hẹn / Hạn hoàn thành), 2 thanh trượt Giờ & Phút trực quan
// ==========================================

export interface TodayTimeViewProps {
  mode: "scheduled" | "deadline";
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

export const TodayTimeView: React.FC<TodayTimeViewProps> = ({
  mode,
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
  return (
    <div className="space-y-2 py-0.5">
      {mode === "scheduled" ? (
        // 1. CHẾ ĐỘ LỊCH HẸN (Được mở từ nút [ Lịch hẹn ])
        <div className="space-y-2">
          <TimeSliderAdjuster
            hour={eventStartHour}
            minute={eventStartMinute}
            onHourChange={onEventStartHourChange}
            onMinuteChange={onEventStartMinuteChange}
            accentColor="#FEF08A"
            mode="scheduled"
          />

          {/* Tùy chọn Có giờ kết thúc */}
          <div className="pt-1.5 border-t border-[#E7E5E4] space-y-1.5">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#1C1917] bg-white p-1.5 border border-[#262626] rounded-[5px] shadow-[1px_1px_0px_#262626]">
              <input
                type="checkbox"
                checked={hasEndTime}
                onChange={(e) => onHasEndTimeChange(e.target.checked)}
                className="w-3.5 h-3.5 accent-[#262626] rounded border border-[#262626]"
              />
              <span>Có giờ kết thúc cuộc hẹn</span>
            </label>

            {hasEndTime && (
              <div className="space-y-1 animate-in fade-in duration-150">
                <span className="text-[10px] font-bold text-[#78716C] block pl-0.5">
                  Chọn giờ kết thúc:
                </span>
                <TimeSliderAdjuster
                  hour={eventEndHour}
                  minute={eventEndMinute}
                  onHourChange={onEventEndHourChange}
                  onMinuteChange={onEventEndMinuteChange}
                  accentColor="#FEF08A"
                  mode="scheduled"
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        // 2. CHẾ ĐỘ HẠN HOÀN THÀNH (Được mở từ nút [ Hạn hoàn thành ])
        <div>
          <TimeSliderAdjuster
            hour={deadlineHour}
            minute={deadlineMinute}
            onHourChange={onDeadlineHourChange}
            onMinuteChange={onDeadlineMinuteChange}
            accentColor="#FECDD3"
            mode="deadline"
          />
        </div>
      )}
    </div>
  );
};
