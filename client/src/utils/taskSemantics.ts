import { TaskDto, TaskTimeType } from "../types";
import { getLocalTodayStr } from "./date";

export type NormalizedTaskTimeType = "scheduled" | "deadline" | "none";

export type TaskParentScope = "today" | "planner" | "global";

export type TaskTemporalState =
  | "unscheduled"
  | "dateOnly"
  | "upcoming"
  | "pastScheduled"
  | "overdue"
  | "completed";

export interface TaskDateTime {
  date?: string;
  time?: string;
}

export interface ParentSelectOption {
  value: string;
  label: string;
  group?: string;
  depth?: number;
  badge?: string;
}

/** Build the canonical date/time value used by legacy dueDate. */
export const formatTaskDateTime = (date?: string, time?: string): string | undefined => {
  if (!date) return undefined;
  return `${date}${time ? ` ${time}` : ""}`;
};

const shiftIsoDate = (date: string, days: number): string => {
  const [year, month, day] = date.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day));
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
};

const daysBetweenIsoDates = (startDate: string, endDate: string): number => {
  const start = Date.parse(`${startDate}T00:00:00Z`);
  const end = Date.parse(`${endDate}T00:00:00Z`);
  return Math.max(0, Math.round((end - start) / (24 * 60 * 60 * 1000)));
};

const LEGACY_TIME_TYPES: Record<string, NormalizedTaskTimeType> = {
  event: "scheduled",
  task: "deadline",
};

const getDueDateParts = (dueDate?: string): TaskDateTime => {
  const value = dueDate?.trim();
  if (!value) return {};

  const [date, time] = value.split(/\s+/, 2);
  return {
    date: date || undefined,
    time: time && /^\d{2}:\d{2}$/.test(time) ? time : undefined,
  };
};

export const normalizeTaskTimeType = (task: Pick<TaskDto, "timeType" | "startTime" | "deadlineDate" | "deadlineTime">): NormalizedTaskTimeType => {
  const rawType = task.timeType as TaskTimeType | undefined;

  if (rawType === "scheduled" || (rawType && LEGACY_TIME_TYPES[rawType] === "scheduled")) {
    return "scheduled";
  }
  if (rawType === "deadline" || (rawType && LEGACY_TIME_TYPES[rawType] === "deadline")) {
    return "deadline";
  }
  if (task.startTime) return "scheduled";
  if (task.deadlineDate || task.deadlineTime) return "deadline";
  return "none";
};

export const getTaskEffectiveDate = (task: TaskDto): string | undefined => {
  const type = normalizeTaskTimeType(task);
  const { date: dueDateDate } = getDueDateParts(task.dueDate);

  if (type === "scheduled") {
    return dueDateDate || task.startDate;
  }
  if (type === "deadline") {
    return task.deadlineDate || task.startDate || dueDateDate;
  }
  return task.startDate || dueDateDate;
};

/** Lấy ngày bắt đầu của task (hỗ trợ task liên ngày) */
export const getTaskStartDate = (task: TaskDto): string | undefined => {
  return task.startDate || getTaskEffectiveDate(task);
};

/** Lấy ngày kết thúc của task (hỗ trợ task liên ngày & ca đêm) */
export const getTaskEndDate = (task: TaskDto): string | undefined => {
  if (task.endDate) return task.endDate;
  const effectiveDate = getTaskEffectiveDate(task);
  if (
    effectiveDate &&
    normalizeTaskTimeType(task) === "scheduled" &&
    task.startTime &&
    task.endTime
  ) {
    const [startH] = task.startTime.split(":").map(Number);
    const [endH] = task.endTime.split(":").map(Number);
    if (startH > endH) {
      return shiftIsoDate(effectiveDate, 1);
    }
  }
  return effectiveDate;
};

/** Lấy ngày hết hạn thực sự của task (cho tab Deadlines & đếm ngược) */
export const getTaskDeadlineDate = (task: TaskDto): string | undefined => {
  return task.endDate || task.deadlineDate || getTaskEffectiveDate(task);
};

export const getTaskEffectiveTime = (task: TaskDto): string | undefined => {
  const type = normalizeTaskTimeType(task);
  const { time: dueDateTime } = getDueDateParts(task.dueDate);

  if (type === "scheduled") {
    return task.startTime || dueDateTime;
  }
  if (type === "deadline") {
    return task.deadlineTime || dueDateTime;
  }
  return dueDateTime;
};

export const getTaskDateTime = (task: TaskDto): TaskDateTime => ({
  date: getTaskEffectiveDate(task),
  time: getTaskEffectiveTime(task),
});

export const getTaskTemporalState = (task: TaskDto, now: Date = new Date()): TaskTemporalState => {
  if (task.completed) {
    return "completed";
  }

  const startDate = getTaskStartDate(task);
  const endDate = getTaskEndDate(task) || startDate;
  const time = getTaskEffectiveTime(task);

  if (!startDate && !endDate) {
    return "unscheduled";
  }

  const todayStr = getLocalTodayStr(now);
  const type = normalizeTaskTimeType(task);

  // 1. Nếu ngày hôm nay chưa tới ngày bắt đầu (todayStr < startDate) -> Tương lai (Upcoming)
  if (startDate && todayStr < startDate) {
    return type === "none" || !time ? "dateOnly" : "upcoming";
  }

  // 2. Nếu ngày hôm nay đã qua hẳn ngày kết thúc (todayStr > endDate) -> Đã quá hạn / quá lịch
  if (endDate && todayStr > endDate) {
    if (type === "scheduled") {
      return "pastScheduled";
    }
    return "overdue";
  }

  // 3. Ngày hôm nay nằm trong khoảng [startDate, endDate]
  // Nếu hôm nay trước ngày kết thúc (todayStr < endDate) -> Đang trong tiến trình, chưa hết hạn
  if (endDate && todayStr < endDate) {
    return type === "none" || !time ? "dateOnly" : "upcoming";
  }

  // 4. Hôm nay chính là ngày kết thúc (todayStr === endDate)
  if (!time) {
    return "dateOnly";
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  const targetMinutes = hours * 60 + minutes;

  if (type === "scheduled") {
    const [endH, endM] = (task.endTime || time).split(":").map(Number);
    const endMinutes = (endH ?? hours) * 60 + (endM ?? minutes);

    if (currentMinutes > endMinutes) {
      return "pastScheduled";
    }
    return "upcoming";
  }

  if (type === "deadline") {
    if (currentMinutes > targetMinutes) {
      return "overdue";
    }
    return "upcoming";
  }

  return currentMinutes > targetMinutes ? "overdue" : "upcoming";
};

/** Kiểm tra task có thuộc đúng một ngày cụ thể (YYYY-MM-DD) hay không */
export const isTaskForSpecificDate = (task: TaskDto, targetDateStr: string): boolean => {
  return isTaskOccurringOnDate(task, targetDateStr);
};

/** Kiểm tra task có đang diễn ra / cần làm trong ngày hôm nay hay không */
export const isTaskDueToday = (task: TaskDto, referenceDate: Date = new Date()): boolean => {
  return isTaskOccurringOnDate(task, getLocalTodayStr(referenceDate));
};

/** Kiểm tra task chưa có bất kỳ ngày nào (Hộp chờ) */
export const isTaskUnscheduled = (task: TaskDto): boolean => {
  return !getTaskStartDate(task) && !getTaskEndDate(task);
};

/** Kiểm tra task có ngày nhưng không có giờ */
export const isTaskDateOnly = (task: TaskDto): boolean => {
  return Boolean(getTaskStartDate(task)) && !getTaskEffectiveTime(task);
};

/** Kiểm tra task deadline hoặc task thông thường bị quá hạn từ ngày trước */
export const isTaskOverdueFromPast = (task: TaskDto, referenceDate: Date = new Date()): boolean => {
  if (task.completed) return false;
  const endDate = getTaskEndDate(task);
  const todayStr = getLocalTodayStr(referenceDate);
  const type = normalizeTaskTimeType(task);
  return Boolean(endDate && endDate < todayStr && type !== "scheduled");
};

/** Kiểm tra task scheduled từ ngày trước chưa hoàn thành (Lịch hẹn đã qua) */
export const isTaskPastScheduledFromPast = (task: TaskDto, referenceDate: Date = new Date()): boolean => {
  if (task.completed) return false;
  const endDate = getTaskEndDate(task);
  const todayStr = getLocalTodayStr(referenceDate);
  const type = normalizeTaskTimeType(task);
  return Boolean(endDate && endDate < todayStr && type === "scheduled");
};

/** Kiểm tra task deadline quá giờ trong chính ngày hôm nay */
export const isTaskOverdueToday = (task: TaskDto, referenceDate: Date = new Date()): boolean => {
  if (task.completed) return false;
  return isTaskDueToday(task, referenceDate) && getTaskTemporalState(task, referenceDate) === "overdue";
};

/** Kiểm tra task scheduled đã qua giờ trong chính ngày hôm nay */
export const isTaskPastScheduledToday = (task: TaskDto, referenceDate: Date = new Date()): boolean => {
  if (task.completed) return false;
  return isTaskDueToday(task, referenceDate) && getTaskTemporalState(task, referenceDate) === "pastScheduled";
};

/** Kiểm tra task có trạng thái overdue */
export const isTaskOverdue = (task: TaskDto, referenceDate: Date = new Date()): boolean => {
  if (task.completed) return false;
  return getTaskTemporalState(task, referenceDate) === "overdue";
};

/** Kiểm tra task có trạng thái pastScheduled */
export const isTaskPastScheduled = (task: TaskDto, referenceDate: Date = new Date()): boolean => {
  if (task.completed) return false;
  return getTaskTemporalState(task, referenceDate) === "pastScheduled";
};

export const constrainTaskToParent = (
  childTask: TaskDto,
  updates: Partial<TaskDto>,
  parentTask?: TaskDto,
): Partial<TaskDto> => {
  if (!parentTask) return updates;
  const merged: TaskDto = { ...childTask, ...updates };
  const { date: parentDate, time: parentTime } = getTaskDateTime(parentTask);
  const parentType = normalizeTaskTimeType(parentTask);
  const childType = normalizeTaskTimeType(merged);

  // A scheduled parent limits children by the end of its slot.
  const parentLimitTime =
    parentType === "scheduled" ? parentTask.endTime || parentTime : parentTime;
  const childDate = getTaskEffectiveDate(merged);
  const childTime = getTaskEffectiveTime(merged);
  const constrainedDate =
    parentDate && (!childDate || childDate > parentDate) ? parentDate : childDate;
  const constrainedTime =
    parentLimitTime && constrainedDate === parentDate && childTime && childTime > parentLimitTime
      ? parentLimitTime
      : childTime;
  const nextDueDate = formatTaskDateTime(constrainedDate, constrainedTime);

  const finalUpdates: Partial<TaskDto> = {
    ...updates,
    parentTaskId: parentTask.id,
  };

  if (parentType === "none" && childType === "none") {
    return {
      ...finalUpdates,
      dueDate: constrainedDate,
      timeType: undefined,
    };
  }

  if (childType === "scheduled") {
    return {
      ...finalUpdates,
      dueDate: nextDueDate,
      startTime: constrainedTime || undefined,
      endTime:
        merged.endTime && parentLimitTime && constrainedDate === parentDate && merged.endTime > parentLimitTime
          ? parentLimitTime
          : merged.endTime,
      deadlineDate: undefined,
      deadlineTime: undefined,
    };
  }

  if (childType === "deadline") {
    return {
      ...finalUpdates,
      dueDate: nextDueDate,
      deadlineDate: constrainedDate,
      deadlineTime: constrainedTime || undefined,
    };
  }

  return {
    ...finalUpdates,
    dueDate: constrainedDate,
  };
};

/** Move a task without changing its scheduled/deadline semantics. */
export const moveTaskToDate = (task: TaskDto, targetDate: string): Partial<TaskDto> => {
  const type = normalizeTaskTimeType(task);
  const time = getTaskEffectiveTime(task);
  const hasDateRange = Boolean(task.startDate && task.endDate && task.startDate <= task.endDate);
  const rangeEndDate = hasDateRange
    ? shiftIsoDate(targetDate, daysBetweenIsoDates(task.startDate!, task.endDate!))
    : undefined;
  const rangeFields = hasDateRange
    ? { startDate: targetDate, endDate: rangeEndDate }
    : { startDate: undefined, endDate: undefined };

  if (type === "scheduled") {
    return {
      ...rangeFields,
      dueDate: formatTaskDateTime(targetDate, time),
      timeType: "scheduled",
      startTime: time,
      endTime: task.endTime,
      deadlineDate: undefined,
      deadlineTime: undefined,
    };
  }

  if (type === "deadline") {
    return {
      ...rangeFields,
      dueDate: formatTaskDateTime(targetDate, time),
      timeType: "deadline",
      startTime: undefined,
      endTime: undefined,
      deadlineDate: rangeEndDate || targetDate,
      deadlineTime: time,
    };
  }

  return {
    ...rangeFields,
    dueDate: targetDate,
    timeType: undefined,
    startTime: undefined,
    endTime: undefined,
    deadlineDate: undefined,
    deadlineTime: undefined,
  };
};

export const wouldCreateTaskCycle = (
  taskId: string,
  parentTaskId: string | undefined,
  tasks: TaskDto[],
): boolean => {
  if (!parentTaskId) return false;
  const taskMap = new Map(tasks.map((task) => [task.id, task]));
  const visited = new Set<string>();
  let currentId: string | undefined = parentTaskId;

  while (currentId) {
    if (currentId === taskId || visited.has(currentId)) return true;
    visited.add(currentId);
    currentId = taskMap.get(currentId)?.parentTaskId;
  }

  return false;
};

export const canAssignTaskParent = (
  taskId: string | undefined,
  parentTaskId: string,
  tasks: TaskDto[],
): boolean =>
  Boolean(parentTaskId) &&
  parentTaskId !== taskId &&
  !wouldCreateTaskCycle(taskId || "", parentTaskId, tasks);

/**
 * Returns the fields a child should inherit when a parent is selected.
 */
export const getInheritedParentSchedule = (parentTask: TaskDto): Partial<TaskDto> => {
  const { date, time } = getTaskDateTime(parentTask);
  const type = normalizeTaskTimeType(parentTask);

  if (type === "scheduled") {
    return {
      dueDate: date ? `${date}${time ? ` ${time}` : ""}` : undefined,
      timeType: "scheduled",
      startTime: time,
      endTime: parentTask.endTime,
      deadlineDate: undefined,
      deadlineTime: undefined,
    };
  }

  if (type === "deadline") {
    return {
      dueDate: date ? `${date}${time ? ` ${time}` : ""}` : undefined,
      timeType: "deadline",
      startTime: undefined,
      endTime: undefined,
      deadlineDate: date,
      deadlineTime: time,
    };
  }

  return {
    dueDate: date,
    timeType: undefined,
    startTime: undefined,
    endTime: undefined,
    deadlineDate: undefined,
    deadlineTime: undefined,
  };
};

/**
 * Danh sách task hợp lệ làm cha
 */
export const getTaskParentCandidates = (
  tasks: TaskDto[],
  scope: TaskParentScope,
  options: { taskId?: string; date?: string } = {},
): TaskDto[] => {
  return tasks.filter((candidate) => {
    // Không thể chọn chính mình hoặc tạo chu trình vòng lặp
    if (!canAssignTaskParent(options.taskId, candidate.id, tasks)) {
      return false;
    }

    if (scope === "global") {
      return true;
    }

    return Boolean(options.date && getTaskEffectiveDate(candidate) === options.date);
  });
};

/**
 * Xây dựng danh sách SelectOption công việc cha đầy đủ, thông minh và trực quan:
 * - Đầy đủ tất cả các task trong ngày/sổ tay có thể làm cha
 * - Phân nhóm theo: Lịch hẹn, Hạn chót, Việc cần làm
 * - Hiển thị nhãn kèm mốc giờ và số lượng việc con
 */
export const buildParentSelectOptions = (
  candidates: TaskDto[],
  allTasks: TaskDto[],
  selectedParentId?: string,
): ParentSelectOption[] => {
  // 1. Đảm bảo task đang chọn (nếu có) luôn nằm trong candidates
  let taskList = [...candidates];
  if (selectedParentId && !taskList.some((t) => t.id === selectedParentId)) {
    const selectedTask = allTasks.find((t) => t.id === selectedParentId);
    if (selectedTask) taskList.unshift(selectedTask);
  }

  // 2. Sắp xếp danh sách candidates:
  // - Lịch hẹn trước (theo startTime)
  // - Hạn chót (theo deadlineTime)
  // - Việc cần làm thông thường
  // - Việc chưa hoàn thành lên trước việc đã hoàn thành
  taskList.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const normA = normalizeTaskTimeType(a);
    const normB = normalizeTaskTimeType(b);

    if (normA === "scheduled" && normB !== "scheduled") return -1;
    if (normA !== "scheduled" && normB === "scheduled") return 1;
    if (normA === "deadline" && normB === "none") return -1;
    if (normA === "none" && normB === "deadline") return 1;

    if (normA === "scheduled" && normB === "scheduled") {
      return (getTaskEffectiveTime(a) || "").localeCompare(getTaskEffectiveTime(b) || "");
    }
    if (normA === "deadline" && normB === "deadline") {
      return (getTaskEffectiveTime(a) || "").localeCompare(getTaskEffectiveTime(b) || "");
    }
    return (a.title || "").localeCompare(b.title || "");
  });

  const options: ParentSelectOption[] = [
    { value: "", label: "Không thuộc công việc nào (Tạo việc độc lập)" },
  ];

  taskList.forEach((t) => {
    const childCount = allTasks.filter((c) => c.parentTaskId === t.id).length;
    const isSub = Boolean(t.parentTaskId);
    const norm = normalizeTaskTimeType(t);

    let groupTitle = "Việc cần làm";
    let formattedLabel = t.title;

    const effectiveTime = getTaskEffectiveTime(t);
    if (norm === "scheduled" && effectiveTime) {
      groupTitle = "Khung giờ hẹn";
      formattedLabel = `[${effectiveTime}${t.endTime ? ` - ${t.endTime}` : ""}] ${t.title}`;
    } else if (norm === "deadline" && effectiveTime) {
      groupTitle = "Có hạn chót";
      formattedLabel = `[Hạn ${effectiveTime}] ${t.title}`;
    }

    options.push({
      value: t.id,
      label: formattedLabel,
      group: groupTitle,
      depth: isSub ? 1 : 0,
      badge: childCount > 0 ? `${childCount} việc con` : undefined,
    });
  });

  return options;
};

// === PHẦN 7: Xử lý Nhãn (#Tag) & Multi-tags ===

/** Chuẩn hóa tên tag (bỏ # ở đầu, cắt khoảng trắng thừa) */
export const normalizeTagName = (tag: string): string => {
  if (!tag) return "";
  return tag.replace(/^#+/, "").trim();
};

/** Lấy toàn bộ danh sách tags của một task (tương thích cả `tags: string[]` và `tag: string`) */
export const getTaskTags = (task: Pick<TaskDto, "tag" | "tags">): string[] => {
  const result = new Set<string>();
  if (Array.isArray(task.tags)) {
    task.tags.forEach((t) => {
      const clean = normalizeTagName(t);
      if (clean) result.add(clean);
    });
  }
  if (task.tag) {
    const clean = normalizeTagName(task.tag);
    if (clean) result.add(clean);
  }
  return Array.from(result);
};

/** Bóc tách hashtag tự động khi người dùng gõ trong ô tiêu đề */
export const extractTagsFromTitle = (
  rawTitle: string,
): { cleanTitle: string; extractedTags: string[] } => {
  if (!rawTitle) return { cleanTitle: "", extractedTags: [] };

  const extractedTags: string[] = [];
  // Tìm các cụm #tag (hỗ trợ chữ cái Unicode tiếng Việt, số, gạch chân)
  const regex = /(?:^|\s)#([\p{L}\p{N}_-]+)/gu;

  let match;
  while ((match = regex.exec(rawTitle)) !== null) {
    const tag = match[1].trim();
    if (tag && !extractedTags.includes(tag)) {
      extractedTags.push(tag);
    }
  }

  // Tiêu đề sạch sẽ sau khi loại bỏ các hashtag
  const cleanTitle = rawTitle.replace(/(?:^|\s)#[\p{L}\p{N}_-]+/gu, " ").trim();

  return { cleanTitle: cleanTitle || rawTitle, extractedTags };
};

/** Kiểm tra xem một task có diễn ra trong ngày dateStr (YYYY-MM-DD) hay không (Hỗ trợ multi-day & overnight) */
export const isTaskOccurringOnDate = (task: TaskDto, dateStr: string): boolean => {
  const effectiveDate = getTaskEffectiveDate(task);

  // 1. Task có khoảng ngày rõ ràng (startDate -> endDate)
  const startDate = task.startDate || effectiveDate;
  const endDate = task.endDate || (task.deadlineDate && task.timeType !== "deadline" ? task.deadlineDate : undefined);

  if (startDate && endDate && startDate <= endDate) {
    return dateStr >= startDate && dateStr <= endDate;
  }

  // 2. Task đơn ngày bình thường
  if (effectiveDate === dateStr) {
    return true;
  }

  // 3. Task qua đêm (startTime > endTime) -> xuất hiện cả ở ngày bắt đầu và ngày hôm sau
  if (
    effectiveDate &&
    normalizeTaskTimeType(task) === "scheduled" &&
    task.startTime &&
    task.endTime
  ) {
    const [startH] = task.startTime.split(":").map(Number);
    const [endH] = task.endTime.split(":").map(Number);
    if (startH > endH) {
      // Ngày hôm sau của effectiveDate
      const nextDateStr = shiftIsoDate(effectiveDate, 1);
      if (dateStr === nextDateStr) {
        return true;
      }
    }
  }

  return false;
};

/** Lấy khoảng thời gian (start phút -> end phút) trên lưới 24h của một ngày cụ thể (Hỗ trợ phân khúc task xuyên đêm) */
export const getTaskTimelineRangeForDate = (
  task: TaskDto,
  dateStr: string,
): { start: number; end: number } | undefined => {
  const effectiveDate = getTaskEffectiveDate(task);
  const effectiveTime = getTaskEffectiveTime(task);
  if (!effectiveDate || !effectiveTime) return undefined;

  const [startH, startM] = effectiveTime.split(":").map(Number);
  if (isNaN(startH) || isNaN(startM)) return undefined;
  const startMinutes = startH * 60 + startM;

  const type = normalizeTaskTimeType(task);

  if (type === "scheduled" && task.endTime && /^\d{2}:\d{2}$/.test(task.endTime)) {
    const [endH, endM] = task.endTime.split(":").map(Number);
    const endMinutes = endH * 60 + endM;

    // Case 1: Qua đêm (startTime > endTime)
    if (startMinutes > endMinutes) {
      // Ngày bắt đầu: từ startMinutes đến 24:00 (1440)
      if (effectiveDate === dateStr) {
        return { start: startMinutes, end: 24 * 60 };
      }

      // Ngày hôm sau: từ 00:00 (0) đến endMinutes
      const nextDateStr = shiftIsoDate(effectiveDate, 1);
      if (nextDateStr === dateStr) {
        return { start: 0, end: Math.max(15, endMinutes) };
      }

      return undefined;
    }

    // Case 2: Trong cùng ngày (startTime <= endTime)
    if (effectiveDate === dateStr) {
      return {
        start: startMinutes,
        end: Math.max(startMinutes + 15, Math.min(24 * 60, endMinutes)),
      };
    }

    return undefined;
  }

  // Deadline hoặc scheduled không có endTime: chỉ nằm ở ngày effectiveDate
  if (effectiveDate === dateStr) {
    const duration = type === "scheduled" ? 60 : 45;
    return {
      start: startMinutes,
      end: Math.min(24 * 60, startMinutes + duration),
    };
  }

  return undefined;
};
