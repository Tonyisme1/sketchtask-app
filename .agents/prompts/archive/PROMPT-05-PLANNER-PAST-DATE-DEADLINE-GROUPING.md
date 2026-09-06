# PROMPT 05 - KHÓA TẠO TASK Ở NGÀY QUÁ KHỨ VÀ GOM HẠN THEO NGÀY

## Phạm vi lượt này

Chỉ sửa hai hành vi còn thiếu sau Prompt 04: Planner ngày quá khứ và danh sách Hạn định. Không sửa helper thời gian đã đạt, không đổi dữ liệu mẫu, không đổi API/schema và không chỉnh các tab Note, Journal, Sổ tay hoặc Cài đặt.

## 1. Planner ngày quá khứ

Khi ngày đang chọn nhỏ hơn ngày hiện tại:

- Vẫn hiển thị toàn bộ task thuộc đúng ngày đó.
- Giữ trạng thái `Lịch hẹn đã qua` hoặc `Quá hạn` đúng loại task.
- Ẩn hoặc disable toàn bộ điểm tạo task mới của ngày đó:
  - nút `+ Thêm việc` ở header ngày;
  - CTA `Thêm việc mới ngay` trong empty state;
  - Quick Add hoặc composer gắn với ngày quá khứ.
- Hiển thị một thông báo ngắn: `Ngày đã qua, không thể tạo việc mới.`
- Không khóa thao tác xử lý task cũ đã có: xem chi tiết, hoàn thành, sửa ngày, sửa nội dung hoặc chuyển sang ngày hợp lệ vẫn được phép theo flow hiện tại.
- Ngày hôm nay và ngày tương lai giữ nguyên khả năng thêm task.

## 2. Hạn định/Thông báo gom theo ngày

Trong tab Hạn định, với nhóm `Quá hạn chót` và `Quá ngày hẹn`:

- Gom task theo ngày hiệu lực `YYYY-MM-DD`, hiển thị tiêu đề ngày trước mỗi nhóm, ví dụ:
  - `28/08/2026 - 1 việc`
  - `01/09/2026 - 2 việc`
  - `02/09/2026 - 3 việc`
- Sắp xếp nhóm từ ngày cũ nhất đến ngày gần hiện tại nhất.
- Bên trong mỗi nhóm, giữ sắp xếp theo giờ và loại task hiện tại.
- Không trộn task deadline với scheduled trong cùng một nhãn trạng thái; chỉ có thể nằm cùng ngày nếu UI vẫn phân biệt rõ badge.
- Tab `Đến hạn (24h)` có thể giữ dạng danh sách riêng vì đây là nhóm theo thời gian sắp đến, không phải nhóm quá hạn.
- Không tạo bản sao task; chỉ thay đổi cách render danh sách.

## Acceptance cases

- Chọn một ngày quá khứ trong Planner: không còn nút/CTA tạo task mới.
- Chọn hôm nay: Quick Add vẫn hoạt động.
- Chọn ngày tương lai: Quick Add vẫn hoạt động.
- Ngày quá khứ có task: task vẫn xem, sửa, hoàn thành và chuyển ngày được.
- Hạn định hiển thị header ngày rõ ràng, task ngày 28/08 không nằm lẫn với task ngày 01/09.
- Deadline quá hạn hiển thị `Quá hạn`; scheduled quá ngày hiển thị `Lịch hẹn đã qua`.

## Kiểm tra

- Chạy `npx tsc --noEmit` và `npm run build` thật sự.
- Kiểm tra desktop và mobile, tối thiểu 390px và 1280px.
- Cập nhật `.agents/ANTIGRAVITY-REPORT.md` bằng mục riêng `PROMPT 05`, ghi file thực tế thay đổi, acceptance cases và kết quả kiểm tra thật.

## Không làm

- Không sửa `getTaskEffectiveDate`, `getTaskTemporalState` hoặc các helper đã được Prompt 04 xác nhận đạt nếu không có regression trực tiếp.
- Không sửa Dashboard, Today, Note, Journal, Sổ tay, Cài đặt.
