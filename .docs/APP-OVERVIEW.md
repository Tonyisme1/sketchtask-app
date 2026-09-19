# SketchTask App

Tài liệu tổng quan sản phẩm cho My_Task_App. Nội dung phải mô tả feature đang được mount trong `client/src`; ý tưởng chưa triển khai phải ghi rõ là `Planned`.

## Mục đích

SketchTask là app cá nhân để quản lý task, lịch hẹn, deadline, ghi chú và nhật ký. App ưu tiên xử lý công việc hôm nay, lập kế hoạch theo thời gian và ghi lại nội dung theo ngữ cảnh.

## Phạm vi đang hoạt động

1. **Task workspace:** Hôm nay, Kế hoạch và Hạn định.
2. **Ghi chép:** Ghi chú và Nhật ký.
3. **AI:** trợ lý AI theo platform.
4. **Thông báo:** notification drawer/page và trạng thái permission.
5. **Cài đặt:** tài khoản, giao diện, typography, thông báo, dữ liệu, bảo mật, shortcut và giới thiệu.

Notebook chỉ là dữ liệu phân loại trong task/note/journal. `Dashboard`, `Review/Tổng kết` và workspace `Sổ tay` riêng không phải navigation hiện hành.

## Nguyên tắc sản phẩm

- Hành vi và dữ liệu ổn định trước thay đổi visual.
- Desktop, tablet và mobile dùng chung semantics/token nhưng được phép có composition khác nhau.
- Back từ child detail phải đóng child trước, pop stack sau và cuối cùng quay về `Hôm nay`.
- Dữ liệu local cập nhật nhanh; sync lỗi phải báo trạng thái/retry, không âm thầm xóa dữ liệu.
- Dữ liệu theo user phải được bảo vệ ở backend bằng JWT/user context, không tin `userId` từ client.
- Mọi thay đổi feature phải cập nhật source, contract liên quan và tài liệu trong cùng một change.

## Mô hình thời gian

- `scheduled`: lịch thực hiện/cuộc hẹn, có ngày và có thể có giờ.
- `deadline`: hạn chót, có ngày và có thể có giờ.
- `dueDate`: trường tương thích ngược với dữ liệu cũ.
- `DatePickerPopover` và `TimePickerPopover` là picker custom dùng trong create/edit flow.
- Scheduled không tự biến thành deadline overdue; trạng thái thời gian phải lấy từ logic task chung.

## Kiến trúc chính

- `client/`: React + Vite + TypeScript + PWA.
- `server/`: Express + TypeScript + Prisma + PostgreSQL.
- `api-contract/`: DTO và hợp đồng dữ liệu dùng chung.
- `.design/`: runtime UI state, principles, tokens và components.
- `.docs/`: phạm vi feature, kiến trúc, dữ liệu, phát triển và kiểm thử.

## Môi trường phát triển

- Client: `http://localhost:5173`.
- Backend: `http://localhost:5000`.
- Health check: `http://localhost:5000/health`.
- Client gọi API qua `/api/v1`; Vite proxy chuyển tiếp sang backend.
- Backend đọc `DATABASE_URL`; Prisma migrations dùng `DIRECT_URL`. Local có thể trỏ tới PostgreSQL cục bộ hoặc project cloud tùy file môi trường, không dùng SQLite mặc định.

## Phiên bản

Version runtime phải lấy từ `client/src/services/updateService.ts`. Không hardcode version ở component hoặc tài liệu feature riêng.

## Tài liệu liên quan

- `AGENTS.md`: chỉ thị bắt buộc cho coding agent.
- `.design/README.md`: cách đọc design rules.
- `.design/CURRENT-STATE.md`: runtime UI và navigation.
- `.design/PRINCIPLES.md`: nguyên tắc UX/UI.
- `.design/TOKENS.md`: design tokens.
- `.design/COMPONENTS.md`: component chuẩn.
- `.docs/FEATURES.md`: feature đang hoạt động và Planned.
- `.docs/ARCHITECTURE.md`: cấu trúc client/backend và sync.
