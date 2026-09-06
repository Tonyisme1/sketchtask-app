# PROMPT 16 - CONTENT FRAME FOLLOW-UP

## Phạm vi duy nhất

Chỉ sửa layout khung ngoài của Dashboard, Note/Journal, Sổ tay và Cài đặt để đồng bộ với Today/Planner. Không đổi nội dung chức năng, logic, dữ liệu, API, navigation hoặc layout nội bộ của từng feature.

## Vấn đề đã xác minh

Các page hiện còn tự giới hạn bằng `max-w-6xl`, `max-w-5xl`, `max-w-4xl` và `mx-auto`, khiến Dashboard/Note/Journal/Sổ tay/Cài đặt bị co giữa canvas trong khi Today/Planner trải rộng.

## Yêu cầu

- Sau Sidebar, page root của các tab phải dùng `w-full min-w-0` với padding ngang nhất quán.
- Không dùng `max-w-* mx-auto` để giới hạn toàn bộ page ở desktop; content frame phải tận dụng vùng còn lại hợp lý.
- Được giữ `max-w` cho component nội bộ có chủ đích như editor note, modal, card empty state hoặc panel chi tiết.
- Dashboard giữ grid thống kê; Note/Journal giữ master-detail/cuốn sổ; Sổ tay giữ danh sách/chi tiết; Settings giữ bố cục danh mục/chi tiết.
- Desktop 1280/1440: mép trái/phải các page chính thẳng hàng và không có khoảng trắng giữa bất thường.
- Tablet 768/1024: co giãn không tràn ngang.
- Mobile 320/390: giữ full-width, padding và bottom navigation không bị ảnh hưởng.
- Không khôi phục Tổng kết và không sửa Today/Planner ngoài wrapper dùng chung nếu bắt buộc.

## Kiểm tra bắt buộc

- So sánh Dashboard, Today, Planner, Ghi chú, Nhật ký, Sổ tay, Cài đặt ở 1280px.
- Kiểm tra 768/1024/320/390px.
- Chuyển tab liên tục để xác nhận content frame không nhảy width.
- Cập nhật `.agents/ANTIGRAVITY-REPORT.md` bằng mục `PROMPT 16`, ghi file thực sự đổi và các max-width nội bộ được giữ lại có lý do.
- Chạy thật `npx tsc --noEmit` và `npm run build`; nếu bị chặn phải ghi lỗi thật.

