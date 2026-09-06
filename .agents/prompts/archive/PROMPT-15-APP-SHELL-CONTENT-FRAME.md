# PROMPT 15 - APP SHELL CONTENT FRAME CONSISTENCY

## Phạm vi duy nhất

Chuẩn hóa khung diện tích của các tab đang hoạt động: Dashboard, Today/Task, Planner, Note/Journal, Sổ tay và Cài đặt. Ưu tiên sửa `AppShell`/container dùng chung và class layout của từng tab khi cần. Không đổi business logic, dữ liệu, API, navigation hierarchy, task semantics hoặc nội dung chức năng.

## Vấn đề cần giải quyết

Ảnh thực tế cho thấy Today/Task gần chiếm toàn bộ canvas còn Dashboard, Note/Journal và Cài đặt bị bó vào một khung giữa màn hình. Khi chuyển tab, mép trái/phải và mật độ nội dung thay đổi đột ngột.

## Quy chuẩn mới

- Sau Sidebar, main content phải dùng cùng một content frame: `w-full min-w-0`, padding ngang nhất quán và không tự ý dùng `max-w-*` hẹp ở từng tab.
- Desktop 1280/1440: nội dung sử dụng hợp lý toàn bộ vùng còn lại sau Sidebar; không bị co thành cột giữa nếu tab không có lý do master-detail rõ ràng.
- Tablet 768/1024: content frame co giãn theo chiều rộng còn lại, không tạo horizontal scroll.
- Mobile 320/390: giữ full-width, padding nhỏ nhất quán, không ảnh hưởng bottom navigation và không ép layout desktop.
- Dashboard có thể giữ grid nội bộ; Note/Journal có thể giữ editor/book nội bộ; Settings có thể giữ 2 cột nội bộ. Chỉ chuẩn hóa khung ngoài, không kéo tất cả nội dung thành một card dài.
- Giữ visual language chung: nền giấy, divider, typography, token màu và hard shadow hiện có.
- Không thêm `max-w` mới để chữa tạm; nếu cần giới hạn chiều rộng của editor/card thì giới hạn ở component nội bộ, không giới hạn toàn bộ page.
- Không thay đổi hoặc khôi phục tab Tổng kết.

## Kiểm tra bắt buộc

- So sánh Dashboard, Today, Planner, Ghi chú, Nhật ký, Sổ tay, Cài đặt ở 1280px.
- Kiểm tra 768/1024px và 320/390px.
- Chuyển qua lại giữa các tab, xác nhận header, mép trái/phải, scroll container và bottom nav không nhảy bất thường.
- Cập nhật `.agents/ANTIGRAVITY-REPORT.md` mục `PROMPT 15`, ghi file thật sự đổi và lý do nếu tab nào vẫn giữ giới hạn nội bộ.
- Chạy thật `npx tsc --noEmit` và `npm run build`; nếu bị runner chặn phải ghi lỗi thật.

