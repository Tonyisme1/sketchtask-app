import React, { useState, useRef, useEffect } from "react";
import { TaskDto } from "../../../types";
import { useAppStore } from "../../../stores/appStore";
import { HandDrawnCheckbox } from "../../ui/core/HandDrawnCheckbox";
import { DynamicIcon } from "../../ui/core/DynamicIcon";
import { getCardTilt } from "../../../utils/tilt";
import { getTagStyle } from "../../../utils/tagColors";
import { getLocalTodayStr, getNextDayStr, formatShortDayMonth } from "../../../utils/date";
import {
  getTaskEffectiveDate,
  getTaskEffectiveTime,
  getTaskTemporalState,
  normalizeTaskTimeType,
} from "../../../utils/taskSemantics";
import {
  Clock,
  Hourglass,
  AlertCircle,
  ArrowRight,
  Edit3,
  Trash2,
  CalendarDays,
  MoreVertical,
  Package,
  Layers,
  Eye,
  ChevronDown,
  ChevronUp,
  CornerDownRight,
  Plus,
  Check,
} from "lucide-react";

// ==========================================
// COMPONENT: TaskCard (Thẻ Công Việc Tinh Gọn - Chuẩn Task 35 Phân Cấp Cha/Con)
// Visual Hierarchy:
// 1. Checkbox (Trái)
// 2. Tiêu đề task (Ưu tiên chiều rộng, KHÔNG gạch ngang khi xong)
// 3. Một chip thời gian chính duy nhất
// 4. Metadata: Sổ tay, Tag, Ưu tiên, Phân cấp Cha/Con (Số lượng con / Con của ...)
// 5. Hành động (Desktop & Mobile)
// ==========================================

export interface TaskCardProps {
  task: TaskDto;
  index?: number;
  onToggle: (taskId: string) => void;
  onEdit: (task: TaskDto) => void;
  onDelete: (taskId: string) => void;
  onMoveTomorrow?: (taskId: string) => void;
  onAddSubtask?: (parentTask: TaskDto) => void;
  onClick?: (task: TaskDto) => void;
  variant?: "today" | "planner" | "notebook" | "overdue";
  hideDate?: boolean;
  hideNotebookBadge?: boolean;
  baseDateStr?: string;
  moveButtonTitle?: string;
  // Hierarchy Props (Task 34 & Task 35)
  isSubtask?: boolean;
  childCount?: number;
  completedChildCount?: number;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  showParentBadge?: boolean;
  isOutOfFilterContext?: boolean; // Task cha nằm ngoài bộ lọc hiển thị để làm context cho task con
  isSelected?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  index = 0,
  onToggle,
  onEdit,
  onDelete,
  onMoveTomorrow,
  onAddSubtask,
  onClick,
  variant = "today",
  hideDate = false,
  hideNotebookBadge = false,
  baseDateStr,
  moveButtonTitle,
  isSubtask = false,
  childCount = 0,
  completedChildCount = 0,
  isExpanded = true,
  onToggleExpand,
  showParentBadge = false,
  isOutOfFilterContext = false,
  isSelected = false,
}) => {
  const { notebooks, tasks: allTasks, isTiltEnabled } = useAppStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const todayStr = getLocalTodayStr(now);

  const normalizedTimeType = normalizeTaskTimeType(task);
  const isScheduled = normalizedTimeType === "scheduled";
  const isDeadline = normalizedTimeType === "deadline";

  // Ngày thực tế của task
  const effectiveDate = getTaskEffectiveDate(task);
  const temporalState = getTaskTemporalState(task, now);
  const isOverdue = temporalState === "overdue";
  const isPastScheduled = temporalState === "pastScheduled";
  const isPastNoTime = Boolean(
    temporalState === "dateOnly" && effectiveDate && effectiveDate < todayStr,
  );

  const assignedNotebook = notebooks.find((n) => n.id === task.notebookId);
  const cardTilt = isTiltEnabled ? getCardTilt(index) : "rotate-0";

  // Tìm task cha nếu cần hiển thị parent badge
  const parentTask = task.parentTaskId
    ? allTasks.find((t) => t.id === task.parentTaskId)
    : null;

  // Đóng menu trên mobile khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isMenuOpen]);

  // Giờ hiển thị chính
  const primaryTime = getTaskEffectiveTime(task);
  const timeStr = isScheduled
    ? task.endTime && primaryTime
      ? `${primaryTime} - ${task.endTime}`
      : primaryTime || ""
    : primaryTime || "";

  // Tính toán nhãn/tooltip dời ngày
  const targetBaseDate = baseDateStr || effectiveDate || todayStr;
  const isPastTask = targetBaseDate < todayStr;
  const diffDaysFromToday = Math.floor((new Date(todayStr).getTime() - new Date(targetBaseDate).getTime()) / (1000 * 60 * 60 * 24));

  const moveTitle =
    moveButtonTitle ||
    (isPastTask
      ? diffDaysFromToday === 1
        ? "Dời sang ngày mai"
        : "Chọn ngày dời"
      : "Dời sang ngày mai");

  return (
    <div
      data-task-card="true"
      data-task-id={task.id}
      onClick={() => onClick?.(task)}
      className={`group relative p-2.5 sm:p-3 border-[1.5px] rounded-[6px] transition-all cursor-pointer select-none ${cardTilt} ${
        isMenuOpen ? "z-50" : isSelected ? "z-20" : "z-0"
      } ${
        isSelected
          ? "bg-[#FFFDEB] border-[#262626] ring-2 ring-[#262626] shadow-[3.5px_3.5px_0px_#262626] -translate-y-[1px]"
          : task.completed
          ? "bg-[#FBF9F4]/80 opacity-80 border-[#262626] shadow-[2px_2px_0px_#262626] hover:shadow-[3px_3px_0px_#262626] hover:-translate-y-[0.5px]"
          : isOutOfFilterContext
          ? "bg-[#FAF7EE] border-[#262626] border-dashed shadow-[2px_2px_0px_#262626] hover:shadow-[3px_3px_0px_#262626] hover:-translate-y-[0.5px]"
          : isOverdue
          ? "bg-rose-50/50 border-rose-400 shadow-[2px_2px_0px_#262626] hover:shadow-[3px_3px_0px_#262626] hover:-translate-y-[0.5px]"
          : isPastScheduled
          ? "bg-[#F5F2EA]/70 border-[#D4CEBF] shadow-[2px_2px_0px_#262626] hover:shadow-[3px_3px_0px_#262626] hover:-translate-y-[0.5px]"
          : isSubtask
          ? "bg-[#FCFBF9] border-[#262626] shadow-[2px_2px_0px_#262626] hover:shadow-[3px_3px_0px_#262626] hover:-translate-y-[0.5px]"
          : "bg-white border-[#262626] shadow-[2px_2px_0px_#262626] hover:shadow-[3px_3px_0px_#262626] hover:-translate-y-[0.5px]"
      }`}
    >
      <div className="flex items-start gap-2 sm:gap-2.5">
        {/* 1. Checkbox Hoàn Thành */}
        <div
          className="pt-0.5 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <HandDrawnCheckbox
            checked={task.completed}
            onChange={() => onToggle(task.id)}
          />
        </div>

        {/* 2. Phần Thân Task (Tiêu đề + Badges Tinh Gọn) */}
        <div className="flex-1 min-w-0">
          {/* Tiêu đề Task rõ ràng, không bị cồng kềnh */}
          <h4
            className={`text-xs sm:text-sm font-semibold text-[#1C1917] leading-snug break-words transition-colors ${
              task.completed ? "text-[#78716C]" : ""
            }`}
          >
            <span>{task.title}</span>
          </h4>

          {/* Dải Badges Metadata (Tối đa 1 Chip Thời Gian Canonical + Tối đa 2 Metadata Phụ) */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap mt-1.5">
            {/* A. BADGE TASK CHA NGOÀI BỘ LỌC (Parent Context) */}
            {isOutOfFilterContext && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] border border-[#78716C] bg-[#F5F2EA] text-[#57534E] text-[10px] font-bold h-[20px] whitespace-nowrap">
                <Layers size={10} className="text-[#78716C]" />
                <span>Việc cha</span>
              </span>
            )}

            {/* B. NHÃN PHÂN CẤP SUBTASK (Nếu là Task Con được lồng) */}
            {isSubtask && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] border border-[#262626] bg-[#F5F2EA] text-[#1C1917] text-[10px] font-bold h-[20px] whitespace-nowrap">
                <CornerDownRight size={10} strokeWidth={2.4} />
                <span>Việc con</span>
              </span>
            )}

            {/* C. NHÃN PARENT KHI TASK CON XUẤT HIỆN RIÊNG LẺ */}
            {(showParentBadge || (!isSubtask && task.parentTaskId && !parentTask)) && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] border border-[#D4CEBF] bg-[#FBF9F4] text-[#78716C] text-[10px] font-semibold h-[20px] max-w-[130px] truncate whitespace-nowrap">
                <Layers size={10} className="shrink-0" />
                <span className="truncate">
                  {parentTask ? `Thuộc: ${parentTask.title}` : "Việc con"}
                </span>
              </span>
            )}

            {/* D. DUY NHẤT 1 CHIP THỜI GIAN CANONICAL */}
            {task.completed ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] border border-[#262626] bg-[#BBF7D0] text-emerald-950 text-[10px] font-bold h-[20px] whitespace-nowrap shadow-[0.5px_0.5px_0px_#262626]">
                <span className="inline-flex items-center gap-1">
                  <Check size={10} strokeWidth={3} />
                  Đã xong
                </span>
              </span>
            ) : isOverdue ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] border border-[#262626] bg-[#FECDD3] text-rose-950 text-[10px] font-bold h-[20px] whitespace-nowrap shadow-[0.5px_0.5px_0px_#262626]">
                <AlertCircle size={10} strokeWidth={2.5} />
                <span>
                  {effectiveDate === todayStr
                    ? `Quá giờ${timeStr ? ` (${timeStr})` : ""}`
                    : `Quá hạn${effectiveDate ? ` (${effectiveDate.split("-")[2]}/${effectiveDate.split("-")[1]})` : ""}`}
                </span>
              </span>
            ) : isPastScheduled ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] border border-[#262626] bg-[#FED7AA] text-[#7C2D12] text-[10px] font-bold h-[20px] whitespace-nowrap shadow-[0.5px_0.5px_0px_#262626]">
                <Clock size={10} strokeWidth={2.4} className="text-[#9A3412]" />
                <span>{timeStr ? `${timeStr} (Đã qua)` : "Đã qua"}</span>
              </span>
            ) : isScheduled && timeStr ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] border border-[#262626] bg-[#FEF08A] text-amber-950 font-mono text-[10px] font-bold h-[20px] whitespace-nowrap shadow-[0.5px_0.5px_0px_#262626]">
                <Clock size={10} strokeWidth={2.4} className="text-amber-900" />
                <span>{timeStr}</span>
              </span>
            ) : isDeadline ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] border border-[#262626] bg-[#FECDD3] text-rose-950 font-mono text-[10px] font-bold h-[20px] whitespace-nowrap shadow-[0.5px_0.5px_0px_#262626]">
                <Hourglass size={10} strokeWidth={2.4} className="text-rose-900" />
                <span>
                  {timeStr
                    ? `Hạn ${timeStr}`
                    : effectiveDate
                    ? `Hạn ${effectiveDate.split("-")[2]}/${effectiveDate.split("-")[1]}`
                    : "Hạn chót"}
                </span>
              </span>
            ) : isPastNoTime ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] border border-[#D4CEBF] bg-[#F3EFE6] text-[#78716C] text-[10px] font-bold h-[20px] whitespace-nowrap">
                <CalendarDays size={10} strokeWidth={2.4} />
                <span>Ngày đã qua</span>
              </span>
            ) : !effectiveDate ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] border border-dashed border-[#D4CEBF] bg-[#F5F2EA] text-[#78716C] text-[10px] font-bold h-[20px] whitespace-nowrap">
                <Package size={10} />
                <span>Chưa đặt ngày</span>
              </span>
            ) : !hideDate && variant !== "today" ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] border border-[#D4CEBF] bg-[#FBF9F4] text-[#78716C] text-[10px] font-mono font-medium h-[20px] whitespace-nowrap">
                <CalendarDays size={10} strokeWidth={2.2} />
                <span>
                  {effectiveDate === todayStr
                    ? "Hôm nay"
                    : `${effectiveDate.split("-")[2]}/${effectiveDate.split("-")[1]}`}
                </span>
              </span>
            ) : null}

            {/* F. BADGE SỐ LƯỢNG TASK CON (Cho Task Cha) */}
            {childCount > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand?.();
                }}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[3px] border border-[#262626] text-[10px] font-bold h-[20px] transition-all shadow-[1px_1px_0px_#262626] active:translate-y-[0.5px] ${
                  isOutOfFilterContext
                    ? "bg-[#EFEAE0] hover:bg-[#E5DFD3] text-[#1C1917]"
                    : "bg-[#FEF08A] hover:bg-[#FDE047] text-[#1C1917]"
                }`}
                title={isExpanded ? "Thu gọn việc con" : "Mở rộng việc con"}
              >
                <Layers size={10} strokeWidth={2.4} />
                <span>
                  {childCount} việc con ({completedChildCount}/{childCount})
                </span>
                {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              </button>
            )}

            {/* G. BADGE ƯU TIÊN (Chỉ hiển thị khi Gấp hoặc Thấp) */}
            {task.priority === "high" && !task.completed && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] border border-rose-300 bg-rose-50 text-rose-800 text-[10px] font-bold h-[20px] whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                <span>Gấp</span>
              </span>
            )}
            {task.priority === "low" && !task.completed && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] border border-emerald-300 bg-emerald-50 text-emerald-800 text-[10px] font-bold h-[20px] whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                <span>Thấp</span>
              </span>
            )}

            {/* H. BADGE NHÃN / TAG */}
            {task.tag && (
              <span
                className={`${getTagStyle(task.tag).bg} ${getTagStyle(task.tag).text} px-1.5 py-0.5 rounded-[3px] border ${getTagStyle(task.tag).border} text-[10px] font-bold h-[20px] inline-flex items-center max-w-[100px] truncate whitespace-nowrap`}
              >
                <span className="truncate">#{task.tag}</span>
              </span>
            )}

            {/* I. BADGE SỔ TAY */}
            {assignedNotebook && !hideNotebookBadge && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] border border-[#262626] text-[10px] font-bold h-[20px] max-w-[110px] truncate whitespace-nowrap"
                style={{ backgroundColor: assignedNotebook.color || "#FEF08A" }}
              >
                <DynamicIcon name={assignedNotebook.icon} size={10} strokeWidth={2.2} />
                <span className="truncate">{assignedNotebook.name}</span>
              </span>
            )}
          </div>
        </div>

        {/* 3. Cụm Action: Nút + Thêm Việc Con & Nút 3 Chấm */}
        <div
          ref={menuRef}
          className="relative shrink-0 ml-1 flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Nút + 1 chạm để thêm việc con (Gắn với task hiện tại) */}
          {onAddSubtask && !task.completed && (
            <button
              type="button"
              onClick={() => onAddSubtask(task)}
              title="Thêm việc con"
              aria-label="Thêm việc con"
              className="w-7 h-7 rounded-[4px] bg-[#FCFBF9] hover:bg-[#BBF7D0] border border-[#262626] flex items-center justify-center text-[#1C1917] active:translate-y-[0.5px] transition-all shadow-[1px_1px_0px_#262626]"
            >
              <Plus size={13} strokeWidth={2.6} />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            title="Tùy chọn"
            className="w-7 h-7 rounded-[4px] bg-[#FCFBF9] hover:bg-[#F3EFE6] border border-[#262626] flex items-center justify-center text-[#78716C] hover:text-[#1C1917] active:translate-y-[0.5px] transition-all shadow-[1px_1px_0px_#262626]"
            aria-label="Tùy chọn"
          >
            <MoreVertical size={14} strokeWidth={2.4} />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-40 bg-white border-[1.5px] border-[#262626] rounded-[6px] shadow-[3.5px_3.5px_0px_#262626] z-50 p-1 space-y-0.5 animate-in fade-in zoom-in-95 text-xs">
              {/* 1. Thêm việc con */}
              {onAddSubtask && !task.completed && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onAddSubtask(task);
                  }}
                  className="w-full px-2.5 py-1.5 text-left font-bold text-[#1C1917] hover:bg-[#BBF7D0] rounded-[4px] flex items-center gap-2 transition-colors"
                >
                  <Plus size={13} strokeWidth={2.4} />
                  <span>Thêm việc con</span>
                </button>
              )}

              {/* 2. Xem chi tiết */}
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onClick?.(task);
                }}
                className="w-full px-2.5 py-1.5 text-left font-bold text-[#1C1917] hover:bg-[#BAE6FD] rounded-[4px] flex items-center gap-2 transition-colors"
              >
                <Eye size={13} strokeWidth={2.2} />
                <span>Chi tiết</span>
              </button>

              {/* 3. Chỉnh sửa */}
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onEdit(task);
                }}
                className="w-full px-2.5 py-1.5 text-left font-bold text-[#1C1917] hover:bg-[#FEF08A] rounded-[4px] flex items-center gap-2 transition-colors"
              >
                <Edit3 size={13} strokeWidth={2.2} />
                <span>Sửa</span>
              </button>

              {onMoveTomorrow && !task.completed && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onMoveTomorrow(task.id);
                  }}
                  className="w-full px-2.5 py-1.5 text-left font-bold text-[#1C1917] hover:bg-[#BAE6FD] rounded-[4px] flex items-center gap-2 transition-colors"
                >
                  <ArrowRight size={13} strokeWidth={2.4} />
                  <span>{moveTitle}</span>
                </button>
              )}

              <div className="border-t border-[#262626]/20 my-0.5" />

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onDelete(task.id);
                }}
                className="w-full px-2.5 py-1.5 text-left font-bold text-rose-700 hover:bg-rose-50 rounded-[4px] flex items-center gap-2 transition-colors"
              >
                <Trash2 size={13} strokeWidth={2.2} />
                <span>Xóa</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
