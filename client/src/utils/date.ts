// ==========================================
// UTILS: Date Helper (Khắc phục triệt để lệch múi giờ UTC/GMT+7)
// ==========================================

/**
 * Lấy chuỗi ngày YYYY-MM-DD theo giờ địa phương của máy người dùng
 */
export const getLocalTodayStr = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Lấy ngày mai YYYY-MM-DD
 */
export const getLocalTomorrowStr = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return getLocalTodayStr(d);
};

/**
 * Lấy ngày hôm qua YYYY-MM-DD
 */
export const getLocalYesterdayStr = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getLocalTodayStr(d);
};

/**
 * Kiểm tra xem một dueDate có khớp với ngày targetDate không
 */
export const isTaskForDate = (taskDueDate?: string | null, targetDateStr: string = getLocalTodayStr()): boolean => {
  if (!taskDueDate) return true; // Không gán ngày -> Mặc định hiện ở Hôm nay
  // So khớp YYYY-MM-DD ở đầu chuỗi (ví dụ: "2026-08-25" hoặc "2026-08-25 14:30")
  return taskDueDate.startsWith(targetDateStr);
};

