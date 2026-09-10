import React from "react";
import { ArrowRight, Check, Clock, Trash2 } from "lucide-react";
import { TaskDto } from "../../../types";
import { getTaskEffectiveTime, normalizeTaskTimeType } from "../../../utils/taskSemantics";
import { buildTimelineGridLayout } from "./plannerTimelineLayout";

export type PlannerDayTimelineMode = "hour" | "minute";

interface PlannerDayTimelineProps {
  tasks: TaskDto[];
  mode: PlannerDayTimelineMode;
  onModeChange: (mode: PlannerDayTimelineMode) => void;
  onSelectTask: (task: TaskDto) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onMoveTomorrow?: (taskId: string) => void;
}

const MINUTES_PER_DAY = 24 * 60;
const HOUR_ROW_HEIGHT = 52;
const MINUTE_MARKS = [0, 15, 30, 45, 60];

const parseTime = (value?: string) => {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) return undefined;
  const [hours, minutes] = value.split(":").map(Number);
  if (hours > 23 || minutes > 59) return undefined;
  return hours * 60 + minutes;
};

const formatTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
};

const getTaskRange = (task: TaskDto) => {
  const start = parseTime(getTaskEffectiveTime(task));
  if (start === undefined) return undefined;

  const type = normalizeTaskTimeType(task);
  const rawEnd = type === "scheduled" ? parseTime(task.endTime) : undefined;
  const end = rawEnd !== undefined && rawEnd > start
    ? rawEnd
    : start + (type === "scheduled" ? 60 : 45);

  return {
    start: Math.max(0, Math.min(start, MINUTES_PER_DAY - 15)),
    end: Math.min(MINUTES_PER_DAY, Math.max(end, start + 15)),
  };
};

const getTaskTimeLabel = (task: TaskDto) => {
  const time = getTaskEffectiveTime(task);
  if (!time) return "";
  return normalizeTaskTimeType(task) === "scheduled"
    ? `${time}${task.endTime ? ` - ${task.endTime}` : ""}`
    : `Hạn ${time}`;
};

// === PHẦN 1: Thẻ task đặt trên biểu đồ chi tiết ngày ===
const DayTimelineTaskCard: React.FC<{
  task: TaskDto;
  style: React.CSSProperties;
  showLabel?: boolean;
  onSelectTask: (task: TaskDto) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onMoveTomorrow?: (taskId: string) => void;
}> = ({ task, style, showLabel = true, onSelectTask, onToggleTask, onDeleteTask, onMoveTomorrow }) => {
  const type = normalizeTaskTimeType(task);
  const tone = task.completed
    ? "bg-[#BBF7D0]"
    : type === "scheduled"
      ? "bg-[#BAE6FD]"
      : "bg-[#FECDD3]";

  return (
    <article
      style={style}
      className={`group absolute overflow-hidden border-[1.5px] border-[#262626] ${tone} p-1.5 shadow-[1.5px_1.5px_0px_#262626]`}
    >
      <div className="flex min-w-0 items-start gap-1.5">
        <button
          type="button"
          onClick={() => onToggleTask(task.id)}
          aria-label={task.completed ? `Bỏ hoàn thành: ${task.title}` : `Hoàn thành: ${task.title}`}
          className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border-[1.5px] border-[#262626] bg-white text-[#1C1917] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
        >
          {task.completed && <Check size={11} strokeWidth={3} />}
        </button>

        <button
          type="button"
          onClick={() => onSelectTask(task)}
          className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7]"
          title="Mở chi tiết task"
        >
          <span className={`block truncate text-[11px] font-bold leading-tight text-[#1C1917] ${task.completed ? "line-through opacity-60" : ""}`}>
            {showLabel ? task.title : "Tiếp tục"}
          </span>
          {showLabel && (
            <span className="mt-0.5 block truncate font-mono text-[9px] text-[#57534E]">
              {getTaskTimeLabel(task)}
            </span>
          )}
        </button>

        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          {onMoveTomorrow && (
            <button
              type="button"
              onClick={() => onMoveTomorrow(task.id)}
              aria-label={`Dời sang ngày mai: ${task.title}`}
              title="Dời sang ngày mai"
              className="flex h-5 w-5 items-center justify-center rounded-[3px] border border-[#262626] bg-white text-[#1C1917] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
            >
              <ArrowRight size={11} strokeWidth={2.4} />
            </button>
          )}
          <button
            type="button"
            onClick={() => onDeleteTask(task.id)}
            aria-label={`Xóa task: ${task.title}`}
            title="Xóa task"
            className="flex h-5 w-5 items-center justify-center rounded-[3px] border border-[#BE123C] bg-white text-[#BE123C] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
          >
            <Trash2 size={11} strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </article>
  );
};

// === PHẦN 2: Biểu đồ ngày với hai mức chi tiết dành riêng cho desktop ===
export const PlannerDayTimeline: React.FC<PlannerDayTimelineProps> = ({
  tasks,
  mode,
  onModeChange,
  onSelectTask,
  onToggleTask,
  onDeleteTask,
  onMoveTomorrow,
}) => {
  const rowHeight = HOUR_ROW_HEIGHT;
  const visibleMinuteMarks = mode === "hour" ? [0, 30, 60] : MINUTE_MARKS;
  const timedTasks = tasks
    .map((task) => ({ task, range: getTaskRange(task) }))
    .filter((item): item is { task: TaskDto; range: { start: number; end: number } } => Boolean(item.range))
    .sort((a, b) => a.range.start - b.range.start);

  const timelineLayout = buildTimelineGridLayout(tasks, getTaskRange, rowHeight, 42);

  if (timedTasks.length === 0) return null;

  return (
    <section className="space-y-2.5 select-none animate-in fade-in duration-150">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#262626]/20 pb-1.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#1C1917]">
          <Clock size={14} strokeWidth={2.4} />
          <span>Biểu đồ trong ngày ({timedTasks.length})</span>
        </div>

        <div className="inline-flex items-center gap-0.5 rounded-[5px] border-[1.5px] border-[#262626] bg-[#FAF8F3] p-0.5 shadow-[1px_1px_0px_#262626]" role="tablist" aria-label="Kiểu biểu đồ ngày">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "hour"}
            onClick={() => onModeChange("hour")}
            className={`rounded-[3px] px-2 py-1 text-[10px] font-bold transition-all active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none ${
              mode === "hour"
                ? "border-[1.5px] border-[#262626] bg-[#1C1917] text-white shadow-[1px_1px_0px_#262626]"
                : "text-[#57534E] hover:bg-white"
            }`}
          >
            Theo giờ
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "minute"}
            onClick={() => onModeChange("minute")}
            className={`rounded-[3px] px-2 py-1 text-[10px] font-bold transition-all active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none ${
              mode === "minute"
                ? "border-[1.5px] border-[#262626] bg-[#1C1917] text-white shadow-[1px_1px_0px_#262626]"
                : "text-[#57534E] hover:bg-white"
            }`}
          >
            Giờ-phút
          </button>
        </div>
      </div>

      <div
        className="min-h-[260px] max-h-[58vh] overflow-auto rounded-[6px] border-[1.5px] border-[#262626] bg-white shadow-[2px_2px_0px_#262626]"
        tabIndex={0}
        aria-label="Vùng cuộn biểu đồ chi tiết ngày"
      >
        <div className="min-w-[560px]">
          <div className="grid grid-cols-[72px_minmax(0,1fr)] border-b border-[#D4CEBF] bg-[#FAF8F3]">
            <div className="border-r border-[#D4CEBF] px-1.5 py-1 font-mono text-[9px] text-[#78716C]">GIỜ</div>
            <div className="relative h-7 font-mono text-[9px] text-[#78716C]">
              {visibleMinuteMarks.map((minute) => (
                <span key={minute} className="absolute top-1 -translate-x-1/2" style={{ left: `${(minute / 60) * 100}%` }}>
                  {String(minute).padStart(2, "0")}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-[72px_minmax(0,1fr)]">
            <div className="relative border-r border-[#D4CEBF] bg-[#FAF8F3]" style={{ height: timelineLayout.totalHeight }}>
              {timelineLayout.hours.map(({ hour, top, height }) => (
                <div
                  key={hour}
                  className="absolute left-0 right-0 border-b border-[#D4CEBF] px-1.5 pt-1 font-mono text-[10px] text-[#57534E]"
                  style={{ top, height }}
                >
                  {formatTime(hour * 60)}
                </div>
              ))}
            </div>

            <div className="relative" style={{ height: timelineLayout.totalHeight }}>
              {timelineLayout.hours.map(({ hour, top, height }) => (
                <div
                  key={hour}
                  className="absolute left-0 right-0 border-b border-[#D4CEBF]"
                  style={{ top, height }}
                >
                  {visibleMinuteMarks.slice(1, -1).map((minute) => (
                    <span
                      key={minute}
                      aria-hidden="true"
                      className="pointer-events-none absolute bottom-0 top-0 border-l border-dashed border-[#D4CEBF]/70"
                      style={{ left: `${(minute / 60) * 100}%` }}
                    />
                  ))}
                </div>
              ))}

              {timelineLayout.segments.map((segment, index) => (
                <DayTimelineTaskCard
                  key={`${segment.task.id}-${index}`}
                  task={segment.task}
                  showLabel={segment.showLabel}
                  style={{
                    top: segment.top + 2,
                    left: `${segment.left}%`,
                    width: `${segment.width}%`,
                    height: rowHeight - 4,
                  }}
                  onSelectTask={onSelectTask}
                  onToggleTask={onToggleTask}
                  onDeleteTask={onDeleteTask}
                  onMoveTomorrow={onMoveTomorrow}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
