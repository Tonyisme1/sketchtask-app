// ==========================================
// TYPES & CONSTANTS: TimePicker Types
// ==========================================

export interface TaskTimeValue {
  timeType?: "scheduled" | "deadline";
  date?: string;
  startTime?: string;
  endTime?: string;
  deadlineDate?: string;
  deadlineTime?: string;
}

export type TimePickerVariant = "today" | "planner" | "datetime";

export interface CustomDuePickerProps {
  value?: string;
  timeData?: TaskTimeValue;
  onChange?: (value: string | undefined, timeData?: TaskTimeValue) => void;
  className?: string;
  variant?: TimePickerVariant;
  initialMode?: "scheduled" | "deadline";
  forcedMode?: "scheduled" | "deadline";
  initialDate?: string;
  selectedDate?: string;
}

export const MONTH_NAMES = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
  "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
  "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

export const DAY_NAMES = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export const ITEM_HEIGHT = 28; // Chiều cao mỗi dòng trong Wheel Picker tối giản (px)
export const VISIBLE_COUNT = 3; // 3 dòng hiển thị: 1 trên, 1 giữa (chọn), 1 dưới
