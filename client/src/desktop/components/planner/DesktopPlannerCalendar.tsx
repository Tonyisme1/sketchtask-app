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
  getTaskCardVisualStyle,
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
  itemLabel?: "việc" | "sự kiện";
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
  itemLabel = "việc",
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
    <section className="w-full min-w-0 overflow-hidden rounded-2xl border-none bg-white dark:bg-[#1C1C1E] shadow-sm select-none">
      {/* 1. Header các thứ trong tuần */}
      <div className="grid grid-cols-7 bg-[#F2F2F7] dark:bg-[#202023]">
        {WEEKDAYS.map((day) => (
          <div
            key={day.short}
            className="flex min-w-0 min-h-[38px] items-center justify-center px-1 text-center text-[11px] font-extrabold uppercase tracking-wider text-[#8E8E93] dark:text-[#8E8E93]"
          >
            <span>{day.label}</span>
          </div>
        ))}
      </div>

      {/* 2. Lưới 35 hoặc 42 ô ngày */}
      <div className="grid grid-cols-7 gap-1 bg-[#F2F2F7] dark:bg-[#12161B] p-1.5">
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

          let cellBg = "bg-white dark:bg-[#1E222A]";
          if (!isCurrentMonth) {
            cellBg = "bg-[#F2F2F7]/80 dark:bg-[#141416] opacity-45";
          } else if (isSelected) {
            cellBg = "bg-[var(--accent-blue)]/[0.08] dark:bg-[var(--accent-blue)]/[0.16] ring-2 ring-inset ring-[var(--accent-blue)]";
          } else if (isToday) {
            cellBg = "bg-[var(--accent-sky)]/[0.25] dark:bg-[var(--accent-sky)]/[0.12]";
          }

          return (
            <div
              key={item.dateStr}
              role="gridcell"
              onClick={() => isCurrentMonth && onSelectDate(item.dateStr)}
              className={`relative flex min-w-0 min-h-[105px] lg:min-h-[120px] flex-col justify-between p-2 transition-colors ${isCurrentMonth ? "cursor-pointer" : ""} ${cellBg}`}
            >
              {/* Header của ô ngày: Nút số ngày + Tổng số việc */}
              <div className="flex items-center justify-between gap-1 w-full">
                {isCurrentMonth ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectDate(item.dateStr);
                    }}
                    className={`flex h-[26px] w-[26px] items-center justify-center rounded-full font-mono text-xs font-bold transition-transform active:scale-90 cursor-pointer ${
                      isToday
                        ? "bg-[var(--accent-blue)] text-white shadow-sm font-black"
                        : isSelected
                          ? "bg-[var(--accent-blue)] text-white"
                          : isPast
                            ? "text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/10"
                            : "text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/10"
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
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectDate(item.dateStr);
                    }}
                    className="font-mono text-[10px] font-bold text-[#8E8E93] dark:text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white cursor-pointer"
                    title={`${taskCount} công việc`}
                  >
                    {taskCount} {itemLabel}
                  </button>
                )}
              </div>

              {/* Danh sách Task Chips (Độc lập, click mở TaskDetailPage) */}
              {isCurrentMonth && taskCount > 0 && (
                <div className="mt-1.5 space-y-1 flex-1 flex flex-col justify-start">
                  {visibleTasks.map((task) => {
                    const time = getTaskEffectiveTime(task);
                    const normType = normalizeTaskTimeType(task);
                    const isPastEvent =
                      getTaskItemType(task) === "event" && item.dateStr < todayStr;

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
                        style={getTaskCardVisualStyle(task)}
                        className={`planner-calendar-card flex w-full min-w-0 items-center gap-1 rounded-xl px-2 py-0.5 text-left text-[10.5px] font-bold transition-all active:scale-[0.98] cursor-pointer shadow-2xs ${task.completed ? "line-through opacity-60" : isPastEvent ? "opacity-60" : "hover:brightness-95 dark:hover:brightness-110"}`}
                      >
                        {normType === "deadline" ? (
                          <Hourglass size={9.5} className="shrink-0 text-current" />
                        ) : normType === "scheduled" ? (
                          <Clock size={9.5} className="shrink-0 text-current" />
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
            className="fixed z-40 flex max-h-[min(360px,calc(100vh-24px))] w-[min(360px,calc(100vw-24px))] flex-col rounded-3xl bg-white dark:bg-[#1E222A] border border-black/[0.06] dark:border-white/[0.08] p-3 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            style={{ left, top }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10.5px] font-bold uppercase tracking-wider text-[#8E8E93] dark:text-[#8E8E93]">
                  Tóm tắt {itemLabel} trong ngày
                </p>
                <h3 className="mt-0.5 truncate text-base font-black text-[#1C1C1E] dark:text-white">
                  {formatShortDayMonth(previewDateStr)}
                </h3>
                <p className="mt-1 text-xs text-[#8E8E93] dark:text-[#8E8E93]">
                  {previewSummary.total} {itemLabel} · {previewSummary.completed} đã xong · {previewSummary.active} chưa xong
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPreviewDateStr(null);
                  setPreviewAnchorRect(null);
                }}
                aria-label="Đóng tóm tắt ngày"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-2xl bg-white dark:bg-[#2C2C2E] text-[#8E8E93] dark:text-white hover:bg-[#E5E5EA] dark:hover:bg-[#3A3A3C] active:scale-95 transition-all cursor-pointer shadow-xs"
              >
                <X size={14} strokeWidth={2.4} />
              </button>
            </div>

            {previewTasks.length === 0 ? (
              <p className="mt-3 rounded-2xl bg-black/5 dark:bg-white/5 px-3 py-2 text-xs text-[#8E8E93]">
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
                        style={getTaskCardVisualStyle(task)}
                        className="flex w-full items-center justify-between gap-3 rounded-2xl p-2.5 text-left hover:brightness-95 dark:hover:brightness-110 shadow-xs transition-all cursor-pointer"
                      >
                      <p className={`min-w-0 truncate text-xs font-bold ${isCompleted ? "line-through opacity-70" : ""}`}>
                        {task.title || "Công việc không tên"}
                      </p>
                      <p className="shrink-0 text-[10px] font-semibold opacity-75">
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
