import type { TaskDto } from "../types";

/** Tags used only by the non-production preview fixture. */
export const DEVELOPMENT_PREVIEW_TAGS = [
  "Cá nhân",
  "Học tập",
  "Dự án",
  "Tài chính",
  "Sức khỏe",
] as const;

const TASK_ACTIONS = [
  "Hoàn thiện",
  "Rà soát",
  "Chuẩn bị",
  "Gửi",
  "Cập nhật",
  "Sắp xếp",
  "Đọc lại",
  "Kiểm tra",
  "Liên hệ",
  "Tổng hợp",
] as const;

const TASK_SUBJECTS = [
  "kế hoạch tuần",
  "tài liệu dự án",
  "ngân sách tháng",
  "mục tiêu học tập",
  "không gian làm việc",
] as const;

const EVENT_ACTIONS = [
  "Họp rà soát",
  "Trao đổi",
  "Buổi hướng dẫn",
  "Gọi cập nhật",
  "Phiên làm việc",
  "Đánh giá",
  "Thảo luận",
  "Buổi học",
  "Họp nhóm",
  "Lên kế hoạch",
] as const;

const EVENT_SUBJECTS = [
  "dự án mới",
  "ngân sách quý",
  "nội dung đào tạo",
  "mục tiêu cá nhân",
  "tiến độ triển khai",
] as const;

const DEADLINE_TIMES = ["08:30", "10:00", "11:30", "14:00", "16:30", "18:00"] as const;
const EVENT_TIMES = ["08:00", "08:30", "09:30", "11:00", "13:30", "15:00", "16:30", "18:00"] as const;

const pad = (value: number) => String(value).padStart(2, "0");

const toLocalIsoDate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const shiftDate = (reference: Date, days: number) => {
  const date = new Date(reference);
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return toLocalIsoDate(date);
};

const addMinutes = (time: string, minutes: number) => {
  const [hours, minutePart] = time.split(":").map(Number);
  const total = Math.min(hours * 60 + minutePart + minutes, 23 * 60 + 59);
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
};

/**
 * Creates a deterministic, dense data set for layout and calendar QA.
 * It is imported only by the development store bootstrap and is never shown
 * as a runtime "load sample data" action in the product UI.
 */
export const createDevelopmentPreviewData = (referenceDate = new Date()): TaskDto[] => {
  const createdAt = referenceDate.toISOString();

  const tasks = Array.from({ length: 50 }, (_, index): TaskDto => {
    const date = shiftDate(referenceDate, (index % 19) - 7);
    const deadlineTime = index % 4 === 0 ? undefined : DEADLINE_TIMES[index % DEADLINE_TIMES.length];
    const completed = index % 11 === 0;
    const title = `${TASK_ACTIONS[index % TASK_ACTIONS.length]} ${TASK_SUBJECTS[Math.floor(index / TASK_ACTIONS.length)]}`;

    return {
      id: `preview-task-${index + 1}`,
      title,
      completed,
      dueDate: deadlineTime ? `${date} ${deadlineTime}` : date,
      itemType: "task",
      timeType: "deadline",
      deadlineDate: date,
      deadlineTime,
      tag: DEVELOPMENT_PREVIEW_TAGS[index % DEVELOPMENT_PREVIEW_TAGS.length],
      priority: index % 7 === 0 ? "high" : index % 3 === 0 ? "low" : "medium",
      status: completed ? "completed" : "todo",
      createdAt,
      updatedAt: createdAt,
    };
  });

  const events = Array.from({ length: 50 }, (_, index): TaskDto => {
    const date = shiftDate(referenceDate, (index % 15) - 4);
    const startTime = EVENT_TIMES[index % EVENT_TIMES.length];
    const isPointEvent = index % 5 === 0;
    const title = `${EVENT_ACTIONS[index % EVENT_ACTIONS.length]} ${EVENT_SUBJECTS[Math.floor(index / EVENT_ACTIONS.length)]}`;

    return {
      id: `preview-event-${index + 1}`,
      title,
      completed: false,
      dueDate: `${date} ${startTime}`,
      itemType: "event",
      timeType: "event",
      startTime,
      endTime: isPointEvent ? undefined : addMinutes(startTime, index % 3 === 0 ? 90 : 60),
      tag: DEVELOPMENT_PREVIEW_TAGS[index % DEVELOPMENT_PREVIEW_TAGS.length],
      priority: "medium",
      status: "todo",
      createdAt,
      updatedAt: createdAt,
    };
  });

  return [...tasks, ...events];
};
