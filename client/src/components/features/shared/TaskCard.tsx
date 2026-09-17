import React, { useEffect, useRef, useState } from "react";
import { TaskDto } from "../../../types";
import { HandDrawnCheckbox } from "../../ui/core/HandDrawnCheckbox";
import {
  formatShortDayMonth,
  getLocalTodayStr,
} from "../../../utils/date";
import {
  getTaskEffectiveDate,
  getTaskEffectiveTime,
  getTaskTemporalState,
  normalizeTaskTimeType,
} from "../../../utils/taskSemantics";
import {
  CornerDownRight,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Trash2,
  Layers,
  Plus,
  Calendar,
} from "lucide-react";

export interface TaskCardProps {
  task: TaskDto;
  index?: number;
  onToggle: (taskId: string) => void;
  onEdit: (task: TaskDto) => void;
  onDelete: (taskId: string) => void;
  onMoveTomorrow?: (taskId: string) => void;
  onAddSubtask?: (parentTask: TaskDto) => void;
  onClick?: (task: TaskDto) => void;
  variant?: "today" | "planner" | "overdue";
  hideDate?: boolean;
  baseDateStr?: string;
  moveButtonTitle?: string;
  // Hierarchy
  isSubtask?: boolean;
  hierarchyDepth?: number;
  childCount?: number;
  completedChildCount?: number;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  showParentBadge?: boolean;
  isOutOfFilterContext?: boolean;
  isSelected?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggle,
  onDelete,
  onMoveTomorrow,
  onAddSubtask,
  onClick,
  variant = "today",
  hideDate = false,
  isSubtask = false,
  hierarchyDepth,
  childCount = 0,
  completedChildCount = 0,
  isExpanded = true,
  onToggleExpand,
  isSelected = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileActionsOpen, setIsMobileActionsOpen] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwipeDragging, setIsSwipeDragging] = useState(false);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressStartPointRef = useRef<{ x: number; y: number } | null>(null);
  const swipeActiveRef = useRef(false);
  const swipeOffsetRef = useRef(0);
  const swipeStartOffsetRef = useRef(0);
  const longPressTriggeredRef = useRef(false);

  const now = new Date();
  const todayStr = getLocalTodayStr(now);

  const temporal = getTaskTemporalState(task, now);
  const normTime = normalizeTaskTimeType(task);
  const effectiveTime = getTaskEffectiveTime(task);
  const effectiveDate = getTaskEffectiveDate(task);

  const isDateRange = Boolean(task.startDate && task.endDate && task.startDate !== task.endDate);

  // Nhãn khoảng ngày: LUÔN hiển thị đối với công việc liên ngày để người dùng nắm rõ phạm vi
  const dateRangeLabel = isDateRange
    ? `${formatShortDayMonth(task.startDate!)} → ${formatShortDayMonth(task.endDate!)}`
    : null;

  // Nhãn ngày đơn: hiển thị khi không ẩn ngày và không phải liên ngày
  const singleDateLabel =
    !isDateRange && !hideDate && effectiveDate
      ? effectiveDate === todayStr
        ? "Hôm nay"
        : formatShortDayMonth(effectiveDate)
      : null;

  // Nhãn thời gian nằm dưới tiêu đề để phân biệt rõ lịch hẹn và hạn.
  const timeLabel = React.useMemo(() => {
    if (normTime === "scheduled" && effectiveTime) {
      const range = task.endTime ? `${effectiveTime} – ${task.endTime}` : effectiveTime;
      return `Lịch hẹn · ${range}`;
    }
    if (normTime === "deadline" && effectiveTime) {
      return `Hạn · ${effectiveTime}`;
    }
    if (effectiveTime) {
      return `Giờ · ${effectiveTime}`;
    }
    return null;
  }, [normTime, effectiveTime, task.endTime]);

  const timeTone =
    normTime === "scheduled"
      ? "bg-[#BAE6FD] text-[#1C1917] border-[#262626]"
      : normTime === "deadline"
      ? "bg-[#FECDD3] text-[#9F1239] border-[#FDA4AF]"
      : "bg-[#FAF8F3] text-[#78716C] border-[#D4CEBF]";

  const hasChildren = childCount > 0;
  const indentLevel = Math.max(0, hierarchyDepth ?? (isSubtask ? 1 : 0));
  const indentPx = indentLevel * 20;
  const supportsMobileSwipe =
    variant === "today" ||
    variant === "planner" ||
    variant === "overdue";
  const mobileActionWidth = onMoveTomorrow && !task.completed ? 104 : 56;

  const setSwipePosition = (offset: number) => {
    swipeOffsetRef.current = offset;
    setSwipeOffset(offset);
  };

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Trạng thái chờ hoàn thành có hiệu ứng tích và trượt mượt mà
  const [isPendingComplete, setIsPendingComplete] = useState(false);
  const pendingTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setIsPendingComplete(false);
    return () => {
      if (pendingTimerRef.current !== null) {
        window.clearTimeout(pendingTimerRef.current);
      }
    };
  }, [task.completed]);

  const handleToggleCheckbox = () => {
    if (task.completed) {
      // Khi bỏ tích thì hoàn tác ngay lập tức
      setIsPendingComplete(false);
      onToggle(task.id);
    } else {
      // Khi nhấn tích hoàn thành: Hiện dấu tích ngay lập tức, gạch ngang tiêu đề, rồi trượt xuống sau 380ms
      if (isPendingComplete) {
        if (pendingTimerRef.current !== null) {
          window.clearTimeout(pendingTimerRef.current);
        }
        setIsPendingComplete(false);
        return;
      }
      setIsPendingComplete(true);
      pendingTimerRef.current = window.setTimeout(() => {
        onToggle(task.id);
      }, 380);
    }
  };

  const isEffectivelyCompleted = task.completed || isPendingComplete;

  useEffect(() => clearLongPressTimer, []);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "touch") return;

    const target = event.target as HTMLElement;
    if (target.closest("button, input, a, [role='button']")) return;

    clearLongPressTimer();
    longPressTriggeredRef.current = false;
    swipeActiveRef.current = false;
    swipeStartOffsetRef.current = swipeOffsetRef.current;
    longPressStartPointRef.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      setIsMobileActionsOpen(true);
      setSwipePosition(-mobileActionWidth);
      longPressTimerRef.current = null;
    }, 550);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "touch" || !longPressStartPointRef.current) return;

    const dx = event.clientX - longPressStartPointRef.current.x;
    const dy = event.clientY - longPressStartPointRef.current.y;
    const isHorizontalSwipe = supportsMobileSwipe && Math.abs(dx) > Math.abs(dy);

    if (isHorizontalSwipe && Math.abs(dx) > 8) {
      clearLongPressTimer();
      swipeActiveRef.current = true;
      setIsSwipeDragging(true);
      // Keep the row attached to the finger while actions stay behind it.
      setSwipePosition(
        Math.max(-mobileActionWidth, Math.min(0, swipeStartOffsetRef.current + dx)),
      );
      if (event.cancelable) event.preventDefault();
      return;
    }

    if (Math.hypot(dx, dy) > 8) {
      clearLongPressTimer();
      longPressStartPointRef.current = null;
      swipeActiveRef.current = false;
      setIsSwipeDragging(false);
      setSwipePosition(0);
      if (isMobileActionsOpen) setIsMobileActionsOpen(false);
    }
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") {
      clearLongPressTimer();
      longPressStartPointRef.current = null;
      if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      if (swipeActiveRef.current) {
        const shouldRevealActions = swipeOffsetRef.current <= -(mobileActionWidth / 2);
        setSwipePosition(shouldRevealActions ? -mobileActionWidth : 0);
        swipeActiveRef.current = false;
        setIsSwipeDragging(false);
        longPressTriggeredRef.current = shouldRevealActions;
        setIsMobileActionsOpen(shouldRevealActions);
      }
    }
  };

  const closeMobileActions = () => {
    clearLongPressTimer();
    longPressTriggeredRef.current = false;
    setIsMobileActionsOpen(false);
    setIsSwipeDragging(false);
    setSwipePosition(0);
  };

  const handleClickRow = () => {
    // A long press opens actions and must not also open the task detail.
    if (longPressTriggeredRef.current) {
      closeMobileActions();
      return;
    }
    onClick?.(task);
  };

  const areActionsVisible = isHovered;

  return (
    <div
      style={{
        marginLeft: indentPx > 0 ? `${indentPx}px` : undefined,
        width: indentPx > 0 ? `calc(100% - ${indentPx}px)` : undefined,
      }}
      className={`task-card-shell relative overflow-hidden transition-all duration-300 rounded-none border-b border-[#D4CEBF] dark:border-transparent ${
        indentLevel > 0 ? "bg-[#FAF8F3]/70 dark:bg-[#1C1C1E]/70" : "bg-white dark:bg-[#1C1C1E]"
      } ${
        isSelected
          ? "bg-[#FAF8F3] dark:bg-[#2C2C2E] border-b-[#1C1917] dark:border-b-transparent"
          : isEffectivelyCompleted
          ? "border-[#D4CEBF] dark:border-transparent opacity-60 bg-[#FAF8F3]/50 dark:bg-[#121214]/50 shadow-none translate-y-[0.5px]"
          : "border-[#D4CEBF] dark:border-transparent hover:bg-[#FAF8F3] dark:hover:bg-[#2C2C2E]"
      }`}
    >
      {supportsMobileSwipe && (
        <div
          className={`absolute inset-y-0 right-0 z-0 flex items-center justify-end gap-1 bg-[#F3EFE6] dark:bg-[#2C2C2E] px-2 lg:hidden ${
            swipeOffset === 0 ? "pointer-events-none" : "pointer-events-auto"
          }`}
          style={{ width: mobileActionWidth }}
          aria-hidden={swipeOffset === 0}
        >
          {onMoveTomorrow && !isEffectivelyCompleted && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                closeMobileActions();
                onMoveTomorrow(task.id);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-[4px] border-[1.5px] border-[#262626] dark:border-black bg-white dark:bg-[#1C1C1E] text-[#1C1917] dark:text-[#F2F2F7] shadow-[1px_1px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
              title="Dời sang ngày mai"
              aria-label="Dời sang ngày mai"
            >
              <ArrowRight size={15} strokeWidth={2.2} />
            </button>
          )}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              closeMobileActions();
              onDelete(task.id);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-[4px] border-[1.5px] border-[#BE123C] bg-[#FFE4E6] dark:bg-rose-950/40 text-[#BE123C] dark:text-rose-400 shadow-[1px_1px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
            title="Xóa công việc"
            aria-label="Xóa công việc"
          >
            <Trash2 size={15} strokeWidth={2.2} />
          </button>
        </div>
      )}
      {/* 1. HÀNG CHÍNH (COMPACT SCAN-FRIENDLY TASK ROW) */}
      <div
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") setIsHovered(true);
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse") setIsHovered(false);
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onContextMenu={(event) => {
          if (isMobileActionsOpen) event.preventDefault();
        }}
        onClick={handleClickRow}
        style={{
          touchAction: "pan-y",
          transform: swipeOffset ? `translateX(${swipeOffset}px)` : undefined,
          transition: isSwipeDragging ? "none" : "transform 180ms ease-out",
        }}
        className={`relative z-10 flex items-center justify-between gap-3 px-3.5 py-3 min-h-[54px] cursor-pointer select-none transition-colors duration-200 ${
          isSelected
            ? "bg-[#FAF8F3] dark:bg-[#2C2C2E]"
            : isEffectivelyCompleted
            ? "bg-[#FAF8F3]/60 dark:bg-[#1C1C1E]/60"
            : "bg-white dark:bg-[#1C1C1E]"
        }`}
      >
        {/* KHỐI TRÁI: Checkbox sát tiêu đề, thời gian nằm ngay bên dưới */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {isSubtask && (
            <CornerDownRight size={13} className="text-[#78716C] dark:text-[#8E8E93] shrink-0" strokeWidth={2.4} />
          )}

          {/* Checkbox Tròn (Min touch target) */}
          <div className="shrink-0 flex items-center justify-center min-w-[26px] min-h-[26px]" onClick={(e) => e.stopPropagation()}>
            <HandDrawnCheckbox
              checked={isEffectivelyCompleted}
              onChange={handleToggleCheckbox}
            />
          </div>

          {/* Nội dung Task: Tiêu đề + Metadata dòng 2 */}
          <div className="min-w-0 flex-1 flex flex-col justify-center py-0.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className={`text-[14.5px] sm:text-base font-semibold line-clamp-2 break-words leading-snug transition-all duration-300 ${
                  isEffectivelyCompleted
                    ? "text-[#78716C] dark:text-[#8E8E93] line-through opacity-70"
                    : "text-[#1C1917] dark:text-[#F2F2F7]"
                }`}
              >
                {task.title}
              </span>

              {/* Điểm ưu tiên gấp (chỉ hiện khi gấp ●) */}
              {task.priority === "high" && !isEffectivelyCompleted && (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[#1C1917] dark:bg-[#FAFAFA] shrink-0"
                  title="Ưu tiên gấp"
                />
              )}

              {/* Nút bấm mở/gập việc con */}
              {hasChildren && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleExpand?.();
                  }}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] border border-[#262626]/30 bg-[#FAF8F3] hover:bg-white text-[11px] font-sans text-[#78716C] shrink-0"
                  title={isExpanded ? "Thu gọn việc con" : "Mở rộng việc con"}
                >
                  <Layers size={11} />
                  <span>
                    {completedChildCount}/{childCount}
                  </span>
                  {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                </button>
              )}
            </div>

            {(dateRangeLabel || singleDateLabel || timeLabel || (!task.completed && (temporal === "overdue" || temporal === "pastScheduled"))) && (
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5 min-w-0">
                {dateRangeLabel && (
                  <span className="inline-flex items-center gap-1 rounded-[4px] border border-[#262626] bg-[#FEF08A] px-1.5 py-0.5 font-sans text-[11px] font-semibold text-[#1C1917] leading-tight shadow-[1px_1px_0px_#262626]">
                    <Calendar size={11} className="shrink-0 text-[#1C1917]" />
                    <span>{dateRangeLabel}</span>
                  </span>
                )}
                {timeLabel && (
                  <span className={`inline-flex items-center rounded-[4px] border px-1.5 py-0.5 font-sans text-[11px] font-semibold leading-tight ${timeTone}`}>
                    {timeLabel}
                  </span>
                )}
                {singleDateLabel && (
                  <span className="font-sans text-[11px] text-[#78716C]">
                    {singleDateLabel}
                  </span>
                )}
                {!task.completed && (temporal === "overdue" || temporal === "pastScheduled") && (
                  <span className="shrink-0 rounded-[4px] border border-[#FDA4AF] bg-[#FECDD3] px-1.5 py-0.5 font-sans text-[11px] font-semibold text-[#9F1239]">
                    {temporal === "pastScheduled" ? "Đã qua" : "Quá hạn"}
                  </span>
                )}
              </div>
            )}

            {/* Dòng metadata phụ (Tag nếu có) */}
            {task.tag && (
              <div className="flex items-center gap-1.5 text-[11px] font-normal text-[#78716C] truncate mt-1">
                <span className="font-sans text-[#57534E]">#{task.tag}</span>
              </div>
            )}
          </div>
        </div>

        {/* KHỐI PHẢI: Chỉ giữ quick actions, không chiếm chỗ của thời gian */}
        <div className="relative flex items-start gap-2 shrink-0 min-w-0 pt-0.5">

          {/* Desktop: hover. Touch: long press. Hidden actions do not reserve width. */}
          <div
            className={`hidden md:items-center md:gap-1 transition-opacity ${
              areActionsVisible
                ? "md:flex md:opacity-100 md:pointer-events-auto"
                : "md:absolute md:right-0 md:flex md:opacity-0 md:pointer-events-none"
            }`}
          >
            {onAddSubtask && !isSubtask && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  closeMobileActions();
                  onAddSubtask(task);
                }}
                className="w-7 h-7 rounded flex items-center justify-center text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAF8F3]"
                title="Thêm việc con"
              >
                <Plus size={14} strokeWidth={2.4} />
              </button>
            )}

            {onMoveTomorrow && !task.completed && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  closeMobileActions();
                  onMoveTomorrow(task.id);
                }}
                className="w-7 h-7 rounded flex items-center justify-center text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAF8F3]"
                title="Dời sang ngày mai"
              >
                <ArrowRight size={14} strokeWidth={2.2} />
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                closeMobileActions();
                onDelete(task.id);
              }}
              className="w-7 h-7 rounded flex items-center justify-center text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAF8F3]"
              title="Xóa công việc"
            >
              <Trash2 size={14} strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
