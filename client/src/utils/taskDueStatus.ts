export type DueStatusType = "overdue" | "today" | "upcoming" | "no-due";

export interface TaskDueInfo {
  type: DueStatusType;
  label: string;
  badgeClass: string;
  iconName: "alert" | "clock" | "calendar";
}

/**
 * Tính toán mức độ hạn chót của công việc dựa trên dueDate
 */
export const getTaskDueInfo = (dueDate?: string): TaskDueInfo | null => {
  if (!dueDate) return null;

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const datePart = dueDate.split(" ")[0].split("T")[0];
  const timePart = dueDate.includes(" ")
    ? dueDate.split(" ")[1]
    : dueDate.includes("T")
      ? dueDate.split("T")[1]?.slice(0, 5)
      : null;

  // 1. Quá hạn
  if (datePart < todayStr) {
    const taskDate = new Date(datePart);
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
    };
  }

  // 2. Hôm nay
  if (datePart === todayStr) {
    return {
      type: "today",
      label: timePart ? `Hôm nay ${timePart}` : "Hôm nay",
      badgeClass: "bg-amber-100 text-amber-900 border-amber-300 font-bold",
      iconName: "clock",
    };
  }

  // 3. Sắp tới / Còn hạn
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

  if (datePart === tomorrowStr) {
    return {
      type: "upcoming",
      label: timePart ? `Ngày mai ${timePart}` : "Ngày mai",
      badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-300 font-medium",
      iconName: "calendar",
    };
  }

  // Các ngày xa hơn: định dạng DD/MM
  const parts = datePart.split("-");
  const formatted = parts.length === 3 ? `${parts[2]}/${parts[1]}` : datePart;

  return {
    type: "upcoming",
    label: timePart ? `${formatted} ${timePart}` : formatted,
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-300 font-medium",
    iconName: "calendar",
  };
};

