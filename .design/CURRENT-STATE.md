# Current Runtime UI State

Tài liệu này là mô tả runtime của `client/src`. Khi tài liệu và source khác nhau, source hiện tại được ưu tiên và tài liệu phải được cập nhật ở cùng một thay đổi.

## 1. Ngôn ngữ hình ảnh đang dùng

- Giao diện mặc định là phong cách phẳng, tối giản, gần với iOS: nền trung tính, surface rõ lớp, viền mảnh, góc bo và typography sans dễ đọc.
- `appStore` khởi tạo `interfaceStyle` là `ios`; setter hiện giữ giá trị `ios` để toàn app dùng cùng một skin. Các lớp giấy/nét mực cũ vẫn có thể còn trong source để tương thích, nhưng không phải visual baseline mới.
- Dark mode dùng nền graphite và phân cấp chữ theo ngữ cảnh. Không mặc định đổi toàn bộ chữ thành trắng; chữ phụ dùng token muted/subtle.
- Font mặc định là Inter với fallback hệ điều hành. Người dùng có thể chọn family `Inter`, `Plus Jakarta Sans` hoặc system và cỡ `normal`, `large`, `xlarge`; lựa chọn áp dụng ở root cho cả ba shell.

## 2. Ba platform shell

Breakpoint dùng chung trong `useResponsiveLayout`:

- Mobile: `< 768px`.
- Tablet: `768px - 1023px`.
- Desktop: `>= 1024px`.

Mỗi shell có nhiệm vụ riêng, không được ép ba kích thước thành cùng một bố cục:

- Desktop: `DesktopShell`, `DesktopHeader`, `DesktopSidebar`, `DesktopWorkspace`; sidebar trái, header đầy đủ, nội dung có thể dùng nhiều cột và task detail dạng panel/dock.
- Tablet: `TabletShell`, `TabletHeader`, `TabletNav`, `TabletWorkspace`; nội dung tập trung trong vùng chính, điều hướng bằng dock dưới và contextual FAB khi phù hợp.
- Mobile: `MobileShell`, `MobileHeader`, `MobileNav`, `MobileWorkspace`; nội dung một cột, dock dưới, modal dạng bottom sheet hoặc trang toàn màn hình tùy flow.

Không thay đổi luồng thao tác mobile chỉ để làm desktop/tablet giống mobile. Có thể dùng chung token và component, nhưng composition, mật độ và vị trí điều hướng phải theo platform.

## 3. Điều hướng đang hoạt động

### Desktop

Sidebar chính gồm:

1. `Hôm nay`: task của ngày hiện tại.
2. `Kế hoạch`: planner theo tuần/ngày.
3. `Hạn định`: task theo deadline, gồm quá hạn và sắp đến.
4. `Ghi chú`: danh sách và trình soạn thảo note.
5. `Nhật ký`: danh sách ngày và sổ nhật ký đang mở.
6. `AI`: trợ lý AI.

Settings mở từ account control/header và hiển thị trong dialog có vùng cuộn riêng.

### Tablet

Dock dưới gồm `Hôm nay`, `Công việc`, `Ghi chép` và `Trợ lý AI`. `Công việc` vẫn dùng các subcontext task là `today`, `planner`, `deadlines`; không tạo thêm một tab dashboard trung gian.

### Mobile

Dock dưới gồm:

1. `Công việc` cho các subcontext hôm nay/kế hoạch/hạn định.
2. `Ghi chép` cho ghi chú và nhật ký.
3. Nút `+` mở create sheet để chọn thêm task hoặc note.
4. `Thông báo` với badge khi có thông báo chưa đọc.
5. `Cá nhân` để vào Settings.

Dock tự ẩn khi bàn phím mở hoặc khi người dùng cuộn xuống, sau đó hiện lại theo hành vi của shell.

Không có workspace active riêng tên `Sổ tay`, `Dashboard` hoặc `Review`. Notebook chỉ là dữ liệu phân loại được chọn trong note/task detail; các file legacy có thể tồn tại nhưng không được tự đưa vào navigation.

## 4. Task workspace

- Store giữ task workspace bằng `activeTab = "tasks"` và `activeTaskSubTab` là `today`, `planner` hoặc `deadlines`.
- `Hôm nay` ưu tiên danh sách task hiện tại, progress và các thao tác nhanh phù hợp platform.
- `Kế hoạch` có overview, day detail, lịch trình và lịch tháng theo những view mà `PlannerTab` đang render. Desktop có weekly time chart; tablet/mobile ưu tiên danh sách bảy ngày và day detail dễ cuộn.
- `Hạn định` có nhóm `Quá hạn` và `Sắp đến`; đây là task subcontext, không phải app-level tab mới.
- Task detail: desktop dùng panel/dock; tablet và mobile dùng detail surface toàn màn hình. Edit và view là hai trạng thái của cùng một detail flow.
- Quick create không được nhân đôi trên cùng một màn hình: desktop mở `QuickTaskModal` từ sidebar/Today, tablet dùng contextual FAB, mobile dùng nút `+` và create sheet.

## 5. Ghi chép và nhật ký

- `Ghi chú` hiển thị index/list trước; khi chọn note mới mở editor. Mobile có back rõ ràng từ editor về index.
- Note editor có một action row gọn: back, chọn notebook và xóa. Trạng thái autosave không chiếm thêm một control độc lập.
- `Nhật ký` hiển thị danh sách ngày; chọn một ngày mở `JournalBook`. Trong book có chọn ngày và chuyển ngày theo component hiện tại.
- Khi note editor hoặc journal book mở ở mobile, header/dock không được chồng lên nội dung; back phải quay về đúng index/list trước đó.

## 6. Back và child surface

`App.tsx` là nguồn chuẩn cho back:

1. Đóng task detail đang mở.
2. Đóng settings subview mobile.
3. Đóng mobile note detail.
4. Đóng journal book.
5. Pop location gần nhất trong app navigation stack.
6. Nếu đang ở task subcontext khác `today`, quay về `tasks/today`.
7. Nếu đang ở khu vực khác task, quay về tab hôm nay.
8. Chỉ khi đã ở `tasks/today` và không còn child surface mới cho phép browser/native back thoát app hoặc quay khỏi `/app`.

Browser back, Android/Capacitor back và nút back trong UI phải đi qua cùng handler; không tạo logic back riêng theo từng màn hình.

## 7. Modal, scroll và picker

- Mobile modal ưu tiên bottom sheet hoặc full-screen detail tùy component; nội dung dài phải có vùng cuộn độc lập.
- Desktop modal/dialog có nút đóng rõ ràng; không đưa hint bàn phím desktop lên mobile.
- `DatePickerPopover` và `TimePickerPopover` là picker custom của app. Không thay bằng native browser control nếu chưa cập nhật design contract.
- Picker/dropdown phải nằm trên lớp nội dung đúng z-index, không bị cắt bởi parent overflow và không đẩy layout làm che phần bên dưới.
- Toolbar soạn thảo trên màn hình cảm ứng giữ một hàng cuộn ngang khi số lượng action vượt chiều rộng.

## 8. Dữ liệu và trạng thái

- `scheduled` và `deadline` là hai field thời gian khác nhau; không suy diễn scheduled thành overdue deadline.
- `parentTaskId` là nguồn xác định task con; UI phải thụt cấp theo quan hệ dữ liệu, không chỉ dựa vào vị trí mảng.
- Note, journal và task có thể dùng notebook để phân loại; notebook không được biến thành navigation surface riêng.
- Mọi async surface cần có loading, empty, error và success phù hợp. Error phải có hành động khắc phục hoặc retry.

## 9. Legacy và Planned

Các file sau có thể còn để tương thích nhưng không phải luật runtime mới:

- `AppShell` và `TasksTab` legacy không được mount bởi `App.tsx`.
- `PlannerYearView` không được render trong flow planner hiện tại.
- Dashboard/Review và workspace Sổ tay riêng không phải điểm đến navigation hiện hành.
- Bất kỳ ý tưởng như thêm wheel picker mới, thêm dashboard, tách thêm tab hoặc đổi back flow chỉ là `Planned` cho đến khi source và tài liệu được cập nhật cùng nhau.
