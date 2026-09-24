import React from "react";
import { ChevronRight } from "lucide-react";
import { TaskDto, TaskItemType } from "../../../types";
import { normalizeTaskTimeType } from "../../../utils/taskSemantics";
import { useResponsiveLayout } from "../../../hooks";
import { PlannerTimeline } from "./PlannerTimeline";

interface DayColumn {
  dateStr: string;
  dayName: string;
  dayNum: number;
  isToday: boolean;
}

interface PlannerWeekViewProps {
  weekDays: DayColumn[];
  selectedDateStr?: string;
  previewedTaskId?: string | null;
  getTasksForDate: (dateStr: string) => TaskDto[];
  onSelectDate: (dateStr: string) => void;
  onOpenDay?: (dateStr: string) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<TaskDto>) => void;
  onPreviewTask?: (task: TaskDto, anchorRect?: DOMRect | null) => void;
  calendarItemType?: TaskItemType;
  itemLabel?: string;
}

// === PHẦN 1: Danh sách 7 ngày cho mobile và tablet (Rõ ràng, dễ bấm, tỷ lệ cân đối) ===
const TouchWeekList: React.FC<PlannerWeekViewProps> = ({
  weekDays,
  getTasksForDate,
  onSelectDate,
  calendarItemType,
  itemLabel = calendarItemType === "event" ? "sự kiện" : "việc",
}) => (
  <div className="w-full space-y-2 select-none mobile-tab-enter pb-16">
    {weekDays.map((day) => {
      const dayTasks = getTasksForDate(day.dateStr);
      const scheduledCount = dayTasks.filter(
        (task) => normalizeTaskTimeType(task) === "scheduled",
      ).length;
      const deadlineCount = dayTasks.filter(
        (task) => normalizeTaskTimeType(task) === "deadline",
      ).length;
      const taskCount = dayTasks.length;

      return (
        <button
          key={day.dateStr}
          type="button"
          onClick={() => onSelectDate(day.dateStr)}
          aria-label={`${day.dayName}, ngày ${day.dayNum}, ${taskCount} ${itemLabel}`}
          className={`w-full px-4 py-3.5 sm:py-4 rounded-2xl border-none transition-all text-left flex items-center justify-between gap-2.5 shadow-xs active:scale-[0.99] cursor-pointer min-h-[56px] ${
            day.isToday
              ? "bg-[#007AFF]/10 dark:bg-[#0A84FF]/15"
              : "bg-white dark:bg-[#1C1C1E] hover:bg-black/[0.02] dark:hover:bg-white/[0.04]"
          }`}
        >
          {/* Cột 1: Thứ & Ngày */}
          <div className="flex items-center gap-1.5 min-w-[72px] sm:min-w-[84px] shrink-0">
              <span className={`text-[14.5px] sm:text-sm font-bold leading-tight ${
              day.isToday
                ? "text-[#007AFF] dark:text-[#0A84FF]"
                : "text-[#1C1C1E] dark:text-[#F2F2F7]"
            }`}>
              {day.dayName}, {day.dayNum}
            </span>
            {day.isToday && (
              <span className="px-2 py-0.5 rounded-full bg-[#007AFF] dark:bg-[#0A84FF] text-white text-[10px] font-bold leading-none shrink-0 shadow-2xs">
                Nay
              </span>
            )}
          </div>

          {/* Cột 2: Thông tin tóm tắt công việc */}
          <div className="flex-1 min-w-0 flex items-center gap-1.5 text-[13px] sm:text-xs text-[#8E8E93] dark:text-[#8E8E93] truncate">
            {dayTasks.length > 0 ? (
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-semibold text-[#1C1C1E] dark:text-[#F2F2F7]">{dayTasks.length} {itemLabel}</span>
                <span>·</span>
                {scheduledCount > 0 && (
                  <>
                    <span>·</span>
                    <span className="text-sky-600 dark:text-sky-400 font-medium">🕒 {scheduledCount} hẹn</span>
                  </>
                )}
                {deadlineCount > 0 && (
                  <>
                    <span>·</span>
                    <span className="text-rose-600 dark:text-rose-400 font-medium">{deadlineCount} hạn</span>
                  </>
                )}
              </div>
            ) : (
              <span className="text-[#8E8E93] dark:text-[#8E8E93] text-[13px] sm:text-xs">Trống</span>
            )}
          </div>

          {/* Cột 3: Điều hướng ngày */}
          <div className="flex items-center gap-2 shrink-0">
            <ChevronRight size={15} className="text-[#8E8E93] dark:text-[#AEAEC2]" strokeWidth={2.2} />
          </div>
        </button>
      );
    })}
  </div>
);

// === PHẦN 2: Bộ chọn 7 ngày và biểu đồ ngày theo giờ-phút cho desktop ===
export const PlannerWeekView: React.FC<PlannerWeekViewProps> = (props) => {
  const { isMobile, isTablet } = useResponsiveLayout();

  if (isMobile || isTablet) {
    return <TouchWeekList {...props} />;
  }

  return <PlannerTimeline {...props} />;
};
