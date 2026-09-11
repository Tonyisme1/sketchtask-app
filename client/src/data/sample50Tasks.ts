import { TaskDto, TaskPriority, TaskTimeType } from "../types";
import { getLocalTodayStr } from "../utils/date";

// Dữ liệu mẫu gọn, không phụ thuộc vào sổ tay đã bị loại bỏ khỏi ứng dụng.
export const generateSample50Tasks = (): TaskDto[] => {
  const today = new Date();
  const priorities: TaskPriority[] = ["high", "medium", "low"];
  const timeTypes: TaskTimeType[] = ["task", "deadline", "scheduled"];
  const titles = [
    "Kiểm tra email quan trọng",
    "Hoàn thiện tài liệu dự án",
    "Ôn tập kiến thức mới",
    "Tập thể dục 30 phút",
    "Lên kế hoạch cho ngày mai",
    "Dọn dẹp danh sách công việc",
    "Đọc tài liệu tham khảo",
    "Gọi điện trao đổi công việc",
    "Cập nhật tiến độ tuần",
    "Chuẩn bị nội dung họp",
  ];

  return Array.from({ length: 50 }, (_, index) => {
    const offset = (index % 11) - 5;
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    const dueDate = getLocalTodayStr(date);
    const timeType = timeTypes[index % timeTypes.length];
    const completed = index % 7 === 0;
    const startTime = timeType === "scheduled" ? `${String(8 + (index % 10)).padStart(2, "0")}:00` : undefined;
    const deadlineTime = timeType === "deadline" ? `${String(9 + (index % 9)).padStart(2, "0")}:00` : undefined;

    return {
      id: `sample-task-${index + 1}`,
      title: `${titles[index % titles.length]} ${index + 1}`,
      description: index % 4 === 0 ? "Dữ liệu mẫu để kiểm tra danh sách và bộ lọc." : undefined,
      completed,
      dueDate,
      timeType,
      startTime,
      endTime: timeType === "scheduled" ? `${String(9 + (index % 10)).padStart(2, "0")}:00` : undefined,
      deadlineDate: timeType === "deadline" ? dueDate : undefined,
      deadlineTime,
      tag: index % 2 === 0 ? "Cá nhân" : "Công việc",
      tags: [index % 2 === 0 ? "Cá nhân" : "Công việc"],
      priority: priorities[index % priorities.length],
      status: completed ? "completed" : "todo",
      createdAt: new Date(today.getTime() - (index + 1) * 3600000).toISOString(),
      updatedAt: today.toISOString(),
    };
  });
};
