import React, { useEffect, useState } from "react";
import { ChevronRight, X } from "lucide-react";
import { TaskDto } from "../../../types";
import { formatShortDayMonth } from "../../../utils/date";
import {
  getTaskEffectiveTime,
  getTaskTemporalState,
  normalizeTaskTimeType,
  getTaskCardVisualStyle,
} from "../../../utils/taskSemantics";

export interface PlannerCalendarProps {
  selectedDateStr: string;
  onSelectDate: (dateStr: string) => void;
  todayStr: string;
  monthMatrix: Array<{ dayNum: number; dateStr: string; isCurrentMonth: boolean }>;
  getTasksForDate: (dateStr: string) => TaskDto[];
  itemLabel?: string;
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
  itemLabel = "việc",
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
    <section className="w-full min-w-0 overflow-hidden rounded-3xl bg-white dark:bg-[#1C1C1E] shadow-xs select-none">
      <div className="grid grid-cols-7 border-b border-black/[0.04] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.03]">
        {WEEKDAYS.map((day) => (
          <div
            key={day.short}
            className="flex min-w-0 min-h-[32px] items-center justify-center px-1 text-center text-xs font-semibold text-[#8E8E93] dark:text-[#A1A1A6] sm:min-h-[40px]"
          >
            <span className="hidden sm:inline">{day.label}</span>
            <span className="sm:hidden">{day.short}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-black/[0.04] dark:border-white/[0.06] px-3 py-2 text-[11px] font-medium text-[#8E8E93] dark:text-[#A1A1A6] sm:justify-end sm:px-4">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[var(--accent-coral)]" />
          Quá hạn
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[var(--accent-sky)]" />
          Sắp đến
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[var(--text-muted)]" />
          Đã xong
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1.5 p-2 sm:p-3">
        {monthMatrix.map((item) => {
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

          let dateAriaLabel = "";
          if (!isCurrentMonth) {
            dateAriaLabel = `${formatShortDayMonth(item.dateStr)} (Tháng khác)`;
          } else {
            const labelParts: string[] = [];
            if (isToday) labelParts.push("Hôm nay");
            labelParts.push(formatShortDayMonth(item.dateStr));
            if (isSelected) labelParts.push("Đang chọn");
              if (taskCount > 0) {
                labelParts.push(`${taskCount} ${itemLabel}`);
              if (summary.overdue > 0) labelParts.push(`${summary.overdue} quá hạn`);
              if (summary.pastScheduled > 0) labelParts.push(`${summary.pastScheduled} lịch hẹn đã qua`);
              if (summary.scheduled > 0) labelParts.push(`${summary.scheduled} lịch hẹn`);
              if (summary.completed > 0) labelParts.push(`${summary.completed} đã xong`);
              } else {
                labelParts.push(`Chưa có ${itemLabel}`);
            }
            dateAriaLabel = labelParts.join(", ");
          }

          let bgClass = "";
          if (!isCurrentMonth) {
            bgClass = "opacity-30 pointer-events-none";
          } else if (isSelected) {
            bgClass = "bg-[var(--accent-sky)] shadow-xs";
          } else if (isToday) {
            bgClass = "bg-[var(--accent-sky)] hover:bg-[var(--bg-interactive)]";
          } else if (isPast) {
            bgClass = "bg-[var(--bg-surface)] hover:bg-[var(--bg-interactive)]";
          } else {
            bgClass = "bg-[var(--bg-surface-muted)] hover:bg-[var(--bg-interactive)]";
          }

          let dayNumColor = "";
          if (!isCurrentMonth) {
            dayNumColor = "text-[var(--text-subtle)]";
          } else if (isSelected) {
            dayNumColor = "text-[var(--text-on-soft-accent)] font-bold";
          } else if (isToday) {
            dayNumColor = "text-[var(--text-on-soft-accent)] font-bold";
          } else {
            dayNumColor = "text-[var(--text-main)] font-semibold";
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
              className={`relative flex min-w-0 min-h-[56px] flex-col justify-between p-2 text-left rounded-2xl transition-all cursor-pointer sm:min-h-[78px] sm:p-2.5 lg:min-h-[92px] lg:p-3 ${bgClass}`}
            >
              {/* Header của ô: Số ngày + Tổng việc */}
              <div className="flex items-start justify-between gap-1 w-full">
                <span
                  className={`flex h-6 min-w-6 items-center justify-center rounded-full font-mono text-xs sm:h-7 sm:min-w-7 sm:text-sm ${dayNumColor}`}
                >
                  {item.dayNum}
                </span>

                {taskCount > 0 && isCurrentMonth && (
                  <span className="font-mono text-[10px] font-semibold text-[#8E8E93] dark:text-[#A1A1A6] sm:text-xs shrink-0">
                    {taskCount} <span className="hidden sm:inline">{itemLabel}</span>
                  </span>
                )}
              </div>

              {/* Chỉ báo trạng thái */}
              {taskCount > 0 && isCurrentMonth ? (
                <div className="flex min-h-4 min-w-0 max-w-full items-center gap-1.5 overflow-hidden text-[10px] font-semibold sm:gap-2 sm:text-xs">
                  {overdueCount > 0 && (
                    <span className="inline-flex shrink-0 items-center gap-1 text-[var(--danger-text)]" title={`${overdueCount} việc quá hạn`}>
                      <span className="h-2 w-2 rounded-full bg-[var(--accent-coral)]" />
                      <span className="hidden md:inline">{overdueCount}</span>
                    </span>
                  )}
                  {upcomingCount > 0 && (
                    <span className="inline-flex shrink-0 items-center gap-1 text-[var(--accent-blue)]" title={`${upcomingCount} việc sắp đến`}>
                      <span className="h-2 w-2 rounded-full bg-[var(--accent-blue)]" />
                      <span className="hidden md:inline">{upcomingCount}</span>
                    </span>
                  )}
                  {summary.completed > 0 && (
                    <span className="inline-flex shrink-0 items-center gap-1 text-[var(--text-muted)]" title={`${summary.completed} việc đã xong`}>
                      <span className="h-2 w-2 rounded-full bg-[var(--text-muted)]" />
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
          className="border-t border-black/[0.04] dark:border-white/[0.06] bg-black/[0.01] dark:bg-white/[0.02] p-4 sm:p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="mt-1 text-xs text-[#8E8E93] dark:text-[#A1A1A6]">
                {previewSummary.total} việc · {previewSummary.completed} đã xong · {previewSummary.active} chưa xong
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPreviewDateStr(null)}
              aria-label="Đóng tóm tắt ngày"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] text-[#1C1C1E] dark:text-[#F2F2F7] shadow-2xs cursor-pointer transition-all"
            >
              <X size={15} strokeWidth={2.2} />
            </button>
          </div>

          {previewTasks.length === 0 ? (
            <p className="mt-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] px-4 py-3 text-xs text-[#8E8E93] dark:text-[#A1A1A6]">
              Ngày này chưa có công việc.
            </p>
          ) : (
            <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
              {previewTasks.slice(0, 4).map((task) => {
                const meta = getTaskPreviewMeta(task);
                const isCompleted = task.completed;
                const isOverdue = meta === "Quá hạn" || meta === "Lịch đã qua";
                return (
                  <div
                    key={task.id}
                    style={getTaskCardVisualStyle(task)}
                    className="min-w-0 rounded-2xl px-3.5 py-2.5 shadow-2xs"
                  >
                    <p className={`truncate text-xs font-semibold ${isCompleted ? "line-through opacity-70" : ""}`}>
                      {task.title || "Công việc không có tiêu đề"}
                    </p>
                    <p className={`mt-0.5 text-[11px] font-medium opacity-75 ${isOverdue ? "font-semibold" : ""}`}>
                      {meta}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            {previewTasks.length > 4 ? (
              <p className="text-xs text-[#8E8E93] dark:text-[#A1A1A6] font-medium">+ {previewTasks.length - 4} việc khác</p>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={() => onSelectDate(previewDateStr)}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-2xl bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-hover)] px-4 py-2 text-xs font-semibold text-[var(--text-on-accent)] shadow-xs cursor-pointer transition-all"
            >
              <span>Xem chi tiết ngày</span>
              <ChevronRight size={14} strokeWidth={2.4} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
