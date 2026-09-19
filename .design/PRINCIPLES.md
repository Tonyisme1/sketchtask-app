# UX/UI Principles

Đây là các nguyên tắc áp dụng cho giao diện đang chạy, không phải danh sách ý tưởng thiết kế độc lập. Mục tiêu là giữ app dễ đọc, nhất quán và không làm thay đổi luồng mobile đã ổn định.

## 1. Hành vi trước hình thức

- Không đổi navigation, dữ liệu hoặc thứ tự back chỉ vì thay màu, font hay skin.
- Mỗi feature chỉ có một nguồn điều khiển chính. Không thêm quick action, tab hoặc popup trùng với action đã có.
- Khi cần thay đổi visual, ưu tiên token và component hiện có trước khi viết CSS riêng.

## 2. Một visual language, ba composition

- Baseline hiện tại là giao diện phẳng tối giản: surface rõ, viền mảnh, typography sans, khoảng trắng đủ và góc bo vừa phải.
- Desktop, tablet và mobile dùng chung màu, font, trạng thái và ý nghĩa icon; không bắt buộc dùng chung vị trí hay bố cục.
- Không đưa cấu trúc sidebar desktop lên mobile. Không làm mobile thành bản thu nhỏ của desktop.
- Phong cách giấy/nét mực chỉ là lớp tương thích cũ, không được tự thêm decoration mới vào màn hình đang dùng visual tối giản.

## 3. Phân cấp thông tin

- Tiêu đề task/note và action chính dùng `text-main`/`text-strong` với cỡ rõ ràng.
- Metadata, ngày giờ, badge phụ và mô tả dùng `text-muted` hoặc `text-subtle`.
- Dark mode không dùng chữ trắng cho mọi ngữ cảnh; màu chữ phải thể hiện primary, secondary và disabled.
- Một màn hình chỉ có một primary action nổi bật; action phụ không được cạnh tranh cùng màu/kích thước.

## 4. Điều hướng và back

- Back là một contract của toàn app: đóng child surface trước, pop navigation stack sau, cuối cùng mới quay về `Hôm nay`.
- Nút back trong header, browser back và native back phải gọi cùng semantics.
- Back button trên mobile/tablet phải có vùng chạm dễ bấm, nhãn accessible và không bị đẩy lên vùng status bar.
- Không dùng `history.back()` rải rác trong feature nếu có thể đăng ký handler chung của app.

## 5. Responsive và bàn phím

- Mobile ưu tiên một cột, bottom dock và bottom sheet/full-screen detail. Tablet ưu tiên vùng làm việc trung tâm và dock. Desktop được phép dùng sidebar, nhiều cột và panel dock.
- Nội dung dài phải cuộn trong đúng container; không để picker, editor hoặc toolbar bị cắt bởi `overflow` của parent.
- Khi keyboard mở, nội dung nhập và toolbar phải nằm trong vùng nhìn thấy. Toolbar touch nhiều action được cuộn ngang, không ép xuống nhiều hàng.
- Không hiển thị phím tắt desktop, chữ ESC hoặc hint bàn phím trên mobile.

## 6. Tương tác

- Mọi button, checkbox, card có thể bấm phải có hover/focus/active/disabled rõ ràng và phản hồi không gây giật layout.
- Vùng chạm mobile tối thiểu khoảng 40px cho control chính; icon-only control cần aria-label hoặc title phù hợp.
- Dropdown dài có panel cuộn riêng. Date/time picker phải có z-index và placement đủ để không che khuất field khác.
- Không dùng trạng thái màu duy nhất để truyền ý nghĩa; kết hợp text, icon hoặc shape khi cần.

## 7. Trạng thái và dữ liệu

- Loading không được giả như dữ liệu thật.
- Empty state nói rõ lý do và bước tiếp theo, không thêm CTA trùng với nút tạo chính.
- Error phải nêu thao tác khắc phục; retry không được tạo bản ghi trùng.
- Completed, overdue, disabled và selected phải khác nhau cả về màu lẫn nội dung/aria.

## 8. Accessibility và hiệu năng

- Dùng semantic HTML, label/aria phù hợp, focus-visible và keyboard support cho control có thể thao tác.
- Tôn trọng `prefers-reduced-motion`; animation chỉ hỗ trợ chuyển trạng thái, không được che nội dung.
- Không tạo shadow/blur/gradient mới chỉ để làm UI “nổi” hơn.
- Không dùng text overflow để che dữ liệu quan trọng; detail flow phải mở được nội dung đầy đủ.

## 9. Giới hạn không được vi phạm

- Không thêm gradient tím/hồng/cyan đại trà hoặc glassmorphism.
- Không dùng Gaussian shadow `shadow-lg`, `shadow-xl`, `shadow-2xl` cho component mới.
- Không xoay input, calendar, table hoặc container cuộn.
- Không dùng `rounded-full` cho card hoặc primary button; chỉ dùng cho badge/toggle khi phù hợp.
- Không dùng font viết tay cho title, label hoặc dữ liệu dài.
- Không hardcode màu mới nếu token hiện tại đã đáp ứng được.
