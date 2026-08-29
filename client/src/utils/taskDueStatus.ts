import { TaskDto } from "../types";

export type DueBadgeType = "today" | "tomorrow" | "overdue" | "future" | "none";

export interface TaskDueInfo {
  type: DueBadgeType;
  label: string;
  icon: "clock" | "alert" | "calendar" | "hourglass";
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  isOverdue: boolean;
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
      isOverdue: false,
    };
  }

  let timeType: "event" | "task" | undefined;
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

  if (!rawDueDate && !deadlineDate && !startTime) {
    return {
      type: "none",
      label: "",
      icon: "calendar",
      badgeBg: "bg-stone-100",
      badgeBorder: "border-stone-300",
      badgeText: "text-stone-600",
      isOverdue: false,
    };
  }

  const datePart = (deadlineDate || rawDueDate.split(" ")[0] || "").trim();
  const timePart = (deadlineTime || startTime || (rawDueDate.includes(" ") ? rawDueDate.split(" ")[1] : "")).trim();

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

  const isToday = datePart === todayStr;
  const isTomorrow = datePart === tomorrowStr;
  const isPast = datePart < todayStr;

  // 1. Trường hợp LỊCH HẸN (Event)
  if (timeType === "event" || (!timeType && startTime)) {
    const timeDisplay = endTime ? `${startTime || timePart} - ${endTime}` : (startTime || timePart || "Hôm nay");
    if (isToday) {
      return {
        type: "today",
        label: `🕒 ${timeDisplay}`,
        icon: "clock",
        badgeBg: "bg-[#FEF08A]",
        badgeBorder: "border-[#262626]",
        badgeText: "text-[#1C1917]",
        isOverdue: false,
      };
    }
    if (isTomorrow) {
      return {
        type: "tomorrow",
        label: `🕒 Mai ${timeDisplay}`,
        icon: "clock",
        badgeBg: "bg-[#BAE6FD]",
        badgeBorder: "border-[#262626]",
        badgeText: "text-[#1C1917]",
        isOverdue: false,
      };
    }
    if (isPast) {
      return {
        type: "overdue",
        label: `🕒 Đã qua (${datePart.slice(5).replace("-", "/")})`,
        icon: "alert",
        badgeBg: "bg-[#FECDD3]",
        badgeBorder: "border-[#262626]",
        badgeText: "text-rose-900 font-bold",
        isOverdue: true,
      };
    }
    return {
      type: "future",
      label: `🕒 ${datePart.slice(5).replace("-", "/")} ${timeDisplay}`,
      icon: "calendar",
      badgeBg: "bg-[#DDD6FE]",
      badgeBorder: "border-[#262626]",
      badgeText: "text-[#1C1917]",
      isOverdue: false,
    };
  }

  // 2. Trường hợp VIỆC CẦN LÀM / HẠN CHÓT (Task / Deadline)
  if (isPast) {
    return {
      type: "overdue",
      label: `⏳ Quá hạn: ${datePart.slice(5).replace("-", "/")}`,
      icon: "alert",
      badgeBg: "bg-[#FECDD3]",
      badgeBorder: "border-[#262626]",
      badgeText: "text-rose-900 font-bold",
      isOverdue: true,
    };
  }

  if (isToday) {
    const timeDisplay = timePart ? `Hạn ${timePart}` : "Hôm nay";
    return {
      type: "today",
      label: `⏳ ${timeDisplay}`,
      icon: "hourglass",
      badgeBg: "bg-[#FEF08A]",
      badgeBorder: "border-[#262626]",
      badgeText: "text-[#1C1917]",
      isOverdue: false,
    };
  }

  if (isTomorrow) {
    const timeDisplay = timePart ? `Hạn Mai ${timePart}` : "Ngày mai";
    return {
      type: "tomorrow",
      label: `⏳ ${timeDisplay}`,
      icon: "hourglass",
      badgeBg: "bg-[#BAE6FD]",
      badgeBorder: "border-[#262626]",
      badgeText: "text-[#1C1917]",
      isOverdue: false,
    };
  }

  return {
    type: "future",
    label: `⏳ Hạn: ${datePart.slice(5).replace("-", "/")}${timePart ? ` ${timePart}` : ""}`,
    icon: "hourglass",
    badgeBg: "bg-[#DDD6FE]",
    badgeBorder: "border-[#262626]",
    badgeText: "text-[#1C1917]",
    isOverdue: false,
  };
};
