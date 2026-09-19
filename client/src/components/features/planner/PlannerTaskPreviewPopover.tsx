// ==========================================
// COMPONENT: PlannerTaskPreviewPopover (Google Calendar Style Quick View)
// ==========================================

import React, { useEffect, useState, useRef } from "react";
import {
  Pencil,
  Trash2,
  X,
  Clock,
  Calendar,
  Bell,
  Folder,
  Tag,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { TaskDto } from "../../../types";
import { formatShortDayMonth, parseDateString } from "../../../utils/date";
import {
  getTaskEffectiveDate,
  getTaskItemType,
  normalizeTaskTimeType,
} from "../../../utils/taskSemantics";

export interface PlannerTaskPreviewPopoverProps {
  task: TaskDto;
  anchorRect?: DOMRect | null;
  onClose: () => void;
  onEdit: (task: TaskDto) => void;
  onDelete?: (taskId: string) => void;
  onToggleComplete?: (taskId: string) => void;
}

const POPOVER_WIDTH = 340;
const ESTIMATED_HEIGHT = 240;
const VIEWPORT_GUTTER = 16;
const TOP_HEADER_GUTTER = 68;

const calculatePosition = (anchorRect?: DOMRect | null) => {
  if (!anchorRect) {
    const vpW = typeof window === "undefined" ? 1280 : window.innerWidth;
    const vpH = typeof window === "undefined" ? 800 : window.innerHeight;
    return {
      left: Math.max(VIEWPORT_GUTTER, (vpW - POPOVER_WIDTH) / 2),
      top: Math.max(TOP_HEADER_GUTTER, (vpH - ESTIMATED_HEIGHT) / 2),
    };
  }

  const vpW = typeof window === "undefined" ? 1280 : window.innerWidth;
  const vpH = typeof window === "undefined" ? 800 : window.innerHeight;

  // Try placing to the right first
  let left = anchorRect.right + 10;
  if (left + POPOVER_WIDTH > vpW - VIEWPORT_GUTTER) {
    // Try placing to the left
    left = anchorRect.left - POPOVER_WIDTH - 10;
    if (left < VIEWPORT_GUTTER) {
      // Center or clamp to fit on screen
      left = Math.max(
        VIEWPORT_GUTTER,
        Math.min(vpW - POPOVER_WIDTH - VIEWPORT_GUTTER, anchorRect.left)
      );
    }
  }

  let top = anchorRect.top - 10;
  if (top + ESTIMATED_HEIGHT > vpH - VIEWPORT_GUTTER) {
    top = vpH - ESTIMATED_HEIGHT - VIEWPORT_GUTTER;
  }
  if (top < TOP_HEADER_GUTTER) {
    top = TOP_HEADER_GUTTER;
  }

  return { left, top };
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

export const PlannerTaskPreviewPopover: React.FC<PlannerTaskPreviewPopoverProps> = ({
  task,
  anchorRect,
  onClose,
  onEdit,
  onDelete,
  onToggleComplete,
}) => {
  const [position, setPosition] = useState(() => calculatePosition(anchorRect));
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => setPosition(calculatePosition(anchorRect));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [anchorRect]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const dateStr = getTaskEffectiveDate(task) || "";
  const weekday = dateStr ? getVietnameseWeekday(dateStr) : "";
  const shortDate = dateStr ? formatShortDayMonth(dateStr) : "";
  const isEvent = getTaskItemType(task) === "event";
  const normType = normalizeTaskTimeType(task);

  // Time label formulation
  let timeLabel = "Cả ngày";
  if (normType === "scheduled" || isEvent) {
    if (task.startTime && task.endTime) {
      timeLabel = `${task.startTime} – ${task.endTime}`;
    } else if (task.startTime) {
      timeLabel = task.startTime;
    }
  } else if (normType === "deadline") {
    timeLabel = `Hạn chót: ${task.deadlineTime || task.endTime || "Cuối ngày"}`;
  }

  const dateTimeSummary = dateStr
    ? `${weekday}, ${shortDate} · ${timeLabel}`
    : timeLabel;

  const tagLabel = task.tag || task.tags?.[0];

  return (
    <>
      {/* Click outside backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/10 dark:bg-black/40 backdrop-blur-[1px] transition-opacity animate-in fade-in duration-100"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Floating Popover Container */}
      <div
        ref={popoverRef}
        role="dialog"
        aria-modal="true"
        aria-label={task.title || "Xem nhanh công việc"}
        style={{ left: position.left, top: position.top }}
        onClick={(e) => e.stopPropagation()}
        className="fixed z-50 w-[min(340px,calc(100vw-24px))] rounded-2xl border-[1.5px] border-[#262626] dark:border-[#38383A] bg-white dark:bg-[#1E1E20] p-4 text-[#1C1917] dark:text-[#F2F2F7] shadow-[4px_4px_0px_#262626] dark:shadow-[4px_4px_0px_#000000] animate-in fade-in zoom-in-95 duration-150 select-none"
      >
        {/* === HEADER ACTION BAR === */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA] dark:border-[#2C2C2E]">
          {/* Quick Complete Status */}
          {onToggleComplete && (
            <button
              type="button"
              onClick={() => onToggleComplete(task.id)}
              title={task.completed ? "Đánh dấu chưa hoàn thành" : "Đánh dấu đã hoàn thành"}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                task.completed
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800"
                  : "bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#78716C] dark:text-[#A1A1AA] border-transparent hover:border-[#262626] dark:hover:border-white hover:text-[#1C1917] dark:hover:text-white"
              } active:scale-95`}
            >
              <CheckCircle2 size={13} strokeWidth={2.4} />
              <span>{task.completed ? "Đã xong" : "Chưa xong"}</span>
            </button>
          )}

          {/* Right Action Icons (Edit, Delete, Close) */}
          <div className="flex items-center gap-1 ml-auto">
            {/* 1. NÚT SỬA -> MỞ SIDEBAR PHẢI VÀ ĐÓNG POPUP */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(task);
              }}
              title="Chỉnh sửa công việc (mở bảng bên phải)"
              aria-label="Chỉnh sửa"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-transparent hover:border-[#262626] dark:hover:border-white bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#1C1917] dark:text-[#F2F2F7] hover:bg-[#E5E5EA] dark:hover:bg-[#3A3A3C] shadow-xs active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer"
            >
              <Pencil size={13} strokeWidth={2.2} />
            </button>

            {/* 2. NÚT XÓA */}
            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Bạn có chắc muốn xóa công việc này?")) {
                    onDelete(task.id);
                    onClose();
                  }
                }}
                title="Xóa công việc"
                aria-label="Xóa"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-transparent hover:border-red-500 bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#78716C] dark:text-[#A1A1AA] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 shadow-xs active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer"
              >
                <Trash2 size={13} strokeWidth={2.2} />
              </button>
            )}

            {/* 3. NÚT ĐÓNG */}
            <button
              type="button"
              onClick={onClose}
              title="Đóng xem nhanh (Esc)"
              aria-label="Đóng"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-transparent hover:border-[#262626] dark:hover:border-white bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#78716C] dark:text-[#A1A1AA] hover:text-[#1C1917] dark:hover:text-white shadow-xs active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer ml-0.5"
            >
              <X size={14} strokeWidth={2.2} />
            </button>
          </div>
        </div>

        {/* === BODY CONTENT === */}
        <div className="pt-3 space-y-2.5">
          {/* Title & Type Badge */}
          <div className="flex items-start gap-2.5">
            <span
              className={`mt-1 h-3.5 w-3.5 shrink-0 rounded-[4px] border ${
                task.completed
                  ? "bg-[#A8A29E] border-[#78716C]"
                  : isEvent
                    ? "bg-[var(--accent-blue)] border-[var(--accent-blue)]"
                    : normType === "deadline"
                      ? "bg-rose-500 border-rose-600"
                      : "bg-[var(--accent-sky)] border-[var(--accent-sky)]"
              }`}
            />
            <div className="min-w-0 flex-1">
              <h3
                className={`text-sm font-bold leading-snug tracking-tight text-[#1C1917] dark:text-[#FAFAFA] ${
                  task.completed ? "line-through text-[#78716C] dark:text-[#A1A1AA]" : ""
                }`}
              >
                {task.title || "(Chưa có tiêu đề)"}
              </h3>
            </div>
          </div>

          {/* Date & Time Row */}
          <div className="flex items-center gap-2 text-xs text-[#57534E] dark:text-[#D4D4D8] pl-6">
            <Clock size={13} strokeWidth={2.2} className="shrink-0 text-[#78716C] dark:text-[#A1A1AA]" />
            <span className="font-medium truncate">{dateTimeSummary}</span>
          </div>

          {/* Notebook / Tag / Category Row */}
          {tagLabel && (
            <div className="flex items-center gap-2 text-xs text-[#57534E] dark:text-[#D4D4D8] pl-6">
              <Folder size={13} strokeWidth={2.2} className="shrink-0 text-[#78716C] dark:text-[#A1A1AA]" />
              <span className="font-medium truncate">{tagLabel}</span>
            </div>
          )}

          {/* Priority Row */}
          {task.priority && task.priority !== "low" && (
            <div className="flex items-center gap-2 text-xs text-[#57534E] dark:text-[#D4D4D8] pl-6">
              <AlertCircle size={13} strokeWidth={2.2} className="shrink-0 text-amber-500" />
              <span className="font-medium">
                {task.priority === "high" ? "🔴 Ưu tiên gấp & quan trọng" : "🟡 Ưu tiên vừa"}
              </span>
            </div>
          )}

          {/* Description snippet if present */}
          {task.description && (
            <div className="flex items-start gap-2 text-xs text-[#78716C] dark:text-[#A1A1AA] pl-6 pt-1 border-t border-[#F2F2F7] dark:border-[#2C2C2E]">
              <FileText size={13} strokeWidth={2.2} className="shrink-0 mt-0.5" />
              <p className="line-clamp-2 italic">{task.description}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
