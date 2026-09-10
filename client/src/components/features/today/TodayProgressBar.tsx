import React from "react";

export interface TodayProgressBarProps {
  completedCount: number;
  totalCount: number;
  label?: string;
}

// === PHẦN 1: Thanh tiến độ dùng chung cho workspace Hôm nay ===
export const TodayProgressBar: React.FC<TodayProgressBarProps> = ({
  completedCount,
  totalCount,
  label = "Tiến độ hôm nay",
}) => {
  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <section
      aria-label="Tiến độ hôm nay"
      className="space-y-1.5 rounded-[6px] border-[1.5px] border-[#262626] bg-white px-3 py-2 shadow-[2px_2px_0px_#262626]"
    >
      <div className="flex items-center justify-between gap-3 text-xs font-bold text-[#1C1917]">
        <span>{label}</span>
        <span className="font-mono text-[11px] text-[#57534E]">
          {completedCount}/{totalCount} xong · {progressPercent}%
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={`Phần trăm công việc đã hoàn thành: ${label.toLowerCase()}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressPercent}
        className="h-1.5 w-full overflow-hidden rounded-[2px] border border-[#262626] bg-[#F3EFE6]"
      >
        <div
          className="h-full bg-[#1C1917] transition-[width] duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </section>
  );
};
