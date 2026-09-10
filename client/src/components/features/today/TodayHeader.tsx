import React from "react";
import { TodayProgressBar } from "./TodayProgressBar";

export interface TodayHeaderProps {
  dayNum: number;
  monthNum: number;
  completedCount: number;
  totalCount: number;
}

export const TodayHeader: React.FC<TodayHeaderProps> = ({
  dayNum,
  monthNum,
  completedCount,
  totalCount,
}) => {
  return (
    <div className="pb-2 border-b border-[#262626] space-y-1.5 animate-in fade-in duration-150 select-none">
      <div className="flex items-center justify-between gap-2">
        {/* Tiêu đề Hôm Nay + Badge Ngày */}
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#1C1917]">
            Hôm nay
          </h1>
          <span className="text-[11px] font-mono font-bold bg-[#1C1917] text-white px-2 py-0.5 rounded-[4px] border-[1.5px] border-[#262626] shadow-[1px_1px_0px_#262626]">
            {dayNum}/{monthNum}
          </span>
        </div>

        {/* Tiến độ hoàn tất tỉ lệ 0/0 */}
        <div className="flex items-center gap-2">
          <div className="font-mono text-xs font-bold bg-white px-2.5 py-0.5 border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626]">
            {completedCount}/{totalCount}
          </div>
        </div>
      </div>

      <TodayProgressBar
        completedCount={completedCount}
        totalCount={totalCount}
      />
    </div>
  );
};
