# PROMPT 14 - PLANNER BACKLOG FLOW AUDIT

## Phạm vi duy nhất

Chỉ xử lý `PlannerBacklog.tsx`, `PlannerTab.tsx` và helper trực tiếp phục vụ việc xếp lịch từ Hộp chờ. Không sửa Calendar visual, Notification, Today, Filter, Note, Journal, Sổ tay hoặc Cài đặt.

## Yêu cầu

- Hộp chờ chỉ gồm task chưa hoàn thành và chưa có ngày/giờ hiệu lực; task có ngày nhưng chưa có giờ không được đưa vào đây.
- Copy phải rõ đây là danh sách task chưa quyết định ngày, không nói sai rằng chỉ thuộc “trong tháng”.
- Mở Hộp chờ không khóa scroll trang chính; chỉ khóa nền khi mini calendar đang mở.
- Mỗi task hiển thị title, sổ tay/tag/priority chính và nút chọn ngày.
- Mini calendar cho phép chọn từ hôm nay trở về sau; ngày quá khứ bị khóa; không dùng native date picker.
- Sau khi chọn ngày, chỉ cập nhật ngày cần thiết, giữ title, note, tag, notebook, priority và time metadata; task biến mất khỏi Hộp chờ và xuất hiện đúng ngày Planner.
- Không tạo bản sao, không làm mất task, không tự gán giờ hoặc deadline.
- Nếu có prop/state không dùng như `selectedDateStr`, xử lý gọn trong phạm vi này: hoặc dùng đúng mục đích, hoặc loại bỏ an toàn sau khi kiểm tra toàn bộ import/call site.

## Kiểm tra bắt buộc

- Task không ngày, task có ngày không giờ, task đã hoàn thành.
- Chọn ngày hôm nay, ngày tương lai, thử ngày quá khứ.
- Xác nhận metadata trước/sau và danh sách Planner sau reload.
- Kiểm tra 320/390/768/1280px, không tràn ngang và không khóa scroll sai.
- Chạy thật `npx tsc --noEmit` và `npm run build`.
- Cập nhật `.agents/ANTIGRAVITY-REPORT.md` bằng mục `PROMPT 14`, ghi file thật sự đổi và kết quả từng case.

