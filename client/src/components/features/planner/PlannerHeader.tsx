import React from "react";
import { ChevronLeft, ChevronRight, Calendar, CalendarDays } from "lucide-react";
import { useResponsiveLayout } from "../../../shared/hooks";

export type PlannerViewMode = "agenda" | "month";

export interface PlannerHeaderProps {
  viewMode: PlannerViewMode;
  onViewModeChange: (mode: PlannerViewMode) => void;
  titleLabel: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export const PlannerHeader: React.FC<PlannerHeaderProps> = ({
  viewMode,
  onViewModeChange,
  titleLabel,
  onPrev,
  onNext,
  onToday,
}) => {
  const { isMobile } = useResponsiveLayout();

  return (
    <div className="flex items-center justify-between gap-1.5 pb-2.5 border-b border-[#262626]/15 select-none overflow-x-hidden">
      {/* 1. Bộ điều hướng thời gian */}
      <div className="flex items-center gap-1.5 min-w-0">
        {/* Nút Chuyển Mốc Thời Gian (< Label >) */}
        <div className="flex items-center bg-white dark:bg-[#1C1C1E] border-[1.5px] border-[#262626] dark:border-black rounded-[6px] shadow-[1px_1px_0px_#262626] h-8 sm:h-8.5">
          <button
            type="button"
            onClick={onPrev}
            className="w-6 sm:w-7 h-full hover:bg-[#F3EFE6] dark:hover:bg-[#2C2C2E] rounded-l-[4px] flex items-center justify-center text-[#1C1917] dark:text-white active:bg-[#E7E2D5] transition-all cursor-pointer"
            title="Kỳ trước"
            aria-label="Kỳ trước"
          >
            <ChevronLeft size={14} strokeWidth={2.4} />
          </button>

          <span className="font-bold text-xs sm:text-[13px] font-mono text-[#1C1917] dark:text-white px-2 text-center whitespace-nowrap">
            {titleLabel}
          </span>

          <button
            type="button"
            onClick={onNext}
            className="w-6 sm:w-7 h-full hover:bg-[#F3EFE6] dark:hover:bg-[#2C2C2E] rounded-r-[4px] flex items-center justify-center text-[#1C1917] dark:text-white active:bg-[#E7E2D5] transition-all cursor-pointer"
            title="Kỳ sau"
            aria-label="Kỳ sau"
          >
            <ChevronRight size={14} strokeWidth={2.4} />
          </button>
        </div>

        {/* Nút Nhảy Về Hiện Tại */}
        <button
          type="button"
          onClick={onToday}
          className="h-8 sm:h-8.5 px-2 sm:px-2.5 text-xs font-bold bg-[#FAF8F3] dark:bg-[#2C2C2E] hover:bg-[#F3EFE6] dark:hover:bg-[#3A3A3C] border-[1.5px] border-[#262626] dark:border-black rounded-[6px] shadow-[1px_1px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none text-[#1C1917] dark:text-white transition-all cursor-pointer shrink-0"
          title="Nhảy về mốc hiện tại"
        >
          Nay
        </button>
      </div>

      {/* 2. Chuyển giữa 7 ngày và Lịch tháng */}
      <div className="flex items-center shrink-0">
        <div className="inline-flex h-8 sm:h-8.5 p-0.5 bg-[#FAF8F3] dark:bg-[#2C2C2E] border-[1.5px] border-[#262626] dark:border-black rounded-[6px] shadow-[1px_1px_0px_#262626]">
          <button
            type="button"
            onClick={() => onViewModeChange("agenda")}
            className={`flex items-center gap-1 px-2 sm:px-2.5 h-full rounded-[4px] text-xs font-bold transition-all cursor-pointer ${
              viewMode === "agenda"
                ? "bg-[#1C1917] dark:bg-white text-white dark:text-[#1C1917] shadow-[0.5px_0.5px_0px_#262626]"
                : "bg-transparent text-[#78716C] dark:text-[#AEAEC2] hover:text-[#1C1917] dark:hover:text-white"
            } active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none`}
            title="Xem 7 ngày"
          >
            <CalendarDays size={13} strokeWidth={viewMode === "agenda" ? 2.5 : 2} />
            <span>7 ngày</span>
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange("month")}
            className={`flex items-center gap-1 px-2 sm:px-2.5 h-full rounded-[4px] text-xs font-bold transition-all cursor-pointer ${
              viewMode === "month"
                ? "bg-[#1C1917] dark:bg-white text-white dark:text-[#1C1917] shadow-[0.5px_0.5px_0px_#262626]"
                : "bg-transparent text-[#78716C] dark:text-[#AEAEC2] hover:text-[#1C1917] dark:hover:text-white"
            } active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none`}
            title="Xem lịch tháng"
          >
            <Calendar size={13} strokeWidth={viewMode === "month" ? 2.5 : 2} />
            <span>{isMobile ? "Tháng" : "Lịch tháng"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
