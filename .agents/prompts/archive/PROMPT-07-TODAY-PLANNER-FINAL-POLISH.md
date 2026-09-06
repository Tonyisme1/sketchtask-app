# PROMPT 07 - FINAL POLISH TODAY / PLANNER

## Phạm vi

Chỉ sửa các chi tiết visual còn sót lại trong `Today` và `Planner` sau Prompt 06. Không đổi logic task, dữ liệu, API, Note, Journal, Sổ tay, Cài đặt hoặc Dashboard.

## Việc cần làm

1. Rà soát `Today` và toàn bộ các mode `Planner` ở desktop, tablet và mobile.
2. Thay các `shadow-sm` còn sót trong phần UI thuộc Prompt 06 bằng hard offset shadow theo design contract; không dùng soft Gaussian shadow.
3. Đảm bảo các nút chuyển mode, nút ngày, nút Hộp chờ, CTA và card empty state có cùng quy luật:
   - viền mực rõ;
   - active có tactile feedback;
   - không bị viền mặc định của trình duyệt;
   - không dùng `rounded-full` cho button/card chính.
4. Giữ đúng khác biệt có chủ đích:
   - Today: khu lịch hẹn ở trên, danh sách task ở dưới, nút thêm dọc bên phải trên desktop;
   - Planner: điều hướng Tuần/Tháng/Năm và Hộp chờ, không biến thành bản sao Today.
5. Kiểm tra không tràn ngang ở 320px, 390px, 768px và 1280px. Không làm card quá cao hoặc khoảng trắng vô lý.
6. Không thay đổi label, dữ liệu mẫu, bộ lọc, pipeline task hoặc hành vi ngày quá khứ.

## Kiểm tra bắt buộc

- Chạy thật `npx tsc --noEmit`.
- Chạy thật `npm run build`.
- Cập nhật `.agents/ANTIGRAVITY-REPORT.md` bằng mục `PROMPT 07`, ghi chính xác file đã đổi và kết quả từng viewport. Nếu lệnh bị runner chặn, ghi nguyên nhân thật, không ghi PASS giả.

