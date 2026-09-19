# Product Features

Tài liệu này mô tả feature đang có trong runtime. Ý tưởng chưa được mount trong `App.tsx` phải ghi là `Planned`; file legacy không đồng nghĩa feature đang hoạt động.

## 1. Cấu trúc sản phẩm hiện tại

### Task workspace

- `Hôm nay`: task theo ngày hiện tại, progress, filter và action tạo task.
- `Kế hoạch`: lập lịch theo tuần/ngày, lịch trình, lịch tháng và day detail.
- `Hạn định`: nhóm `Quá hạn` và `Sắp đến`.

Ba mục trên dùng chung task store và được điều khiển bằng `activeTab = "tasks"` cùng `activeTaskSubTab`.

### Ghi chép

- `Ghi chú`: index/list, note detail/editor, notebook selector và delete.
- `Nhật ký`: danh sách entry/ngày và `JournalBook` khi mở một ngày.
- Notebook là dữ liệu phân loại trong task/note/journal, không phải workspace top-level riêng.

### System areas

- `AI`: trợ lý AI dạng workspace/panel tùy platform.
- `Thông báo`: drawer hoặc page system tùy shell, có badge unread.
- `Cài đặt`: account, giao diện, typography, notification, data, security, shortcuts và about theo các category đang có.
- Auth: login/register trong `AuthModal` hoặc trang auth theo route.

Không coi `Dashboard`, `Review/Tổng kết` hoặc màn hình `Sổ tay` riêng là feature navigation hiện hành.

## 2. Task operations

App hỗ trợ:

- Tạo, sửa, hoàn thành, xóa task.
- Dời ngày và thay đổi scheduled/deadline.
- Priority, tags, notebook, mô tả và quan hệ parent/child.
- Task detail ở view/edit mode.
- Lọc theo trạng thái và nhóm thời gian trong các context tương ứng.

Quy tắc dữ liệu:

- `scheduled` là thời điểm hẹn/lịch thực hiện; `deadline` là hạn chót. Hai field không thay thế nhau.
- `dueDate` có thể còn trong dữ liệu để tương thích, không tự dùng làm UI mới nếu field chuyên biệt đã có.
- Task con dùng `parentTaskId`; UI phải thể hiện cấp thụt vào và có thể thu gọn theo component hiện tại.
- Task không có ngày không được tự coi là overdue; chỉ hiển thị trong backlog/nhóm phù hợp với logic planner.

## 3. Planner

- Desktop có weekly timeline/time chart để đọc task theo ngày và mốc giờ.
- Tablet/mobile hiển thị tuần theo danh sách ngày gọn hơn; chọn ngày mở day detail.
- Day detail có timeline/list theo những view source đang hỗ trợ; không thêm toggle mới nếu chưa có component và state tương ứng.
- Lịch tháng dùng `PlannerCalendar` và chỉ điều hướng vào ngày/task, không tự mở dashboard.

## 4. Note và journal flow

- Note tạo từ create sheet/action note, mở vào index/list rồi mới vào editor.
- Editor autosave theo store hiện tại; action row không hiển thị status/control thừa nếu source không cần.
- Journal tạo/mở entry theo ngày; book có date picker và chuyển ngày.
- Khi rời detail, back quay về index/list của feature trước khi quay về tab hoặc subtab cấp app.

## 5. Search, notification và auth

- Global search có thể tìm các loại dữ liệu mà search service/store hiện hỗ trợ; không quảng cáo loại dữ liệu chưa được query.
- Notification dùng notification service và permission của hệ điều hành/trình duyệt theo platform. UI phải phân biệt trạng thái chưa cấp quyền, đã bật, lỗi và không có thông báo.
- Auth có login/register state; form phải responsive và giữ action đăng ký/đăng nhập trong viewport mobile.

## 6. Persistence và sync

- Store có persistence cục bộ và các hook sync/remote theo cấu hình hiện tại. Không mô tả local-only hoặc cloud-only nếu chưa kiểm tra adapter runtime.
- CRUD local phải cập nhật UI ngay khi có thể; sync lỗi cần được biểu diễn bằng trạng thái/retry thay vì làm mất bản ghi.
- Import/export/reset dữ liệu chỉ là feature data settings khi route/component hiện tại expose chúng; không tự thêm lại các control đã loại khỏi giao diện.

## 7. Responsive contract

- Desktop: sidebar trái, header đầy đủ, dialog/panel và multi-column khi cần.
- Tablet: workspace trung tâm, dock dưới, contextual FAB và detail riêng.
- Mobile: bottom dock, nút `+` ở giữa, bottom sheet/full-screen detail, keyboard-safe editor.
- Cùng một feature có thể dùng khác composition, nhưng phải giữ cùng semantics, token, dữ liệu và back contract.

## 8. Versioning, PWA và update

- Version runtime phải lấy từ `updateService.ts`; không hardcode version ở feature khác.
- Patch update có thể kiểm tra nền và áp dụng khi reload; update lớn cần modal nêu thay đổi và action rõ ràng.
- PWA/Capacitor phải có loading placeholder, service worker và fallback phù hợp khi offline; không hứa tính năng online nếu service chưa cung cấp.

## 9. Planned và legacy

- Planned: bất kỳ biến thể planner/time picker, dashboard, batch action hoặc workspace mới chưa xuất hiện trong `App.tsx`.
- Legacy: `AppShell`, `TasksTab`, `PlannerYearView`, Review/Dashboard files và các picker cũ không còn call-site.
- Khi một Planned feature được làm thật, phải cập nhật source, tests và tài liệu trong cùng change; không thêm tên tab/component vào docs trước khi runtime có state và route rõ ràng.
