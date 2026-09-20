import { TaskDto, TaskTimeType } from "../types";
import { formatShortDayMonth } from "./date";
import {
  getTaskEffectiveDate,
  getTaskEffectiveTime,
  getTaskTemporalState,
  normalizeTaskTimeType,
} from "./taskSemantics";

export type DueBadgeType = "today" | "tomorrow" | "overdue" | "past" | "future" | "none";

export interface TaskDueInfo {
  type: DueBadgeType;
  label: string;
  icon: "clock" | "alert" | "calendar" | "hourglass";
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  isOverdue: boolean;
  badgeClass: string;
  iconName: "clock" | "alert" | "calendar" | "hourglass";
  timeType?: TaskTimeType;
}

export const getTaskDueInfo = (
  taskOrDueDate: TaskDto | string | undefined,
  referenceDate: Date = new Date()
): TaskDueInfo => {
  if (!taskOrDueDate) {
    return {
      type: "none",
      label: "",
      icon: "calendar",
      badgeBg: "bg-stone-100 dark:bg-[#2C2C2E]",
      badgeBorder: "border-none",
      badgeText: "text-stone-600 dark:text-stone-300",
      badgeClass: "bg-stone-100 dark:bg-[#2C2C2E] text-stone-600 dark:text-stone-300 rounded-full font-mono shadow-2xs",
      iconName: "calendar",
      isOverdue: false,
    };
  }

  let timeType: TaskTimeType | undefined;
  let startTime: string | undefined;
  let endTime: string | undefined;
  let deadlineDate: string | undefined;
  let deadlineTime: string | undefined;
  let rawDueDate = "";

  if (typeof taskOrDueDate === "string") {
    rawDueDate = taskOrDueDate;
  } else {
    rawDueDate = taskOrDueDate.dueDate || "";
    timeType = taskOrDueDate.timeType;
    startTime = taskOrDueDate.startTime;
    endTime = taskOrDueDate.endTime;
    deadlineDate = taskOrDueDate.deadlineDate;
    deadlineTime = taskOrDueDate.deadlineTime;
  }

  // Không có thông tin thời gian nào
  if (!rawDueDate && !deadlineDate && !startTime && !deadlineTime) {
    return {
      type: "none",
      label: "",
      icon: "calendar",
      badgeBg: "bg-stone-100 dark:bg-[#2C2C2E]",
      badgeBorder: "border-none",
      badgeText: "text-stone-600 dark:text-stone-300",
      badgeClass: "bg-stone-100 dark:bg-[#2C2C2E] text-stone-600 dark:text-stone-300 rounded-full font-mono shadow-2xs",
      iconName: "calendar",
      isOverdue: false,
    };
  }

  const normalizedTimeType =
    typeof taskOrDueDate === "string"
      ? timeType
      : normalizeTaskTimeType(taskOrDueDate);
  const isScheduled = normalizedTimeType === "scheduled";
  const isDeadline = normalizedTimeType === "deadline";

  const datePart = typeof taskOrDueDate === "string"
    ? rawDueDate.split(" ")[0].trim()
    : getTaskEffectiveDate(taskOrDueDate) || "";

  const timePart = typeof taskOrDueDate === "string"
    ? (rawDueDate.includes(" ") ? rawDueDate.split(" ")[1] : "").trim()
    : getTaskEffectiveTime(taskOrDueDate) || "";

  // So sánh ngày
  const refYear = referenceDate.getFullYear();
  const refMonth = String(referenceDate.getMonth() + 1).padStart(2, "0");
  const refDay = String(referenceDate.getDate()).padStart(2, "0");
  const todayStr = `${refYear}-${refMonth}-${refDay}`;

  const tomorrow = new Date(referenceDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomYear = tomorrow.getFullYear();
  const tomMonth = String(tomorrow.getMonth() + 1).padStart(2, "0");
  const tomDay = String(tomorrow.getDate()).padStart(2, "0");
  const tomorrowStr = `${tomYear}-${tomMonth}-${tomDay}`;

  const isToday = !datePart || datePart === todayStr;
  const isTomorrow = datePart === tomorrowStr;
  const isPastDate = Boolean(datePart && datePart < todayStr);
  const temporalState =
    typeof taskOrDueDate === "string"
      ? undefined
      : getTaskTemporalState(taskOrDueDate, referenceDate);
  const isPast = temporalState === "pastScheduled" || temporalState === "overdue" || isPastDate;

  // 1. Trường hợp LỊCH HẸN / LỊCH LÀM VIỆC (Scheduled / Event)
  if (isScheduled) {
    const timeDisplay = endTime
      ? `${startTime || timePart} - ${endTime}`
      : startTime || timePart || "";

    if (temporalState === "pastScheduled" || (typeof taskOrDueDate === "string" && isPast)) {
      const pastLabel = isToday
        ? "Lịch hẹn đã qua"
        : `Lịch hẹn đã qua (${formatShortDayMonth(datePart)})`;

      return {
        type: "past",
        label: pastLabel,
        icon: "alert",
        badgeBg: "bg-[#1C1917] dark:bg-white",
        badgeBorder: "border-none",
        badgeText: "text-white dark:text-[#1C1917] font-bold",
        badgeClass: "bg-[#1C1917] dark:bg-white text-white dark:text-[#1C1917] font-bold rounded-full font-mono shadow-2xs",
        iconName: "alert",
        timeType: "scheduled",
        isOverdue: false,
      };
    }

    if (isToday) {
      return {
        type: "today",
        label: timeDisplay || "Hôm nay",
        icon: "clock",
        badgeBg: "bg-[#E0F2FE] dark:bg-sky-950/40",
        badgeBorder: "border-none",
        badgeText: "text-[#0369A1] dark:text-sky-300",
        badgeClass: "bg-[#E0F2FE] dark:bg-sky-950/40 text-[#0369A1] dark:text-sky-300 rounded-full font-bold font-mono shadow-2xs",
        iconName: "clock",
        timeType: "scheduled",
        isOverdue: false,
      };
    }

    if (isTomorrow) {
      return {
        type: "tomorrow",
        label: `Mai ${timeDisplay}`.trim(),
        icon: "clock",
        badgeBg: "bg-[#E0F2FE] dark:bg-sky-950/40",
        badgeBorder: "border-none",
        badgeText: "text-[#0369A1] dark:text-sky-300",
        badgeClass: "bg-[#E0F2FE] dark:bg-sky-950/40 text-[#0369A1] dark:text-sky-300 rounded-full font-bold font-mono shadow-2xs",
        iconName: "clock",
        timeType: "scheduled",
        isOverdue: false,
      };
    }

    return {
      type: "future",
      label: `${formatShortDayMonth(datePart)} ${timeDisplay}`.trim(),
      icon: "clock",
      badgeBg: "bg-black/[0.04] dark:bg-white/[0.06]",
      badgeBorder: "border-none",
      badgeText: "text-[#1C1917] dark:text-[#F2F2F7]",
      badgeClass: "bg-black/[0.04] dark:bg-white/[0.06] text-[#1C1917] dark:text-[#F2F2F7] rounded-full font-mono font-medium shadow-2xs",
      iconName: "clock",
      timeType: "scheduled",
      isOverdue: false,
    };
  }

  // 2. Trường hợp HẠN HOÀN THÀNH / DEADLINE hoặc KHÔNG CÓ LOẠI
  if (temporalState === "overdue" || (typeof taskOrDueDate === "string" && isPast)) {
    const overdueLabel = isToday
      ? "Quá giờ"
      : `Quá hạn: ${formatShortDayMonth(datePart)}`;

    return {
      type: "overdue",
      label: overdueLabel,
      icon: "alert",
      badgeBg: "bg-[#FEE2E2] dark:bg-rose-950/40",
      badgeBorder: "border-none",
      badgeText: "text-[#991B1B] dark:text-rose-300 font-bold",
      badgeClass: "bg-[#FEE2E2] dark:bg-rose-950/40 text-[#991B1B] dark:text-rose-300 font-bold rounded-full font-mono shadow-2xs",
      iconName: "alert",
      timeType: isDeadline ? "deadline" : undefined,
      isOverdue: true,
    };
  }

  if (isToday) {
    const timeDisplay = isDeadline
      ? (timePart ? `Hạn ${timePart}` : "Hạn hôm nay")
      : (timePart || "Hôm nay");

    return {
      type: "today",
      label: timeDisplay,
      icon: isDeadline ? "hourglass" : "calendar",
      badgeBg: isDeadline ? "bg-[#FEE2E2] dark:bg-rose-950/40" : "bg-[#E0F2FE] dark:bg-sky-950/40",
      badgeBorder: "border-none",
      badgeText: isDeadline ? "text-[#991B1B] dark:text-rose-300" : "text-[#0369A1] dark:text-sky-300",
      badgeClass: isDeadline
        ? "bg-[#FEE2E2] dark:bg-rose-950/40 text-[#991B1B] dark:text-rose-300 rounded-full font-bold font-mono shadow-2xs"
        : "bg-[#E0F2FE] dark:bg-sky-950/40 text-[#0369A1] dark:text-sky-300 rounded-full font-bold font-mono shadow-2xs",
      iconName: isDeadline ? "hourglass" : "calendar",
      timeType: isDeadline ? "deadline" : undefined,
      isOverdue: false,
    };
  }

  if (isTomorrow) {
    const timeDisplay = isDeadline
      ? (timePart ? `Hạn Mai ${timePart}` : "Hạn ngày mai")
      : `Mai${timePart ? ` ${timePart}` : ""}`;

    return {
      type: "tomorrow",
      label: timeDisplay,
      icon: isDeadline ? "hourglass" : "calendar",
      badgeBg: isDeadline ? "bg-[#FEE2E2]/60 dark:bg-rose-950/40" : "bg-[#E0F2FE] dark:bg-sky-950/40",
      badgeBorder: "border-none",
      badgeText: isDeadline ? "text-[#991B1B] dark:text-rose-300" : "text-[#0369A1] dark:text-sky-300",
      badgeClass: isDeadline
        ? "bg-[#FEE2E2]/60 dark:bg-rose-950/40 text-[#991B1B] dark:text-rose-300 rounded-full font-bold font-mono shadow-2xs"
        : "bg-[#E0F2FE] dark:bg-sky-950/40 text-[#0369A1] dark:text-sky-300 rounded-full font-bold font-mono shadow-2xs",
      iconName: isDeadline ? "hourglass" : "calendar",
      timeType: isDeadline ? "deadline" : undefined,
      isOverdue: false,
    };
  }

  return {
    type: "future",
    label: isDeadline
      ? `Hạn ${formatShortDayMonth(datePart)}${timePart ? ` ${timePart}` : ""}`
      : `${formatShortDayMonth(datePart)}${timePart ? ` ${timePart}` : ""}`,
    icon: isDeadline ? "hourglass" : "calendar",
    badgeBg: "bg-black/[0.04] dark:bg-white/[0.06]",
    badgeBorder: "border-none",
    badgeText: "text-[#1C1917] dark:text-[#F2F2F7]",
    badgeClass: "bg-black/[0.04] dark:bg-white/[0.06] text-[#1C1917] dark:text-[#F2F2F7] rounded-full font-mono font-medium shadow-2xs",
    iconName: isDeadline ? "hourglass" : "calendar",
    timeType: isDeadline ? "deadline" : undefined,
    isOverdue: false,
  };
};
