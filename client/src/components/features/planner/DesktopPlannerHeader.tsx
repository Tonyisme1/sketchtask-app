import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CalendarDays,
} from "lucide-react";

export type PlannerViewMode = "agenda" | "month";
export type DesktopPlannerSurface = "calendar" | "list";

export interface DesktopPlannerHeaderProps {
  viewMode: PlannerViewMode;
  surface: DesktopPlannerSurface;
  onViewModeChange: (mode: PlannerViewMode) => void;
  titleLabel: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export const DesktopPlannerHeader: React.FC<DesktopPlannerHeaderProps> = ({
  viewMode,
  surface,
  onViewModeChange,
  titleLabel,
  onPrev,
  onNext,
  onToday,
}) => {
  return (
    <header className="flex items-center justify-between gap-3 px-4 py-2 border-b border-[var(--border-ink)] bg-[var(--bg-surface)] select-none shrink-0 h-[54px]">
      {/* 1. Bộ điều hướng thời gian chuẩn Desktop (Hôm nay + Prev/Next + Tiêu đề lớn) */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={onToday}
          className="h-[34px] px-3.5 text-xs font-bold bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-muted)] border border-[var(--border-ink)] rounded-xl shadow-xs active:scale-95 text-[var(--text-main)] transition-all cursor-pointer shrink-0"
          title="Nhảy về ngày hôm nay"
        >
          Hôm nay
        </button>

        {/* Nút Prev / Next bo tròn */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrev}
            className="w-8 h-[34px] rounded-xl border border-[var(--border-ink)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-muted)] flex items-center justify-center text-[var(--text-main)] active:scale-95 transition-all cursor-pointer shadow-xs"
            title="Kỳ trước"
            aria-label="Kỳ trước"
          >
            <ChevronLeft size={16} strokeWidth={2.2} />
          </button>

          <button
            type="button"
            onClick={onNext}
            className="w-8 h-[34px] rounded-xl border border-[var(--border-ink)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-muted)] flex items-center justify-center text-[var(--text-main)] active:scale-95 transition-all cursor-pointer shadow-xs"
            title="Kỳ sau"
            aria-label="Kỳ sau"
          >
            <ChevronRight size={16} strokeWidth={2.2} />
          </button>
        </div>

        {/* Tiêu đề thời gian sắc nét */}
        <h2 className="text-base lg:text-lg font-extrabold text-[var(--text-main)] tracking-tight truncate pl-1">
          {titleLabel}
        </h2>
      </div>

      {/* 2. Các controls bên phải */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="inline-flex h-[34px] p-0.5 bg-[var(--bg-surface-muted)] border border-[var(--border-ink)] rounded-xl">
          <button
            type="button"
            onClick={() => onViewModeChange("agenda")}
            className={`flex items-center gap-1.5 px-3 h-full rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === "agenda"
                ? "bg-[var(--bg-surface)] text-[var(--text-main)] shadow-xs"
                : "bg-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]"
            } active:scale-95`}
            title="Xem 7 ngày theo giờ"
          >
            <CalendarDays
              size={14}
              strokeWidth={viewMode === "agenda" ? 2.5 : 2}
            />
            <span>Tuần</span>
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange("month")}
            className={`flex items-center gap-1.5 px-3 h-full rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === "month"
                ? "bg-[var(--bg-surface)] text-[var(--text-main)] shadow-xs"
                : "bg-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]"
            } active:scale-95`}
            title="Xem tổng quan lịch tháng"
          >
            <Calendar size={14} strokeWidth={viewMode === "month" ? 2.5 : 2} />
            <span>Lịch tháng</span>
          </button>
        </div>
      </div>
    </header>
  );
};
