# PROMPT 04 - CHUẨN HÓA NGỮ CẢNH TASK VÀ NGÀY QUÁ HẠN

## Phạm vi lượt này

Chỉ sửa logic dùng chung và bộ lọc dữ liệu cho task. Chưa chỉnh layout lớn, màu sắc, animation, Nhật ký, Sổ tay hoặc Cài đặt.

## Mục tiêu đã chốt

Một task có thể xuất hiện ở nhiều màn hình theo ngữ cảnh, nhưng không được tạo bản sao dữ liệu:

- Hôm nay chỉ hiển thị task thuộc đúng ngày hôm nay.
- Task từ các ngày trước không được kéo vào Hôm nay.
- Nếu task thuộc đúng hôm nay nhưng giờ hẹn/hạn đã qua, vẫn giữ trong Hôm nay và đánh dấu trạng thái quá giờ nhẹ.
- Ngày quá khứ trong Planner vẫn hiển thị task thuộc đúng ngày đó và đánh dấu quá hạn.
- Cùng task quá hạn được phép xuất hiện thêm trong Hạn định/Thông báo, nơi gom theo ngày.
- Lịch hẹn đã qua và hạn hoàn thành quá hạn phải là hai trạng thái khác nhau.
- Task không có ngày chỉ xuất hiện trong Hộp chờ Planner.
- Task có ngày nhưng chưa có giờ không được xem là task chưa sắp lịch.
- Dashboard chỉ đếm task đúng ngày hôm nay; task chưa có ngày và task quá hạn ngày trước phải đếm riêng.

## Việc phải làm

1. Đọc `client/src/utils/taskSemantics.ts`, `client/src/utils/taskDueStatus.ts`, `client/src/utils/date.ts` và các caller hiện tại trước khi sửa.
2. Sửa `getTaskEffectiveDate()` và `getTaskEffectiveTime()` để chọn field theo loại đã chuẩn hóa:
   - `scheduled/event`: dùng ngày/giờ lịch hẹn.
   - `deadline/task`: dùng ngày/giờ hạn.
   - task không có loại: dùng ngày chung nếu có, không tự gán deadline.
3. Tạo hoặc hoàn thiện helper dùng chung cho:
   - task thuộc một ngày cụ thể;
   - task quá giờ trong chính ngày đó;
   - task quá hạn từ ngày trước;
   - task chưa có ngày;
   - task có ngày nhưng chưa có giờ.
4. Cho Today, Dashboard, Planner và Deadlines dùng cùng helper, không tự lọc bằng `dueDate.startsWith(...)` hoặc logic riêng.
5. Không thay đổi dữ liệu mẫu, API contract hoặc tên field hiện có.
6. Không xóa task quá hạn khỏi ngày gốc trong Planner.
7. Không đưa toàn bộ task quá hạn ngày trước vào Today.

## Acceptance cases bắt buộc

- Task scheduled ngày hôm nay, giờ đã qua: xuất hiện ở Today với trạng thái `Lịch hẹn đã qua`.
- Task deadline ngày hôm nay, giờ đã qua: xuất hiện ở Today với trạng thái `Quá giờ`.
- Task deadline ngày hôm qua: không xuất hiện trong danh sách chính của Today; xuất hiện ở Planner ngày hôm qua và Hạn định/Thông báo.
- Task scheduled ngày hôm qua: xuất hiện ở Planner ngày hôm qua và Hạn định/Thông báo với trạng thái `Lịch hẹn đã qua`, không bị gọi là deadline.
- Task không có ngày: chỉ xuất hiện trong Hộp chờ, không được tính vào “Việc hôm nay”.
- Task có ngày nhưng không có giờ: xuất hiện trong ngày tương ứng, không vào Hộp chờ.
- Task có `deadlineDate` cũ nhưng loại là `scheduled`: không được đọc thành deadline.
- Dashboard và Today phải trả cùng phạm vi task cho ngày hôm nay.

## Kiểm tra

- Chạy `npx tsc --noEmit` và `npm run build` thật sự.
- Ghi kết quả thật vào `.agents/ANTIGRAVITY-REPORT.md` bằng mục `PROMPT 04`.
- Báo cáo chính xác file đã đổi và các acceptance case đã kiểm tra.

## Không làm trong lượt này

- Không chỉnh lại bố cục lớn của Today/Planner.
- Không sửa TaskCard nếu chỉ là thay đổi visual; chỉ sửa dữ liệu trạng thái mà card nhận được.
- Không xử lý Prompt 02 Cài đặt hoặc Prompt 03 Tổng kết.
