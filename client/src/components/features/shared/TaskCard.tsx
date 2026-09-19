import React, { useEffect, useRef, useState } from "react";
import { TaskDto } from "../../../types";
import { HandDrawnCheckbox } from "../../ui/core/HandDrawnCheckbox";
import { formatShortDayMonth, getLocalTodayStr } from "../../../utils/date";
import {
  getTaskEffectiveDate,
  getTaskEffectiveTime,
  getTaskTemporalState,
  getTaskItemType,
  normalizeTaskTimeType,
} from "../../../utils/taskSemantics";
import {
  CornerDownRight,
  ChevronDown,
  ChevronUp,
  Layers,
  Plus,
  Calendar,
} from "lucide-react";

export interface TaskCardProps {
  task: TaskDto;
  index?: number;
  onToggle: (taskId: string) => void;
  onEdit: (task: TaskDto) => void;
  onDelete?: (taskId: string) => void;
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
  showEventTimeLabel?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggle,
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
  showEventTimeLabel = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const now = new Date();
  const todayStr = getLocalTodayStr(now);

  const temporal = getTaskTemporalState(task, now);
  const normTime = normalizeTaskTimeType(task);
  // Chỉ bật cách hiển thị Event riêng cho desktop; mobile giữ nguyên TaskCard hiện tại.
  const isEvent = showEventTimeLabel && getTaskItemType(task) === "event";
  const effectiveTime = getTaskEffectiveTime(task);
  const effectiveDate = getTaskEffectiveDate(task);

  const isDateRange = Boolean(
    task.startDate && task.endDate && task.startDate !== task.endDate,
  );

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

  // Nhãn thời gian giữ rõ ba ngữ nghĩa: event, lịch hẹn của task và hạn.
  const timeLabel = React.useMemo(() => {
    if (isEvent && showEventTimeLabel) {
      if (effectiveTime) {
        const range = task.endTime
          ? `${effectiveTime} – ${task.endTime}`
          : effectiveTime;
        return `Sự kiện · ${range}`;
      }
      return "Sự kiện · Cả ngày";
    }
    if (normTime === "scheduled" && effectiveTime) {
      const range = task.endTime
        ? `${effectiveTime} – ${task.endTime}`
        : effectiveTime;
      return `Lịch hẹn · ${range}`;
    }
    if (normTime === "deadline" && effectiveTime) {
      return `Hạn · ${effectiveTime}`;
    }
    if (effectiveTime) {
      return `Giờ · ${effectiveTime}`;
    }
    return null;
  }, [isEvent, normTime, effectiveTime, task.endTime, showEventTimeLabel]);

  const timeTone = showEventTimeLabel
    ? "bg-[var(--accent-blue)] text-white border-[#1D4ED8] dark:border-[#3B82F6]"
    : normTime === "scheduled"
      ? "bg-[#E0F2FE] text-[#0C4A6E] border-[#0284C7] dark:bg-[#0F172A] dark:text-[#38BDF8] dark:border-[#38BDF8]"
      : normTime === "deadline"
        ? "bg-[#FEE2E2] text-[#991B1B] border-[#DC2626] dark:bg-[#450A0A] dark:text-[#FECDD3] dark:border-[#EF4444]"
        : "bg-[var(--bg-surface-muted)] text-[var(--text-muted)] border-[var(--border-ink)]";

  const hasChildren = childCount > 0;
  const indentLevel = Math.max(0, hierarchyDepth ?? (isSubtask ? 1 : 0));
  const indentPx = indentLevel * 14;

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

  const isEffectivelyCompleted =
    !isEvent && (task.completed || isPendingComplete);

  const handleClickRow = () => {
    onClick?.(task);
  };

  const areActionsVisible = isHovered;

  return (
    <div
      style={{
        marginLeft: indentPx > 0 ? `${indentPx}px` : undefined,
        width: indentPx > 0 ? `calc(100% - ${indentPx}px)` : undefined,
      }}
      className={`task-card-shell relative overflow-hidden transition-all duration-200 rounded-none border-b border-[#E4E4E7] dark:border-[#2E2E34] ${
        indentLevel > 0
          ? "bg-black/[0.02] dark:bg-white/[0.02]"
          : "bg-white dark:bg-[#141417]"
      } ${
        isSelected
          ? "bg-black/[0.05] dark:bg-white/[0.08] border-b-[#09090B] dark:border-b-white"
          : isEffectivelyCompleted
            ? "opacity-50 hover:opacity-75"
            : "hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
      }`}
    >
      {/* 1. HÀNG CHÍNH (COMPACT SCAN-FRIENDLY TASK ROW) */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClickRow}
        className={`relative z-10 flex items-center justify-between gap-2.5 px-3 py-2 min-h-[42px] sm:min-h-[44px] cursor-pointer select-none transition-colors duration-150 ${
          isSelected ? "bg-black/[0.04] dark:bg-white/[0.06]" : "bg-transparent"
        }`}
      >
        {/* KHỐI TRÁI: Checkbox sát tiêu đề, thời gian nằm ngay bên dưới */}
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          {isSubtask && (
            <CornerDownRight
              size={12}
              className="text-[#71717A] dark:text-[#A1A1AA] shrink-0 mt-0.5"
              strokeWidth={2.4}
            />
          )}

          {/* Event là lịch tham chiếu, không có trạng thái hoàn thành như task. */}
          {!isEvent ? (
            <div
              className="shrink-0 flex items-center justify-center min-w-[22px] min-h-[22px]"
              onClick={(e) => e.stopPropagation()}
            >
              <HandDrawnCheckbox
                checked={isEffectivelyCompleted}
                onChange={handleToggleCheckbox}
              />
            </div>
          ) : (
            <div
              className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-[var(--accent-blue)] bg-[var(--bg-surface-muted)]"
              aria-label="Sự kiện"
              title="Sự kiện"
            />
          )}

          {/* Nội dung Task: Tiêu đề + Metadata dòng 2 */}
          <div className="min-w-0 flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className={`text-[13.5px] sm:text-sm font-semibold line-clamp-2 break-words leading-snug transition-all duration-200 ${
                  isEffectivelyCompleted
                    ? "text-[#71717A] dark:text-[#A1A1AA] line-through opacity-80"
                    : "text-[#09090B] dark:text-[#FFFFFF]"
                }`}
              >
                {task.title}
              </span>

              {/* Điểm ưu tiên gấp (chỉ hiện khi gấp ●) */}
              {task.priority === "high" && !isEffectivelyCompleted && (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[#DC2626] dark:bg-[#EF4444] shrink-0"
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
                  className="flex items-center gap-1 px-1.5 py-0.25 rounded-[3px] border border-[#18181B]/20 dark:border-[#2E2E34] bg-white dark:bg-[#1F1F23] hover:bg-black/5 dark:hover:bg-white/10 text-[10px] font-sans text-[#71717A] dark:text-[#A1A1AA] shrink-0"
                  title={isExpanded ? "Thu gọn việc con" : "Mở rộng việc con"}
                >
                  <Layers size={10} />
                  <span>
                    {completedChildCount}/{childCount}
                  </span>
                  {isExpanded ? (
                    <ChevronUp size={9} />
                  ) : (
                    <ChevronDown size={9} />
                  )}
                </button>
              )}
            </div>

            {(dateRangeLabel ||
              singleDateLabel ||
              timeLabel ||
              (!task.completed &&
                (temporal === "overdue" || temporal === "pastScheduled"))) && (
              <div className="flex flex-wrap items-center gap-1 mt-1 min-w-0">
                {dateRangeLabel && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-[3px] border px-1.5 py-0.25 font-sans text-[10px] sm:text-[10.5px] font-semibold leading-tight ${
                      showEventTimeLabel
                        ? "border-[var(--accent-blue)] bg-[var(--bg-surface-muted)] text-[var(--text-main)]"
                        : "border-[#262626] bg-[#FEF08A] text-[#1C1917] shadow-[0.5px_0.5px_0px_#262626]"
                    }`}
                  >
                    <Calendar size={10} className="shrink-0 text-[#1C1917]" />
                    <span>{dateRangeLabel}</span>
                  </span>
                )}
                {timeLabel && (
                  <span
                    className={`inline-flex items-center rounded-[3px] border px-1.5 py-0.25 font-sans text-[10px] sm:text-[10.5px] font-semibold leading-tight ${timeTone}`}
                  >
                    {timeLabel}
                  </span>
                )}
                {singleDateLabel && (
                  <span className="font-sans text-[10px] sm:text-[10.5px] text-[#78716C] dark:text-[#A1A1AA]">
                    {singleDateLabel}
                  </span>
                )}
                {!task.completed &&
                  (temporal === "overdue" || temporal === "pastScheduled") && (
                    <span
                      className={`shrink-0 rounded-[3px] border px-1.5 py-0.25 font-sans text-[10px] sm:text-[10.5px] font-semibold ${
                        showEventTimeLabel
                          ? "border-[var(--accent-blue)] bg-[var(--bg-surface-muted)] text-[var(--text-main)]"
                          : "border-[#DC2626] bg-[#FEE2E2] text-[#991B1B] dark:border-[#EF4444] dark:bg-[#450A0A] dark:text-[#FECDD3]"
                      }`}
                    >
                      {temporal === "pastScheduled" ? "Đã qua" : "Quá hạn"}
                    </span>
                  )}
              </div>
            )}

            {/* Dòng metadata phụ (Tag nếu có) */}
            {task.tag && (
              <div className="flex items-center gap-1 text-[10px] sm:text-[10.5px] font-normal text-[#78716C] dark:text-[#A1A1AA] truncate mt-0.5">
                <span className="font-sans text-[#57534E] dark:text-[#D4D4D8]">
                  #{task.tag}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* KHỐI PHẢI: Chỉ giữ quick action thêm việc con nếu có */}
        {onAddSubtask && !isSubtask && (
          <div className="relative flex items-start gap-2 shrink-0 min-w-0 pt-0.5">
            <div
              className={`hidden md:items-center md:gap-1 transition-opacity ${
                areActionsVisible
                  ? "md:flex md:opacity-100 md:pointer-events-auto"
                  : "md:absolute md:right-0 md:flex md:opacity-0 md:pointer-events-none"
              }`}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddSubtask(task);
                }}
                className="w-7 h-7 rounded flex items-center justify-center text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAF8F3] dark:hover:bg-[#2C2C2E]"
                title="Thêm việc con"
              >
                <Plus size={14} strokeWidth={2.4} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
