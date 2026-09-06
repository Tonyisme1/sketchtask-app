import React from "react";
import { ChevronLeft, ChevronRight, Package, Calendar, CalendarDays, CalendarRange } from "lucide-react";

export type PlannerViewMode = "week" | "month" | "year";

export interface PlannerHeaderProps {
  viewMode: PlannerViewMode;
  onViewModeChange: (mode: PlannerViewMode) => void;
  titleLabel: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  unscheduledCount: number;
  onOpenBacklog: () => void;
}

export const PlannerHeader: React.FC<PlannerHeaderProps> = ({
  viewMode,
  onViewModeChange,
  titleLabel,
  onPrev,
  onNext,
  onToday,
  unscheduledCount,
  onOpenBacklog,
}) => {
  return (
    <div className="flex items-center justify-between gap-2.5 flex-wrap pb-2 border-b border-[#262626] select-none">
      {/* 1. Bộ Điều Hướng Thời Gian */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Nút Chuyển Mốc Thời Gian (< Label >) */}
        <div className="flex items-center gap-1 bg-white border-[1.5px] border-[#262626] rounded-[5px] p-0.5 shadow-[1.5px_1.5px_0px_#262626]">
          <button
            type="button"
            onClick={onPrev}
            className="w-6 h-6 sm:w-7 sm:h-7 bg-[#FCFBF9] hover:bg-[#F3EFE6] rounded-[3px] flex items-center justify-center text-[#1C1917] active:translate-x-[0.5px] active:translate-y-[0.5px] transition-all"
            title="Kỳ trước"
            aria-label="Kỳ trước"
          >
            <ChevronLeft size={14} strokeWidth={2.4} />
          </button>

          <span className="font-bold text-xs sm:text-sm font-mono text-[#1C1917] px-2 min-w-[130px] sm:min-w-[150px] text-center truncate">
            {titleLabel}
          </span>

          <button
            type="button"
            onClick={onNext}
            className="w-6 h-6 sm:w-7 sm:h-7 bg-[#FCFBF9] hover:bg-[#F3EFE6] rounded-[3px] flex items-center justify-center text-[#1C1917] active:translate-x-[0.5px] active:translate-y-[0.5px] transition-all"
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
          className="px-2.5 py-1 text-xs font-bold bg-[#FAF8F3] hover:bg-[#F3EFE6] border-[1.5px] border-[#262626] rounded-[5px] shadow-[1px_1px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all"
          title="Nhảy về mốc hiện tại"
        >
          {viewMode === "week" ? "Tuần này" : viewMode === "year" ? "Năm nay" : "Tháng này"}
        </button>
      </div>

      {/* 2. Cụm Chuyển 3 Chế Độ Xem (Tuần | Tháng | Năm) + Nút Hộp Chờ */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Segmented Switch: Tuần | Tháng | Năm */}
        <div className="inline-flex p-0.5 bg-[#FAF8F3] border-[1.5px] border-[#262626] rounded-[6px] shadow-[1.5px_1.5px_0px_#262626]">
          <button
            type="button"
            onClick={() => onViewModeChange("week")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-xs font-bold transition-all ${
              viewMode === "week"
                ? "bg-[#FEF08A] text-[#1C1917] border-[1.5px] border-[#262626] shadow-[1px_1px_0px_#262626]"
                : "bg-transparent text-[#78716C] hover:text-[#1C1917] border border-transparent"
            } active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none`}
          >
            <CalendarDays size={13} strokeWidth={viewMode === "week" ? 2.5 : 2} />
            <span>Tuần</span>
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange("month")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-xs font-bold transition-all ${
              viewMode === "month"
                ? "bg-[#BAE6FD] text-[#1C1917] border-[1.5px] border-[#262626] shadow-[1px_1px_0px_#262626]"
                : "bg-transparent text-[#78716C] hover:text-[#1C1917] border border-transparent"
            } active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none`}
          >
            <Calendar size={13} strokeWidth={viewMode === "month" ? 2.5 : 2} />
            <span>Tháng</span>
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange("year")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-xs font-bold transition-all ${
              viewMode === "year"
                ? "bg-[#DDD6FE] text-[#1C1917] border-[1.5px] border-[#262626] shadow-[1px_1px_0px_#262626]"
                : "bg-transparent text-[#78716C] hover:text-[#1C1917] border border-transparent"
            } active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none`}
          >
            <CalendarRange size={13} strokeWidth={viewMode === "year" ? 2.5 : 2} />
            <span>Năm</span>
          </button>
        </div>

        {/* Nút Hộp Chờ Riêng Biệt */}
        <button
          type="button"
          onClick={onOpenBacklog}
          className={`px-2.5 py-1.5 text-xs font-bold rounded-[5px] border-[1.5px] border-[#262626] flex items-center gap-1.5 transition-all shadow-[1.5px_1.5px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none ${
            unscheduledCount > 0
              ? "bg-[#FEF08A] hover:bg-[#FDE047] text-[#1C1917]"
              : "bg-white hover:bg-[#FBF9F4] text-[#78716C]"
          }`}
          title="Xem các công việc chưa quyết định ngày"
        >
          <Package size={13} strokeWidth={2.4} className="shrink-0" />
          <span className="hidden sm:inline">Hộp chờ</span>
          {unscheduledCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-[#262626] text-white text-[10px] font-mono leading-none">
              {unscheduledCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
