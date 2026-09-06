# SketchTask App

Tài liệu tổng quan sản phẩm cho My_Task_App.

## Mục Đích

SketchTask là ứng dụng quản lý công việc và ghi chú theo phong cách sổ tay phác thảo. App ưu tiên việc tập trung vào công việc trong ngày, lập kế hoạch và ghi lại nội dung theo ngữ cảnh.

## Cấu Trúc Khu Vực Chính

1. **Dashboard**: Xem tổng quan tiến độ, lịch gần nhất và nhật ký gần đây.
2. **Task**: Khu vực task với Hôm Nay, Kế Hoạch và Hạn Định.
3. **Note**: Khu vực note với Ghi Chú thường và Nhật Ký.
4. **Sổ Tay**: Phân loại task và note theo notebook hoặc chủ đề.
5. **Cài Đặt**: Quản lý tài khoản, giao diện, thông báo và đồng bộ.

`ReviewTab`/Tổng Kết hiện còn trong source legacy nhưng không được xem là tab đang hoạt động trong navigation.

## Nguyên Tắc Sản Phẩm

- Tab Hôm Nay là nơi tập trung xử lý việc trong một ngày, không thay thế Planner.
- Tính năng nâng cao được ẩn sau thao tác mở rộng để giảm tải giao diện.
- Dữ liệu người dùng phải được phân quyền theo `userId`.
- Đồng bộ dữ liệu phải merge an toàn, không xóa toàn bộ dữ liệu cục bộ.
- Giao diện phải hoạt động tốt trên desktop, tablet và mobile.
- Client và backend chạy độc lập trong môi trường phát triển localhost.

## Mô Hình Thời Gian

- `scheduled`: lịch làm việc hoặc cuộc hẹn, có ngày và giờ bắt đầu/kết thúc.
- `deadline`: hạn chót, có ngày và giờ hoàn thành trước.
- `dueDate`: trường tương thích ngược với dữ liệu cũ.
- `CustomDuePicker` dùng chung logic nhưng có giao diện theo ngữ cảnh:
  - `today`: chỉ chọn giờ/phút cho hôm nay.
  - `planner`: chọn ngày và giờ đầy đủ.
  - `datetime`: dùng khi tạo/chỉnh sửa task cần ngày cụ thể.

## Kiến Trúc Chính

- `client/`: React + Vite + TypeScript + PWA.
- `server/`: Express + TypeScript + Prisma + SQLite.
- `api-contract/`: Các DTO và hợp đồng dữ liệu dùng chung.
- `.design/`: Design system và quy tắc UI/UX.
- `.agents/`: Prompt, task và báo cáo giao tiếp với Antigravity.
- `.agent/`: Checklist và log nghiệm thu của Codex.
- `.docs/`: Tài liệu sản phẩm, kiến trúc và hướng dẫn sử dụng app.

## Môi Trường Phát Triển

- Client: `http://localhost:5173`
- Backend: `http://localhost:5000`
- Health check: `http://localhost:5000/health`
- Client dùng Vite proxy để gọi API backend qua `/api/v1`.

## Phiên Bản

Phiên bản hiện tại: `1.6.0`.

Nguồn version chuẩn: `client/src/services/updateService.ts`.

## Tài Liệu Liên Quan

- `AGENTS.md`: chỉ thị bắt buộc cho coding agent.
- `.design/DESIGN-PRINCIPLES.md`: định hướng thiết kế.
- `.design/TOKENS.md`: design tokens.
- `.design/COMPONENTS.md`: component chuẩn.
- `.design/FEATURES-AND-TABS.md`: chức năng từng tab.
- `.agents/prompts/ANTIGRAVITY-TASK.md`: task/prompt hiện tại gửi Antigravity.
- `.agents/reports/ANTIGRAVITY-REPORT.md`: báo cáo thực hiện của Antigravity.
- `.agent/verification/VERIFICATION-LOG.md`: kết quả kiểm tra độc lập của Codex.
