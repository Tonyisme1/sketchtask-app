# PROMPT 12 - NOTIFICATION OVERDUE / PAST SCHEDULED

## Phạm vi duy nhất

Chỉ xử lý khu vực thông báo trong `client/src/components/ui/feedback/NotificationBell.tsx` và helper trực tiếp nếu cần. Không sửa Today, Planner Calendar, Quick Add, Note, Journal, Sổ tay, Cài đặt hoặc Dashboard.

## Yêu cầu

1. Giữ bốn nhóm/filter hiện có: `Tất cả`, `Quá hạn`, `Lịch hẹn đã qua`, `Chưa đọc`.
2. `Quá hạn` chỉ gồm deadline chưa hoàn thành, nhóm theo ngày deadline thực tế, không trộn scheduled.
3. `Lịch hẹn đã qua` chỉ gồm scheduled chưa hoàn thành, nhóm theo ngày hẹn, không gắn nhãn Quá hạn.
4. Card trong mỗi nhóm vẫn mở được task detail; nút hoàn thành và ArrowRight giữ đúng hành vi hiện có.
5. Chuẩn hóa các button tương tác chính của notification:
   - border `1.5px` khi là control chính;
   - hard offset shadow;
   - `active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none`;
   - không còn viền kép/focus mặc định.
6. Giữ bottom sheet mobile, grab handle, nút đóng và cuộn nội bộ; không khóa cuộn nền sai cách.
7. Không thay đổi công thức badge chuông ngoài việc bảo đảm nó đếm đúng cảnh báo chưa xử lý.

## Kiểm tra bắt buộc

- Kiểm tra đủ 4 filter, empty state từng filter, nhóm nhiều ngày và task scheduled/deadline cùng tồn tại.
- Kiểm tra mobile 320/390px và desktop 1280px, không tràn ngang.
- Chạy thật `npx tsc --noEmit` và `npm run build`.
- Cập nhật `.agents/ANTIGRAVITY-REPORT.md` bằng mục `PROMPT 12`, ghi file thật sự đổi, case đã kiểm tra và lỗi chưa xác minh.

