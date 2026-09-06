# Prompt 02: Tái cấu trúc Cài đặt

## Visual contract bắt buộc

Tab Cài đặt phải dùng cùng visual language với `Today`, `Planner` và `Task`: cùng page shell, content width, header hierarchy, typography scale, spacing rhythm, border `1.5px`, màu token, hard offset shadow, button height, focus/active state và responsive breakpoint. Cài đặt là nội dung hệ thống trong cùng app, không phải một màn hình quản trị có style riêng.

Chỉ xử lý khu vực Cài đặt. Không thay đổi Dashboard, Today, Planner, Note, Journal, Sổ tay hoặc Tổng kết.

## Mục tiêu

Tạo màn hình Cài đặt rõ ràng theo nhóm, không để các thiết lập nằm rải rác trong modal hồ sơ.

## Nhóm cài đặt

1. Tài khoản
- Hiển thị người dùng hiện tại.
- Đăng nhập/đăng xuất theo flow đang có.

2. Giao diện
- Theme hoặc lựa chọn giao diện nếu store hiện tại hỗ trợ.
- Kích thước chữ hoặc density chỉ thêm nếu đã có state tương ứng.
- Không tự tạo setting giả không có persistence.

3. Ngôn ngữ
- Chuẩn bị cấu trúc cho `vi` và `en` nếu hệ thống hiện tại chưa có i18n.
- Nếu chưa có translation system, chỉ tạo section và ghi rõ Planned, không thay toàn bộ text bằng cơ chế tạm.

4. Thông báo
- Bật/tắt notification.
- Hiển thị trạng thái quyền hiện tại.
- Dùng Service Worker notification trên Android Chrome, không gọi `new Notification()` trực tiếp.

5. Đồng bộ và dữ liệu
- Hiển thị trạng thái đồng bộ hiện có.
- Có xuất/nhập dữ liệu nếu chức năng hiện tại đã hỗ trợ.
- Không xóa dữ liệu nếu chưa có bước xác nhận rõ ràng.

6. Về ứng dụng
- Hiển thị version lấy từ nguồn version chung.
- Không hardcode version mới ở component.

## UI và responsive

- Desktop: sidebar nhóm cài đặt + panel chi tiết.
- Mobile: danh sách nhóm trước, bấm vào mở trang chi tiết có Back.
- Không dồn tất cả thành một modal rất dài.
- Không dùng layout, font, radius, shadow, màu hoặc trạng thái tương tác riêng chỉ cho Cài đặt.
- Dùng component hiện có, token hiện có, border nét mực và hard shadow.
- Không dùng native select/date/time.

## Kiểm tra

- Mở từng nhóm cài đặt.
- Reload vẫn giữ các setting có persistence.
- Không làm thay đổi dữ liệu task/note/journal.
- Kiểm tra 320px, 768px, 1280px.
- Chạy `npx tsc --noEmit` và `npm run build`.

Báo cáo rõ setting nào thực sự hoạt động, setting nào Planned và file thực tế đã đổi.
