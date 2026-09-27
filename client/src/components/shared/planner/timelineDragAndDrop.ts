import { TaskDto } from "../../../types";
import {
  getTaskEffectiveDate,
  getTaskEffectiveTime,
  getTaskItemType,
  getTaskTimelineRangeForDate,
  moveTaskToDate,
  normalizeTaskTimeType,
} from "../../../utils/taskSemantics";

export const TIMELINE_DRAG_MIME = "application/x-sketchtask-timeline";
const MINUTES_PER_DAY = 24 * 60;

export interface TimelineDragPayload {
  taskId: string;
}

export const createTimelineDragPayload = (taskId: string): string =>
  JSON.stringify({ taskId } satisfies TimelineDragPayload);

export const readTimelineDragPayload = (dataTransfer: DataTransfer): TimelineDragPayload | null => {
  const raw = dataTransfer.getData(TIMELINE_DRAG_MIME) || dataTransfer.getData("text/plain");
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<TimelineDragPayload>;
    return parsed.taskId ? { taskId: parsed.taskId } : null;
  } catch {
    return { taskId: raw };
  }
};

const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
};

export const formatDuration = (startMinutes: number, endMinutes: number): string => {
  const diff = Math.max(0, endMinutes - startMinutes);
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  if (h === 0) return `${m}p`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}p`;
};

/** Build updates for a desktop timeline drop without changing Event/Task semantics. */
export const getTimelineDropUpdates = (
  task: TaskDto,
  targetDate: string,
  targetStartMinutes: number,
): Partial<TaskDto> => {
  const type = normalizeTaskTimeType(task);
  const targetTime = formatTime(Math.max(0, Math.min(MINUTES_PER_DAY - 15, targetStartMinutes)));

  // A start-only event stays a point when moved. Only an explicit resize adds
  // an end time, so the timeline never creates duration the user did not set.
  if (getTaskItemType(task) === "event" && !task.endTime) {
    return {
      ...moveTaskToDate(task, targetDate),
      dueDate: `${targetDate} ${targetTime}`,
      timeType: "event",
      startTime: targetTime,
      endTime: undefined,
      deadlineDate: undefined,
      deadlineTime: undefined,
    };
  }

  if (type === "scheduled") {
    const sourceDate = getTaskEffectiveDate(task) || targetDate;
    const sourceRange = getTaskTimelineRangeForDate(task, sourceDate);
    const duration = sourceRange
      ? Math.max(15, sourceRange.end - sourceRange.start)
      : 60;
    const startMinutes = Math.min(
      Math.max(0, targetStartMinutes),
      Math.max(0, MINUTES_PER_DAY - duration),
    );
    const endMinutes = Math.min(MINUTES_PER_DAY, startMinutes + duration);

    return {
      ...moveTaskToDate(task, targetDate),
      dueDate: `${targetDate} ${formatTime(startMinutes)}`,
      timeType: "scheduled",
      startTime: formatTime(startMinutes),
      endTime: endMinutes >= MINUTES_PER_DAY ? "23:59" : formatTime(endMinutes),
    };
  }

  if (type === "deadline") {
    return {
      ...moveTaskToDate(task, targetDate),
      dueDate: `${targetDate} ${targetTime}`,
      timeType: "deadline",
      startTime: undefined,
      endTime: undefined,
      deadlineDate: targetDate,
      deadlineTime: targetTime,
    };
  }

  // A task dropped on a time grid gets a deadline at that point. It never
  // acquires an invented 60-minute duration; duration belongs to Event only.
  return {
    ...moveTaskToDate(task, targetDate),
    dueDate: `${targetDate} ${targetTime}`,
    timeType: "deadline",
    startTime: undefined,
    endTime: undefined,
    deadlineDate: targetDate,
    deadlineTime: targetTime,
  };
};

/** Build updates for resizing an Event block. Legacy scheduled tasks remain untouched. */
export const getTimelineResizeUpdates = (
  task: TaskDto,
  targetDate: string,
  edge: "top" | "bottom",
  newMinutes: number,
): Partial<TaskDto> => {
  const sourceDate = getTaskEffectiveDate(task) || targetDate;
  const effectiveTime = getTaskEffectiveTime(task);
  let currentStart = 9 * 60;
  if (effectiveTime && /^\d{2}:\d{2}$/.test(effectiveTime)) {
    const [h, m] = effectiveTime.split(":").map(Number);
    currentStart = h * 60 + m;
  }
  const sourceRange = getTaskTimelineRangeForDate(task, sourceDate);
  const currentEnd = sourceRange ? sourceRange.end : currentStart + 60;

  let startMinutes = currentStart;
  let endMinutes = currentEnd;

  if (edge === "top") {
    // Top edge sets startTime: cannot exceed endMinutes - 15
    startMinutes = Math.max(0, Math.min(newMinutes, endMinutes - 15));
  } else {
    // Bottom edge sets endTime: cannot be less than startMinutes + 15
    endMinutes = Math.min(MINUTES_PER_DAY, Math.max(newMinutes, startMinutes + 15));
  }

  const startStr = formatTime(startMinutes);
  const endStr = endMinutes >= MINUTES_PER_DAY ? "23:59" : formatTime(endMinutes);
  const isEvent = getTaskItemType(task) === "event";

  if (!isEvent) {
    return {};
  }

  return {
    ...moveTaskToDate(task, targetDate),
    dueDate: `${targetDate} ${startStr}`,
    timeType: "event",
    startTime: startStr,
    endTime: endStr,
    deadlineTime: undefined,
  };
};
