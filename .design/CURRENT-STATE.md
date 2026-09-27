# Current Runtime UI State

## Desktop right dock

- Desktop has one shared right dock. The narrow tool rail is always visible;
  its panel expands left from the rail when a utility is selected.
- Search opens the shared `GlobalSearchModal`; `Ghi chép` is one docked parent
  with child tabs for notes and journal. Opening a utility does not change the
  active Event or Task workspace.
- Deadline metadata is read in the Task workspace; the right dock must not create
  a second notification, overdue, or upcoming feed.
- Task detail and utility content share the same right-dock area. Opening a
  utility temporarily hides the inspector without clearing the selected task;
  closing the utility restores that inspector when a task is still selected.

## Desktop visual composition

- `DesktopShell` applies the `desktop-minimal` scope at the Desktop breakpoint.
- This scope keeps the current Desktop information architecture but reduces
  surface corners to 6-12px, removes soft shadows, and uses thin token-based
  borders where a surface needs separation.
- The Desktop sidebar keeps navigation and status badges but hides repeated
  preview summaries. The compact right utility rail and planner toolbar use
  the same lower-density control scale.
- Tablet and Mobile are outside this scope and retain their existing composition.

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

1. `Công việc`: backlog, filter tag đa chọn và task detail.
2. `Sự kiện`: lịch hoạt động Desktop, gộp Event và Task theo cùng ngày/giờ.
3. `Ghi chép`: một parent, bên trong chuyển giữa danh sách ghi chú và sổ nhật ký.
4. `AI`: trợ lý AI.

Lịch Desktop nằm trong workspace `Sự kiện`, nhưng là lịch hoạt động chung: Event và
Task cùng xuất hiện trên lưới thời gian, tháng và năm. Khi mở, lưới mặc định là `Tuần`.
Task có checkbox; Event không có checkbox. Các mục trùng giờ được chia lane ngang thay vì đè lên nhau. Dòng hoạt
động dùng cùng lựa chọn Ngày/Tuần/Tháng/Năm, chỉ hiển thị các ngày có hoạt động và
chia tối đa 12 ngày cho một trang khi phạm vi lớn. Bấm card trong lưới mở quick preview;
bấm card ở dòng hoạt động mở detail panel bên phải.
`Hôm nay` và planner task là route legacy: nếu một liên kết cũ còn mở chúng, app trả
về `Công việc` thay vì tạo workspace task thứ hai.

Trong `Công việc`, task được nhóm theo tag/danh sách. Dải tag ngay workspace Desktop
cho phép chọn một hoặc nhiều tag; task không có tag nằm ở `Chưa gắn tag`. Các tag là
các lane nằm cạnh nhau và cuộn ngang; mỗi lane cuộn dọc độc lập, có mốc ngày để tổ chức
task. Lane chỉ dùng đường ngăn mảnh, không bọc thêm surface/card quanh các `TaskCard`.
Việc đã xong luôn nằm trong dropdown thu gọn ở đáy lane.

Settings mở từ account control/header. Desktop giữ navigation theo nhóm và master-detail;
tablet giữ nhóm theo hướng màn hình; mobile hiển thị toàn bộ controls theo một trang
cuộn liên tục, không có heading section lặp lại. Mobile không mở detail settings con và
root `Cá nhân` không hiện Back.

### Tablet

Dock tablet gồm `Công việc`, `Sự kiện`, `Ghi chép` và `AI`. `Ghi chép` mở hai tab
con `Ghi chú` và `Nhật ký`; `Sự kiện` là workspace độc lập, dùng dữ liệu event và
nút tạo event theo context.

### Mobile

Dock dưới gồm:

1. `Việc` mặc định ở `Ngày`, có checkbox, hạn tùy chọn và một nhãn.
2. `Sự kiện` mặc định ở `Ngày`, cho dòng sự kiện và lịch sự kiện.
3. Nút `+` ở giữa để tạo đúng loại mục của workspace hiện tại.
4. `Ghi chép` gom `Ghi chú` và `Nhật ký`; header của khu vực này mở dropdown để
   chuyển giữa hai surface mà không chiếm thêm một ô dock.
5. `Cá nhân` để vào Settings.

Dock tự ẩn khi bàn phím mở hoặc khi người dùng cuộn xuống, sau đó hiện lại theo hành vi của shell.

Không có workspace active riêng tên `Sổ tay`, `Dashboard` hoặc `Review`. Notebook chỉ là dữ liệu phân loại được chọn trong note/task detail; các file legacy có thể tồn tại nhưng không được tự đưa vào navigation.

## 4. Task workspace

- `App.tsx` chỉ giữ workspace tab và navigation stack. Liên kết cũ `today`,
  `planner` hoặc `deadlines` được chuẩn hóa về `Công việc`; không giữ subtab runtime.
- Lịch Desktop tuần/ngày/tháng/năm là surface của workspace `Sự kiện` và hiển thị
  cả Event lẫn Task. Event giữ khoảng bắt đầu-kết thúc hoặc mốc đơn; Task chỉ có
  deadline và checkbox. Tablet/mobile giữ surface Event riêng để phù hợp mật độ nhỏ.
- Hạn và trạng thái quá hạn là metadata của từng task trong Công việc, không dựng
  inbox hoặc destination thứ hai từ cùng tập task đó.
- Task detail: desktop dùng panel/dock; tablet và mobile dùng detail surface toàn màn hình. Edit và view là hai trạng thái của cùng một detail flow.
- Quick create không được nhân đôi trên cùng một màn hình: desktop mở `QuickTaskModal` từ sidebar, tablet dùng contextual FAB, mobile dùng nút `+` và create sheet.

## 5. Ghi chép và nhật ký

- `Ghi chú` hiển thị index/list phẳng trước; khi chọn note mới mở editor rộng. Mobile có back rõ ràng từ editor về index.
- Note editor có một action row gọn: back, chọn notebook và xóa. Trạng thái autosave không chiếm thêm một control độc lập.
- `Nhật ký` hiển thị chỉ mục ngày phẳng có preview dòng đầu, tối đa 12 ngày mỗi trang;
  chọn một ngày mở `JournalBook`. Trong book có chọn ngày và chuyển ngày theo component hiện tại.
- Khi note editor hoặc journal book mở ở mobile, header/dock không được chồng lên nội dung; back phải quay về đúng index/list trước đó.

## 6. Back và child surface

`App.tsx` là nguồn chuẩn cho back:

1. Đóng task detail đang mở.
2. Đóng mobile note detail.
3. Đóng journal book.
4. Pop location gần nhất trong app navigation stack.
5. Nếu đang ở workspace khác `Công việc`, quay về `Công việc`.
6. Chỉ khi đã ở `Công việc` và không còn child surface mới cho phép browser/native back thoát app hoặc quay khỏi `/app`.

Browser back, Android/Capacitor back và nút back trong UI phải đi qua cùng handler; không tạo logic back riêng theo từng màn hình.

## 7. Modal, scroll và picker

- Mobile modal ưu tiên bottom sheet hoặc full-screen detail tùy component; nội dung dài phải có vùng cuộn độc lập.
- Desktop modal/dialog có nút đóng rõ ràng; không đưa hint bàn phím desktop lên mobile.
- `DatePickerPopover` và `TimePickerPopover` là picker custom của app. Không thay bằng native browser control nếu chưa cập nhật design contract.
- Picker/dropdown phải nằm trên lớp nội dung đúng z-index, không bị cắt bởi parent overflow và không đẩy layout làm che phần bên dưới.
- Toolbar soạn thảo trên màn hình cảm ứng giữ một hàng cuộn ngang khi số lượng action vượt chiều rộng.

## 8. Dữ liệu và trạng thái

- Task mới chỉ dùng `task` hoặc `deadline`; Event mới dùng `event` với giờ bắt đầu và giờ kết thúc tùy chọn. `scheduled` chỉ còn để đọc task lịch cũ và phải được người dùng phân loại lại trước khi sửa.
- `parentTaskId` là nguồn xác định task con; UI phải thụt cấp theo quan hệ dữ liệu, không chỉ dựa vào vị trí mảng.
- `tag` là phân loại đơn của task. Trường mảng `tags` chỉ đọc để chuyển đổi dữ liệu cũ,
  rồi bị loại khi task được nạp, tạo hoặc cập nhật.
- Task con giữ quan hệ cha khi sửa. Xóa cha chỉ nâng các con trực tiếp lên thành task độc lập; event không tham gia cây task.
- Note, journal và task có thể dùng notebook để phân loại; notebook không được biến thành navigation surface riêng.
- Mọi async surface cần có loading, empty, error và success phù hợp. Error phải có hành động khắc phục hoặc retry.

## 9. First-run onboarding và AI

- Lần đầu vào app, `AppOnboardingTour` dùng coach mark theo platform để trỏ vào điều hướng và thao tác cốt lõi, không tự mở AI. Có thể bỏ qua, và khi hoàn thành sẽ không tự hiện lại.
- AI chỉ sinh proposal. Mỗi task, bước chia nhỏ hoặc thao tác dữ liệu là một lựa chọn riêng, mặc định chưa được chọn; không có lệnh áp dụng hàng loạt mặc định.
- AI không tự chia nhỏ mục tiêu nếu người dùng chưa yêu cầu, không tự mặc định số bước, không tự gán ngày khi thiếu dữ kiện và phải hỏi lại một câu khi mục tiêu chưa đủ rõ.

## 10. Legacy và Planned

Các file sau có thể còn để tương thích nhưng không phải luật runtime mới:

- `AppShell` và `TasksTab` legacy không được mount bởi `App.tsx`.
- Lịch Năm là overview hoạt động chỉ dành cho Desktop; không đưa sang task/mobile/tablet.
- Dashboard/Review và workspace Sổ tay riêng không phải điểm đến navigation hiện hành.
- Bất kỳ ý tưởng như thêm wheel picker mới, thêm dashboard, tách thêm tab hoặc đổi back flow chỉ là `Planned` cho đến khi source và tài liệu được cập nhật cùng nhau.
