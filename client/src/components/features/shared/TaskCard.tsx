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
}) => {
  const [isHovered, setIsHovered] = useState(false);

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

  const isEffectivelyCompleted = task.completed || isPendingComplete;

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
      className={`task-card-shell relative overflow-hidden transition-all duration-200 rounded-none border-b border-[#E5E5EA] dark:border-[#2C2C2E] ${
        indentLevel > 0 ? "bg-[#FAF8F3]/50 dark:bg-white/[0.02]" : "bg-white dark:bg-[#1C1C1E]"
      } ${
        isSelected
          ? "bg-[#FAF8F3] dark:bg-[#2C2C2E] border-b-[#1C1917]"
          : isEffectivelyCompleted
          ? "opacity-50 hover:opacity-75"
          : "hover:bg-[#FAF8F3] dark:hover:bg-[#2C2C2E]"
      }`}
    >
      {/* 1. HÀNG CHÍNH (COMPACT SCAN-FRIENDLY TASK ROW) */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClickRow}
        className={`relative z-10 flex items-center justify-between gap-2.5 px-3 py-2 min-h-[42px] sm:min-h-[44px] cursor-pointer select-none transition-colors duration-150 ${
          isSelected
            ? "bg-[#FAF8F3] dark:bg-[#2C2C2E]"
            : "bg-transparent"
        }`}
      >
        {/* KHỐI TRÁI: Checkbox sát tiêu đề, thời gian nằm ngay bên dưới */}
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          {isSubtask && (
            <CornerDownRight size={12} className="text-[#78716C] dark:text-[#8E8E93] shrink-0 mt-0.5" strokeWidth={2.4} />
          )}

          {/* Checkbox Tròn (Min touch target) */}
          <div className="shrink-0 flex items-center justify-center min-w-[22px] min-h-[22px]" onClick={(e) => e.stopPropagation()}>
            <HandDrawnCheckbox
              checked={isEffectivelyCompleted}
              onChange={handleToggleCheckbox}
            />
          </div>

          {/* Nội dung Task: Tiêu đề + Metadata dòng 2 */}
          <div className="min-w-0 flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className={`text-[13.5px] sm:text-sm font-semibold line-clamp-2 break-words leading-snug transition-all duration-200 ${
                  isEffectivelyCompleted
                    ? "text-[#78716C] dark:text-[#8E8E93] line-through opacity-80"
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
                  className="flex items-center gap-1 px-1.5 py-0.25 rounded-[3px] border border-[#262626]/30 bg-[#FAF8F3] hover:bg-white text-[10px] font-sans text-[#78716C] shrink-0"
                  title={isExpanded ? "Thu gọn việc con" : "Mở rộng việc con"}
                >
                  <Layers size={10} />
                  <span>
                    {completedChildCount}/{childCount}
                  </span>
                  {isExpanded ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
                </button>
              )}
            </div>

            {(dateRangeLabel || singleDateLabel || timeLabel || (!task.completed && (temporal === "overdue" || temporal === "pastScheduled"))) && (
              <div className="flex flex-wrap items-center gap-1 mt-1 min-w-0">
                {dateRangeLabel && (
                  <span className="inline-flex items-center gap-1 rounded-[3px] border border-[#262626] bg-[#FEF08A] px-1.5 py-0.25 font-sans text-[10px] sm:text-[10.5px] font-semibold text-[#1C1917] leading-tight shadow-[0.5px_0.5px_0px_#262626]">
                    <Calendar size={10} className="shrink-0 text-[#1C1917]" />
                    <span>{dateRangeLabel}</span>
                  </span>
                )}
                {timeLabel && (
                  <span className={`inline-flex items-center rounded-[3px] border px-1.5 py-0.25 font-sans text-[10px] sm:text-[10.5px] font-semibold leading-tight ${timeTone}`}>
                    {timeLabel}
                  </span>
                )}
                {singleDateLabel && (
                  <span className="font-sans text-[10px] sm:text-[10.5px] text-[#78716C]">
                    {singleDateLabel}
                  </span>
                )}
                {!task.completed && (temporal === "overdue" || temporal === "pastScheduled") && (
                  <span className="shrink-0 rounded-[3px] border border-[#FDA4AF] bg-[#FECDD3] px-1.5 py-0.25 font-sans text-[10px] sm:text-[10.5px] font-semibold text-[#9F1239]">
                    {temporal === "pastScheduled" ? "Đã qua" : "Quá hạn"}
                  </span>
                )}
              </div>
            )}

            {/* Dòng metadata phụ (Tag nếu có) */}
            {task.tag && (
              <div className="flex items-center gap-1 text-[10px] sm:text-[10.5px] font-normal text-[#78716C] truncate mt-0.5">
                <span className="font-sans text-[#57534E]">#{task.tag}</span>
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
                className="w-7 h-7 rounded flex items-center justify-center text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAF8F3]"
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
