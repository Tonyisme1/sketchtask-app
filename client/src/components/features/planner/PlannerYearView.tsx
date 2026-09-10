import React from "react";
import { TaskDto } from "../../../types";
import { getTaskEffectiveDate } from "../../../utils/taskSemantics";
import { getLocalTodayStr } from "../../../utils/date";
import { Calendar, ChevronRight } from "lucide-react";

interface MonthOverview {
  monthIndex: number; // 0 - 11
  monthName: string;
  year: number;
  totalDays: number;
  startDayOfWeek: number;
}

interface PlannerYearViewProps {
  year: number;
  todayStr: string;
  tasks: TaskDto[];
  onSelectMonth: (monthIndex: number) => void;
  onSelectDate: (dateStr: string) => void;
}

const MONTH_NAMES = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
  "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
  "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
];

const MINI_DAY_HEADERS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export const PlannerYearView: React.FC<PlannerYearViewProps> = ({
  year,
  todayStr,
  tasks,
  onSelectMonth,
  onSelectDate,
}) => {
  // Tạo danh sách 12 tháng
  const monthsData = MONTH_NAMES.map((name, monthIndex) => {
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    let startDayOfWeek = firstDay.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const totalDays = lastDay.getDate();

    // Lấy các task trong tháng này
    const monthPrefix = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
    const monthTasks = tasks.filter((t) => {
      const taskDate = getTaskEffectiveDate(t);
      return taskDate && taskDate.startsWith(monthPrefix);
    });

    const completedCount = monthTasks.filter((t) => t.completed).length;
    const totalTasks = monthTasks.length;

    // Map ngày có task
    const tasksPerDayMap: Record<number, number> = {};
    monthTasks.forEach((t) => {
      const taskDate = getTaskEffectiveDate(t);
      if (taskDate) {
        const day = parseInt(taskDate.split("-")[2], 10);
        tasksPerDayMap[day] = (tasksPerDayMap[day] || 0) + 1;
      }
    });

    return {
      monthIndex,
      name,
      totalDays,
      startDayOfWeek,
      totalTasks,
      completedCount,
      tasksPerDayMap,
      monthPrefix,
    };
  });

  return (
    <div className="w-full space-y-3 select-none animate-in fade-in duration-150">
      {/* Lưới 12 Tháng (3 cột trên desktop, 2 cột trên tablet, 1 cột trên mobile) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-3.5">
        {monthsData.map((m) => {
          const completionRate =
            m.totalTasks > 0 ? Math.round((m.completedCount / m.totalTasks) * 100) : 0;
          const isCurrentMonth =
            new Date().getFullYear() === year && new Date().getMonth() === m.monthIndex;

          return (
            <div
              key={m.monthIndex}
              className={`flex flex-col rounded-[8px] border-[1.5px] border-[#262626] p-3 transition-all ${
                isCurrentMonth
                  ? "bg-[#FAF8F3] shadow-[2.5px_2.5px_0px_#262626] ring-2 ring-[#262626]"
                  : "bg-white hover:bg-[#FAF8F3] shadow-[1.5px_1.5px_0px_#262626]"
              }`}
            >
              {/* Header Tháng & Nút mở Lịch Tháng */}
              <div className="flex items-center justify-between pb-2 border-b border-[#262626]/20">
                <button
                  type="button"
                  onClick={() => onSelectMonth(m.monthIndex)}
                  className="flex items-center gap-1.5 font-bold text-sm text-[#1C1917] hover:text-[#262626] group transition-colors text-left"
                  title="Nhảy vào xem lịch tháng này"
                >
                  <span>{m.name}</span>
                  {isCurrentMonth && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 bg-[#1C1917] border border-[#262626] rounded text-white leading-none">
                      Hiện tại
                    </span>
                  )}
                  <ChevronRight size={13} className="text-[#78716C] group-hover:translate-x-0.5 transition-transform" />
                </button>

                <div className="text-[10px] font-mono font-bold text-[#78716C]">
                  {m.completedCount}/{m.totalTasks} việc
                </div>
              </div>

              {/* Progress Bar Nét Mực Mini */}
              {m.totalTasks > 0 && (
                <div className="mt-2 w-full bg-white border border-[#262626] rounded-[2px] h-1.5 overflow-hidden shadow-[1px_1px_0px_#262626]">
                  <div
                    className="bg-[#1C1917] border-r border-[#262626] h-full transition-all duration-300"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              )}

              {/* Mini Calendar Matrix */}
              <div className="mt-2.5 pt-1">
                {/* Thứ */}
                <div className="grid grid-cols-7 gap-0.5 mb-1 text-center">
                  {MINI_DAY_HEADERS.map((h) => (
                    <span key={h} className="text-[8px] font-bold text-[#A8A29E]">
                      {h}
                    </span>
                  ))}
                </div>

                {/* Các ô ngày */}
                <div className="grid grid-cols-7 gap-0.5 text-center">
                  {/* Ngày rỗng đầu tháng */}
                  {Array.from({ length: m.startDayOfWeek }).map((_, idx) => (
                    <div key={`empty-${idx}`} className="h-4 sm:h-5" />
                  ))}

                  {/* Ngày trong tháng */}
                  {Array.from({ length: m.totalDays }).map((_, idx) => {
                    const dayNum = idx + 1;
                    const dateStr = `${m.monthPrefix}-${String(dayNum).padStart(2, "0")}`;
                    const hasTask = (m.tasksPerDayMap[dayNum] || 0) > 0;
                    const isToday = dateStr === todayStr;

                    return (
                      <button
                        key={dayNum}
                        type="button"
                        onClick={() => onSelectDate(dateStr)}
                        className={`h-4 sm:h-5 rounded-[2px] flex items-center justify-center text-[9px] font-mono transition-all ${
                          isToday
                            ? "bg-[#1C1917] font-bold text-white border border-[#262626]"
                            : hasTask
                            ? "bg-[#FAF8F3] font-bold text-[#1C1917] border border-[#262626]"
                            : "text-[#78716C] hover:bg-[#FAF8F3]"
                        }`}
                        title={`${dayNum}/${m.monthIndex + 1}/${year}${hasTask ? ` (${m.tasksPerDayMap[dayNum]} việc)` : ""}`}
                      >
                        {dayNum}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
