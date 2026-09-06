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
      badgeBg: "bg-stone-100",
      badgeBorder: "border-stone-300",
      badgeText: "text-stone-600",
      badgeClass: "bg-stone-100 border-stone-300 text-stone-600 border font-mono",
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
      badgeBg: "bg-stone-100",
      badgeBorder: "border-stone-300",
      badgeText: "text-stone-600",
      badgeClass: "bg-stone-100 border-stone-300 text-stone-600 border font-mono",
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
        badgeBg: "bg-[#FED7AA]",
        badgeBorder: "border-[#262626]",
        badgeText: "text-[#7C2D12] font-bold",
        badgeClass: "bg-[#FED7AA] border-[#262626] text-[#7C2D12] font-bold border font-mono",
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
        badgeBg: "bg-[#FEF08A]",
        badgeBorder: "border-[#262626]",
        badgeText: "text-[#1C1917]",
        badgeClass: "bg-[#FEF08A] border-[#262626] text-[#1C1917] border font-bold font-mono",
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
        badgeBg: "bg-[#BAE6FD]",
        badgeBorder: "border-[#262626]",
        badgeText: "text-[#1C1917]",
        badgeClass: "bg-[#BAE6FD] border-[#262626] text-[#1C1917] border font-bold font-mono",
        iconName: "clock",
        timeType: "scheduled",
        isOverdue: false,
      };
    }

    return {
      type: "future",
      label: `${formatShortDayMonth(datePart)} ${timeDisplay}`.trim(),
      icon: "clock",
      badgeBg: "bg-[#DDD6FE]",
      badgeBorder: "border-[#262626]",
      badgeText: "text-[#1C1917]",
      badgeClass: "bg-[#DDD6FE] border-[#262626] text-[#1C1917] border font-mono font-medium",
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
      badgeBg: "bg-rose-50",
      badgeBorder: "border-rose-300",
      badgeText: "text-rose-700 font-bold",
      badgeClass: "bg-rose-50 border-rose-300 text-rose-700 font-bold border font-mono",
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
      badgeBg: isDeadline ? "bg-[#FECDD3]" : "bg-[#FEF08A]",
      badgeBorder: "border-[#262626]",
      badgeText: "text-[#1C1917]",
      badgeClass: `${isDeadline ? "bg-[#FECDD3]" : "bg-[#FEF08A]"} border-[#262626] text-[#1C1917] border font-bold font-mono`,
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
      badgeBg: "bg-[#BAE6FD]",
      badgeBorder: "border-[#262626]",
      badgeText: "text-[#1C1917]",
      badgeClass: "bg-[#BAE6FD] border-[#262626] text-[#1C1917] border font-bold font-mono",
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
    badgeBg: "bg-[#DDD6FE]",
    badgeBorder: "border-[#262626]",
    badgeText: "text-[#1C1917]",
    badgeClass: "bg-[#DDD6FE] border-[#262626] text-[#1C1917] border font-mono font-medium",
    iconName: isDeadline ? "hourglass" : "calendar",
    timeType: isDeadline ? "deadline" : undefined,
    isOverdue: false,
  };
};
