// ==========================================
// COMPONENT: PlannerTaskPreviewPopover (Google Calendar Style Quick View)
// ==========================================

import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Pencil,
  Trash2,
  X,
  Clock,
  Calendar,
  Bell,
  Folder,
  Tag,
  Check,
  AlertCircle,
  FileText,
} from "lucide-react";
import { TaskDto } from "../../../types";
import { formatShortDayMonth, parseDateString } from "../../../utils/date";
import {
  getTaskEffectiveDate,
  getTaskTag,
  getTaskItemType,
  normalizeTaskTimeType,
  getTaskCardVisualStyle,
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
const ANCHOR_GAP = 24;

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.max(minimum, Math.min(value, Math.max(minimum, maximum)));

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

  const maxLeft = vpW - POPOVER_WIDTH - VIEWPORT_GUTTER;
  const maxTop = vpH - ESTIMATED_HEIGHT - VIEWPORT_GUTTER;
  const rightSpace = vpW - VIEWPORT_GUTTER - anchorRect.right;
  const leftSpace = anchorRect.left - VIEWPORT_GUTTER;
  const canPlaceRight = rightSpace >= POPOVER_WIDTH + ANCHOR_GAP;
  const canPlaceLeft = leftSpace >= POPOVER_WIDTH + ANCHOR_GAP;

  let left: number;
  let top: number;

  // Prefer the roomier side of the selected card. The vertical midpoint keeps
  // the card and quick view visually related without covering each other.
  if (canPlaceRight || canPlaceLeft) {
    const placeRight = canPlaceRight && (!canPlaceLeft || rightSpace >= leftSpace);
    left = placeRight
      ? anchorRect.right + ANCHOR_GAP
      : anchorRect.left - POPOVER_WIDTH - ANCHOR_GAP;
    top = clamp(
      anchorRect.top + anchorRect.height / 2 - ESTIMATED_HEIGHT / 2,
      TOP_HEADER_GUTTER,
      maxTop,
    );
  } else {
    // Narrow viewports fall back to a vertical placement while preserving the
    // same breathing room from the selected task whenever either side fits.
    left = clamp(
      anchorRect.left + anchorRect.width / 2 - POPOVER_WIDTH / 2,
      VIEWPORT_GUTTER,
      maxLeft,
    );
    const canPlaceBelow = anchorRect.bottom + ANCHOR_GAP + ESTIMATED_HEIGHT <= vpH - VIEWPORT_GUTTER;
    const canPlaceAbove = anchorRect.top - ANCHOR_GAP - ESTIMATED_HEIGHT >= TOP_HEADER_GUTTER;
    top = canPlaceBelow
      ? anchorRect.bottom + ANCHOR_GAP
      : canPlaceAbove
        ? anchorRect.top - ANCHOR_GAP - ESTIMATED_HEIGHT
        : clamp(anchorRect.bottom + ANCHOR_GAP, TOP_HEADER_GUTTER, maxTop);
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
  const visualStyle = getTaskCardVisualStyle(task);

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

  const tagLabel = getTaskTag(task);

  return createPortal(
    <>
      {/* Transparent click-catcher keeps the calendar visible behind quick view. */}
      <div
        className="fixed inset-0 z-[1000]"
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
        className="fixed z-[1001] w-[min(340px,calc(100vw-24px))] rounded-3xl border border-[var(--border-ink-muted)] bg-[var(--bg-surface)] p-4 text-[var(--text-main)] shadow-2xl animate-in fade-in zoom-in-95 duration-150 select-none"
      >
        {/* === HEADER ACTION BAR === */}
        <div className="flex items-center justify-between pb-3">
          {/* Quick Complete Status */}
          {!isEvent && onToggleComplete && (
            <button
              type="button"
              role="checkbox"
              aria-checked={task.completed}
              onClick={() => onToggleComplete(task.id)}
              title={task.completed ? "Đánh dấu chưa hoàn thành" : "Đánh dấu đã hoàn thành"}
              className={`flex h-6 min-w-6 items-center justify-center gap-1 rounded-[5px] border px-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                task.completed
                  ? "border-[var(--accent-blue)] bg-[var(--accent-blue)] text-[var(--text-on-accent)]"
                  : "border-[#8E8E93] bg-transparent text-[#8E8E93] hover:border-[var(--accent-blue)]"
              }`}
            >
              {task.completed && <Check size={13} strokeWidth={3} />}
              <span>{task.completed ? "Đã xong" : "Chưa xong"}</span>
            </button>
          )}

          {/* Right Action Icons (Edit, Delete, Close) */}
          <div className="flex items-center gap-1 ml-auto">
            {/* 1. NÚT SỬA */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(task);
              }}
              title="Chỉnh sửa công việc (mở bảng bên phải)"
              aria-label="Chỉnh sửa"
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--bg-surface-muted)] text-[var(--text-main)] shadow-2xs transition-colors hover:bg-[var(--bg-interactive)] cursor-pointer"
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
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--bg-surface-muted)] text-[var(--text-muted)] shadow-2xs transition-colors hover:bg-[var(--danger-surface)] cursor-pointer"
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
              className="ml-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--bg-surface-muted)] text-[var(--text-muted)] shadow-2xs transition-colors hover:bg-[var(--bg-interactive)] cursor-pointer"
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
              style={{ backgroundColor: visualStyle.backgroundColor }}
              className={`mt-1 h-3 w-3 shrink-0 rounded-full ${task.completed ? "opacity-60" : ""}`}
            />
            <div className="min-w-0 flex-1">
              <h3
                className={`text-sm font-bold leading-snug tracking-tight text-[var(--text-strong)] ${
                  task.completed ? "line-through opacity-70" : ""
                }`}
              >
                {task.title || "(Chưa có tiêu đề)"}
              </h3>
            </div>
          </div>

          {/* Date & Time Row */}
          <div className="flex items-center gap-2 pl-5 text-xs text-[var(--text-muted)]">
            <Clock size={13} strokeWidth={2.2} className="shrink-0" />
            <span className="font-medium truncate">{dateTimeSummary}</span>
          </div>

          {/* Notebook / Tag / Category Row */}
          {tagLabel && (
            <div className="flex items-center gap-2 pl-5 text-xs text-[var(--text-muted)]">
              <Folder size={13} strokeWidth={2.2} className="shrink-0" />
              <span className="font-medium truncate">{tagLabel}</span>
            </div>
          )}

          {/* Priority Row */}
          {task.priority && task.priority !== "low" && (
            <div className="flex items-center gap-2 pl-5 text-xs text-[var(--text-muted)]">
              <AlertCircle size={13} strokeWidth={2.2} className="shrink-0 text-amber-500" />
              <span className="font-medium">
                {task.priority === "high" ? "🔴 Ưu tiên gấp & quan trọng" : "🟡 Ưu tiên vừa"}
              </span>
            </div>
          )}

          {/* Description snippet if present */}
          {task.description && (
            <div className="flex items-start gap-2 pl-5 pt-2 text-xs text-[var(--text-muted)]">
              <FileText size={13} strokeWidth={2.2} className="shrink-0 mt-0.5" />
              <p className="line-clamp-2 italic">{task.description}</p>
            </div>
          )}
        </div>
      </div>
    </>,
    document.body,
  );
};
