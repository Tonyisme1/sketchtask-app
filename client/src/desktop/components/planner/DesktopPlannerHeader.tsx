import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CustomSelect } from "../../../components/ui/pickers/select/CustomSelect";

export type PlannerViewMode = "day" | "agenda" | "month" | "year";
export type DesktopPlannerSurface = "calendar" | "list";

const VIEW_MODE_OPTIONS = [
  { value: "agenda", label: "Tuần" },
  { value: "month", label: "Tháng" },
  { value: "year", label: "Năm" },
  { value: "day", label: "Ngày" },
];

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
    <header className="flex h-[60px] shrink-0 select-none items-center justify-between gap-2 border-b border-[var(--border-ink-muted)] bg-[var(--bg-canvas)] px-4">
      {/* 1. Bộ điều hướng thời gian chuẩn Desktop (Hôm nay + Prev/Next + Tiêu đề lớn) */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={onToday}
          className="h-9 rounded-xl px-3 text-xs font-bold text-[var(--text-main)] transition-colors hover:bg-[var(--bg-surface-muted)] focus-visible:bg-[var(--bg-surface-muted)] active:scale-95 cursor-pointer shrink-0"
          title="Nhảy về ngày hôm nay"
        >
          Hôm nay
        </button>

        {/* Nút Prev / Next bo tròn */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrev}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--text-main)] transition-colors hover:bg-[var(--bg-surface-muted)] focus-visible:bg-[var(--bg-surface-muted)] active:scale-95 cursor-pointer"
            title="Kỳ trước"
            aria-label="Kỳ trước"
          >
            <ChevronLeft size={16} strokeWidth={2.2} />
          </button>

          <button
            type="button"
            onClick={onNext}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--text-main)] transition-colors hover:bg-[var(--bg-surface-muted)] focus-visible:bg-[var(--bg-surface-muted)] active:scale-95 cursor-pointer"
            title="Kỳ sau"
            aria-label="Kỳ sau"
          >
            <ChevronRight size={16} strokeWidth={2.2} />
          </button>
        </div>

        {/* Tiêu đề thời gian sắc nét */}
        <h2 className="pl-1 text-lg font-extrabold tracking-tight text-[var(--text-main)] truncate lg:text-xl">
          {titleLabel}
        </h2>
      </div>

      {/* 2. Các controls bên phải */}
      <div className="flex items-center gap-2 shrink-0">
        <CustomSelect
          className="w-[118px] shrink-0"
          options={VIEW_MODE_OPTIONS}
          value={viewMode}
          onChange={(value) => onViewModeChange(value as PlannerViewMode)}
          placeholder="Chế độ xem"
        />
      </div>
    </header>
  );
};
