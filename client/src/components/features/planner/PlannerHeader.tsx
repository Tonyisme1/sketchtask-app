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
    <div className="flex items-center justify-between gap-1 pb-2 border-b border-[#262626]/15 select-none overflow-x-hidden">
      {/* 1. Bộ điều hướng thời gian */}
      <div className="flex items-center gap-1 min-w-0">
        {/* Nút Chuyển Mốc Thời Gian (< Label >) */}
        <div className="flex items-center bg-white border-[1.5px] border-[#262626] rounded-[5px] shadow-[1px_1px_0px_#262626] h-7 sm:h-8">
          <button
            type="button"
            onClick={onPrev}
            className="w-5 sm:w-7 h-full hover:bg-[#F3EFE6] rounded-l-[3px] flex items-center justify-center text-[#1C1917] active:bg-[#E7E2D5] transition-all cursor-pointer"
            title="Kỳ trước"
            aria-label="Kỳ trước"
          >
            <ChevronLeft size={13} strokeWidth={2.4} />
          </button>

          <span className="font-bold text-[10px] sm:text-xs font-mono text-[#1C1917] px-1 sm:px-2 max-w-[85px] xs:max-w-[120px] sm:max-w-[160px] text-center truncate">
            {titleLabel}
          </span>

          <button
            type="button"
            onClick={onNext}
            className="w-5 sm:w-7 h-full hover:bg-[#F3EFE6] rounded-r-[3px] flex items-center justify-center text-[#1C1917] active:bg-[#E7E2D5] transition-all cursor-pointer"
            title="Kỳ sau"
            aria-label="Kỳ sau"
          >
            <ChevronRight size={13} strokeWidth={2.4} />
          </button>
        </div>

        {/* Nút Nhảy Về Hiện Tại */}
        <button
          type="button"
          onClick={onToday}
          className="h-7 sm:h-8 px-1.5 sm:px-2 text-[10px] sm:text-xs font-bold bg-[#FAF8F3] hover:bg-[#F3EFE6] border-[1.5px] border-[#262626] rounded-[5px] shadow-[1px_1px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer shrink-0"
          title="Nhảy về mốc hiện tại"
        >
          Nay
        </button>
      </div>

      {/* 2. Chuyển giữa 7 ngày và Lịch tháng */}
      <div className="flex items-center shrink-0">
        <div className="inline-flex h-7 sm:h-8 p-0.5 bg-[#FAF8F3] border-[1.5px] border-[#262626] rounded-[5px] shadow-[1px_1px_0px_#262626]">
          <button
            type="button"
            onClick={() => onViewModeChange("agenda")}
            className={`flex items-center gap-1 px-1.5 sm:px-2 h-full rounded-[3px] text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
              viewMode === "agenda"
                ? "bg-[#1C1917] text-white shadow-[0.5px_0.5px_0px_#262626]"
                : "bg-transparent text-[#78716C] hover:text-[#1C1917]"
            } active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none`}
            title="Xem 7 ngày"
          >
            <CalendarDays size={12} strokeWidth={viewMode === "agenda" ? 2.5 : 2} />
            <span>7 ngày</span>
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange("month")}
            className={`flex items-center gap-1 px-1.5 sm:px-2 h-full rounded-[3px] text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
              viewMode === "month"
                ? "bg-[#1C1917] text-white shadow-[0.5px_0.5px_0px_#262626]"
                : "bg-transparent text-[#78716C] hover:text-[#1C1917]"
            } active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none`}
            title="Xem lịch tháng"
          >
            <Calendar size={12} strokeWidth={viewMode === "month" ? 2.5 : 2} />
            <span>{isMobile ? "Tháng" : "Lịch tháng"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
