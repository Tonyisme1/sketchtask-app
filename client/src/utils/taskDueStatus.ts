export type DueStatusType = "overdue" | "today" | "upcoming" | "no-due" | "scheduled";

export interface TaskDueInfo {
  type: DueStatusType;
  timeType: "scheduled" | "deadline";
  label: string;
  badgeClass: string;
  iconName: "alert" | "clock" | "calendar" | "hourglass";
}

/**
 * Tính toán mức độ hạn chót hoặc khung giờ làm việc của công việc
 */
export const getTaskDueInfo = (
  dueDateOrTask?: string | {
    dueDate?: string;
    timeType?: "scheduled" | "deadline";
    startTime?: string;
    endTime?: string;
    deadlineDate?: string;
    deadlineTime?: string;
  }
): TaskDueInfo | null => {
  if (!dueDateOrTask) return null;

  let dueDate: string | undefined;
  let timeType: "scheduled" | "deadline" = "scheduled";
  let startTime: string | undefined;
  let endTime: string | undefined;
  let deadlineDate: string | undefined;
  let deadlineTime: string | undefined;

  if (typeof dueDateOrTask === "string") {
    dueDate = dueDateOrTask;
  } else {
    dueDate = dueDateOrTask.dueDate;
    timeType = dueDateOrTask.timeType || (dueDateOrTask.deadlineDate ? "deadline" : "scheduled");
    startTime = dueDateOrTask.startTime;
    endTime = dueDateOrTask.endTime;
    deadlineDate = dueDateOrTask.deadlineDate;
    deadlineTime = dueDateOrTask.deadlineTime;
  }

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const nowHours = String(now.getHours()).padStart(2, "0");
  const nowMinutes = String(now.getMinutes()).padStart(2, "0");
  const currentTimeStr = `${nowHours}:${nowMinutes}`;

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

  // ==========================================
  // 1. NẾU LÀ HẠN CHÓT (DEADLINE - BẮT BUỘC PHẢI XONG TRƯỚC...)
  // ==========================================
  if (timeType === "deadline" || deadlineDate) {
    const targetDate = deadlineDate || dueDate?.split(" ")[0].split("T")[0];
    const targetTime = deadlineTime || (dueDate?.includes(" ") ? dueDate.split(" ")[1] : dueDate?.includes("T") ? dueDate.split("T")[1]?.slice(0, 5) : undefined);

    if (!targetDate) return null;

    // A. Đã quá hạn ngày
    if (targetDate < todayStr) {
      const taskDate = new Date(targetDate);
      const todayDate = new Date(todayStr);
      const diffDays = Math.max(
        1,
        Math.round((todayDate.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24))
      );
      return {
        type: "overdue",
        timeType: "deadline",
        label: diffDays === 1 ? "Hạn chót: Quá 1 ngày" : `Hạn chót: Quá ${diffDays} ngày`,
        badgeClass: "bg-rose-100 text-rose-800 border-rose-400 font-bold shadow-[1px_1px_0px_#262626]",
        iconName: "alert",
      };
    }

    // B. Hạn chót hôm nay
    if (targetDate === todayStr) {
      // Nếu có giờ hạn chót và giờ hiện tại đã vượt quá
      const isPastTime = targetTime && targetTime < currentTimeStr;
      if (isPastTime) {
        return {
          type: "overdue",
          timeType: "deadline",
          label: `Quá hạn lúc ${targetTime}`,
          badgeClass: "bg-rose-100 text-rose-800 border-rose-400 font-bold shadow-[1px_1px_0px_#262626]",
          iconName: "alert",
        };
      }

      return {
        type: "today",
        timeType: "deadline",
        label: targetTime ? `⏳ Hạn: Hôm nay ${targetTime}` : "⏳ Hạn: Hôm nay",
        badgeClass: "bg-amber-100 text-amber-900 border-amber-400 font-bold shadow-[1px_1px_0px_#262626]",
        iconName: "hourglass",
      };
    }

    // C. Hạn chót ngày mai
    if (targetDate === tomorrowStr) {
      return {
        type: "upcoming",
        timeType: "deadline",
        label: targetTime ? `⏳ Hạn: Ngày mai ${targetTime}` : "⏳ Hạn: Ngày mai",
        badgeClass: "bg-orange-50 text-orange-800 border-orange-300 font-bold",
        iconName: "hourglass",
      };
    }

    // D. Hạn chót ngày xa hơn (DD/MM)
    const parts = targetDate.split("-");
    const formatted = parts.length === 3 ? `${parts[2]}/${parts[1]}` : targetDate;
    return {
      type: "upcoming",
      timeType: "deadline",
      label: targetTime ? `⏳ Hạn: ${formatted} ${targetTime}` : `⏳ Hạn: ${formatted}`,
      badgeClass: "bg-orange-50 text-orange-800 border-orange-300 font-medium",
      iconName: "hourglass",
    };
  }

  // ==========================================
  // 2. NẾU LÀ LỊCH LÀM VIỆC / KHUNG GIỜ (SCHEDULED / TIME BLOCKING)
  // ==========================================
  if (!dueDate && !startTime) return null;

  const datePart = dueDate ? dueDate.split(" ")[0].split("T")[0] : todayStr;
  const timePart = startTime || (dueDate?.includes(" ")
    ? dueDate.split(" ")[1]
    : dueDate?.includes("T")
      ? dueDate.split("T")[1]?.slice(0, 5)
      : null);

  // Tạo chuỗi khung giờ: ví dụ "09:00 - 10:30" hoặc "09:00"
  const timeRangeLabel = timePart
    ? endTime && endTime !== timePart
      ? `${timePart} - ${endTime}`
      : timePart
    : "";

  // A. Lịch hôm nay
  if (datePart === todayStr) {
    return {
      type: "today",
      timeType: "scheduled",
      label: timeRangeLabel ? `🕒 ${timeRangeLabel}` : "Hôm nay",
      badgeClass: "bg-[#FEF08A] text-[#1C1917] border-[#262626] font-bold shadow-[1px_1px_0px_#262626]",
      iconName: "clock",
    };
  }

  // B. Lịch ngày mai
  if (datePart === tomorrowStr) {
    return {
      type: "upcoming",
      timeType: "scheduled",
      label: timeRangeLabel ? `🕒 Mai ${timeRangeLabel}` : "Ngày mai",
      badgeClass: "bg-[#BBF7D0] text-emerald-900 border-emerald-400 font-bold",
      iconName: "calendar",
    };
  }

  // C. Lịch các ngày khác
  const parts = datePart.split("-");
  const formatted = parts.length === 3 ? `${parts[2]}/${parts[1]}` : datePart;
  return {
    type: "scheduled",
    timeType: "scheduled",
    label: timeRangeLabel ? `🕒 ${formatted} ${timeRangeLabel}` : formatted,
    badgeClass: "bg-[#F3EFE6] text-[#1C1917] border-[#D4CEBF] font-medium",
    iconName: "calendar",
  };
};

