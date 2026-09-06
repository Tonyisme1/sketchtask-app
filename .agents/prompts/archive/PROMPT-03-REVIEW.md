# Prompt 03: Tái cấu trúc Tổng kết

## Visual contract bắt buộc

Tab Tổng kết phải dùng cùng visual language với `Today`, `Planner` và `Task`: cùng page shell, content width, header hierarchy, typography scale, spacing rhythm, border `1.5px`, màu token, hard offset shadow, button height, focus/active state và responsive breakpoint. Chỉ dữ liệu phân tích được khác; không tạo chart theme riêng làm lệch app.

Chỉ xử lý tab Tổng kết. Không thay đổi Dashboard, Today, Planner, Note, Journal, Sổ tay hoặc Cài đặt.

## Mục tiêu

Tổng kết trả lời câu hỏi: người dùng đã làm được gì trong một khoảng thời gian. Không lặp lại Dashboard và không render toàn bộ TaskCard.

## Bố cục

1. Bộ chọn khoảng thời gian
- Tuần, tháng và khoảng tùy chọn nếu code hiện tại hỗ trợ.
- Dùng custom control, không dùng native date picker.
- Khoảng thời gian đang chọn phải hiển thị rõ.

2. Tóm tắt
- Task đã hoàn thành.
- Task đang làm.
- Task quá hạn.
- Tỷ lệ hoàn tất.
- Các số liệu phải dùng cùng logic task hiện có, không tự diễn giải khác.

3. Tiến độ theo ngày
- Hiển thị số task hoàn thành theo từng ngày trong khoảng chọn.
- Dùng biểu đồ hoặc thanh tiến độ đơn giản, đọc được trên mobile.
- Ngày không có dữ liệu phải hiển thị 0, không bỏ sót ngày.

4. Phân tích theo sổ/nhãn
- Chỉ hiển thị nếu có dữ liệu.
- Không làm bảng quá dài.
- Có empty state phù hợp.

5. Nhật ký hoạt động
- Hiển thị tối đa một số entry gần nhất trong khoảng chọn.
- Chỉ hiển thị giờ, nội dung rút gọn và task liên quan nếu có.
- Không biến entry thành TaskCard.

## UI và responsive

- Desktop: lưới 2-3 cột, tận dụng vùng content.
- Tablet: giảm số cột nhưng giữ hierarchy.
- Mobile: xếp dọc theo thứ tự Tóm tắt, Tiến độ, Phân tích, Nhật ký.
- Không dùng card cao hoặc shadow mềm.
- Dùng token và component trong `.design/`.
- Không dùng layout, font, radius, shadow, màu hoặc trạng thái tương tác riêng chỉ cho Tổng kết.

## Kiểm tra

- Không có dữ liệu.
- Có task scheduled, deadline, quá hạn và đã xong.
- Đổi tuần/tháng không kéo dữ liệu ngoài khoảng chọn.
- Số liệu không NaN/undefined.
- Kiểm tra 320px, 768px, 1280px.
- Chạy `npx tsc --noEmit` và `npm run build`.

Báo cáo file thực tế đã đổi, công thức số liệu, case đã kiểm tra và lỗi chưa xác minh.
