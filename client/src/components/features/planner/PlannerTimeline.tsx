import React from "react";
import { ArrowRight, Check, Clock, Trash2 } from "lucide-react";
import { TaskDto } from "../../../types";
import {
  getTaskEffectiveTime,
  normalizeTaskTimeType,
} from "../../../utils/taskSemantics";
import { buildTimelineGridLayout } from "./plannerTimelineLayout";

interface TimelineDay {
  dateStr: string;
  dayName: string;
  dayNum: number;
  isToday: boolean;
}

interface PlannerTimelineProps {
  weekDays: TimelineDay[];
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

const START_HOUR = 0;
const END_HOUR = 24;
const HOUR_HEIGHT = 44;
const MINUTE_MARKS = [15, 30, 45];

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

const getTimelineRange = (task: TaskDto) => {
  const start = parseTime(getTaskEffectiveTime(task));
  if (start === undefined) return undefined;

  const type = normalizeTaskTimeType(task);
  const rawEnd = type === "scheduled" ? parseTime(task.endTime) : undefined;
  const end = rawEnd !== undefined && rawEnd > start ? rawEnd : start + (type === "scheduled" ? 60 : 45);

  return {
    start: Math.max(START_HOUR * 60, Math.min(start, END_HOUR * 60 - 30)),
    end: Math.min(END_HOUR * 60, Math.max(end, start + 30)),
  };
};

interface TimelineTaskCardProps {
  task: TaskDto;
  style?: React.CSSProperties;
  showLabel?: boolean;
  onSelectTask: (task: TaskDto) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onMoveTomorrow?: (taskId: string) => void;
}

// === PHẦN 1: Thẻ task dùng trong biểu đồ tuần ===
const TimelineTaskCard: React.FC<TimelineTaskCardProps> = ({
  task,
  style,
  showLabel = true,
  onSelectTask,
  onToggleTask,
  onDeleteTask,
  onMoveTomorrow,
}) => {
  const type = normalizeTaskTimeType(task);
  const time = getTaskEffectiveTime(task);
  const timeLabel =
    type === "scheduled" && time
      ? `${time}${task.endTime ? ` - ${task.endTime}` : ""}`
      : time
        ? `Hạn ${time}`
        : "";
  const tone = task.completed
    ? "bg-[#BBF7D0]"
    : type === "scheduled"
      ? "bg-[#BAE6FD]"
      : type === "deadline"
        ? "bg-[#FECDD3]"
        : "bg-white";

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
              {timeLabel}
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

// === PHẦN 2: Biểu đồ tuần với trục thời gian dọc ===
export const PlannerTimeline: React.FC<PlannerTimelineProps> = ({
  weekDays,
  todayStr,
  selectedDateStr,
  onPreviewDate,
  getTasksForDate,
  onSelectDate,
  onSelectTask,
  onToggleTask,
  onDeleteTask,
  onMoveTomorrow,
}) => {
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, index) => START_HOUR + index);
  const selectedDay = weekDays.find((day) => day.dateStr === selectedDateStr)
    ?? weekDays.find((day) => day.dateStr === todayStr)
    ?? weekDays[0];
  const selectedDayTasks = selectedDay ? getTasksForDate(selectedDay.dateStr) : [];
  const selectedTimedTasks = selectedDayTasks
    .map((task) => ({ task, range: getTimelineRange(task) }))
    .filter((item): item is { task: TaskDto; range: { start: number; end: number } } => Boolean(item.range));
  const timelineLayout = buildTimelineGridLayout(
    selectedDayTasks,
    getTimelineRange,
    HOUR_HEIGHT,
    32,
  );

  return (
    <div className="w-full space-y-3.5 select-none animate-in fade-in duration-150">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#262626]/20 pb-2">
        <div className="flex items-center gap-2 text-xs font-bold text-[#1C1917]">
          <Clock size={15} strokeWidth={2.4} />
          <span>Thời khóa biểu tuần</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px] text-[#57534E]">
          <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-[2px] bg-[#BAE6FD]" />Lịch hẹn</span>
          <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-[2px] bg-[#FECDD3]" />Hạn</span>
        </div>
      </div>

      <div
        className="min-h-[360px] max-h-[70vh] overflow-auto rounded-[6px] border-[1.5px] border-[#262626] bg-white shadow-[2px_2px_0px_#262626]"
        tabIndex={0}
        aria-label="Vùng cuộn thời khóa biểu tuần"
      >
        <div className="min-w-[620px]">
          <div className="sticky top-0 z-20 grid grid-cols-[62px_repeat(7,minmax(0,1fr))] border-b-[1.5px] border-[#262626] bg-[#FAF8F3]">
            <div className="flex items-center justify-center border-r border-[#D4CEBF] font-mono text-[10px] text-[#78716C]">
              NGÀY
            </div>
            {weekDays.map((day) => {
              const dayTasks = getTasksForDate(day.dateStr);
              const completed = dayTasks.filter((task) => task.completed).length;
              const isSelected = day.dateStr === selectedDay?.dateStr;
              const isToday = day.dateStr === todayStr;

              return (
                <button
                  key={day.dateStr}
                  type="button"
                  onClick={() => (onPreviewDate ? onPreviewDate(day.dateStr) : onSelectDate(day.dateStr))}
                  className={`relative min-h-[58px] border-r border-[#D4CEBF] px-1.5 py-1.5 text-left transition-colors last:border-r-0 hover:bg-white ${
                    isSelected ? "bg-[#1C1917]" : isToday ? "bg-[#FAF8F3]" : ""
                  }`}
                  aria-label={`${day.dayName}, ngày ${day.dayNum}, ${dayTasks.length} việc`}
                >
                  {isToday && (
                    <span className={`absolute right-1 top-0.5 rounded-[2px] px-1 text-[8px] font-bold ${isSelected ? "bg-[#FEF08A] text-[#1C1917]" : "bg-[#1C1917] text-white"}`}>
                      Nay
                    </span>
                  )}
                  <span className={`block font-mono text-[10px] font-bold ${isSelected ? "text-white" : "text-[#57534E]"}`}>{day.dayName}</span>
                  <span className={`block text-sm font-black ${isSelected ? "text-white" : "text-[#1C1917]"}`}>{day.dayNum}</span>
                  <span className={`font-mono text-[9px] ${isSelected ? "text-[#E7E5E4]" : "text-[#78716C]"}`}>{completed}/{dayTasks.length} xong</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-[#D4CEBF] bg-[#FAF8F3] px-2 py-1 text-[10px] font-bold text-[#1C1917]">
            <div>
              {selectedDay ? `${selectedDay.dayName}, ngày ${selectedDay.dayNum}` : "Ngày đang chọn"}
              <span className="ml-2 font-mono font-normal text-[#78716C]">{selectedTimedTasks.length} việc có giờ</span>
            </div>
            <button
              type="button"
              onClick={() => selectedDay && onSelectDate(selectedDay.dateStr)}
              disabled={!selectedDay}
              className="shrink-0 rounded-[3px] border-[1.5px] border-[#262626] bg-white px-2 py-1 text-[10px] font-bold text-[#1C1917] shadow-[1px_1px_0px_#262626] transition-all hover:bg-[#F3EFE6] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              Chi tiết ngày
            </button>
          </div>

          <div className="grid grid-cols-[62px_minmax(0,1fr)]">
            <div className="relative border-r border-[#D4CEBF] bg-[#FAF8F3]" style={{ height: timelineLayout.totalHeight }}>
              {timelineLayout.hours.map(({ hour, top, height }) => (
                <div
                  key={hour}
                  className="absolute left-0 right-0 border-b border-[#D4CEBF] px-1.5 pt-1 font-mono text-[10px] text-[#78716C]"
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
                  {MINUTE_MARKS.map((minute) => (
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
                <TimelineTaskCard
                  key={`${segment.task.id}-${index}`}
                  task={segment.task}
                  showLabel={segment.showLabel}
                  style={{
                    top: segment.top,
                    left: `${segment.left}%`,
                    width: `${segment.width}%`,
                    height: segment.height,
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
    </div>
  );
};
