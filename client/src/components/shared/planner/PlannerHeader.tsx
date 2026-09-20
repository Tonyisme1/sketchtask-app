import React from "react";
import { ChevronLeft, ChevronRight, Calendar, CalendarDays } from "lucide-react";
import { useResponsiveLayout } from "../../../hooks";

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
    <div className="flex items-center justify-between gap-2 pb-3 border-b border-black/[0.04] dark:border-white/[0.06] select-none overflow-x-hidden">
      {/* 1. Bộ điều hướng thời gian */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Nút Chuyển Mốc Thời Gian (< Label >) */}
        <div className="flex items-center bg-black/[0.04] dark:bg-white/[0.06] rounded-2xl shadow-2xs p-0.5 h-8 sm:h-9">
          <button
            type="button"
            onClick={onPrev}
            className="w-7 sm:w-8 h-full hover:bg-black/[0.06] dark:hover:bg-white/[0.1] rounded-xl flex items-center justify-center text-[#1C1C1E] dark:text-[#F2F2F7] transition-all cursor-pointer"
            title="Kỳ trước"
            aria-label="Kỳ trước"
          >
            <ChevronLeft size={15} strokeWidth={2.2} />
          </button>

          <span className="font-semibold text-xs sm:text-[13px] font-mono text-[#1C1C1E] dark:text-[#F2F2F7] px-2 text-center whitespace-nowrap">
            {titleLabel}
          </span>

          <button
            type="button"
            onClick={onNext}
            className="w-7 sm:w-8 h-full hover:bg-black/[0.06] dark:hover:bg-white/[0.1] rounded-xl flex items-center justify-center text-[#1C1C1E] dark:text-[#F2F2F7] transition-all cursor-pointer"
            title="Kỳ sau"
            aria-label="Kỳ sau"
          >
            <ChevronRight size={15} strokeWidth={2.2} />
          </button>
        </div>

        {/* Nút Nhảy Về Hiện Tại */}
        <button
          type="button"
          onClick={onToday}
          className="h-8 sm:h-9 px-3 text-xs font-semibold bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] rounded-2xl shadow-2xs text-[#1C1C1E] dark:text-[#F2F2F7] transition-all cursor-pointer shrink-0"
          title="Nhảy về mốc hiện tại"
        >
          Nay
        </button>
      </div>

      {/* 2. Chuyển giữa 7 ngày và Lịch tháng */}
      <div className="flex items-center shrink-0">
        <div className="inline-flex h-8 sm:h-9 p-0.5 bg-black/[0.04] dark:bg-white/[0.06] rounded-2xl shadow-2xs">
          <button
            type="button"
            onClick={() => onViewModeChange("agenda")}
            className={`flex items-center gap-1.5 px-3 h-full rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "agenda"
                ? "bg-white dark:bg-[#2C2C2E] text-[#007AFF] dark:text-[#0A84FF] shadow-2xs"
                : "text-[#8E8E93] dark:text-[#A1A1A6] hover:text-[#1C1C1E] dark:hover:text-[#F2F2F7]"
            }`}
            title="Xem 7 ngày"
          >
            <CalendarDays size={14} strokeWidth={2.2} />
            <span>7 ngày</span>
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange("month")}
            className={`flex items-center gap-1.5 px-3 h-full rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "month"
                ? "bg-white dark:bg-[#2C2C2E] text-[#007AFF] dark:text-[#0A84FF] shadow-2xs"
                : "text-[#8E8E93] dark:text-[#A1A1A6] hover:text-[#1C1C1E] dark:hover:text-[#F2F2F7]"
            }`}
            title="Xem lịch tháng"
          >
            <Calendar size={14} strokeWidth={2.2} />
            <span>{isMobile ? "Tháng" : "Lịch tháng"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
