import React, { useEffect, useState } from "react";
import { Clock, Hourglass, X } from "lucide-react";
import { TaskDto } from "../../../types";
import { useAppStore } from "../../../stores/appStore";
import { formatShortDayMonth } from "../../../utils/date";
import {
  getTaskEffectiveTime,
  getTaskTemporalState,
  getTaskItemType,
  normalizeTaskTimeType,
} from "../../../utils/taskSemantics";

export interface DesktopPlannerCalendarProps {
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
  onPreviewTask?: (task: TaskDto, anchorRect?: DOMRect | null) => void;
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

export const DesktopPlannerCalendar: React.FC<DesktopPlannerCalendarProps> = ({
  selectedDateStr,
  onSelectDate,
  todayStr,
  monthMatrix,
  getTasksForDate,
  getTaskSummaryForDate,
  onPreviewTask,
}) => {
  const { openTaskDetail } = useAppStore();
  const [previewDateStr, setPreviewDateStr] = useState<string | null>(null);
  const [previewAnchorRect, setPreviewAnchorRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    setPreviewDateStr(null);
    setPreviewAnchorRect(null);
  }, [monthMatrix]);

  useEffect(() => {
    if (!previewDateStr) return;

    const closeOnResize = () => {
      setPreviewDateStr(null);
      setPreviewAnchorRect(null);
    };

    window.addEventListener("resize", closeOnResize);
    return () => window.removeEventListener("resize", closeOnResize);
  }, [previewDateStr]);

  const previewTasks = previewDateStr ? getTasksForDate(previewDateStr) : [];
  const previewSummary = previewDateStr
    ? getTaskSummaryForDate(previewDateStr)
    : null;

  const getTaskPreviewMeta = (task: TaskDto) => {
    const type = normalizeTaskTimeType(task);
    const isEvent = getTaskItemType(task) === "event";
    const time = getTaskEffectiveTime(task);

    if (isEvent) {
      const label = time ? `Sự kiện · ${time}` : "Sự kiện · Cả ngày";
      return getTaskTemporalState(task) === "pastScheduled" ? `${label} · Đã qua` : label;
    }

    if (task.completed) return "Đã xong";

    const temporalState = getTaskTemporalState(task);
    if (temporalState === "overdue") return "Quá hạn";
    if (temporalState === "pastScheduled") return "Lịch đã qua";

    if (time) return `${type === "scheduled" ? "Lịch hẹn" : "Hạn"} · ${time}`;
    return type === "scheduled" ? "Lịch hẹn · Cả ngày" : "Chưa đặt giờ";
  };

  return (
    <section className="w-full min-w-0 overflow-hidden rounded-[8px] border border-[#E5E5EA] dark:border-[#2C2C2E] bg-white dark:bg-[#1C1C1E] shadow-sm select-none">
      {/* 1. Header các thứ trong tuần */}
      <div className="grid grid-cols-7 border-b border-[#E5E5EA] dark:border-[#2C2C2E] bg-[#F2F2F7] dark:bg-[#202023]">
        {WEEKDAYS.map((day) => (
          <div
            key={day.short}
            className="flex min-w-0 min-h-[38px] items-center justify-center border-r border-[#E5E5EA]/70 dark:border-[#2C2C2E] px-1 text-center text-[11px] font-extrabold uppercase tracking-wider text-[#8E8E93] dark:text-[#8E8E93] last:border-r-0"
          >
            <span>{day.label}</span>
          </div>
        ))}
      </div>

      {/* 2. Lưới 35 hoặc 42 ô ngày (div container, 0% lồng button) */}
      <div className="grid grid-cols-7 divide-x divide-y divide-[#E5E5EA] dark:divide-[#2C2C2E] bg-[#E5E5EA] dark:bg-[#2C2C2E]">
        {monthMatrix.map((item) => {
          const isCurrentMonth = item.isCurrentMonth;
          const dayTasks = isCurrentMonth ? getTasksForDate(item.dateStr) : [];
          const taskCount = dayTasks.length;

          const isSelected = isCurrentMonth && selectedDateStr === item.dateStr;
          const isToday = isCurrentMonth && todayStr === item.dateStr;
          const isPast = isCurrentMonth && item.dateStr < todayStr;

          // Sắp xếp: Scheduled -> Deadline -> Others; Chưa hoàn thành trước
          const sortedTasks = [...dayTasks].sort((a, b) => {
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            const normA = normalizeTaskTimeType(a);
            const normB = normalizeTaskTimeType(b);
            if (normA === "scheduled" && normB !== "scheduled") return -1;
            if (normA !== "scheduled" && normB === "scheduled") return 1;
            return 0;
          });

          const maxVisibleChips = 3;
          const visibleTasks = sortedTasks.slice(0, maxVisibleChips);
          const hiddenCount = taskCount - maxVisibleChips;

          let cellBg = "bg-white dark:bg-[#1C1C1E]";
          if (!isCurrentMonth) {
            cellBg = "bg-[#F2F2F7]/80 dark:bg-[#141416] opacity-45";
          } else if (isSelected) {
            cellBg = "bg-[#007AFF]/[0.08] dark:bg-[#0A84FF]/[0.12] ring-1 ring-inset ring-[#007AFF] dark:ring-[#0A84FF]";
          } else if (isToday) {
            cellBg = "bg-[#007AFF]/[0.025] dark:bg-[#0A84FF]/[0.03]";
          }

          return (
            <div
              key={item.dateStr}
              role="gridcell"
              className={`relative flex min-w-0 min-h-[105px] lg:min-h-[120px] flex-col justify-between p-2 transition-colors ${cellBg}`}
            >
              {/* Header của ô ngày: Nút số ngày + Tổng số việc */}
              <div className="flex items-center justify-between gap-1 w-full">
                {isCurrentMonth ? (
                  <button
                    type="button"
                    onClick={() => onSelectDate(item.dateStr)}
                    className={`flex h-[26px] w-[26px] items-center justify-center rounded-full font-mono text-xs font-bold transition-transform active:scale-90 cursor-pointer ${
                      isToday
                        ? "bg-[#007AFF] dark:bg-[#0A84FF] text-white shadow-sm font-black"
                        : isSelected
                          ? "border-2 border-[#007AFF] dark:border-[#0A84FF] text-[#007AFF] dark:text-[#0A84FF]"
                          : isPast
                            ? "text-[#8E8E93] dark:text-[#8E8E93] hover:bg-neutral-100 dark:hover:bg-[#2C2C2E]"
                            : "text-[#1C1C1E] dark:text-[#F2F2F7] hover:bg-neutral-100 dark:hover:bg-[#2C2C2E]"
                    }`}
                    title={`Xem chi tiết ngày ${formatShortDayMonth(item.dateStr)}`}
                  >
                    {item.dayNum}
                  </button>
                ) : (
                  <span className="flex h-6 w-6 items-center justify-center font-mono text-xs text-[#8E8E93] dark:text-[#636366]">
                    {item.dayNum}
                  </span>
                )}

                {taskCount > 0 && isCurrentMonth && (
                  <button
                    type="button"
                    onClick={() => onSelectDate(item.dateStr)}
                    className="font-mono text-[10px] font-bold text-[#8E8E93] dark:text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white cursor-pointer"
                    title={`${taskCount} công việc`}
                  >
                    {taskCount} việc
                  </button>
                )}
              </div>

              {/* Danh sách Task Chips (Độc lập, click mở TaskDetailPage) */}
              {isCurrentMonth && taskCount > 0 && (
                <div className="mt-1.5 space-y-1 flex-1 flex flex-col justify-start">
                  {visibleTasks.map((task) => {
                    const time = getTaskEffectiveTime(task);
                    const normType = normalizeTaskTimeType(task);

                    const chipTone = task.completed
                      ? "bg-[var(--bg-surface-muted)] border-[var(--border-ink)] text-[var(--text-muted)] line-through opacity-60"
                      : "bg-[var(--accent-blue)] border-[var(--accent-blue)] text-white hover:brightness-95 dark:hover:brightness-110";

                    return (
                      <button
                        key={task.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          if (onPreviewTask) {
                            onPreviewTask(task, rect);
                          } else {
                            openTaskDetail(task.id);
                          }
                        }}
                        title={`${task.title}${time ? ` (${time})` : ""}`}
                        className={`flex w-full min-w-0 items-center gap-1 rounded-xl border px-1.5 py-0.5 text-left text-[10.5px] font-bold transition-all active:scale-[0.98] cursor-pointer shadow-sm ${chipTone}`}
                      >
                        {normType === "deadline" ? (
                          <Hourglass size={9.5} className="shrink-0 text-white" />
                        ) : normType === "scheduled" ? (
                          <Clock size={9.5} className="shrink-0 text-white" />
                        ) : null}

                        {time && (
                          <span className="font-mono text-[9px] font-semibold shrink-0 opacity-80">
                            {time}
                          </span>
                        )}

                        <span className="truncate flex-1 min-w-0">
                          {task.title}
                        </span>
                      </button>
                    );
                  })}

                  {/* Nút +N khác mở xem nhanh ngày */}
                  {hiddenCount > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewDateStr(item.dateStr);
                        setPreviewAnchorRect((e.currentTarget as HTMLElement).getBoundingClientRect());
                      }}
                      className="text-left font-mono text-[9.5px] font-bold text-[#007AFF] dark:text-[#0A84FF] hover:underline cursor-pointer py-0.5"
                    >
                      +{hiddenCount} việc khác
                    </button>
                  )}
                </div>
              )}

              {/* Khoảng trống đệm khi ô trống */}
              {(!isCurrentMonth || taskCount === 0) && <div className="flex-1" />}
            </div>
          );
        })}
      </div>

      {/* 3. Popover tóm tắt ngày cạnh ô +N, không làm tăng chiều cao lịch */}
      {previewDateStr && previewSummary && previewAnchorRect && (() => {
        const popoverWidth = 360;
        const popoverHeight = 360;
        const edgeGap = 12;
        const gap = 8;
        const canOpenRight = previewAnchorRect.right + gap + popoverWidth <= window.innerWidth - edgeGap;
        const preferredLeft = canOpenRight
          ? previewAnchorRect.right + gap
          : previewAnchorRect.left - popoverWidth - gap;
        const left = Math.max(
          edgeGap,
          Math.min(preferredLeft, window.innerWidth - popoverWidth - edgeGap),
        );
        const top = Math.max(
          edgeGap,
          Math.min(previewAnchorRect.top, window.innerHeight - popoverHeight - edgeGap),
        );

        return (
          <div
            role="dialog"
            aria-label={`Tóm tắt ${formatShortDayMonth(previewDateStr)}`}
            className="fixed z-40 flex max-h-[min(360px,calc(100vh-24px))] w-[min(360px,calc(100vw-24px))] flex-col rounded-[12px] border-[1.5px] border-[#262626] dark:border-[#38383A] bg-[#F2F2F7] dark:bg-[#202023] p-3 shadow-[4px_4px_0px_#262626] dark:shadow-[4px_4px_0px_#000000] animate-in fade-in zoom-in-95 duration-150"
            style={{ left, top }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10.5px] font-bold uppercase tracking-wider text-[#8E8E93] dark:text-[#8E8E93]">
                  Tóm tắt công việc trong ngày
                </p>
                <h3 className="mt-0.5 truncate text-base font-black text-[#1C1C1E] dark:text-white">
                  {formatShortDayMonth(previewDateStr)}
                </h3>
                <p className="mt-1 text-xs text-[#8E8E93] dark:text-[#8E8E93]">
                  {previewSummary.total} việc · {previewSummary.completed} đã xong · {previewSummary.active} chưa xong
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPreviewDateStr(null);
                  setPreviewAnchorRect(null);
                }}
                aria-label="Đóng tóm tắt ngày"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] border border-[#E5E5EA] dark:border-[#3A3A3C] bg-white dark:bg-[#2C2C2E] text-[#8E8E93] dark:text-white hover:bg-[#E5E5EA] dark:hover:bg-[#3A3A3C] active:scale-95 transition-all cursor-pointer"
              >
                <X size={14} strokeWidth={2.4} />
              </button>
            </div>

            {previewTasks.length === 0 ? (
              <p className="mt-3 border border-dashed border-[#E5E5EA] dark:border-[#2C2C2E] px-3 py-2 text-xs text-[#8E8E93]">
                Ngày này chưa có công việc.
              </p>
            ) : (
              <div className="mt-3 min-h-0 space-y-1.5 overflow-y-auto pr-1">
                {previewTasks.slice(0, 6).map((task) => {
                  const meta = getTaskPreviewMeta(task);
                  const isCompleted = task.completed;
                    return (
                      <button
                        key={task.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          setPreviewDateStr(null);
                          setPreviewAnchorRect(null);
                          if (onPreviewTask) {
                            onPreviewTask(task, rect);
                          } else {
                            openTaskDetail(task.id);
                          }
                        }}
                        className="flex w-full items-center justify-between gap-3 rounded-[6px] border border-[#E5E5EA] dark:border-[#3A3A3C] bg-white dark:bg-[#1C1C1E] p-2 text-left hover:border-[#007AFF] dark:hover:border-[#0A84FF] transition-all cursor-pointer"
                      >
                      <p className={`min-w-0 truncate text-xs font-bold ${isCompleted ? "text-emerald-600 line-through" : "text-[#1C1C1E] dark:text-white"}`}>
                        {task.title || "Công việc không tên"}
                      </p>
                      <p className="shrink-0 text-[10px] font-semibold text-[#8E8E93] dark:text-[#8E8E93]">
                        {meta}
                      </p>
                    </button>
                  );
                })}
                {previewTasks.length > 6 && (
                  <p className="pt-1 text-[10px] font-semibold text-[#8E8E93] dark:text-[#8E8E93]">
                    +{previewTasks.length - 6} việc khác trong ngày
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })()}

    </section>
  );
};
