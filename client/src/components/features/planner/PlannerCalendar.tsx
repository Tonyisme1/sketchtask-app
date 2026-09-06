import React from "react";
import { AlertCircle, CalendarDays, Check, Clock } from "lucide-react";
import { formatShortDayMonth } from "../../../utils/date";

export interface PlannerCalendarProps {
  selectedDateStr: string;
  onSelectDate: (dateStr: string) => void;
  todayStr: string;
  monthMatrix: Array<{ dayNum: number; dateStr: string; isCurrentMonth: boolean }>;
  getTaskCountForDate: (dateStr: string) => number;
  getTaskSummaryForDate: (dateStr: string) => {
    total: number;
    completed: number;
    active: number;
    overdue: number;
    pastScheduled: number;
    scheduled: number;
  };
}

const WEEKDAYS = [
  { label: "Thứ 2", short: "T2" },
  { label: "Thứ 3", short: "T3" },
  { label: "Thứ 4", short: "T4" },
  { label: "Thứ 5", short: "T5" },
  { label: "Thứ 6", short: "T6" },
  { label: "Thứ 7", short: "T7" },
  { label: "Chủ nhật", short: "CN" },
];

export const PlannerCalendar: React.FC<PlannerCalendarProps> = ({
  selectedDateStr,
  onSelectDate,
  todayStr,
  monthMatrix,
  getTaskCountForDate,
  getTaskSummaryForDate,
}) => {
  return (
    <section className="w-full min-w-0 overflow-hidden rounded-[8px] border-[1.5px] border-[#262626] bg-white shadow-[3px_3px_0px_#262626] select-none">
      <div className="grid grid-cols-7 border-b-[1.5px] border-[#262626] bg-[#F3EFE6]">
        {WEEKDAYS.map((day) => (
          <div
            key={day.short}
            className="flex min-w-0 min-h-[36px] items-center justify-center border-r border-[#D4CEBF] px-1 text-center text-[10px] font-bold uppercase tracking-wide text-[#57534E] last:border-r-0 sm:min-h-[44px] sm:text-xs"
          >
            <span className="hidden sm:inline">{day.label}</span>
            <span className="sm:hidden">{day.short}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 divide-x divide-y divide-[#D4CEBF] bg-[#D4CEBF]">
        {monthMatrix.map((item) => {
          // Ô của tháng trước/sau chỉ để giữ đúng bố cục tuần, không được kéo dữ liệu task vào.
          const isCurrentMonth = item.isCurrentMonth;
          const summary = isCurrentMonth
            ? getTaskSummaryForDate(item.dateStr)
            : { total: 0, completed: 0, active: 0, overdue: 0, pastScheduled: 0, scheduled: 0 };
          const taskCount = isCurrentMonth ? summary.total : 0;

          const isSelected = isCurrentMonth && selectedDateStr === item.dateStr;
          const isToday = isCurrentMonth && todayStr === item.dateStr;
          const isPast = isCurrentMonth && item.dateStr < todayStr;
          const isFuture = isCurrentMonth && item.dateStr > todayStr;

          // Xây dựng title và aria-label đầy đủ ngữ cảnh
          let dateAriaLabel = "";
          if (!isCurrentMonth) {
            dateAriaLabel = `${formatShortDayMonth(item.dateStr)} (Tháng khác)`;
          } else {
            const labelParts: string[] = [];
            if (isToday) labelParts.push("Hôm nay");
            labelParts.push(formatShortDayMonth(item.dateStr));
            if (isSelected) labelParts.push("Đang chọn");
            if (taskCount > 0) {
              labelParts.push(`${taskCount} việc`);
              if (summary.overdue > 0) labelParts.push(`${summary.overdue} quá hạn`);
              if (summary.pastScheduled > 0) labelParts.push(`${summary.pastScheduled} lịch hẹn đã qua`);
              if (summary.scheduled > 0) labelParts.push(`${summary.scheduled} lịch hẹn`);
              if (summary.completed > 0) labelParts.push(`${summary.completed} đã xong`);
            } else {
              labelParts.push("Chưa có việc");
            }
            dateAriaLabel = labelParts.join(", ");
          }

          // Visual Background & Border Classes
          let bgClass = "";
          if (!isCurrentMonth) {
            bgClass = "bg-[#FAF8F3] opacity-60";
          } else if (isSelected) {
            if (isToday) bgClass = "bg-[#BBF7D0] z-10 border-[2px] border-[#262626] shadow-[2px_2px_0px_#262626] rounded-[4px] -m-[1px]";
            else if (isPast) bgClass = "bg-[#FECDD3] z-10 border-[2px] border-[#262626] shadow-[2px_2px_0px_#262626] rounded-[4px] -m-[1px]";
            else bgClass = "bg-[#FEF08A] z-10 border-[2px] border-[#262626] shadow-[2px_2px_0px_#262626] rounded-[4px] -m-[1px]";
          } else if (isToday) {
            bgClass = "bg-[#BBF7D0]/40 hover:bg-[#BBF7D0]/60";
          } else if (isPast) {
            bgClass = "bg-[#FECDD3]/15 hover:bg-[#FECDD3]/30";
          } else {
            bgClass = "bg-[#FEF08A]/10 hover:bg-[#FEF08A]/25";
          }

          let dayNumColor = "";
          if (!isCurrentMonth) {
            dayNumColor = "text-[#A8A29E]";
          } else if (isSelected) {
            dayNumColor = "text-[#1C1917] font-extrabold";
          } else if (isToday) {
            dayNumColor = "text-emerald-950 font-bold";
          } else if (isPast) {
            dayNumColor = "text-rose-900 font-bold";
          } else {
            dayNumColor = "text-[#1C1917] font-bold";
          }

          return (
            <button
              key={item.dateStr}
              type="button"
              onClick={() => {
                if (isCurrentMonth) onSelectDate(item.dateStr);
              }}
              disabled={!isCurrentMonth}
              title={dateAriaLabel}
              aria-label={dateAriaLabel}
              className={`relative flex min-w-0 min-h-[64px] flex-col justify-between p-1.5 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#262626] disabled:cursor-default sm:min-h-[94px] sm:p-2 lg:min-h-[114px] lg:p-2.5 ${bgClass}`}
            >
              {/* Header của ô: Số ngày + Tổng việc */}
              <div className="flex items-start justify-between gap-1 w-full">
                <span
                  className={`flex h-6 min-w-6 items-center justify-center rounded-[3px] font-mono text-xs sm:h-7 sm:min-w-7 sm:text-sm ${dayNumColor}`}
                >
                  {item.dayNum}
                </span>

                {taskCount > 0 && isCurrentMonth && (
                  <span className="font-mono text-[9px] font-bold text-[#57534E] sm:text-[11px] shrink-0">
                    {taskCount} <span className="hidden sm:inline">việc</span>
                  </span>
                )}
              </div>

              {/* Markers trạng thái bên dưới */}
              {taskCount > 0 && isCurrentMonth ? (
                <div className="flex min-h-4 min-w-0 max-w-full items-center gap-1 overflow-hidden font-mono text-[9px] font-bold sm:gap-2 sm:text-[11px]">
                  {/* 1. Lịch hẹn sắp tới / hôm nay: chấm vàng */}
                  {summary.scheduled > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-amber-900 shrink-0" title={`${summary.scheduled} việc có lịch hẹn`}>
                      <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400 border border-[#262626]/60 sm:hidden" />
                      <Clock size={11} strokeWidth={2.4} className="hidden sm:block" />
                      <span className="hidden md:inline">{summary.scheduled}</span>
                    </span>
                  )}

                  {/* 2. Deadline quá hạn: CHỈ hiển thị chấm đỏ khi overdue */}
                  {summary.overdue > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-rose-800 shrink-0" title={`${summary.overdue} việc quá hạn`}>
                      <span className="h-2 w-2 shrink-0 rounded-full bg-rose-500 border border-[#262626]/60 sm:hidden" />
                      <AlertCircle size={11} strokeWidth={2.4} className="hidden sm:block" />
                      <span className="hidden md:inline">{summary.overdue}</span>
                    </span>
                  )}

                  {/* 3. Lịch hẹn đã qua: CHẤM XÁM / TRUNG TÍNH (không bị đọc thành deadline quá hạn) */}
                  {summary.pastScheduled > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-[#57534E] shrink-0" title={`${summary.pastScheduled} lịch hẹn đã qua`}>
                      <span className="h-2 w-2 shrink-0 rounded-full bg-[#78716C] border border-[#262626]/60 sm:hidden" />
                      <CalendarDays size={11} strokeWidth={2.2} className="hidden sm:block" />
                      <span className="hidden md:inline">{summary.pastScheduled}</span>
                    </span>
                  )}

                  {/* 4. Đã hoàn thành: chấm xanh lá */}
                  {summary.completed > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-emerald-800 shrink-0" title={`${summary.completed} việc đã xong`}>
                      <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 border border-[#262626]/60 sm:hidden" />
                      <Check size={11} strokeWidth={2.4} className="hidden sm:block" />
                      <span className="hidden md:inline">{summary.completed}</span>
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-[10px] text-transparent">&nbsp;</span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
};
