import React from "react";
import { ChevronRight } from "lucide-react";
import { TaskDto, TaskItemType } from "../../../types";
import { normalizeTaskTimeType } from "../../../utils/taskSemantics";
import { useResponsiveLayout } from "../../../hooks";
import { PlannerTimeline } from "./PlannerTimeline";
import { getTaskProgress } from "../../../utils/taskHierarchy";

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
}

// === PHẦN 1: Danh sách 7 ngày cho mobile và tablet (Rõ ràng, dễ bấm, tỷ lệ cân đối) ===
const TouchWeekList: React.FC<PlannerWeekViewProps> = ({
  weekDays,
  getTasksForDate,
  onSelectDate,
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
      const { total: taskCount, completed: completedDayCount } = getTaskProgress(dayTasks);
      const progressPercent = taskCount > 0
        ? Math.round((completedDayCount / taskCount) * 100)
        : 0;

      return (
        <button
          key={day.dateStr}
          type="button"
          onClick={() => onSelectDate(day.dateStr)}
          aria-label={`${day.dayName}, ngày ${day.dayNum}, ${taskCount} việc`}
          className={`w-full px-4 py-3 sm:py-3.5 rounded-2xl border-none transition-all text-left flex items-center justify-between gap-2.5 shadow-xs active:scale-[0.99] cursor-pointer min-h-[50px] ${
            day.isToday
              ? "bg-[#007AFF]/10 dark:bg-[#0A84FF]/15"
              : "bg-white dark:bg-[#1C1C1E] hover:bg-black/[0.02] dark:hover:bg-white/[0.04]"
          }`}
        >
          {/* Cột 1: Thứ & Ngày */}
          <div className="flex items-center gap-1.5 min-w-[72px] sm:min-w-[84px] shrink-0">
            <span className={`text-[13.5px] sm:text-sm font-bold ${
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
          <div className="flex-1 min-w-0 flex items-center gap-1.5 text-xs text-[#8E8E93] dark:text-[#8E8E93] truncate">
            {dayTasks.length > 0 ? (
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-semibold text-[#1C1C1E] dark:text-[#F2F2F7]">{dayTasks.length} việc</span>
                <span>·</span>
                <span>{completedDayCount} xong</span>
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
              <span className="text-[#8E8E93] dark:text-[#8E8E93] text-xs">Trống</span>
            )}
          </div>

          {/* Cột 3: Tiến độ & Mũi tên */}
          <div className="flex items-center gap-2 shrink-0">
            {dayTasks.length > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-12 sm:w-14 h-1.5 rounded-full bg-[#E5E5EA] dark:bg-[#3A3A3C] overflow-hidden">
                  <div
                    className="h-full bg-[#007AFF] dark:bg-[#0A84FF] rounded-full transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="font-mono text-[11px] font-bold text-[#1C1C1E] dark:text-[#F2F2F7] min-w-[28px] text-right">
                  {progressPercent}%
                </span>
              </div>
            )}
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
