import React, { useEffect, useState } from "react";
import { ChevronRight, X } from "lucide-react";
import { TaskDto } from "../../../types";
import { formatShortDayMonth } from "../../../utils/date";
import {
  getTaskEffectiveTime,
  getTaskTemporalState,
  normalizeTaskTimeType,
} from "../../../utils/taskSemantics";

export interface PlannerCalendarProps {
  selectedDateStr: string;
  onSelectDate: (dateStr: string) => void;
  todayStr: string;
  monthMatrix: Array<{ dayNum: number; dateStr: string; isCurrentMonth: boolean }>;
  getTasksForDate: (dateStr: string) => TaskDto[];
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
  getTasksForDate,
  getTaskSummaryForDate,
}) => {
  const [previewDateStr, setPreviewDateStr] = useState<string | null>(null);

  useEffect(() => {
    setPreviewDateStr(null);
  }, [monthMatrix]);

  const previewTasks = previewDateStr ? getTasksForDate(previewDateStr) : [];
  const previewSummary = previewDateStr
    ? getTaskSummaryForDate(previewDateStr)
    : null;

  const getTaskPreviewMeta = (task: TaskDto) => {
    if (task.completed) return "Đã xong";

    const temporalState = getTaskTemporalState(task);
    if (temporalState === "overdue") return "Quá hạn";
    if (temporalState === "pastScheduled") return "Lịch đã qua";

    const time = getTaskEffectiveTime(task);
    const type = normalizeTaskTimeType(task);
    if (time) return `${type === "scheduled" ? "Lịch hẹn" : "Hạn"} · ${time}`;
    return type === "scheduled" ? "Lịch hẹn · Cả ngày" : "Chưa đặt giờ";
  };

  return (
    <section className="w-full min-w-0 overflow-hidden rounded-[8px] border-[1.5px] border-[#262626] bg-white shadow-[3px_3px_0px_#262626] select-none">
      <div className="grid grid-cols-7 border-b-[1.5px] border-[#262626] bg-[#F3EFE6]">
        {WEEKDAYS.map((day) => (
          <div
            key={day.short}
            className="flex min-w-0 min-h-[32px] items-center justify-center border-r border-[#D4CEBF] px-1 text-center text-xs font-semibold text-[#57534E] last:border-r-0 sm:min-h-[40px]"
          >
            <span className="hidden sm:inline">{day.label}</span>
            <span className="sm:hidden">{day.short}</span>
          </div>
          ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[#D4CEBF] bg-[#FAF8F3] px-2 py-1.5 text-[10px] font-semibold text-[#57534E] sm:justify-end sm:px-3">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full border border-[#BE123C] bg-[#FECDD3]" />
          Quá hạn
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full border border-[#92400E] bg-[#FEF3C7]" />
          Sắp đến
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full border border-[#065F46] bg-[#BBF7D0]" />
          Đã xong
        </span>
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
          const upcomingCount = Math.max(
            summary.active - summary.overdue - summary.pastScheduled,
            0,
          );
          const overdueCount = summary.overdue + summary.pastScheduled;

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
            if (isToday) bgClass = "bg-[#BBF7D0] ring-2 ring-inset ring-[#262626]";
            else if (isPast) bgClass = "bg-[#FECDD3] ring-2 ring-inset ring-[#262626]";
            else bgClass = "bg-[#BAE6FD] ring-2 ring-inset ring-[#262626]";
          } else if (isToday) {
            bgClass = "bg-[#BBF7D0]/40 hover:bg-[#BBF7D0]/60";
          } else if (isPast) {
            bgClass = "bg-[#FECDD3]/15 hover:bg-[#FECDD3]/30";
          } else {
            bgClass = "bg-[#BAE6FD]/20 hover:bg-[#BAE6FD]/35";
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
                if (isCurrentMonth) setPreviewDateStr(item.dateStr);
              }}
              disabled={!isCurrentMonth}
              title={dateAriaLabel}
              aria-label={dateAriaLabel}
              aria-expanded={previewDateStr === item.dateStr}
              className={`relative flex min-w-0 min-h-[56px] flex-col justify-between p-1.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#262626] disabled:cursor-default sm:min-h-[78px] sm:p-2 lg:min-h-[92px] lg:p-2.5 ${bgClass}`}
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

              {/* Chỉ báo trạng thái: ưu tiên màu và giữ tổng thể ô thật gọn. */}
              {taskCount > 0 && isCurrentMonth ? (
                <div className="flex min-h-4 min-w-0 max-w-full items-center gap-1.5 overflow-hidden text-[9px] font-bold sm:gap-2 sm:text-[11px]">
                  {overdueCount > 0 && (
                    <span className="inline-flex shrink-0 items-center gap-0.5 text-[#BE123C]" title={`${overdueCount} việc quá hạn hoặc lịch đã qua`}>
                      <span className="h-2.5 w-2.5 rounded-full border border-[#BE123C] bg-[#FECDD3]" />
                      <span className="hidden md:inline">{overdueCount}</span>
                    </span>
                  )}
                  {upcomingCount > 0 && (
                    <span className="inline-flex shrink-0 items-center gap-0.5 text-[#92400E]" title={`${upcomingCount} việc sắp đến`}>
                      <span className="h-2.5 w-2.5 rounded-full border border-[#92400E] bg-[#FEF3C7]" />
                      <span className="hidden md:inline">{upcomingCount}</span>
                    </span>
                  )}
                  {summary.completed > 0 && (
                    <span className="inline-flex shrink-0 items-center gap-0.5 text-[#065F46]" title={`${summary.completed} việc đã xong`}>
                      <span className="h-2.5 w-2.5 rounded-full border border-[#065F46] bg-[#BBF7D0]" />
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

      {previewDateStr && previewSummary && (
        <div
          role="dialog"
          aria-label={`Tóm tắt ${formatShortDayMonth(previewDateStr)}`}
          className="border-t-[1.5px] border-[#262626] bg-[#FFFDF8] p-3 sm:p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#78716C]">
                Tóm tắt ngày
              </p>
              <h3 className="mt-0.5 truncate text-base font-bold text-[#1C1917] sm:text-lg">
                {formatShortDayMonth(previewDateStr)}
              </h3>
              <p className="mt-1 text-xs text-[#57534E]">
                {previewSummary.total} việc · {previewSummary.completed} đã xong · {previewSummary.active} chưa xong
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPreviewDateStr(null)}
              aria-label="Đóng tóm tắt ngày"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] border-[1.5px] border-[#262626] bg-white text-[#57534E] shadow-[1px_1px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
            >
              <X size={15} strokeWidth={2.4} />
            </button>
          </div>

          {previewTasks.length === 0 ? (
            <p className="mt-3 border border-dashed border-[#D4CEBF] px-3 py-2 text-sm text-[#78716C]">
              Ngày này chưa có công việc.
            </p>
          ) : (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {previewTasks.slice(0, 4).map((task) => {
                const meta = getTaskPreviewMeta(task);
                const isCompleted = task.completed;
                const isOverdue = meta === "Quá hạn" || meta === "Lịch đã qua";
                return (
                  <div
                    key={task.id}
                    className="min-w-0 border-[1.5px] border-[#D4CEBF] bg-[#FAF8F3] px-3 py-2"
                  >
                    <p className={`truncate text-sm font-semibold ${isCompleted ? "text-[#065F46] line-through" : "text-[#1C1917]"}`}>
                      {task.title || "Công việc không có tiêu đề"}
                    </p>
                    <p className={`mt-1 text-[11px] font-semibold ${isCompleted ? "text-[#065F46]" : isOverdue ? "text-[#BE123C]" : "text-[#92400E]"}`}>
                      {meta}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            {previewTasks.length > 4 ? (
              <p className="text-xs text-[#78716C]">+ {previewTasks.length - 4} việc khác</p>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={() => onSelectDate(previewDateStr)}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-[4px] border-[1.5px] border-[#262626] bg-[#1C1917] px-3 py-1.5 text-xs font-bold text-white shadow-[1.5px_1.5px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
            >
              Xem chi tiết ngày
              <ChevronRight size={14} strokeWidth={2.4} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
