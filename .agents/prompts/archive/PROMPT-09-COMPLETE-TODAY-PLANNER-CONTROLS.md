# PROMPT 09 - COMPLETE TODAY / PLANNER CONTROL AUDIT

## Phạm vi duy nhất

Hoàn tất các control visual còn sót sau Prompt 08. Chỉ sửa class/style trong Today, Planner và component shared được Today/Planner dùng. Không đổi logic task, dữ liệu, API hoặc tab khác.

## Việc cần làm

- Rà lại `QuickAddTaskComposer.tsx`, `TodayComposerSidebar.tsx`, `PlannerFilterBar.tsx`, `PlannerHeader.tsx`.
- Với button/input/select-like control chính đang dùng `border` 1px hoặc thiếu tactile, chuẩn hóa thành `border-[1.5px] border-[#262626]`, hard offset shadow theo token và `active:translate-x-[0.5px] active:translate-y-[0.5px]`.
- Bổ sung `active:shadow-none` cho các control có hard shadow khi nhấn.
- Giữ `border` 1px cho micro-badge, chip trạng thái hoặc đường viền phụ nhỏ; không cần đổi các chấm `rounded-full` trang trí.
- Không sửa các khối layout, không đổi hierarchy Today/Planner, không đổi các mode Tuần/Tháng/Năm và không đổi nội dung hiển thị.
- Kiểm tra focus không tạo viền kép và không làm tràn ngang ở 320/390/768/1280px.

## Kiểm tra bắt buộc

- Chạy thật `npx tsc --noEmit`.
- Chạy thật `npm run build`.
- Cập nhật `.agents/ANTIGRAVITY-REPORT.md` mục `PROMPT 09`, liệt kê file thực sự đổi và các control đã rà. Nếu không chạy được, ghi lỗi thật.

