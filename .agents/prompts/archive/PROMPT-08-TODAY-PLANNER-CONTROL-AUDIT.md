# PROMPT 08 - AUDIT CONTROL TODAY / PLANNER

## Phạm vi duy nhất

Chỉ audit và sửa các control visual trong Today/Planner còn không đúng cam kết Prompt 07. Không đổi logic task, dữ liệu, API, layout lớn, Note, Journal, Sổ tay, Cài đặt hoặc Dashboard.

## Việc cần sửa

- Rà soát `PlannerHeader.tsx`, `PlannerFilterBar.tsx`, `PlannerWeekView.tsx`, `PlannerTab.tsx`, `PlannerBacklog.tsx`, `TodayHeader.tsx`, `TodayScheduleNotes.tsx`, `TodayComposerSidebar.tsx`.
- Các button/input chính của hai tab phải dùng `border-[1.5px] border-[#262626]`, hard offset shadow theo token và tactile feedback khi click.
- Không để control chính chỉ dùng class `border` 1px hoặc chỉ có `active:translate-y` mà thiếu translate ngang; chỉ giữ border 1px cho micro-badge/trang trí thực sự nhỏ.
- Không coi `rounded-full` của chấm trạng thái nhỏ là lỗi; chỉ thay nếu nó đang áp dụng cho button/card/control chính.
- Loại bỏ focus ring/outline mặc định gây viền kép; vẫn giữ focus accessible bằng outline nét mực rõ.
- Không thay đổi hierarchy đã chốt: Today có lịch hẹn trước rồi task; Planner giữ Tuần/Tháng/Năm và Hộp chờ.

## Kiểm tra

- Kiểm tra desktop 1280px và mobile 320/390px trên Today và Planner.
- Chạy thật `npx tsc --noEmit` và `npm run build`.
- Cập nhật `.agents/ANTIGRAVITY-REPORT.md` bằng mục `PROMPT 08`, ghi file thực sự đổi và các control đã audit. Nếu lệnh bị runner chặn, ghi lỗi thật.

