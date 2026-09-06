import React from "react";
import { Minus, Plus } from "lucide-react";

// ==========================================
// COMPONENT: TimeSliderAdjuster (Bộ Điều Chỉnh Giờ & Phút Siêu Gọn)
// Tinh gọn tối đa diện tích: Hiển thị mốc giờ + Phím tắt nhanh + 2 thanh trượt mỏng
// ==========================================

export interface TimeSliderAdjusterProps {
  hour: number;
  minute: number;
  onHourChange: (h: number) => void;
  onMinuteChange: (m: number) => void;
  accentColor?: string; // "#FEF08A" (Vàng Lịch hẹn) hoặc "#FECDD3" (Hồng Hạn chót)
  mode?: "scheduled" | "deadline";
}

const PRESET_HOURS = [
  { label: "08:00", h: 8, m: 0 },
  { label: "09:00", h: 9, m: 0 },
  { label: "12:00", h: 12, m: 0 },
  { label: "14:00", h: 14, m: 0 },
  { label: "17:00", h: 17, m: 0 },
  { label: "20:00", h: 20, m: 0 },
];

export const TimeSliderAdjuster: React.FC<TimeSliderAdjusterProps> = ({
  hour,
  minute,
  onHourChange,
  onMinuteChange,
  accentColor = "#FEF08A",
}) => {
  const handleDecHour = () => onHourChange(hour > 0 ? hour - 1 : 23);
  const handleIncHour = () => onHourChange(hour < 23 ? hour + 1 : 0);
  const handleDecMinute = () => onMinuteChange(minute >= 5 ? minute - 5 : 55);
  const handleIncMinute = () => onMinuteChange(minute <= 50 ? minute + 5 : 0);

  return (
    <div
      className="space-y-1.5 select-none text-xs"
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      {/* 1. Header: Màn hình giờ gọn + Mốc giờ nhanh */}
      <div className="flex items-center justify-between gap-1.5 flex-wrap">
        {/* Badge giờ to vừa phải */}
        <div
          className="px-2.5 py-0.5 rounded-[4px] border-[1.5px] border-[#262626] shadow-[1px_1px_0px_#262626] font-mono text-base sm:text-lg font-black tracking-wider text-[#1C1917] shrink-0"
          style={{ backgroundColor: accentColor }}
        >
          {String(hour).padStart(2, "0")}:{String(minute).padStart(2, "0")}
        </div>

        {/* Các mốc giờ chọn nhanh 1 chạm */}
        <div className="flex items-center gap-1 flex-wrap">
          {PRESET_HOURS.map((preset) => {
            const isMatch = hour === preset.h && minute === preset.m;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  onHourChange(preset.h);
                  onMinuteChange(preset.m);
                }}
                className={`px-1.5 py-0.5 rounded-[3px] text-[10px] font-mono font-bold border transition-all active:translate-y-[0.5px] ${
                  isMatch
                    ? "bg-[#262626] text-white border-[#262626] shadow-[0.5px_0.5px_0px_#262626]"
                    : "bg-white text-[#78716C] border-[#D4CEBF] hover:border-[#262626] hover:text-[#1C1917]"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Cụm thanh trượt Giờ & Phút tinh gọn */}
      <div className="bg-white border border-[#262626] rounded-[5px] p-2 shadow-[1px_1px_0px_#262626] space-y-1.5">
        {/* Dòng 1: Giờ */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-[#78716C] w-7 shrink-0">
            Giờ:
          </span>
          <button
            type="button"
            onClick={handleDecHour}
            className="w-5 h-5 rounded bg-[#FAF8F3] hover:bg-[#F0ECE1] border border-[#262626] flex items-center justify-center shrink-0 active:translate-y-[0.5px]"
            title="Giảm 1 giờ"
          >
            <Minus size={10} strokeWidth={2.4} />
          </button>
          <input
            type="range"
            min={0}
            max={23}
            step={1}
            value={hour}
            onChange={(e) => onHourChange(parseInt(e.target.value, 10))}
            className="flex-1 h-2 bg-[#E7E5E4] rounded appearance-none cursor-pointer border border-[#262626] accent-[#262626]"
          />
          <button
            type="button"
            onClick={handleIncHour}
            className="w-5 h-5 rounded bg-[#FAF8F3] hover:bg-[#F0ECE1] border border-[#262626] flex items-center justify-center shrink-0 active:translate-y-[0.5px]"
            title="Tăng 1 giờ"
          >
            <Plus size={10} strokeWidth={2.4} />
          </button>
          <span className="font-mono text-xs font-bold text-[#1C1917] w-8 text-right shrink-0">
            {String(hour).padStart(2, "0")}h
          </span>
        </div>

        {/* Dòng 2: Phút */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-[#78716C] w-7 shrink-0">
            Phút:
          </span>
          <button
            type="button"
            onClick={handleDecMinute}
            className="w-5 h-5 rounded bg-[#FAF8F3] hover:bg-[#F0ECE1] border border-[#262626] flex items-center justify-center shrink-0 active:translate-y-[0.5px]"
            title="Giảm 5 phút"
          >
            <Minus size={10} strokeWidth={2.4} />
          </button>
          <input
            type="range"
            min={0}
            max={59}
            step={1}
            value={minute}
            onChange={(e) => onMinuteChange(parseInt(e.target.value, 10))}
            className="flex-1 h-2 bg-[#E7E5E4] rounded appearance-none cursor-pointer border border-[#262626] accent-[#262626]"
          />
          <button
            type="button"
            onClick={handleIncMinute}
            className="w-5 h-5 rounded bg-[#FAF8F3] hover:bg-[#F0ECE1] border border-[#262626] flex items-center justify-center shrink-0 active:translate-y-[0.5px]"
            title="Tăng 5 phút"
          >
            <Plus size={10} strokeWidth={2.4} />
          </button>
          <span className="font-mono text-xs font-bold text-[#1C1917] w-8 text-right shrink-0">
            {String(minute).padStart(2, "0")}p
          </span>
        </div>
      </div>
    </div>
  );
};
