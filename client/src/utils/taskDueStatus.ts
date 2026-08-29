import { TaskDto } from "../types";

export type DueStatusType = "overdue" | "today" | "upcoming" | "no-due";

export interface TaskDueInfo {
  type: DueStatusType;
  label: string;
  badgeClass: string;
  iconName: "alert" | "clock" | "hourglass" | "calendar";
  timeType?: "scheduled" | "deadline";
}

/**
 * Tính toán mức độ hạn chót của công việc dựa trên TaskDto hoặc chuỗi dueDate
 */
export const getTaskDueInfo = (
  taskOrDueDate?: TaskDto | string
): TaskDueInfo | null => {
  if (!taskOrDueDate) return null;

  let dueDate: string | undefined;
  let timeType: "scheduled" | "deadline" = "scheduled";
  let startTime: string | undefined;
  let endTime: string | undefined;
  let deadlineDate: string | undefined;
  let deadlineTime: string | undefined;

  if (typeof taskOrDueDate === "string") {
    dueDate = taskOrDueDate;
  } else {
    dueDate = taskOrDueDate.dueDate;
    timeType = taskOrDueDate.timeType || (taskOrDueDate.deadlineDate ? "deadline" : "scheduled");
    startTime = taskOrDueDate.startTime;
    endTime = taskOrDueDate.endTime;
    deadlineDate = taskOrDueDate.deadlineDate;
    deadlineTime = taskOrDueDate.deadlineTime;
  }

  // 1. Phân loại theo LỊCH LÀM VIỆC (Scheduled Time Blocking)
  if (timeType === "scheduled") {
    const timeDisplay = startTime
      ? endTime
        ? `${startTime} - ${endTime}`
        : startTime
      : dueDate?.includes(":")
        ? dueDate.includes(" ") ? dueDate.split(" ")[1] : dueDate
        : null;

    const datePart = dueDate?.split(" ")[0].split("T")[0];

    return {
      type: "today",
      label: timeDisplay ? `🕒 ${timeDisplay}` : (datePart || "Lịch làm"),
      badgeClass: "bg-[#FEF08A] text-[#1C1917] border-[#262626] font-bold shadow-[0.5px_0.5px_0px_#262626]",
      iconName: "clock",
      timeType: "scheduled",
    };
  }

  // 2. Phân loại theo HẠN CHÓT (Deadline)
  const targetDateStr = deadlineDate || (dueDate ? dueDate.split(" ")[0].split("T")[0] : null);
  const targetTimeStr = deadlineTime || (dueDate?.includes(":") ? (dueDate.includes(" ") ? dueDate.split(" ")[1] : dueDate) : null);

  if (!targetDateStr) return null;

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  // Quá hạn Deadline
  if (targetDateStr < todayStr) {
    const taskDate = new Date(targetDateStr);
    const todayDate = new Date(todayStr);
    const diffDays = Math.max(
      1,
      Math.round(
        (todayDate.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24)
      )
    );
    return {
      type: "overdue",
      label: diffDays === 1 ? "Quá hạn 1 ngày" : `Quá hạn ${diffDays} ngày`,
      badgeClass: "bg-rose-100 text-rose-800 border-rose-300 font-bold",
      iconName: "alert",
      timeType: "deadline",
    };
  }

  // Hạn chót Hôm nay
  if (targetDateStr === todayStr) {
    return {
      type: "today",
      label: targetTimeStr ? `Hạn: ${targetTimeStr}` : "Hạn hôm nay",
      badgeClass: "bg-amber-100 text-amber-900 border-amber-300 font-bold",
      iconName: "hourglass",
      timeType: "deadline",
    };
  }

  // Hạn chót Ngày mai
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

  if (targetDateStr === tomorrowStr) {
    return {
      type: "upcoming",
      label: targetTimeStr ? `Hạn: Mai ${targetTimeStr}` : "Hạn ngày mai",
      badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-300 font-medium",
      iconName: "calendar",
      timeType: "deadline",
    };
  }

  // Các ngày xa hơn: định dạng DD/MM
  const parts = targetDateStr.split("-");
  const formatted = parts.length === 3 ? `${parts[2]}/${parts[1]}` : targetDateStr;

  return {
    type: "upcoming",
    label: targetTimeStr ? `Hạn: ${formatted} ${targetTimeStr}` : `Hạn: ${formatted}`,
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-300 font-medium",
    iconName: "calendar",
    timeType: "deadline",
  };
};

