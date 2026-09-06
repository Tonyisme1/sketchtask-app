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
 * (Khuyến nghị dùng isTaskForSpecificDate / isTaskDueToday trong taskSemantics cho TaskDto)
 */
export const isTaskForDate = (taskDueDate?: string | null, targetDateStr: string = getLocalTodayStr()): boolean => {
  if (!taskDueDate) return false;
  return taskDueDate.startsWith(targetDateStr);
};

/**
 * Lấy chuỗi ngày kế tiếp YYYY-MM-DD từ một chuỗi ngày bất kỳ (YYYY-MM-DD)
 * Đảm bảo tính toán chính xác tuyệt đối qua các tháng và năm
 */
export const getNextDayStr = (dateStr: string): string => {
  if (!dateStr) return getLocalTomorrowStr();
  const rawDate = dateStr.split(" ")[0];
  const parts = rawDate.split("-");
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      const nextDate = new Date(y, m, d + 1);
      return getLocalTodayStr(nextDate);
    }
  }
  return getLocalTomorrowStr();
};

/**
 * Format chuỗi ngày YYYY-MM-DD thành định dạng ngắn DD/MM (ví dụ "18/08", "31/08", "01/09", "01/01")
 */
export const formatShortDayMonth = (dateStr: string): string => {
  if (!dateStr) return "";
  const rawDate = dateStr.split(" ")[0];
  const parts = rawDate.split("-");
  if (parts.length === 3) {
    const day = parts[2].padStart(2, "0");
    const month = parts[1].padStart(2, "0");
    return `${day}/${month}`;
  }
  return dateStr;
};

/**
 * Format chuỗi ngày YYYY-MM-DD thành định dạng đầy đủ DD/MM/YYYY
 */
export const formatFullDate = (dateStr: string): string => {
  if (!dateStr || dateStr === "no-date") return "Chưa xác định";
  const rawDate = dateStr.split(" ")[0];
  const parts = rawDate.split("-");
  if (parts.length === 3) {
    const day = parts[2].padStart(2, "0");
    const month = parts[1].padStart(2, "0");
    const year = parts[0];
    return `${day}/${month}/${year}`;
  }
  return dateStr;
};

/**
 * Parse chuỗi ngày YYYY-MM-DD thành Date object cục bộ (không bị lệch timezone)
 */
export const parseDateString = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const rawDate = dateStr.split(" ")[0];
  const parts = rawDate.split("-");
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m, d);
    }
  }
  return new Date();
};

/**
 * Format Date object thành YYYY-MM-DD theo giờ địa phương
 */
export const formatDateString = (date: Date): string => {
  return getLocalTodayStr(date);
};
