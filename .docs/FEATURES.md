# Product Features

Tài liệu này mô tả feature đang có trong runtime. Ý tưởng chưa được mount trong `App.tsx` phải ghi là `Planned`; file legacy không đồng nghĩa feature đang hoạt động.

## 1. Cấu trúc sản phẩm hiện tại

### Task workspace

- Desktop có một workspace `Công việc`: backlog, filter, tạo và mở task detail.
  Không còn destination `Hôm nay` hoặc planner riêng cho task.
- Nội dung `Công việc` trên Desktop nhóm theo tag/danh sách. Dải tag đa chọn trong
  workspace cho phép lọc trực tiếp; mỗi task thuộc tối đa một tag và task không tag
  thuộc nhóm `Chưa gắn tag`.
- Lịch tuần/ngày/tháng trên Desktop là workspace `Sự kiện`; event có khoảng bắt đầu-kết thúc,
  còn task chỉ có một điểm deadline.

Ba mục trên dùng chung task store và được điều khiển bằng `activeTab = "tasks"` cùng `activeTaskSubTab`.

### Ghi chép

- `Ghi chép`: một parent dùng tab con cho `Ghi chú` (index/list, note detail/editor,
  notebook selector, delete) và `Nhật ký` (danh sách entry/ngày, `JournalBook`).
- Notebook là dữ liệu phân loại trong task/note/journal, không phải workspace top-level riêng.

### System areas

- `AI`: trợ lý AI dạng workspace/panel tùy platform.
- Thông báo hệ điều hành/trình duyệt được cấu hình trong Settings; không có inbox
  Thông báo nội bộ lặp lại danh sách task theo deadline.
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
- Mỗi task chỉ có một `tag`. Mảng `tags` là dữ liệu legacy được thu về tag đầu tiên
  khi app nạp, đồng bộ, tạo hoặc cập nhật task.
- Sửa task con phải giữ `parentTaskId`. Khi xóa task cha, các task con trực tiếp được giữ lại thành task độc lập; event không thể là cha hoặc con trong cây task.
- Task không có ngày không được tự coi là overdue; chỉ hiển thị trong backlog/nhóm phù hợp với logic planner.

## 3. Lịch sự kiện

- Desktop có weekly timeline/time chart để đọc event theo ngày và mốc giờ.
- Tablet, mobile và desktop đều mở workspace event độc lập từ navigation chính.
- Day detail có timeline/list theo những view source đang hỗ trợ; không thêm toggle mới nếu chưa có component và state tương ứng.
- Lịch tháng dùng `PlannerCalendar` và chỉ điều hướng vào ngày/task, không tự mở dashboard.

## 4. Note và journal flow

- Note tạo từ create sheet/action note, mở vào index/list rồi mới vào editor.
- Editor autosave theo store hiện tại; action row không hiển thị status/control thừa nếu source không cần.
- Journal tạo/mở entry theo ngày; book có date picker và chuyển ngày.
- Khi rời detail, back quay về index/list của feature trước khi quay về tab hoặc subtab cấp app.

## 5. Search, notification và auth

- Global search dùng cùng một `GlobalSearchModal` trên desktop, tablet và mobile; mobile không có thêm ô tìm kiếm cục bộ trong từng tab.
- Global search có thể tìm các loại dữ liệu mà search service/store hiện hỗ trợ; không quảng cáo loại dữ liệu chưa được query.
- Notification service chỉ quản lý quyền và lịch nhắc của hệ điều hành/trình duyệt
  theo platform. Hạn và quá hạn được đọc trên từng task, không được render thành
  một feed ứng dụng thứ hai.
- Lần đầu mở app có coach mark ngắn theo platform. Đây là hướng dẫn tương tác, không phải một trang hướng dẫn cố định.
- AI chỉ đưa ra đề xuất. Người dùng chọn từng mục trước khi áp dụng; không có thao tác thêm toàn bộ task AI đề xuất.
- Auth có login/register state; form phải responsive và giữ action đăng ký/đăng nhập trong viewport mobile.

## 6. Persistence và sync

- Store có persistence cục bộ và các hook sync/remote theo cấu hình hiện tại. Không mô tả local-only hoặc cloud-only nếu chưa kiểm tra adapter runtime.
- CRUD local phải cập nhật UI ngay khi có thể; sync lỗi cần được biểu diễn bằng trạng thái/retry thay vì làm mất bản ghi.
- Import/export/reset dữ liệu chỉ là feature data settings khi route/component hiện tại expose chúng; không tự thêm lại các control đã loại khỏi giao diện.

## 7. Responsive contract

- Desktop: sidebar trái, header đầy đủ, dialog/panel và multi-column khi cần.
- Tablet: workspace trung tâm, dock dưới, contextual FAB và detail riêng.
- Mobile: bottom dock gồm `Việc`, `Sự kiện`, nút `+`, `Ghi chép` và `Cá nhân`.
  `Ghi chép` gom Ghi chú/Nhật ký để không chồng với AI nổi. Settings là một trang
  cuộn dài dùng khoảng cách phân nhịp, không phải chuỗi dashboard card hoặc divider.
- Cùng một feature có thể dùng khác composition, nhưng phải giữ cùng semantics, token, dữ liệu và back contract.

## 8. Versioning, PWA và update

- Version runtime phải lấy từ `updateService.ts`; không hardcode version ở feature khác.
- Patch update có thể kiểm tra nền và áp dụng khi reload; update lớn cần modal nêu thay đổi và action rõ ràng.
- PWA/Capacitor phải có loading placeholder, service worker và fallback phù hợp khi offline; không hứa tính năng online nếu service chưa cung cấp.

## 9. Planned và legacy

- Planned: bất kỳ biến thể planner/time picker, dashboard, batch action hoặc workspace mới chưa xuất hiện trong `App.tsx`.
- Legacy: `AppShell`, `TasksTab`, `PlannerYearView`, Review/Dashboard files và các picker cũ không còn call-site.
- Khi một Planned feature được làm thật, phải cập nhật source, tests và tài liệu trong cùng change; không thêm tên tab/component vào docs trước khi runtime có state và route rõ ràng.
