# UI Components

### `DesktopRightDock`

- Desktop-only utility rail on the outer right edge of the workspace.
- Hosts exactly one open utility panel at a time: notes or journal. The search
  rail button opens the shared `GlobalSearchModal` instead of a second search UI.
  Notes and journal are dedicated docked mini-apps that reuse their feature
  models, rather than read-only previews.
- Deadline work belongs to the `Hạn định` task context, not to a right-dock
  notification/overdue/upcoming feed.
- Shares its available width with `DesktopTaskDetailPage`; it must never create
  a second full-height right sidebar beside the inspector.

Danh sách này mô tả component đang được mount hoặc được dùng chung trong `client/src`. Tái sử dụng component hiện có trước khi tạo component mới.

## 1. Platform shells

### `DesktopShell`

- Quản lý header, sidebar trái, workspace chính, AI side panel, settings dialog và các overlay toàn app.
- Hỗ trợ shortcut desktop như `Ctrl+K`, `Ctrl+B`, `N` theo source hiện tại.
- Không dùng shell desktop làm layout fallback cho tablet/mobile.

### `TabletShell`

- Quản lý header tablet, workspace trung tâm, bottom dock, contextual FAB và các overlay.
- Khi detail/settings mở, shell có thể ẩn header/dock theo state hiện tại để tránh chồng lớp.

### `MobileShell`

- Quản lý header mobile, bottom dock, full-screen detail và create sheet.
- Khi keyboard mở hoặc người dùng cuộn, dock xử lý ẩn/hiện theo behavior hiện tại.
- Task detail, note detail, journal book và AI standalone có thể chiếm toàn màn hình.

## 2. Navigation surfaces

### `Sidebar`, `TabletNav`, `MobileNav`

- Chỉ hiển thị destination đang được App mount.
- Task navigation dùng `activeTaskSubTab`; không tạo tab mới cho từng biến thể filter.
- `MobileNav` giữ nút `+` ở giữa để chọn tạo task hoặc note; không thêm quick-add thứ hai nếu flow đã có modal/FAB.
- `Hạn` trên mobile là lối tắt trực tiếp vào `Hạn định`; badge của nó chỉ đếm task deadline cần chú ý và luôn mở `Sắp đến` trước.

### `MobileHeader` và `mobile-back-button`

- Khi đang ở `Hạn định`, dropdown header chỉ chứa `Sắp đến` và `Hạn`; count có task dùng token accent xanh.
- Mobile không dựng thêm ô tìm kiếm cục bộ trong các tab; icon Header mở `GlobalSearchModal` chung.
- Back button phải có aria-label, vùng chạm dễ bấm và gọi callback cấp màn hình.
- Callback chỉ đóng child surface hoặc gọi navigation handler; không tự thao tác history riêng.
- Header không được chiếm vùng status bar hoặc che nội dung khi detail mở.

## 3. Task components

### `TaskCard`, `TaskList`, `HandDrawnCheckbox`

- Hiển thị title, trạng thái, thời gian, deadline, priority, tags, notebook và quan hệ con khi dữ liệu có.
- Completed/overdue/disabled/selected phải khác nhau bằng text/icon và token màu, không chỉ dựa vào opacity.
- Card trong skin tối giản dùng surface và khoảng cách gọn; không tự thêm rotation hoặc hard shadow mới.

### `TaskDetailPage`

- Có view mode và edit mode cho cùng một task.
- Hỗ trợ tạo mới, sửa, hoàn thành, xóa, dời lịch, parent/child, scheduled/deadline và metadata theo source.
- Back khi edit task cũ quay về view; back khi task mới hủy flow tạo theo callback.

### `QuickTaskModal`

- Là flow tạo task nhanh dùng chung cho desktop/tablet/mobile theo cách mở của từng shell.
- Ngày, giờ scheduled và giờ deadline là các lựa chọn riêng; không dùng native browser picker.
- Khi đóng/hủy phải dọn state tạm và không tạo bản ghi rỗng.

## 4. Planner và time surfaces

### `PlannerTab`, `PlannerWeekView`, `PlannerTimeline`, `PlannerDayTimeline`, `PlannerCalendar`

- `PlannerTab` điều phối overview, day detail và các view planner đang được render.
- Desktop có thể dùng weekly time chart; tablet/mobile ưu tiên danh sách ngày và day detail.
- Timeline phải có vùng cuộn nội bộ, giữ mốc giờ dễ đọc và không để task đè ngoài container.
- Calendar grid là core UI: thẳng, không xoay, không bị parent cắt.

### `DatePickerPopover`, `TimePickerPopover`

- Là picker custom có placement theo viewport và z-index riêng.
- Có trạng thái closed/open/focus/disabled và xử lý click ngoài theo flow hiện tại.
- Không dùng `CustomDuePicker`, `WheelTimePicker`, `TodayTimeView`, `PlannerDateTimeView` hoặc `DateTimeView` như tên component mới nếu file đó không còn call-site.

## 5. Notes và journal

### `NotesTab`, `NoteMasterDetailView`

- Notes dùng master/index trước, detail/editor sau.
- Mobile editor giữ action row gọn: back, notebook selector, delete; không đưa toolbar thừa vào index.
- Tablet/desktop dùng master-detail phù hợp chiều rộng, không ép mobile full-screen composition.

### `JournalTab`, `JournalBook`, `JournalEntryCard`

- Journal list và book detail là hai state của cùng feature.
- Chọn ngày, chuyển ngày và back phải quay đúng từ book về journal list trước khi pop navigation ngoài.

## 6. Overlay và system components

### `GlobalSearchModal`, `AuthModal`, `SettingsTab`, `AIAssistantTab`

- Search là overlay/system surface dùng chung cho desktop, tablet và mobile. Không có notification drawer/page nội bộ;
  deadline cần xử lý luôn được mở trong `Hạn định`.
- Settings: desktop dùng dialog/master-detail theo nhóm; tablet tùy orientation có
  master-detail hoặc danh sách nhóm; mobile giữ một trang cuộn dài, liên tục, không
  bọc mỗi mục trong card lớn hoặc chuyển sang fullscreen detail.
- AI: desktop/tablet có thể là workspace/panel; mobile có standalone detail với back rõ ràng.
- AuthModal có login/register state và phải phù hợp viewport, không dùng kích thước desktop cho mobile.

### Modal, sheet và feedback

- Mobile modal ưu tiên bottom sheet hoặc full-screen detail tùy component; nội dung dài có vùng scroll độc lập.
- Desktop dialog có close button rõ ràng; click ngoài chỉ đóng khi không làm mất dữ liệu.
- `ConfirmModal`, `RescheduleDateModal`, `UpdateModal`, `ToastViewport` phải giữ loading/error/success và không tự thêm navigation.
- `EmptyStateDoodle` chỉ là empty-state decoration, không được che CTA hoặc biến thành trang mới.

## 7. Core input và states

### `Button`, `TextInput`, `AutoResizeTextarea`, `CustomSelect`, `TagInputSelector`

- Dùng label/aria, focus-visible, disabled và keyboard support.
- `AutoResizeTextarea` không khóa scroll; quick add có giới hạn chiều cao và scroll nội bộ khi cần.
- `CustomSelect` có open/closed/empty/disabled và panel cuộn riêng cho danh sách dài.
- Control touch phải có vùng chạm khoảng 40px và không overflow khỏi viewport.

## 8. Quy tắc khi tạo component mới

1. Kiểm tra component hiện có và call-site trước.
2. Xác định shell/platform nào thật sự cần component.
3. Dùng token trong `TOKENS.md`, không tạo bảng màu/bo góc riêng.
4. Bổ sung default, hover/focus, active, disabled, loading, empty và error phù hợp.
5. Nếu component là ý tưởng chưa có trong source, ghi `Planned` trong tài liệu thay vì ngụy trang như runtime.
