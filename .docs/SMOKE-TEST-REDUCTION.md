# Smoke Test Và Rút Gọn SketchTask

Mục tiêu của bản này là kiểm tra theo **nghiệp vụ**, không kiểm thử từng màn hình
riêng lẻ. Một task/event chỉ được phép có một nguồn xử lý chính; các màn hình khác
chỉ là cách xem khác nhau khi thật sự cần thiết.

## 1. Bộ dữ liệu kiểm thử nhỏ

Tạo đúng 6 mục, rồi dùng cùng chúng trên desktop, tablet và mobile:

| Mã | Dữ liệu | Mục đích |
| --- | --- | --- |
| A | Task không ngày: `Đọc tài liệu` | Backlog, không được vào Hạn định |
| B | Task deadline ngày mai 09:00: `Nộp báo cáo` | Sắp đến |
| C | Task deadline hôm qua không giờ: `Thanh toán hóa đơn` | Quá hạn sau khi hết ngày hôm qua |
| D | Event hôm nay 09:00–10:00: `Họp nhóm` | Event, không được vào Hạn định |
| E | Task cha: `Chuẩn bị ra mắt` | Quan hệ cha/con |
| F | Task con của E: `Soạn checklist` | Lưu quan hệ khi sửa/xóa |

## 2. Smoke test rút gọn

| # | Luồng cần kiểm | Kết quả đúng | Quyết định khi trùng |
| --- | --- | --- | --- |
| 1 | Tạo và mở A | Có trong danh sách task, không có trong Hạn định | Giữ một luồng tạo dùng chung |
| 2 | Mở B ở lịch và Hạn định | Cùng một task, cùng màu task; Hạn định chỉ là hàng đợi chú ý | Giữ cả hai vì mục đích khác nhau |
| 3 | Mở C ở `Quá hạn` | Chỉ là task deadline quá hạn, không lẫn event | Không tạo thêm feed thông báo |
| 4 | Mở D ở lịch sự kiện | Có giờ bắt đầu/kết thúc; không xuất hiện ở Hạn định | Giữ tách event và task |
| 5 | Sửa F, rồi xóa E | F giữ cha khi sửa; khi xóa E, F thành task độc lập | Đây là một nghiệp vụ, không có màn thay thế |
| 6 | Tìm B và D | Global Search tìm được cả task/event, mở đúng detail | Chỉ giữ một search toàn app |
| 7 | Nhờ AI chia E | AI hỏi lại nếu thiếu dữ kiện; chỉ tạo các bước đã tick | Không có nút áp dụng hàng loạt mặc định |
| 8 | Back từ detail/settings/note | Đóng surface con trước, rồi mới đổi tab | Chỉ giữ một back contract |
| 9 | So sánh `Hôm nay` với lịch Ngày | Ghi lại: dữ liệu, action và mục đích có khác nhau không | Nếu giống hoàn toàn, gộp vào lịch Ngày |

## 3. Kết quả audit hiện tại

### Giữ

| Khu vực | Lý do |
| --- | --- |
| Lịch sự kiện và Hạn định | Lịch là nơi xem event có khoảng bắt đầu-kết thúc; Hạn định là queue task deadline cần chú ý. Không cùng dữ liệu hay mục đích. |
| Event và Task | Event có khoảng bắt đầu-kết thúc; task có deadline. Không được gộp dữ liệu hoặc lẫn trong Hạn định. |
| Ghi chú và Nhật ký | Ghi chú là tri thức lâu dài; nhật ký là ghi chép theo ngày. Chỉ nên gộp navigation trên màn nhỏ, không gộp model. |
| AI và thao tác tạo task | AI là nơi đề xuất; luồng tạo task là nơi người dùng chủ động tạo. Không cùng quyền hạn. |

### Gộp hoặc đổi tên

| Mức | Khu vực | Nhận định | Hướng xử lý đề xuất |
| --- | --- | --- | --- |
| Đã áp dụng | Desktop `Tất cả việc` và `Công việc` | Hai điểm đến cùng task data làm người dùng tưởng có hai workspace. | Gộp thành `Công việc` là backlog/filter; lịch chỉ còn ở workspace `Sự kiện`. |
| Cao | `Lịch sự kiện` và `Dòng sự kiện` desktop | Là hai cách xem cùng một tập event. | Chuyển thành lựa chọn view trong một workspace `Sự kiện`, không để như hai điểm đến ngang hàng. |
| Cao | Tablet `Hôm nay` và `Công việc` | Hai điểm đến đang chia cùng task data, nhưng tablet chưa có workspace Sự kiện thật. | Bỏ `Hôm nay`; thiết kế lại dock tablet quanh `Việc`, `Sự kiện`, `Ghi chép`, `+`, `Sắp đến`. |
| Đã áp dụng | Desktop task `Hôm nay`/planner | Product không còn cần destination Planner/Today riêng cho task. | Liên kết Desktop cũ trả về `Công việc`; event calendar không đổi. |

### Bỏ sau khi xác nhận call-site

| Mức | Hạng mục | Lý do |
| --- | --- | --- |
| Cao | Callback `onNavigateToTaskDate` của Deadlines | Deadline view hiện mở detail trực tiếp, không còn gọi callback này. Các props truyền qua desktop/tablet/mobile là wiring dư. |
| Trung bình | Nhánh route Desktop `today` và `DesktopTodayView` | Desktop contract hiện không có destination Hôm nay, nhưng source vẫn còn fallback legacy. Chỉ xóa sau khi smoke test back/navigation không còn mở route đó. |
| Quyết định cần làm rõ | Lịch Năm desktop | Source vẫn render và header vẫn cho chọn `Năm`, trong khi tài liệu runtime ghi là legacy. Cần chọn một: giữ và cập nhật tài liệu, hoặc bỏ view này. |

## 4. Cấu trúc đề xuất sau khi rút gọn

- Desktop: `Công việc`, `Hạn định`, `Sự kiện`, `Ghi chép`, `AI`; không có Planner/Today cho task.
- Tablet: `Việc`, `Sự kiện`, `Ghi chép`, `+`, `Sắp đến`; tài khoản ở Header. Đây là hướng cần triển khai riêng vì tablet hiện chưa có workspace Sự kiện thật.
- Mobile: `Việc`, `Sự kiện`, `+`, `Sắp đến`, `Cá nhân`; không thêm tab Hôm nay hoặc Thông báo.

Không xóa model dữ liệu trước khi các smoke test ở mục 2 qua ở cả ba breakpoint.
