# UI Components

Đặc tả các component đang có trong `client/src`. Ưu tiên tái sử dụng component hiện có trước khi tạo component mới.

## Core Components

### Button

- Dùng cho hành động chính/phụ và phải có tên dễ hiểu.
- Primary dùng accent yellow; secondary dùng surface; danger dùng coral.
- Có `focus-visible` và phản hồi active bằng hard shadow.
- Vùng chạm mobile tối thiểu khoảng 36px.

### HandDrawnCheckbox

- Dùng để hoàn thành task hoặc chọn trạng thái.
- Viền mực, trạng thái checked rõ ràng, keyboard/touch được.
- Không xoay checkbox hoặc container chứa checkbox.

### TaskCard

- Hiển thị title, checkbox, thời gian, priority, tag, notebook và thao tác.
- Title có thể giới hạn dòng trên mobile nhưng nội dung đầy đủ phải xem được khi sửa.
- Card có border/shadow cứng; rotation chỉ ở card độc lập và trong giới hạn token.
- Trạng thái completed, hover, active và disabled phải dễ phân biệt.

### AutoResizeTextarea

- Dùng cho quick add và nội dung dài.
- Không khóa scroll trang khi keyboard mở.
- Quick add phải có giới hạn chiều cao; nội dung vượt giới hạn được cuộn nội bộ.
- Hành vi Enter/Ctrl+Enter phải được quyết định theo ngữ cảnh, không mặc định áp dụng mọi nơi.

## Selection Components

### CustomSelect

- Dùng thay native select trong UI production.
- Danh sách dài được cuộn trong panel riêng.
- Có trạng thái mở, đóng, focus, keyboard, empty và disabled.
- Không dùng cho lựa chọn cần lịch hoặc wheel picker.

### CustomDuePicker

- Dùng chung logic `scheduled` và `deadline`.
- Wheel picker chọn giờ/phút.
- Variant theo ngữ cảnh là `Planned` nếu chưa có trong source:
  - `today`: chỉ chọn giờ/phút cho hôm nay.
  - `planner`: chọn ngày và giờ đầy đủ.
  - `datetime`: dùng trong edit flow hoặc nơi cần ngày cụ thể.
- Mobile là bottom sheet; desktop giữ nút đóng riêng.
- Không dùng native date/time control.

## Layout Components

### MobileNav

- Điều hướng cố định dưới màn hình trên mobile.
- Ẩn khi keyboard mở hoặc khi người dùng cuộn xuống.
- Không được che input, footer hoặc nội dung task.

### Bottom Sheet / Modal

- Mobile trượt từ dưới lên, có grab handle và vùng nội dung cuộn độc lập.
- Desktop căn giữa và có nút đóng rõ ràng.
- Khi mobile dùng grab handle để đóng thì phải có accessibility label và keyboard fallback.
- Click vùng nền có thể đóng nếu không làm mất dữ liệu đang nhập.

### Filter Toolbar

- Tầng chính chỉ giữ các filter thường dùng.
- Filter nâng cao mở trong panel riêng và có thể cuộn trên mobile.
- Phải hiển thị trạng thái active và nút xóa filter khi cần.

### EmptyStateDoodle

- Dùng cho danh sách rỗng.
- Có hướng dẫn bước tiếp theo và CTA phù hợp.
- Decoration không được lấn vào vùng thao tác chính.

## States Và Accessibility

Component bất đồng bộ cần xử lý loading, empty, error và success. Mọi control tương tác cần tên accessible, focus-visible, keyboard support và trạng thái disabled rõ ràng.
