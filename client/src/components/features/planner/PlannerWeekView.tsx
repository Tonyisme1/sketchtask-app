import React from "react";
import { ChevronRight, Clock } from "lucide-react";
import { TaskDto } from "../../../types";
import { normalizeTaskTimeType } from "../../../utils/taskSemantics";
import { useResponsiveLayout } from "../../../shared/hooks";
import { PlannerTimeline } from "./PlannerTimeline";

interface DayColumn {
  dateStr: string;
  dayName: string;
  dayNum: number;
  isToday: boolean;
}

interface PlannerWeekViewProps {
  weekDays: DayColumn[];
  todayStr: string;
  selectedDateStr?: string;
  onPreviewDate?: (dateStr: string) => void;
  getTasksForDate: (dateStr: string) => TaskDto[];
  onSelectDate: (dateStr: string) => void;
  onSelectTask: (task: TaskDto) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onMoveTomorrow?: (taskId: string) => void;
}

// === PHẦN 1: Danh sách 7 ngày cho mobile và tablet (Siêu gọn & Tiết kiệm diện tích) ===
const TouchWeekList: React.FC<PlannerWeekViewProps> = ({
  weekDays,
  todayStr,
  getTasksForDate,
  onSelectDate,
}) => (
  <div className="w-full space-y-1.5 select-none mobile-tab-enter pb-16">
    {weekDays.map((day) => {
      const dayTasks = getTasksForDate(day.dateStr);
      const scheduledCount = dayTasks.filter(
        (task) => normalizeTaskTimeType(task) === "scheduled",
      ).length;
      const deadlineCount = dayTasks.filter(
        (task) => normalizeTaskTimeType(task) === "deadline",
      ).length;
      const completedDayCount = dayTasks.filter((task) => task.completed).length;
      const progressPercent = dayTasks.length > 0
        ? Math.round((completedDayCount / dayTasks.length) * 100)
        : 0;

      return (
        <button
          key={day.dateStr}
          type="button"
          onClick={() => onSelectDate(day.dateStr)}
          aria-label={`${day.dayName}, ngày ${day.dayNum}, ${dayTasks.length} việc`}
          className={`w-full px-3 py-2 rounded-xl border transition-all text-left flex items-center justify-between gap-2.5 shadow-2xs active:scale-[0.99] cursor-pointer ${
            day.isToday
              ? "bg-[#FAF8F3] dark:bg-[#2C2C2E] border-[#1C1917] dark:border-white/50 ring-1 ring-[#1C1917]/10 dark:ring-white/10"
              : "bg-white dark:bg-[#1C1C1E] border-[#E5E5EA] dark:border-black hover:bg-[#FAF8F3] dark:hover:bg-[#2C2C2E]"
          }`}
        >
          {/* Cột 1: Thứ & Ngày */}
          <div className="flex items-center gap-1.5 min-w-[68px] sm:min-w-[80px] shrink-0">
            <span className={`text-xs sm:text-[13px] font-bold ${
              day.isToday
                ? "text-[#1C1917] dark:text-white"
                : "text-[#1C1C1E] dark:text-[#F2F2F7]"
            }`}>
              {day.dayName}, {day.dayNum}
            </span>
            {day.isToday && (
              <span className="px-1.5 py-0.25 rounded bg-[#1C1917] dark:bg-white text-white dark:text-[#1C1917] text-[9.5px] font-bold leading-none shrink-0">
                Nay
              </span>
            )}
          </div>

          {/* Cột 2: Thông tin tóm tắt công việc */}
          <div className="flex-1 min-w-0 flex items-center gap-1.5 text-[11px] text-[#8E8E93] dark:text-[#AEAEC2] truncate">
            {dayTasks.length > 0 ? (
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-medium text-[#1C1C1E] dark:text-[#F2F2F7]">{dayTasks.length} việc</span>
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
              <span className="text-[#8E8E93] dark:text-[#AEAEC2] text-[11px]">Trống</span>
            )}
          </div>

          {/* Cột 3: Tiến độ & Mũi tên */}
          <div className="flex items-center gap-2 shrink-0">
            {dayTasks.length > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-10 sm:w-12 h-1 rounded-full bg-[#E5E5EA] dark:bg-[#3A3A3C] overflow-hidden">
                  <div
                    className="h-full bg-[#1C1917] dark:bg-white rounded-full transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="font-mono text-[10px] font-bold text-[#1C1C1E] dark:text-[#F2F2F7] min-w-[24px] text-right">
                  {progressPercent}%
                </span>
              </div>
            )}
            <ChevronRight size={14} className="text-[#8E8E93] dark:text-[#AEAEC2]" strokeWidth={2.2} />
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
