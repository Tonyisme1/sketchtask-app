import React, { useMemo } from "react";
import { Clock, Hourglass, Calendar, ArrowRight } from "lucide-react";
import { TaskDto, TabKey } from "../../../types";
import { HandDrawnCheckbox } from "../../ui/core/HandDrawnCheckbox";
import {
  getTaskEffectiveDate,
  getTaskEffectiveTime,
  getTaskTemporalState,
  normalizeTaskTimeType,
} from "../../../utils/taskSemantics";
import { getLocalTodayStr, formatShortDayMonth } from "../../../utils/date";

interface DashboardUpcomingProps {
  tasks: TaskDto[];
  onNavigateTab?: (tab: TabKey) => void;
  onSelectTaskSubTab?: (subTab: "today" | "planner" | "deadlines") => void;
  onToggleTask?: (id: string) => void;
}

export const DashboardUpcoming: React.FC<DashboardUpcomingProps> = ({
  tasks,
  onNavigateTab,
  onSelectTaskSubTab,
  onToggleTask,
}) => {
  const now = new Date();
  const todayStr = getLocalTodayStr(now);

  // Lọc và sắp xếp các công việc có lịch hẹn hoặc hạn chót gần nhất
  const upcomingItems = useMemo(() => {
    const uncompleted = tasks.filter((t) => !t.completed);

    // Lọc các task có ngày hiệu lực và chưa qua hạn
    const withSchedule = uncompleted.filter((t) => {
      const date = getTaskEffectiveDate(t);
      if (!date) return false;
      const state = getTaskTemporalState(t, now);
      if (state === "overdue" || state === "pastScheduled") return false;
      return date >= todayStr;
    });

    // Sắp xếp tăng dần theo ngày rồi đến giờ hiệu lực
    withSchedule.sort((a, b) => {
      const dateA = getTaskEffectiveDate(a) || "";
      const dateB = getTaskEffectiveDate(b) || "";
      const dateCompare = dateA.localeCompare(dateB);
      if (dateCompare !== 0) return dateCompare;
      const timeA = getTaskEffectiveTime(a) || "99:99";
      const timeB = getTaskEffectiveTime(b) || "99:99";
      return timeA.localeCompare(timeB);
    });

    return withSchedule.slice(0, 5);
  }, [tasks, now, todayStr]);

  const handleGoToSchedule = () => {
    if (onNavigateTab) {
      onSelectTaskSubTab?.("planner");
      onNavigateTab("tasks");
    }
  };

  return (
    <div className="bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] p-3.5 sm:p-4 shadow-[2px_2px_0px_#262626] flex flex-col justify-between h-full select-none">
      <div>
        {/* Header Khu Vực */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[#262626] mb-3">
          <div className="flex items-center gap-1.5">
            <Clock size={15} className="text-[#1C1917]" strokeWidth={2.4} />
            <h2 className="text-xs sm:text-sm font-bold text-[#1C1917] uppercase tracking-wider font-mono">
              Lịch Trình & Hạn Gần Nhất
            </h2>
          </div>

          <button
            type="button"
            onClick={handleGoToSchedule}
            className="text-[11px] font-bold text-[#78716C] hover:text-[#1C1917] flex items-center gap-1 hover:underline cursor-pointer transition-colors"
          >
            <span>Kế hoạch</span>
            <ArrowRight size={12} strokeWidth={2.4} />
          </button>
        </div>

        {/* Danh sách các item gần nhất */}
        {upcomingItems.length === 0 ? (
          /* Empty State Gọn */
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
            <div className="w-9 h-9 rounded-full bg-[#FAF8F3] border border-[#262626] flex items-center justify-center shadow-[1px_1px_0px_#262626]">
              <Calendar size={16} className="text-[#78716C]" />
            </div>
            <p className="text-xs font-bold text-[#78716C]">
              Không có lịch hẹn hoặc hạn chót nào sắp tới
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingItems.map((task) => {
              const effectiveDate = getTaskEffectiveDate(task);
              const effectiveTime = getTaskEffectiveTime(task);
              const normalizedType = normalizeTaskTimeType(task);
              const isScheduled = normalizedType === "scheduled";
              const isDeadline = normalizedType === "deadline";
              const dateLabel =
                effectiveDate === todayStr
                  ? "Hôm nay"
                  : effectiveDate
                  ? formatShortDayMonth(effectiveDate)
                  : "";

              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between gap-2.5 p-2 sm:p-2.5 bg-[#FAF8F3] hover:bg-[#F5F2EA] border border-[#262626] rounded-[6px] shadow-[1px_1px_0px_#262626] transition-all"
                >
                  {/* Cột Trái: Checkbox nhanh + Tiêu đề task */}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {onToggleTask && (
                      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                        <HandDrawnCheckbox
                          checked={task.completed}
                          onChange={() => onToggleTask(task.id)}
                        />
                      </div>
                    )}
                    <span className="text-xs sm:text-sm font-bold text-[#1C1917] truncate">
                      {task.title}
                    </span>
                  </div>

                  {/* Cột Phải: Duy nhất 1 chip mốc thời gian tinh gọn */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isScheduled ? (
                      <span className="px-1.5 py-0.5 rounded-[3px] bg-white border border-[#262626] text-[10px] font-bold text-[#1C1917] shadow-[0.5px_0.5px_0px_#262626] font-mono flex items-center gap-1">
                        <Clock size={10} strokeWidth={2.4} className="text-[#1C1917]" />
                        <span>
                          {effectiveTime ? `${effectiveTime}` : ""}{" "}
                          {dateLabel ? `(${dateLabel})` : ""}
                        </span>
                      </span>
                    ) : isDeadline ? (
                      <span className="px-1.5 py-0.5 rounded-[3px] bg-[#1C1917] text-white border border-[#262626] text-[10px] font-bold shadow-[0.5px_0.5px_0px_#262626] font-mono flex items-center gap-1">
                        <Hourglass size={10} strokeWidth={2.4} className="text-white" />
                        <span>
                          Hạn {effectiveTime || dateLabel}
                        </span>
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded-[3px] bg-white border border-[#262626] text-[10px] font-bold text-[#1C1917] shadow-[0.5px_0.5px_0px_#262626] font-mono">
                        {dateLabel}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer gợi ý nhỏ */}
      <div className="pt-2.5 mt-2.5 border-t border-[#E7E5E4] flex items-center justify-between text-[11px] text-[#78716C] font-mono">
        <span>Hiển thị tối đa 5 mốc gần nhất</span>
        <span className="font-bold">{upcomingItems.length} mục</span>
      </div>
    </div>
  );
};
