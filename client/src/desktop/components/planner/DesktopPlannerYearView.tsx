import React, { useMemo } from "react";
import { TaskDto } from "../../../types";

export interface DesktopPlannerYearViewProps {
  year: number;
  todayStr: string;
  selectedDateStr: string;
  getTasksForDate: (dateStr: string) => TaskDto[];
  onSelectDate: (dateStr: string) => void;
}

const MONTH_NAMES = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

const toDateString = (year: number, month: number, day: number) =>
  `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

/** Desktop yearly overview: compact months, with task density kept as a small dot. */
export const DesktopPlannerYearView: React.FC<DesktopPlannerYearViewProps> = ({
  year,
  todayStr,
  selectedDateStr,
  getTasksForDate,
  onSelectDate,
}) => {
  const months = useMemo(() => Array.from({ length: 12 }, (_, month) => {
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
    const totalDays = new Date(year, month + 1, 0).getDate();
    return { month, firstWeekday, totalDays };
  }), [year]);

  return (
    <section className="flex-1 min-h-0 overflow-y-auto bg-[var(--bg-canvas)] p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {months.map(({ month, firstWeekday, totalDays }) => (
          <article key={month} className="rounded-2xl bg-[var(--bg-surface)] p-3">
            <h3 className="mb-2 text-sm font-extrabold text-[var(--text-main)]">{MONTH_NAMES[month]}</h3>
            <div className="mb-1 grid grid-cols-7 text-center text-[9px] font-bold text-[var(--text-muted)]">
              {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => <span key={day}>{day}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: firstWeekday }, (_, index) => <span key={`blank-${index}`} />)}
              {Array.from({ length: totalDays }, (_, index) => {
                const day = index + 1;
                const dateStr = toDateString(year, month, day);
                const taskCount = getTasksForDate(dateStr).length;
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDateStr;
                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => onSelectDate(dateStr)}
                    className={`relative flex h-7 items-center justify-center rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${
                      isToday
                        ? "bg-[var(--accent-blue)] text-white"
                        : isSelected
                          ? "bg-[var(--bg-surface-muted)] text-[var(--text-main)]"
                          : "text-[var(--text-main)] hover:bg-[var(--bg-surface-muted)]"
                    }`}
                    aria-label={`${day}/${month + 1}/${year}${taskCount ? `, ${taskCount} việc` : ""}`}
                  >
                    {day}
                    {taskCount > 0 && !isToday && <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-[var(--accent-sky)]" />}
                  </button>
                );
              })}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
