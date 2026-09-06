import React from "react";
import { WheelColumn } from "./WheelColumn";

// ==========================================
// SUB-COMPONENT: WheelTimePicker (Cụm 2 Cột Giờ & Toàn Bộ 60 Phút)
// ==========================================

export interface WheelTimePickerProps {
  hour: number;
  minute: number;
  onHourChange: (h: number) => void;
  onMinuteChange: (m: number) => void;
  accentBg?: string;
}

const HOURS_LIST = Array.from({ length: 24 }, (_, i) => i);
const ALL_MINUTES_LIST = Array.from({ length: 60 }, (_, i) => i);

export const WheelTimePicker: React.FC<WheelTimePickerProps> = ({
  hour,
  minute,
  onHourChange,
  onMinuteChange,
  accentBg,
}) => {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-[#F5F3EF] border border-[#262626]/20 rounded-[6px]">
      <WheelColumn
        items={HOURS_LIST}
        value={hour}
        onChange={onHourChange}
        label="Giờ"
        accentBg={accentBg}
      />
      <span className="font-mono font-black text-sm text-[#262626] pb-3 select-none">
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
  );
};
