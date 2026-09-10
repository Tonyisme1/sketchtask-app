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

// === PHẦN 1: Danh sách 7 ngày cho mobile và tablet ===
const TouchWeekList: React.FC<PlannerWeekViewProps> = ({
  weekDays,
  todayStr,
  getTasksForDate,
  onSelectDate,
}) => (
  <div className="w-full space-y-2.5 select-none mobile-tab-enter">
    <div className="flex items-center justify-between border-b border-[#262626]/20 pb-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-[#1C1917]">
        <Clock size={16} strokeWidth={2.2} />
        <span>7 ngày trong tuần</span>
      </div>
      <span className="text-[11px] text-[#78716C]">Chạm ngày để xem</span>
    </div>

    <div className="space-y-2">
      {weekDays.map((day) => {
        const dayTasks = getTasksForDate(day.dateStr);
        const scheduledCount = dayTasks.filter(
          (task) => normalizeTaskTimeType(task) === "scheduled",
        ).length;
        const deadlineCount = dayTasks.filter(
          (task) => normalizeTaskTimeType(task) === "deadline",
        ).length;
        const completedDayCount = dayTasks.filter((task) => task.completed).length;
        const isPast = day.dateStr < todayStr;
        const progressPercent = dayTasks.length > 0
          ? Math.round((completedDayCount / dayTasks.length) * 100)
          : 0;

        return (
          <button
            key={day.dateStr}
            type="button"
            onClick={() => onSelectDate(day.dateStr)}
            aria-label={`${day.dayName}, ngày ${day.dayNum}, ${dayTasks.length} việc`}
            className={`w-full rounded-[6px] border-[1.5px] border-[#262626] p-3 text-left shadow-[2px_2px_0px_#262626] transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
              day.isToday
                ? "bg-[#BBF7D0]"
                : isPast
                  ? "bg-[#FECDD3]/35"
                  : "bg-white hover:bg-[#FAF8F3]"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[15px] font-semibold text-[#1C1917]">
                    {day.dayName}, ngày {day.dayNum}
                  </span>
                  {day.isToday && (
                    <span className="shrink-0 rounded-[3px] border border-[#262626] bg-[#FEF08A] px-1.5 py-0.5 text-[10px] font-semibold text-[#1C1917]">
                      Hôm nay
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] font-medium text-[#57534E]">
                  <span>{dayTasks.length} việc</span>
                  <span>{completedDayCount} xong</span>
                  {scheduledCount > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-[#075985]">
                      <Clock size={11} strokeWidth={2.2} />
                      {scheduledCount} hẹn
                    </span>
                  )}
                  {deadlineCount > 0 && <span>{deadlineCount} hạn</span>}
                </div>
              </div>
              <ChevronRight size={18} className="mt-0.5 shrink-0 text-[#57534E]" strokeWidth={2.4} />
            </div>

            {dayTasks.length > 0 ? (
              <div className="mt-3 space-y-1.5 border-t border-[#262626]/20 pt-2.5">
                <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-[#57534E]">
                  <span>Tiến độ</span>
                  <span>{progressPercent}%</span>
                </div>
                <div
                  role="progressbar"
                  aria-label={`Tiến độ ${day.dayName}, ngày ${day.dayNum}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progressPercent}
                  className="h-1.5 w-full overflow-hidden rounded-[2px] border border-[#262626] bg-[#F3EFE6]"
                >
                  <div
                    className="h-full bg-[#1C1917]"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="mt-3 border-t border-[#262626]/20 pt-2.5 text-xs text-[#78716C]">
                Chưa có công việc
              </div>
            )}
          </button>
        );
      })}
    </div>
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
