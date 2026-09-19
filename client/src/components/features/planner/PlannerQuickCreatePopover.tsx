// ==========================================
// COMPONENT: PlannerQuickCreatePopover (Google Calendar Style Quick Create Card)
// ==========================================

import React, { useEffect, useRef, useState } from "react";
import {
  Calendar,
  Check,
  Clock,
  Sparkles,
  X,
  Maximize2,
} from "lucide-react";
import { TaskItemType } from "../../../types";
import { formatShortDayMonth, parseDateString } from "../../../utils/date";

export interface PlannerQuickCreatePopoverProps {
  dateStr: string;
  startMinutes: number;
  endMinutes: number;
  title: string;
  itemType: TaskItemType;
  anchorRect?: DOMRect | null;
  onTitleChange: (newTitle: string) => void;
  onItemTypeChange: (newItemType: TaskItemType) => void;
  onSave: () => void;
  onCancel: () => void;
  onOpenFullDetail?: () => void;
}

const POPOVER_WIDTH = 340;
const ESTIMATED_HEIGHT = 200;
const VIEWPORT_GUTTER = 16;
const TOP_HEADER_GUTTER = 68;

const calculatePosition = (anchorRect?: DOMRect | null) => {
  const vpW = typeof window === "undefined" ? 1280 : window.innerWidth;
  const vpH = typeof window === "undefined" ? 800 : window.innerHeight;

  if (!anchorRect) {
    return {
      left: Math.max(VIEWPORT_GUTTER, (vpW - POPOVER_WIDTH) / 2),
      top: Math.max(TOP_HEADER_GUTTER, (vpH - ESTIMATED_HEIGHT) / 2),
    };
  }

  // Ưu tiên đặt bên phải ô click
  let left = anchorRect.right + 12;
  if (left + POPOVER_WIDTH > vpW - VIEWPORT_GUTTER) {
    // Nếu tràn màn hình phải -> đặt bên trái
    left = anchorRect.left - POPOVER_WIDTH - 12;
    if (left < VIEWPORT_GUTTER) {
      // Nếu tràn cả trái -> kẹp giữa
      left = Math.max(
        VIEWPORT_GUTTER,
        Math.min(vpW - POPOVER_WIDTH - VIEWPORT_GUTTER, anchorRect.left)
      );
    }
  }

  let top = anchorRect.top - 8;
  if (top + ESTIMATED_HEIGHT > vpH - VIEWPORT_GUTTER) {
    top = vpH - ESTIMATED_HEIGHT - VIEWPORT_GUTTER;
  }
  if (top < TOP_HEADER_GUTTER) {
    top = TOP_HEADER_GUTTER;
  }

  return { left, top };
};

const formatTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
};

const getVietnameseWeekday = (dateStr: string) => {
  if (!dateStr) return "";
  const d = parseDateString(dateStr);
  const day = d.getDay();
  const names = [
    "Chủ Nhật",
    "Thứ Hai",
    "Thứ Ba",
    "Thứ Tư",
    "Thứ Năm",
    "Thứ Sáu",
    "Thứ Bảy",
  ];
  return names[day];
};

export const PlannerQuickCreatePopover: React.FC<PlannerQuickCreatePopoverProps> = ({
  dateStr,
  startMinutes,
  endMinutes,
  title,
  itemType,
  anchorRect,
  onTitleChange,
  onItemTypeChange,
  onSave,
  onCancel,
  onOpenFullDetail,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [pos, setPos] = useState(() => calculatePosition(anchorRect));

  // Tự động focus input khi mở
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Tính toán lại vị trí khi anchorRect thay đổi
  useEffect(() => {
    setPos(calculatePosition(anchorRect));
  }, [anchorRect]);

  // Bắt phím Escape và Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      } else if (e.key === "Enter" && !e.shiftKey) {
        if (title.trim()) {
          e.preventDefault();
          onSave();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel, onSave, title]);

  // Click bên ngoài để hủy
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onCancel();
      }
    };
    // Dùng setTimeout nhỏ để tránh click hiện tại đóng luôn popover
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onCancel]);

  const timeRangeDisplay = `${formatTime(startMinutes)} - ${formatTime(endMinutes)}`;
  const dateFormatted = formatShortDayMonth(dateStr);
  const weekday = getVietnameseWeekday(dateStr);

  return (
    <div
      ref={popoverRef}
      role="dialog"
      aria-label="Tạo nhanh công việc hoặc sự kiện"
      style={{
        position: "fixed",
        left: `${pos.left}px`,
        top: `${pos.top}px`,
        width: `${POPOVER_WIDTH}px`,
      }}
      className="z-[99999] rounded-2xl border-[1.5px] border-[#262626] dark:border-[#3F3F46] bg-white dark:bg-[#1E1E22] shadow-[3px_3px_0px_#262626] dark:shadow-[3px_3px_0px_#000000] p-3.5 select-none animate-in fade-in zoom-in-95 duration-100"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Header: Segmented Switch & Actions */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#E4E4E7] dark:border-[#2E2E34]">
        {/* Switch Công việc / Sự kiện */}
        <div className="flex items-center p-0.5 rounded-xl bg-[#F4F4F6] dark:bg-[#141417] border border-[#E4E4E7] dark:border-[#2E2E34]">
          <button
            type="button"
            onClick={() => onItemTypeChange("task")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              itemType === "task"
                ? "bg-[#E0F2FE] text-[#0C4A6E] dark:bg-[#0F172A] dark:text-[#38BDF8] shadow-xs"
                : "text-[#71717A] hover:text-[#18181B] dark:hover:text-[#F4F4F5]"
            }`}
          >
            <Check size={13} strokeWidth={2.6} />
            <span>Công việc</span>
          </button>

          <button
            type="button"
            onClick={() => onItemTypeChange("event")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              itemType === "event"
                ? "bg-[var(--accent-blue)] text-white shadow-xs"
                : "text-[#71717A] hover:text-[#18181B] dark:hover:text-[#F4F4F5]"
            }`}
          >
            <Calendar size={13} strokeWidth={2.4} />
            <span>Sự kiện</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          {onOpenFullDetail && (
            <button
              type="button"
              onClick={onOpenFullDetail}
              className="p-1.5 text-[#71717A] hover:text-[#18181B] dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] rounded-lg transition-all cursor-pointer"
              title="Mở toàn bộ chi tiết"
            >
              <Maximize2 size={14} strokeWidth={2.2} />
            </button>
          )}

          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 text-[#71717A] hover:text-[#18181B] dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] rounded-lg transition-all cursor-pointer"
            title="Đóng (Esc)"
          >
            <X size={15} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* 2. Body: Title Input & Time Indicator */}
      <div className="py-3 space-y-2.5">
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={itemType === "event" ? "Thêm tiêu đề sự kiện..." : "Thêm tiêu đề công việc..."}
          className="w-full bg-[#F4F4F6] dark:bg-[#141417] border-[1.5px] border-[#262626] dark:border-[#3F3F46] rounded-xl px-3 py-2 text-sm font-bold text-[#18181B] dark:text-[#F4F4F5] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)] transition-all"
        />

        {/* Thông tin mốc thời gian */}
        <div className="flex items-center gap-2 text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA] px-1">
          <Clock size={13} strokeWidth={2.2} className="text-[var(--accent-blue)] shrink-0" />
          <span className="font-mono text-[#18181B] dark:text-white">{timeRangeDisplay}</span>
          <span>·</span>
          <span>{weekday}, {dateFormatted}</span>
        </div>
      </div>

      {/* 3. Footer: Action Buttons */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E4E4E7] dark:border-[#2E2E34]">
        {onOpenFullDetail ? (
          <button
            type="button"
            onClick={onOpenFullDetail}
            className="text-xs font-semibold text-[var(--accent-blue)] hover:underline cursor-pointer"
          >
            + Thêm chi tiết
          </button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded-xl border border-[#E4E4E7] dark:border-[#2E2E34] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-muted)] text-xs font-bold text-[#71717A] dark:text-[#A1A1AA] active:scale-95 transition-all cursor-pointer"
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={!title.trim()}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold border-[1.5px] border-[#262626] shadow-[2px_2px_0px_#262626] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              itemType === "event"
                ? "bg-[var(--accent-blue)] text-white"
                : "bg-[#E0F2FE] text-[#0C4A6E] dark:bg-[#38BDF8] dark:text-[#09090B]"
            }`}
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
};
