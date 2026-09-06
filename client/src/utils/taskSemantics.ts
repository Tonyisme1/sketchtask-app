import { TaskDto, TaskTimeType } from "../types";
import { getLocalTodayStr } from "./date";

export type NormalizedTaskTimeType = "scheduled" | "deadline" | "none";

export type TaskParentScope = "today" | "planner" | "notebook" | "global";

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
    return dueDateDate;
  }
  if (type === "deadline") {
    return task.deadlineDate || dueDateDate;
  }
  // type === "none"
  return dueDateDate;
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
  // type === "none"
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

  const date = getTaskEffectiveDate(task);
  const time = getTaskEffectiveTime(task);

  if (!date) {
    return "unscheduled";
  }

  const todayStr = getLocalTodayStr(now);
  const type = normalizeTaskTimeType(task);

  // Ngày quá khứ (< todayStr)
  if (date < todayStr) {
    if (type === "scheduled") {
      return "pastScheduled";
    }
    return "overdue";
  }

  // Ngày tương lai (> todayStr)
  if (date > todayStr) {
    return type === "none" || !time ? "dateOnly" : "upcoming";
  }

  // Ngày hôm nay (=== todayStr)
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
  return getTaskEffectiveDate(task) === targetDateStr;
};

/** Kiểm tra task có thuộc ngày hôm nay hay không */
export const isTaskDueToday = (task: TaskDto, referenceDate: Date = new Date()): boolean => {
  return isTaskForSpecificDate(task, getLocalTodayStr(referenceDate));
};

/** Kiểm tra task chưa có bất kỳ ngày nào (Hộp chờ) */
export const isTaskUnscheduled = (task: TaskDto): boolean => {
  return !getTaskEffectiveDate(task);
};

/** Kiểm tra task có ngày nhưng không có giờ */
export const isTaskDateOnly = (task: TaskDto): boolean => {
  return Boolean(getTaskEffectiveDate(task)) && !getTaskEffectiveTime(task);
};

/** Kiểm tra task deadline hoặc task thông thường bị quá hạn từ ngày trước */
export const isTaskOverdueFromPast = (task: TaskDto, referenceDate: Date = new Date()): boolean => {
  if (task.completed) return false;
  const date = getTaskEffectiveDate(task);
  const todayStr = getLocalTodayStr(referenceDate);
  const type = normalizeTaskTimeType(task);
  return Boolean(date && date < todayStr && type !== "scheduled");
};

/** Kiểm tra task scheduled từ ngày trước chưa hoàn thành (Lịch hẹn đã qua) */
export const isTaskPastScheduledFromPast = (task: TaskDto, referenceDate: Date = new Date()): boolean => {
  if (task.completed) return false;
  const date = getTaskEffectiveDate(task);
  const todayStr = getLocalTodayStr(referenceDate);
  const type = normalizeTaskTimeType(task);
  return Boolean(date && date < todayStr && type === "scheduled");
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
    notebookId: parentTask.notebookId,
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

  if (type === "scheduled") {
    return {
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
      dueDate: formatTaskDateTime(targetDate, time),
      timeType: "deadline",
      startTime: undefined,
      endTime: undefined,
      deadlineDate: targetDate,
      deadlineTime: time,
    };
  }

  return {
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
  options: { taskId?: string; date?: string; notebookId?: string } = {},
): TaskDto[] => {
  return tasks.filter((candidate) => {
    // Không thể chọn chính mình hoặc tạo chu trình vòng lặp
    if (!canAssignTaskParent(options.taskId, candidate.id, tasks)) {
      return false;
    }

    if (scope === "notebook") {
      return Boolean(options.notebookId && candidate.notebookId === options.notebookId);
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
