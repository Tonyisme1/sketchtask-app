import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Calendar, CalendarDays } from "lucide-react";
import { useResponsiveLayout } from "../../../hooks";

export type PlannerViewMode = "day" | "agenda" | "month";

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
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const viewMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isViewMenuOpen) return;

    const handleOutsidePress = (event: MouseEvent | TouchEvent) => {
      if (!viewMenuRef.current?.contains(event.target as Node)) {
        setIsViewMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsidePress);
    document.addEventListener("touchstart", handleOutsidePress);
    return () => {
      document.removeEventListener("mousedown", handleOutsidePress);
      document.removeEventListener("touchstart", handleOutsidePress);
    };
  }, [isViewMenuOpen]);

  const activeViewLabel = viewMode === "day" ? "Ngày" : viewMode === "month" ? "Tháng" : "Tuần";

  return (
    <div className="flex items-center justify-between gap-2 pb-3 select-none overflow-visible">
      {/* 1. Bộ điều hướng thời gian */}
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
        {/* Nút Chuyển Mốc Thời Gian (< Label >) */}
        <div className="flex items-center bg-black/[0.04] dark:bg-white/[0.06] rounded-2xl shadow-2xs p-0.5 h-10 sm:h-9 min-w-0">
          <button
            type="button"
            onClick={onPrev}
            className="w-8 sm:w-8 h-full hover:bg-black/[0.06] dark:hover:bg-white/[0.1] rounded-xl flex items-center justify-center text-[#1C1C1E] dark:text-[#F2F2F7] transition-all cursor-pointer shrink-0"
            title="Kỳ trước"
            aria-label="Kỳ trước"
          >
            <ChevronLeft size={15} strokeWidth={2.2} />
          </button>

          <span className="font-semibold text-[13px] sm:text-[13px] font-mono text-[#1C1C1E] dark:text-[#F2F2F7] px-1.5 sm:px-2 text-center whitespace-nowrap truncate">
            {titleLabel}
          </span>

          <button
            type="button"
            onClick={onNext}
            className="w-8 sm:w-8 h-full hover:bg-black/[0.06] dark:hover:bg-white/[0.1] rounded-xl flex items-center justify-center text-[#1C1C1E] dark:text-[#F2F2F7] transition-all cursor-pointer shrink-0"
            title="Kỳ sau"
            aria-label="Kỳ sau"
          >
            <ChevronRight size={15} strokeWidth={2.2} />
          </button>
        </div>

        {/* Nút Nhảy Về Hiện Tại dùng chung cho cả ba giao diện. */}
        <button
          type="button"
          onClick={onToday}
          className="h-10 sm:h-9 px-3.5 sm:px-3 text-[13px] sm:text-xs font-semibold bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] rounded-2xl shadow-2xs text-[#1C1C1E] dark:text-[#F2F2F7] transition-all cursor-pointer shrink-0"
          title="Nhảy về mốc hiện tại"
        >
          Nay
        </button>
      </div>

      {/* 2. Chuyển giữa Ngày, 7 ngày và Tháng */}
      <div className="flex items-center shrink-0">
        {isMobile ? (
          <div ref={viewMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsViewMenuOpen((open) => !open)}
              aria-expanded={isViewMenuOpen}
              aria-haspopup="menu"
              className="flex h-10 min-w-[92px] items-center justify-between gap-2 rounded-2xl bg-black/[0.04] px-3 text-[13px] font-bold text-[#1C1C1E] shadow-2xs transition-all hover:bg-black/[0.08] active:scale-[0.98] dark:bg-white/[0.06] dark:text-[#F2F2F7] dark:hover:bg-white/[0.1]"
            >
              <span>{activeViewLabel}</span>
              <ChevronDown size={16} strokeWidth={2.4} className={`text-[var(--text-main)] transition-transform ${isViewMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {isViewMenuOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-36 rounded-2xl bg-white p-1.5 shadow-[2px_2px_0px_var(--border-ink)] dark:bg-[#2C2C2E]">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onViewModeChange("day");
                    setIsViewMenuOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-[#1C1C1E] hover:bg-black/[0.06] dark:text-[#F2F2F7] dark:hover:bg-white/[0.1]"
                >
                  <span className="flex items-center gap-2"><CalendarDays size={16} /> Ngày</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onViewModeChange("agenda");
                    setIsViewMenuOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-[#1C1C1E] hover:bg-black/[0.06] dark:text-[#F2F2F7] dark:hover:bg-white/[0.1]"
                >
                  <span className="flex items-center gap-2"><CalendarDays size={16} /> Tuần</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onViewModeChange("month");
                    setIsViewMenuOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-[#1C1C1E] hover:bg-black/[0.06] dark:text-[#F2F2F7] dark:hover:bg-white/[0.1]"
                >
                  <span className="flex items-center gap-2"><Calendar size={16} /> Tháng</span>
                </button>
              </div>
            )}
          </div>
        ) : (
        <div className="inline-flex h-8 sm:h-9 p-0.5 bg-black/[0.04] dark:bg-white/[0.06] rounded-2xl shadow-2xs">
          <button
            type="button"
            onClick={() => onViewModeChange("day")}
            className={`flex items-center gap-1.5 px-3 h-full rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "day"
                ? "bg-white dark:bg-[#2C2C2E] text-[#007AFF] dark:text-[#0A84FF] shadow-2xs"
                : "text-[#8E8E93] dark:text-[#A1A1A6] hover:text-[#1C1C1E] dark:hover:text-[#F2F2F7]"
            }`}
            title="Xem ngày"
          >
            <CalendarDays size={14} strokeWidth={2.2} />
            <span>Ngày</span>
          </button>

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
            <span>Tháng</span>
          </button>
        </div>
        )}
      </div>
    </div>
  );
};
