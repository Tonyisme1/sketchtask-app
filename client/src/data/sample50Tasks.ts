import { TaskDto, TaskPriority } from "../types";
import { getLocalTodayStr } from "../utils/date";

const TASK_TITLES = [
  "Kiểm tra email quan trọng",
  "Hoàn thiện tài liệu dự án",
  "Ôn tập kiến thức mới",
  "Tập thể dục buổi sáng",
  "Lên kế hoạch cho ngày mai",
  "Dọn dẹp danh sách công việc",
  "Đọc tài liệu tham khảo",
  "Gọi điện trao đổi công việc",
  "Cập nhật tiến độ tuần",
  "Chuẩn bị nội dung họp",
  "Phản hồi góp ý từ khách hàng",
  "Kiểm tra kết quả triển khai",
  "Viết bản nháp đề xuất",
  "Sắp xếp tài liệu cá nhân",
  "Hoàn thành bài tập đang làm",
  "Nộp báo cáo tuần",
  "Rà soát ngân sách tháng",
  "Lập danh sách việc ưu tiên",
  "Đặt lịch khám sức khỏe",
  "Thanh toán hóa đơn điện",
  "Sao lưu dữ liệu quan trọng",
  "Cập nhật hồ sơ cá nhân",
  "Chuẩn bị bài thuyết trình",
  "Kiểm tra lịch làm việc",
  "Gửi lời mời khảo sát",
  "Tổng hợp phản hồi người dùng",
  "Chỉnh sửa nội dung trang chủ",
  "Kiểm tra luồng đăng ký",
  "Tối ưu hiệu năng trang",
  "Cập nhật ghi chú cuộc họp",
  "Lập kế hoạch học tập",
  "Hoàn thiện danh sách mua sắm",
  "Đọc sách chuyên ngành",
  "Luyện tập kỹ năng thuyết trình",
  "Sắp xếp không gian làm việc",
  "Gọi điện cho gia đình",
  "Chuẩn bị bữa ăn trong tuần",
  "Kiểm tra mục tiêu tháng",
  "Đánh giá tiến độ cá nhân",
  "Viết nhật ký cuối ngày",
  "Lên ý tưởng tính năng mới",
  "Rà soát kế hoạch truyền thông",
  "Tạo bản sao lưu dự án",
  "Kiểm tra quyền truy cập",
  "Cập nhật hướng dẫn sử dụng",
  "Soạn nội dung bản tin",
  "Đánh giá chất lượng công việc",
  "Ghi lại quyết định quan trọng",
  "Chuẩn bị câu hỏi phỏng vấn",
  "Theo dõi tiến độ học tập",
  "Hoàn thiện thiết kế giao diện",
  "Kiểm tra dữ liệu biểu mẫu",
  "Sắp xếp lịch hẹn trong tuần",
  "Gửi báo cáo cho nhóm",
  "Đọc lại mục tiêu quý",
  "Chuẩn bị tài liệu đào tạo",
  "Rà soát công việc tồn đọng",
  "Cập nhật danh sách liên hệ",
  "Kiểm tra thông báo hệ thống",
  "Lập kế hoạch cuối tuần",
];

const EVENT_TITLES = [
  "Họp khởi động dự án",
  "Trao đổi tiến độ cùng nhóm",
  "Buổi giới thiệu sản phẩm",
  "Họp phản hồi khách hàng",
  "Phiên làm việc tập trung",
  "Họp lập kế hoạch tuần",
  "Buổi chia sẻ kiến thức",
  "Phỏng vấn ứng viên",
  "Cuộc gọi với đối tác",
  "Họp đánh giá sprint",
  "Buổi hướng dẫn thành viên mới",
  "Workshop thiết kế giao diện",
  "Họp rà soát ngân sách",
  "Buổi demo sản phẩm",
  "Cuộc hẹn tư vấn sức khỏe",
  "Họp bàn giao công việc",
  "Buổi học trực tuyến",
  "Họp phân tích dữ liệu",
  "Phiên review mã nguồn",
  "Cuộc gọi cập nhật dự án",
  "Họp chuẩn bị ra mắt",
  "Buổi trao đổi định hướng",
  "Lịch hẹn nha khoa",
  "Họp tổng kết tháng",
  "Buổi luyện phỏng vấn",
  "Cuộc gọi chăm sóc khách hàng",
  "Họp xử lý sự cố",
  "Buổi thảo luận ý tưởng",
  "Phiên làm việc với cố vấn",
  "Họp kiểm tra chất lượng",
  "Buổi học ngoại ngữ",
  "Cuộc hẹn làm việc tại quán cà phê",
  "Họp cập nhật kế hoạch",
  "Buổi trình bày đề xuất",
  "Cuộc gọi tuyển dụng",
  "Họp rà soát bảo mật",
  "Buổi đánh giá trải nghiệm",
  "Phiên trao đổi cùng khách hàng",
  "Họp chốt phạm vi công việc",
  "Buổi tổng kết dự án",
];

const PRIORITIES: TaskPriority[] = ["high", "medium", "low"];
const TAGS = ["Công việc", "Cá nhân", "Học tập", "Dự án Web", "Tài chính", "Ý tưởng"];

const atOffset = (baseDate: Date, offset: number) => {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + offset);
  return getLocalTodayStr(date);
};

const formatTime = (hour: number) => `${String(hour).padStart(2, "0")}:00`;

// Generates data only when the user explicitly loads samples from Settings.
// IDs stay internal for CRUD and sync; visible titles never include sample IDs.
export const generateSample50Tasks = (): TaskDto[] => {
  const now = new Date();
  const tasks = TASK_TITLES.map((title, index): TaskDto => {
    const scheduleKind = index % 4;
    const date = atOffset(now, (index % 25) - 8);
    const tag = TAGS[index % TAGS.length];
    const completed = index % 13 === 0;
    const hour = 8 + (index % 10);
    const baseData = {
      id: `sample-task-${index + 1}`,
      title,
      completed,
      tag,
      priority: PRIORITIES[index % PRIORITIES.length],
      status: completed ? "completed" as const : "todo" as const,
      createdAt: new Date(now.getTime() - (index + 1) * 3600000).toISOString(),
      updatedAt: now.toISOString(),
    };

    if (scheduleKind === 0) return { ...baseData, timeType: "task" };
    if (scheduleKind === 1) {
      return {
        ...baseData,
        dueDate: date,
        deadlineDate: date,
        deadlineTime: formatTime(hour),
        timeType: "deadline",
      };
    }
    if (scheduleKind === 2) {
      return {
        ...baseData,
        dueDate: date,
        startDate: date,
        startTime: formatTime(hour),
        endTime: formatTime(hour + 1),
        timeType: "scheduled",
      };
    }
    return { ...baseData, dueDate: date, timeType: "task" };
  });

  const events = EVENT_TITLES.map((title, index): TaskDto => {
    const date = atOffset(now, (index % 25) - 8);
    const hour = 8 + (index % 10);
    const tag = TAGS[index % TAGS.length];
    return {
      id: `sample-event-${index + 1}`,
      title,
      completed: false,
      dueDate: date,
      startDate: date,
      endDate: date,
      startTime: formatTime(hour),
      endTime: formatTime(hour + 1),
      itemType: "event",
      timeType: "event",
      tag,
      status: "todo",
      createdAt: new Date(now.getTime() - (TASK_TITLES.length + index + 1) * 3600000).toISOString(),
      updatedAt: now.toISOString(),
    };
  });

  return [...tasks, ...events];
};
