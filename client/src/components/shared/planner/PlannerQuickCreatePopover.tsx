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
  itemTypeLocked?: boolean;
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
  itemTypeLocked = false,
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
      className="z-[99999] rounded-3xl bg-white dark:bg-[#1E1E22] shadow-2xl p-4 select-none animate-in fade-in zoom-in-95 duration-150"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Header: Segmented Switch & Actions */}
      <div className="flex items-center justify-between gap-2 pb-3">
        {!itemTypeLocked && (
          <div className="flex items-center p-1 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06]">
            <button
              type="button"
              onClick={() => onItemTypeChange("task")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                itemType === "task"
                  ? "bg-white dark:bg-[#2C2C2E] text-[#007AFF] dark:text-[#0A84FF] shadow-2xs"
                  : "text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-[#F2F2F7]"
              }`}
            >
              <Check size={13} strokeWidth={2.4} />
              <span>Công việc</span>
            </button>

            <button
              type="button"
              onClick={() => onItemTypeChange("event")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                itemType === "event"
                  ? "bg-white dark:bg-[#2C2C2E] text-[#007AFF] dark:text-[#0A84FF] shadow-2xs"
                  : "text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-[#F2F2F7]"
              }`}
            >
              <Calendar size={13} strokeWidth={2.2} />
              <span>Sự kiện</span>
            </button>
          </div>
        )}

        <div className="flex items-center gap-1 ml-auto">
          {onOpenFullDetail && (
            <button
              type="button"
              onClick={onOpenFullDetail}
              className="p-1.5 text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-[#F2F2F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.08] rounded-xl transition-all cursor-pointer"
              title="Mở toàn bộ chi tiết"
            >
              <Maximize2 size={14} strokeWidth={2.2} />
            </button>
          )}

          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-[#F2F2F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.08] rounded-xl transition-all cursor-pointer"
            title="Đóng (Esc)"
          >
            <X size={15} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* 2. Body: Title Input & Time Indicator */}
      <div className="py-3.5 space-y-2.5">
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={itemType === "event" ? "Thêm tiêu đề sự kiện..." : "Thêm tiêu đề công việc..."}
          className="w-full bg-black/[0.04] dark:bg-white/[0.06] rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] placeholder:text-[#8E8E93] dark:placeholder:text-[#A1A1A6] focus:outline-none focus:ring-1 focus:ring-[#007AFF] transition-all shadow-2xs"
        />

        {/* Thông tin mốc thời gian */}
        <div className="flex items-center gap-2 text-xs font-semibold text-[#8E8E93] dark:text-[#A1A1A6] px-1">
          <Clock size={13} strokeWidth={2.2} className="text-[#007AFF] dark:text-[#0A84FF] shrink-0" />
          <span className="font-mono text-[#1C1C1E] dark:text-[#F2F2F7]">{timeRangeDisplay}</span>
          <span>·</span>
          <span>{weekday}, {dateFormatted}</span>
        </div>
      </div>

      {/* 3. Footer: Action Buttons */}
      <div className="flex items-center justify-between gap-2 pt-2">
        {onOpenFullDetail ? (
          <button
            type="button"
            onClick={onOpenFullDetail}
            className="text-xs font-semibold text-[#007AFF] dark:text-[#0A84FF] hover:underline cursor-pointer"
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
            className="px-3.5 py-1.5 rounded-2xl bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] text-xs font-semibold text-[#8E8E93] dark:text-[#A1A1A6] transition-all cursor-pointer shadow-2xs"
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={!title.trim()}
            className="px-4 py-1.5 rounded-2xl text-xs font-semibold bg-[#007AFF] hover:bg-[#0071E3] dark:bg-[#0A84FF] dark:hover:bg-[#0071E3] text-white shadow-2xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
};
