import React from "react";

export interface TodayProgressBarProps {
  completedCount: number;
  totalCount: number;
  label?: string;
}

// === PHẦN 1: Thanh tiến độ siêu tối giản (chỉ thanh tiến độ + 0/0) ===
export const TodayProgressBar: React.FC<TodayProgressBarProps> = ({
  completedCount,
  totalCount,
}) => {
  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="flex items-center gap-2 select-none py-0.5" aria-label="Tiến độ công việc">
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressPercent}
        className="h-2 flex-1 overflow-hidden rounded-[3px] border-[1.5px] border-[#262626] bg-[#F3EFE6] shadow-[0.5px_0.5px_0px_#262626]"
      >
        <div
          className="h-full bg-[#1C1917] transition-[width] duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <span className="font-mono text-xs font-black text-[#1C1917] shrink-0">
        {completedCount}/{totalCount}
      </span>
    </div>
  );
};
