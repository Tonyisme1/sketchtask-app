# PROMPT 06 - ĐỒNG BỘ VISUAL TODAY VÀ PLANNER

## Phạm vi lượt này

Chỉ chỉnh giao diện desktop/tablet/mobile của `Today` và `Planner`. Không sửa logic ngày giờ, dữ liệu, API, Note, Journal, Sổ tay, Cài đặt hoặc Dashboard.

## Mục tiêu

Today và Planner phải nhìn cùng một hệ thống SketchTask, nhưng vẫn giữ vai trò riêng:

- Today: tập trung vào các lịch hẹn trong ngày, sau đó là danh sách task trong ngày.
- Planner: tập trung vào thanh chọn Tuần/Tháng/Năm và danh sách của ngày đang chọn.

## Việc phải làm

1. Đối chiếu `TodayTab.tsx`, `PlannerTab.tsx`, `PlannerWeekView.tsx`, `PlannerCalendar.tsx`, `TaskList.tsx` và các component filter hiện có trước khi sửa.
2. Đồng bộ page shell:
   - cùng padding ngang và khoảng cách giữa header, filter, content;
   - cùng hệ thống heading, subtitle và divider;
   - không để một tab bị bó hẹp giữa màn hình trong khi tab kia kéo lệch toàn chiều ngang.
3. Đồng bộ control:
   - chiều cao input/button/filter;
   - border 1.5px, màu từ token và hard offset shadow;
   - trạng thái active, hover, disabled, focus và pressed;
   - không dùng native select/date/time control.
4. Đồng bộ mật độ task:
   - tiêu đề task, badge thời gian, tag, sổ tay và nhóm thao tác có cùng cỡ chữ/khoảng cách;
   - không để card Today và card Planner chênh lệch quá lớn khi cùng hiển thị một task;
   - vẫn giữ màu nền riêng cho lịch hẹn, deadline, quá hạn và đã xong.
5. Sửa empty state Today:
   - không để một vùng trắng khổng lồ khi không có task;
   - giữ CTA thêm việc rõ ràng nhưng gọn;
   - không làm mất panel thêm việc bên phải trên desktop.
6. Sửa responsive:
   - desktop: nội dung và panel thao tác cân đối;
   - tablet: không tràn ngang, không ép card quá nhỏ;
   - mobile 320/390px: không có horizontal overflow, filter và task card không bị cắt.

## Giữ nguyên

- Không thay đổi quy tắc task quá hạn của Prompt 04/05.
- Không bỏ các mode `Tuần / Tháng / Năm` của Planner.
- Không bỏ cấu trúc Sidebar phân cấp `Task -> Hôm nay/Kế hoạch/Hạn định`.
- Không đổi tone pastel và visual contract đã có.
- Không tạo thêm component tương đương nếu đã có component dùng chung phù hợp.

## Acceptance cases

- Today và Planner có cùng cảm giác về shell, heading, filter và button.
- Một task cùng loại có typography và spacing tương đương ở hai tab.
- Today rỗng không còn khoảng trắng chiếm gần toàn màn hình.
- Planner vẫn giữ đủ Tuần/Tháng/Năm và hoạt động như trước.
- Desktop 1280px, tablet 768px và mobile 390px không tràn ngang.
- Không có lỗi runtime hoặc thay đổi sai logic task.

## Kiểm tra

- Chạy `npx tsc --noEmit` và `npm run build` thật sự.
- Cập nhật `.agents/ANTIGRAVITY-REPORT.md` bằng mục riêng `PROMPT 06`, ghi file thực tế thay đổi và kết quả kiểm tra thật.

## Không làm trong lượt này

- Không sửa Dashboard, Ghi chú, Nhật ký, Sổ tay, Cài đặt.
- Không refactor toàn bộ thư mục `ui`.
- Không xóa component cũ nếu chưa xác minh không còn caller.
