# UX/UI Principles

## Định Hướng

SketchTask dùng ngôn ngữ sổ tay phác thảo: ấm, rõ ràng, có nét mực và phản hồi xúc giác. Trang trí không được làm giảm khả năng đọc hoặc tốc độ thao tác.

## Nguyên Tắc Bắt Buộc

1. **Rõ ràng trước trang trí:** task title, thời gian và hành động chính phải dễ nhìn.
2. **Progressive disclosure:** mặc định chỉ hiện thao tác cần thiết; tùy chọn nâng cao mở khi người dùng yêu cầu.
3. **Theo ngữ cảnh:** giao diện TodayTab, PlannerTab và Edit flow có thể khác nhau dù dùng chung logic.
4. **Responsive:** mọi thao tác chính phải dùng được trên desktop, tablet và mobile.
5. **Mobile ergonomics:** modal mobile là bottom sheet; không hiển thị phím tắt desktop trên mobile.
6. **Scroll không bị khóa:** keyboard, textarea nhiều dòng và panel dài không được làm mất khả năng cuộn nội dung.
7. **Accessibility:** control tương tác phải có tên, focus-visible, keyboard support và vùng chạm phù hợp.
8. **Tactile feedback:** button/card/checkbox có trạng thái active rõ ràng với hard shadow.

## Phân Tầng Visual

- **Core UI:** input, calendar grid, table và navigation phải thẳng, dễ đọc, không xoay.
- **Expressive UI:** task card, sticky note, modal có thể dùng nét mực, shadow cứng và xoay nhẹ trong giới hạn.
- **Decoration:** doodle và highlight chỉ dùng ở vùng trống hoặc vùng phụ.

## Responsive

- Desktop giữ đủ điều khiển và nút đóng rõ ràng.
- Tablet không được vỡ grid hoặc tạo overflow ngang.
- Mobile ưu tiên một cột, vùng chạm tối thiểu khoảng 36px, bottom sheet và nội dung cuộn độc lập.
- Khi keyboard mở, không để bottom navigation che vùng nhập hoặc danh sách.

## States

Component có dữ liệu bất đồng bộ cần thể hiện loading, empty, error và success phù hợp. Trạng thái lỗi phải có hành động khắc phục; trạng thái empty nên hướng dẫn bước tiếp theo.

## Không Làm

- Không dùng gradient tím/hồng/cyan đại trà.
- Không dùng shadow Gaussian như `shadow-lg`, `shadow-xl`, `shadow-2xl`.
- Không xoay input, calendar, table hoặc container cuộn.
- Không dùng `rounded-full` cho button/card chính.
- Không dùng font viết tay cho task title, label hoặc dữ liệu dài.
- Không hardcode màu ngoài `TOKENS.md` nếu token hiện có đáp ứng được.
