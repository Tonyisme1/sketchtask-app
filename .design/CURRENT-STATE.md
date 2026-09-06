# Current UI State

Tài liệu này mô tả UI/UX đang có trong source, không phải danh sách ý tưởng tương lai.

## Layout

- Desktop: `AppShell` có Sidebar bên trái và header sticky.
- Mobile: `MobileNav` cố định ở đáy; modal dùng bottom sheet.
- Tablet: dùng layout responsive của client, cần kiểm tra ở breakpoint trung gian khi sửa UI.
- Client phát triển bằng React + Vite trong `client/src`.

## Điều Hướng

App hiện tổ chức theo 3 khu vực chính và các nhánh theo ngữ cảnh:

1. **Dashboard** (`DashboardTab`): tổng quan nhanh, tiến độ, lịch gần nhất và nhật ký gần đây.
2. **Task** (`TasksTab`): khu vực task với các nhánh **Hôm nay** (`TodayTab`), **Kế hoạch** (`PlannerTab`) và **Hạn định**.
3. **Note** (`NotesTab`): khu vực note với hai nhánh **Ghi chú** và **Nhật ký** (`JournalTab`).
4. **Sổ tay** (`NotebooksTab`): mục điều hướng phụ để quản lý notebook và dữ liệu theo sổ.
5. **Cài đặt** (`SettingsTab`): mục điều hướng phụ cho tài khoản, giao diện và đồng bộ.

Tên hiển thị và nhóm điều hướng phải lấy theo `PRIMARY_TABS` và `SECONDARY_TABS` trong `client/src/components/layout/Sidebar.tsx`.

`ReviewTab` còn tồn tại trong source để tương thích/lưu trữ, nhưng không phải tab đang được điều hướng trong `App.tsx`. Không mô tả nó như một khu vực đang hoạt động nếu chưa được nối lại vào navigation.

## TodayTab

- Header hiển thị ngày hiện tại và tiến độ task trong ngày.
- Danh sách tách thành task quá hạn và lịch trình hôm nay.
- Quick add có tiêu đề, nút thêm và vùng tùy chọn mở rộng.
- Bộ lọc chính gồm `Tất cả`, `Cần làm`, `Đã xong` và bộ lọc nâng cao.
- Task card hỗ trợ hoàn thành, sửa, xóa và dời sang ngày mai.
- Task dài được giới hạn dòng trên card; nội dung đầy đủ xem trong modal sửa.
- Khi keyboard mở trên mobile, `MobileNav` phải ẩn và nội dung vẫn cuộn được.

## Time Picker

`CustomDuePicker` hiện được dùng ở TodayTab, PlannerTab, NotebooksTab và EditTaskModal.

- Có hai loại dữ liệu: `scheduled` và `deadline`.
- Wheel picker dùng cho giờ/phút.
- Component dùng chung logic nhưng đã có ba variant giao diện: `today`, `planner`, `datetime`.
- `today` chỉ chọn giờ/phút cho hôm nay; `planner` và `datetime` dùng lịch đầy đủ.

## Trạng thái UX

- Có empty state cho danh sách.
- Modal có trạng thái mở/đóng và bottom sheet trên mobile.
- Các form cần hỗ trợ default, focus, disabled, loading và error theo component cụ thể.
- Trải nghiệm keyboard/touch trên thiết bị thật vẫn cần kiểm tra thủ công.

## Sai lệch cần tránh

- Không gọi `Note` là `Ý tưởng` hoặc `Brain Dump`; tên hiện hành là `Ghi chú` và `Nhật ký`.
- Không gọi `ReviewTab` là tab `Tổng kết` đang hoạt động khi nó chưa có route/navigation.
- Không mô tả tính năng Planned như đã hoàn thành.
- Không dùng chung giao diện lịch đầy đủ cho mọi ngữ cảnh nếu variant đã được triển khai.
