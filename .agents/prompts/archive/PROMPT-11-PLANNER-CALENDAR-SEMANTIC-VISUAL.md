# PROMPT 11 - PLANNER CALENDAR SEMANTIC VISUAL FIX

## Phạm vi duy nhất

Chỉ sửa `client/src/components/features/planner/PlannerCalendar.tsx` và các helper đã có nếu thật sự cần. Không thay đổi task logic, API, dữ liệu, Today, Notification, Quick Add hoặc các tab khác.

## Yêu cầu

1. Ô tháng trước/sau:
   - Vẫn chỉ dùng để hoàn thiện lưới.
   - Không nhận selected/today/task count/overdue marker.
   - Không bị kéo task của tháng khác vào tháng đang xem.
2. Ngày trong tháng hiện tại:
   - Ngày đã qua: nền đỏ rất nhẹ/muted, chữ đủ tương phản.
   - Ngày tương lai: nền vàng rất nhẹ.
   - Ngày hôm nay: highlight xanh nhẹ.
   - Ngày đang chọn: viền và hard shadow rõ, không dùng ring mặc định chồng màu; nếu đồng thời là hôm nay thì kết hợp màu hợp lý nhưng selected vẫn phải nhận biết được.
3. Marker trong ô:
   - Hiển thị tổng số task đúng ngày.
   - Chấm đỏ chỉ khi có deadline quá hạn chưa hoàn thành.
   - Lịch hẹn đã qua dùng chấm xám/trung tính, không bị đọc thành deadline quá hạn.
   - Không làm ô lịch phình hoặc tràn ở 320/390px.
4. `title` và `aria-label` của ngày phải mô tả đủ ngữ cảnh, gồm ngày, tổng việc và khi có thì số quá hạn/lịch hẹn đã qua.
5. Không đổi các mode Tuần/Tháng/Năm và không thêm native date picker.

## Kiểm tra bắt buộc

- Kiểm tra tháng có ô phụ đầu/cuối tháng, ví dụ tháng 8/9; task tháng sau không xuất hiện ở ô phụ tháng này.
- Kiểm tra ngày quá khứ, hôm nay, tương lai, ngày selected và ngày có deadline quá hạn.
- Kiểm tra mobile 320/390px, tablet 768px, desktop 1280px.
- Chạy thật `npx tsc --noEmit` và `npm run build`.
- Cập nhật `.agents/ANTIGRAVITY-REPORT.md` bằng mục `PROMPT 11`, ghi file thật sự đổi, case đã kiểm tra và lỗi chưa xác minh.

