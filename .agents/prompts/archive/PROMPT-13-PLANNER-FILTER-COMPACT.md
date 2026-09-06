# PROMPT 13 - PLANNER FILTER COMPACT AUDIT

## Phạm vi duy nhất

Chỉ xử lý `PlannerFilterBar.tsx`, `FilterBar.tsx` và cách Planner truyền props filter nếu thật sự cần. Không sửa Calendar, Backlog logic, Notification, Today hoặc các tab khác.

## Yêu cầu

- Hàng filter chính chỉ giữ `Tất cả`, `Cần làm`, `Đã xong`, `Lọc` và action Hộp chờ khi có task chưa sắp lịch.
- Sổ tay và Nhãn phải mở bằng `CustomSelect`, không bung toàn bộ lựa chọn thành chip/button trên hàng chính.
- Dropdown phải có lựa chọn `Tất cả`, `Không thuộc/Không gắn`, danh sách hiện có; không dùng native `<select>`.
- Khi có filter, nút Lọc hiển thị active count; nút reset chỉ xuất hiện khi cần.
- Nút Hộp chờ hiển thị count, trạng thái mở/đóng rõ ràng và có tactile feedback; không làm hàng filter tràn ngang ngoài ý muốn.
- Drawer filter trên mobile không làm phình layout: danh sách dài cuộn bên trong dropdown/panel, không khóa cuộn trang chính khi chỉ mở filter.
- Giữ nguyên callback, giá trị filter và logic lọc hiện có.

## Kiểm tra bắt buộc

- Planner ở 320/390/768/1280px.
- Chọn/reset filter Sổ tay, Nhãn, Loại thời gian, Ưu tiên.
- Mở/đóng Hộp chờ và xác nhận count không sai.
- Chạy thật `npx tsc --noEmit` và `npm run build`.
- Cập nhật `.agents/ANTIGRAVITY-REPORT.md` bằng mục `PROMPT 13`, ghi file thực sự đổi và các case đã kiểm tra.

