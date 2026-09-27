# Smoke Test Rút Gọn SketchTask

Mục tiêu là kiểm thử một nghiệp vụ ở cả ba breakpoint, không tạo thêm màn hình chỉ để xem cùng một dữ liệu. Bộ này dùng fixture kiểm thử, không phải dữ liệu mẫu runtime. Khi chạy `DEV` với kho local của khách trống, app có thể bootstrap một fixture trực quan 100 mục (50 việc và 50 sự kiện) đúng một lần; fixture này không có control nạp dữ liệu, không chạy khi đã đăng nhập và không được đưa vào production.

## Bộ Dữ Liệu

| Mã | Dữ liệu | Kỳ vọng |
| --- | --- | --- |
| A | Task không ngày: `Đọc tài liệu` | Chỉ ở backlog, không quá hạn |
| B | Task hạn ngày mai 09:00: `Nộp báo cáo` | Hiện hạn inline, checkbox hoàn thành |
| C | Task hạn hôm qua: `Thanh toán hóa đơn` | Metadata quá hạn, không có tab/filter riêng |
| D | Event 09:00-10:00: `Họp nhóm` | Block thời gian, không checkbox |
| E | Event 13:30: `Gọi điện khách hàng` | Marker nhỏ, không tự có 60 phút |
| F | Task cha `Ra mắt` và con `Soạn checklist` | Quan hệ cha/con được giữ khi sửa |

## Luồng Bắt Buộc

| # | Thao tác | Kết quả đúng |
| --- | --- | --- |
| 1 | Tạo/sửa B | Chỉ có một tag; Task không có khoảng bắt đầu-kết thúc |
| 2 | Tạo/sửa D và E | Event được phép có khoảng giờ hoặc chỉ mốc bắt đầu; không checkbox |
| 3 | Kéo A vào timeline | A trở thành deadline tại mốc đã chọn, không tự thành block 60 phút |
| 4 | Mở Task/Event từ Search | Cùng `GlobalSearchModal` ở desktop/tablet/mobile, không tràn category mobile |
| 5 | Hoàn thành B ở card và popup | Trạng thái đồng bộ; Event không có action hoàn thành |
| 6 | Sửa F rồi xóa task cha | Sửa giữ `parentTaskId`; xóa cha nâng con thành task độc lập |
| 7 | Nhờ AI chia nhỏ mục tiêu thiếu ngữ cảnh | AI hỏi lại, không tạo bước; proposal đầy đủ mặc định chưa chọn |
| 8 | Mở Settings mobile, rồi detail | Root `Cá nhân` không có Back; detail có Back, không còn dashboard dài |
| 9 | Back từ task detail, search, note và journal | Đóng surface con trước rồi mới quay workspace trước đó |

## Ma Trận Giao Diện

| Breakpoint | Kích thước | Cần xác nhận |
| --- | --- | --- |
| Mobile | `390x844` | Safe area FAB/dock, search category, Settings phẳng, keyboard/back |
| Tablet | `834x1112` | Dock Việc/Sự kiện/Ghi chép/AI, Event workspace độc lập, không import Mobile page |
| Desktop | `1440x900` | Sidebar tag, Event calendar, right dock, master-detail Settings |

## Gate Trước Khi Phát Hành

- `client` và `server` TypeScript check pass.
- `api-contract` typecheck pass.
- Client và server production build pass; server build không chạy Prisma migration.
- `scripts/testTimelineLayout.mjs`, architecture audit và unused-file audit pass.
- Không có `VITE_GEMINI_API_KEY`; provider key chỉ có trong server environment.
- Không có route/tab `Hôm nay`, `Planner`, `Sắp đến` hoặc `Hạn định`.
