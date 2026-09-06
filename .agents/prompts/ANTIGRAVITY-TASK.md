# Antigravity Task

## Chế độ thực thi

`RUN_ALL_REMAINING_PROMPTS`

Anti phải đọc và thực hiện từng prompt độc lập theo thứ tự mã `2A-FIX -> 2B -> 2C -> 2D -> 3A -> 3B -> 3C -> 4A -> 4B -> 4C -> 4D -> 5A -> 5B -> 5C -> 5D -> 6A -> 6B -> 6C -> 6D -> 7A -> 7B -> 7C -> 7D -> 7E` trong một lượt, không dừng chờ xác nhận giữa các prompt.

Phase 0 và Phase 1 đã được Codex xác minh hoàn tất. Không làm lại `0A`, `0B`, `1A`, `1B`, `1C` trừ khi phát hiện regression trực tiếp. Không bỏ qua prompt còn lại; nếu prompt nào lỗi thì ghi lỗi, tiếp tục phần độc lập và không tuyên bố prompt đó PASS.

## Quy tắc chung

1. Đọc `AGENTS.md`, `.design/` liên quan và `.docs/FEATURES.md` trước khi sửa.
2. Ưu tiên component, token, helper và data contract dùng chung; không tạo pipeline/UI trùng.
3. Kiểm tra API/TaskDto/schema trước khi đổi persistence; không tự bịa field.
4. Không dùng Git destructive; không `reset`, `checkout`, `clean` hoặc xóa dữ liệu người dùng.
5. Không dùng dữ liệu giả để che lỗi. Nếu cần seed/test data, ghi rõ.
6. Mỗi prompt phải ghi: file thật sự thay đổi, logic đã sửa, case đã kiểm tra, `PASS`/`PARTIAL`/`BLOCKED` và lỗi còn lại.
7. Không ghi `PASS` cho phần chưa kiểm tra được. Dùng `UNVERIFIED` cho kiểm tra chưa thực hiện.
8. Sau mỗi nhóm logic quan trọng chạy kiểm tra phù hợp; cuối lượt bắt buộc chạy typecheck/build.
9. Cập nhật `.agents/reports/ANTIGRAVITY-REPORT.md` sau toàn bộ lượt, không khai báo file chỉ đọc là file thay đổi.

## Kiến trúc điều hướng đã chốt

- Workspace chính: `Dashboard`, `Task`, `Note`, `Sổ tay`, `Cài đặt`.
- Nhánh `Task`: `Hôm nay`, `Kế hoạch`, `Hạn định`.
- Nhánh `Note`: `Ghi chú`, `Nhật ký`.
- `Tổng kết`/`ReviewTab` là legacy source, không tự đưa lại vào navigation.
- `Sổ tay` là phạm vi dữ liệu; không được trộn task/note/journal giữa các sổ.

---

## Prompt 0A - Kiểm tra trạng thái repo

**Trạng thái:** `COMPLETED` - chỉ đọc, không chạy lại nếu không có regression trực tiếp.

**Mục tiêu:** Xác định chính xác trạng thái Git trước khi sửa.

**Phạm vi:**

- Kiểm tra branch hiện tại, `HEAD`, `.git/index`, `.git/index.lock` và working tree.
- Phân biệt thay đổi do người dùng/Anti với file build hoặc file tạm.
- Không tự `reset`, `checkout`, `clean`, xóa hoặc khôi phục file.
- Nếu Git không xem được diff, ghi rõ giới hạn trong report.

**Đạt khi:** Có baseline rõ ràng và không làm mất thay đổi hiện có.

## Prompt 0B - Baseline kỹ thuật

**Trạng thái:** `COMPLETED` - chỉ đọc, không chạy lại nếu không có regression trực tiếp.

**Mục tiêu:** Có mốc kiểm tra kỹ thuật trước chuỗi thay đổi.

**Phạm vi:**

- Chạy `npx tsc --noEmit`.
- Chạy `npm run build` theo cấu hình repo.
- Ghi lỗi, warning, kích thước bundle và giới hạn chưa xác minh.
- Không refactor hoặc đổi UI trong prompt này.

**Đạt khi:** Có kết quả typecheck/build làm mốc so sánh.

## Prompt 1A - Chốt mô hình điều hướng

**Trạng thái:** `COMPLETED` - chỉ đọc, chỉ sửa nếu phát hiện regression.

**Mục tiêu:** Chỉ còn một nguồn sự thật cho workspace và sub-tab.

**Phạm vi:**

- Workspace chính là `dashboard`, `tasks`, `notes`, `notebooks`, `settings`.
- `Hôm nay`, `Kế hoạch`, `Hạn định` là sub-tab của `Task`.
- `Ghi chú`, `Nhật ký` là sub-tab của `Note`.
- Không render song song route độc lập cho `today`, `planner`, `journal`.
- Giữ active state đúng trên Sidebar và không đổi UI ngoài phạm vi cần thiết.

**Đạt khi:** Click mọi mục Sidebar mở đúng workspace cha và sub-tab tương ứng.

## Prompt 1B - Sửa điều hướng từ Dashboard

**Trạng thái:** `COMPLETED` - chỉ đọc, chỉ sửa nếu phát hiện regression.

**Mục tiêu:** Dashboard mở đúng ngữ cảnh xử lý tiếp theo.

**Phạm vi:**

- Card việc hôm nay mở `Task + Hôm nay`.
- Card quá hạn mở `Task + Hạn định`.
- Card lịch gần nhất mở `Task + Kế hoạch`.
- Card nhật ký mở `Note + Nhật ký`.
- Truyền đúng sub-tab bằng state/router hiện có, không chỉ đổi tab cha.

**Đạt khi:** Mỗi shortcut Dashboard mở đúng nơi người dùng cần xử lý.

## Prompt 1C - Điều hướng mobile và Back

**Trạng thái:** `COMPLETED` - chỉ đọc, chỉ sửa nếu phát hiện regression.

**Mục tiêu:** Mobile không bị kẹt giữa workspace cha và sub-tab.

**Phạm vi:**

- `More` giữ lối vào `Sổ tay` và `Cài đặt`, không thêm dropdown dư.
- Active state của More đúng khi ở `notebooks` hoặc `settings`.
- Back trên mobile quay về workspace trước hoặc tab cha hợp lý.
- Không mất sub-tab khi đi từ Dashboard sang Task/Note.

**Đạt khi:** Mobile có hierarchy rõ và không có màn hình rời không active navigation.

## Prompt 2A-FIX - Đồng bộ giờ hiệu lực với task semantics

**Trạng thái:** `ACTIVE`

**Mục tiêu:** Loại bỏ giờ hiển thị/sắp xếp đọc trực tiếp raw field khi đã có `getTaskEffectiveTime`; tuyệt đối không tự gán `09:00`.

**Phạm vi bắt buộc:**

- `client/src/components/features/today/TodayScheduleNotes.tsx`: dùng `getTaskEffectiveTime(task)` cho giờ bắt đầu; scheduled không có giờ phải hiện trạng thái như `Chưa thiết lập giờ`.
- `client/src/components/ui/feedback/NotificationBell.tsx`: dùng helper cho giờ scheduled; `endTime` chỉ là giờ kết thúc scheduled, không đọc deadline của scheduled.
- `client/src/components/features/deadlines/DeadlinesTab.tsx`: dùng helper để sort theo giờ hiệu lực; vẫn tách scheduled đã qua và deadline quá hạn.
- Quét lại đúng ba file để không còn fallback `09:00` hoặc sort bằng raw field sai semantics.

**Không làm:** Không sửa schema/API, Quick Add, Edit modal, calendar, filter hoặc UI tổng thể nếu không có bằng chứng trực tiếp.

**Đạt khi:** scheduled có giờ trong `dueDate` hiện đúng giờ; scheduled không có giờ không hiện `09:00`; notification và deadlines không đọc nhầm deadline; `npx tsc --noEmit` đạt.

## Prompt 2B - Phân vùng danh sách task

**Mục tiêu:** Today, Planner, Hạn định, Sổ tay và Notification lấy đúng task theo ngữ cảnh.

**Phạm vi:**

- Today chỉ lấy task của ngày đang xem và giữ task quá hạn trong đúng ngày đó; không kéo toàn bộ quá hạn của các ngày khác vào Today.
- Planner chỉ lấy task của ngày được chọn; task tháng khác không tràn vào ô phụ của lịch.
- Hạn định nhóm theo ngày; phân biệt lịch hẹn đã qua với deadline quá hạn.
- Sổ tay lọc đúng notebook hiện tại và vẫn giữ quan hệ cha/con.
- Task hoàn thành nằm cuối nhóm hiện tại, không mất ngữ cảnh ngày/sổ.
- Task không ngày chỉ nằm trong Hộp chờ Planner; task có ngày nhưng thiếu giờ không vào Hộp chờ.

**Đạt khi:** Một task không xuất hiện sai ngày, sai tháng, sai sổ hoặc sai loại quá hạn; các danh sách dùng cùng pipeline lọc -> gom cây -> nhóm hoàn thành -> render.

## Prompt 2C - Chuẩn hóa cây task cha/con

**Mục tiêu:** Hiển thị quan hệ cha/con rõ ràng và ngăn dữ liệu mâu thuẫn.

**Phạm vi:**

- Task cha hiển thị số lượng task con và trạng thái hoàn thành.
- Task con thụt vào, có nhãn `Việc con`, không bị lẫn với task độc lập.
- Chặn tự liên kết và vòng lặp cha/con.
- Khi chọn task cha, con kế thừa ngày/giờ hợp lệ theo dữ liệu cha.
- Task con không vượt hạn cha; nếu cha có ngày/giờ thì ngày/giờ con bị giới hạn tương ứng.
- Nếu cha chưa có hạn, không thêm giới hạn giả cho con.
- Không tự động dời hạn cha khi đổi hạn con.
- Chốt trong report việc task cha hoàn thành/quá hạn có được chọn làm cha hay bị giới hạn theo contract hiện có; không tự bịa rule lưu trữ.

**Đạt khi:** Tạo, sửa, đổi cha, đổi ngày/giờ cha và đổi hạn con không tạo vòng lặp hoặc task con vượt giới hạn cha.

## Prompt 2D - Hoàn thành và dời task

**Mục tiêu:** Hoàn thành, bỏ hoàn thành và dời ngày không làm sai semantics.

**Phạm vi:**

- Hoàn thành task chuyển vào nhóm `Đã xong`, không gạch ngang tiêu đề.
- Bỏ hoàn thành khôi phục đúng loại thời gian và ngày/giờ cũ.
- Scheduled chỉ dùng field scheduled; deadline chỉ dùng field deadline.
- Dời sang ngày mai không làm sai ngày gốc, không kéo task sang tháng khác.
- Notification schedule/cancel dùng cùng helper thời gian.

**Đạt khi:** Case hoàn thành, bỏ hoàn thành, dời ngày, deadline-only và scheduled-only đều giữ đúng dữ liệu sau reload.

---

## Prompt 3A - Gom Note thường vào data model chung

**Mục tiêu:** Note thường có một nguồn đọc/ghi rõ ràng cùng Journal/Notebook.

**Phạm vi:**

- Kiểm tra contract/API trước khi đổi model.
- Đưa Note thường vào store/data source được quản lý thống nhất.
- Giữ dữ liệu cũ trong `sketchtask_notes_v1`.
- Có migration hoặc fallback an toàn; reload không mất note.

**Đạt khi:** Tạo, sửa, xóa, reload Note thường đều dùng nguồn dữ liệu xác định và không mất dữ liệu cũ.

## Prompt 3B - Export/import đầy đủ

**Mục tiêu:** Backup khôi phục đủ dữ liệu người dùng.

**Phạm vi:**

- Export gồm task, Note thường, Journal, notebook, tag, habit và dữ liệu được hỗ trợ hiện tại.
- Import ghi đúng key/store tương ứng.
- Kiểm tra version/schema và báo lỗi file không hợp lệ.
- Không dùng `localStorage.clear()` trong import.

**Đạt khi:** Export rồi import khôi phục được Note thường và không mất dữ liệu task/journal/notebook/tag/habit.

## Prompt 3C - Cloud sync đúng contract

**Mục tiêu:** Đồng bộ đúng dữ liệu, không phá local state.

**Phạm vi:**

- Đọc server contract/schema trước.
- Chỉ thêm Note thường vào payload khi API hỗ trợ thật.
- Nếu API chưa hỗ trợ, không bịa field; ghi blocker và giữ local data an toàn.
- Merge không xóa Note local khi cloud thiếu dữ liệu.

**Đạt khi:** Có bằng chứng source/API cho sync hoặc report rõ blocker, không giả vờ đã sync được.

---

## Prompt 4A - Header và avatar menu

**Mục tiêu:** Header dùng được, đồng nhất desktop/tablet/mobile.

**Phạm vi:**

- Search, Notification, Avatar có kích thước, focus và active state thống nhất.
- Avatar menu mở/đóng bằng click ngoài và Escape.
- Focus không mất khi menu mở; click avatar mở đúng Settings/Auth flow.
- Không để nút hiển thị nhưng no-op.

**Đạt khi:** Header thao tác được bằng chuột, touch và keyboard cơ bản; không có trạng thái active sai workspace.

## Prompt 4B - Global Search

**Mục tiêu:** Search mở đúng item, không chỉ mở tab chung.

**Phạm vi:**

- Tìm task, Note thường, Journal, notebook và habit đang được hỗ trợ.
- Task được phân loại bằng helper semantics.
- Click/Enter mở đúng item/detail và workspace.
- Dùng nhãn hiện tại, không để tên legacy `Ý tưởng` nếu đã đổi thành `Nhật ký`.
- Tìm tiếng Việt không dấu không làm lệch highlight/kết quả.

**Đạt khi:** Tìm một kết quả cụ thể và mở đúng chính item đó.

## Prompt 4C - Notification

**Mục tiêu:** Notification rõ loại và dẫn tới đúng task.

**Phạm vi:**

- Deadline quá hạn nhóm theo ngày.
- Lịch hẹn đã qua tách khỏi deadline quá hạn.
- Card có semantic button hoặc keyboard interaction tương đương.
- Click notification mở đúng task/detail.
- Không dùng full-screen popup nặng hơn cần thiết.

**Đạt khi:** Người dùng biết loại việc cần xử lý và mở được đúng task.

## Prompt 4D - Auth và Settings account

**Mục tiêu:** Login/password, logout và đồng bộ tài khoản là flow thật.

**Phạm vi:**

- Nối `onOpenAuth` từ AppShell/App vào Settings.
- Kiểm tra login, register, logout, API error và loading.
- Không dùng timeout giả để tắt loading khi OAuth còn chạy.
- Show/hide password nếu không phá layout.

**Đạt khi:** Header, Settings và Cloud Sync mở cùng flow Auth hợp lệ, có trạng thái loading/error.

---

## Prompt 5A - Khóa cuộn modal

**Mục tiêu:** Modal che nền nhưng nền không cuộn được.

**Phạm vi:**

- Dùng một cơ chế `useScrollLock` thống nhất.
- Không để nhiều modal tự sửa body style cạnh tranh nhau.
- Hỗ trợ modal lồng nhau, đóng nhanh và khôi phục đúng vị trí scroll.
- Chỉ khóa nền; vùng nội dung modal vẫn cuộn được.

**Đạt khi:** Không thể vuốt/cuộn nền phía sau modal, nhưng modal dài vẫn cuộn bình thường.

## Prompt 5B - Modal accessibility

**Mục tiêu:** Popup có đường vào/ra rõ và không làm kẹt người dùng.

**Phạm vi:**

- Thêm `role="dialog"`, `aria-modal` và label phù hợp.
- Focus vào nội dung chính khi mở và trả focus khi đóng.
- Escape đóng modal khi không phải màn hình khóa bắt buộc.
- Mobile có nút đóng rõ, không phụ thuộc ESC.

**Đạt khi:** Keyboard, screen reader semantics và touch đều có đường thoát rõ.

## Prompt 5C - Mobile quick action

**Mục tiêu:** Nút `+` mobile tạo Task/Note thật.

**Phạm vi:**

- Cho chọn tạo Task hoặc Note.
- Mở composer hiện có, không tạo form trùng.
- Tôn trọng context Task/Note hiện tại.
- Tạo xong cập nhật list và reload vẫn còn dữ liệu.

**Đạt khi:** Nút `+` hoạt động thật trên mobile và không mở sai workspace.

## Prompt 5D - Responsive mobile riêng

**Mục tiêu:** Mobile có bố cục riêng, không bê nguyên desktop.

**Phạm vi:**

- Note master-detail chuyển thành list/detail toàn màn hình có Back.
- Journal không dùng min-height gây tràn khi mở keyboard.
- Có safe-area cho MobileNav.
- Kiểm tra 320px, 390px và orientation cơ bản.
- Không có card quá rộng, nút ngoài viewport hoặc nội dung bị header/bottom nav che.

**Đạt khi:** Mobile thao tác được toàn bộ flow chính mà không bị overflow/che khuất.

---

## Prompt 6A - Type scale và spacing

**Mục tiêu:** Dashboard, Task, Note, Notebook, Settings nhìn như cùng một sản phẩm.

**Phạm vi:**

- Tạo/áp dụng type scale chung cho app title, page title, section title, body, label và micro-copy.
- Tiêu đề app lớn nhất trong brand/header theo hierarchy.
- Chuẩn hóa padding, gap, border, button height và icon size.
- Không tự thêm font/style riêng từng tab.

**Đạt khi:** Các tab có cùng nhịp chữ, khoảng cách, kích thước control và cấp bậc thị giác.

## Prompt 6B - Sidebar, content frame và progress

**Mục tiêu:** Phân bổ diện tích hợp lý ở desktop/tablet/mobile.

**Phạm vi:**

- Sidebar thu gọn/mở rộng có animation thật và active state rõ.
- Content frame dùng chung; không tab rộng tab hẹp bất thường.
- Progress không bị trùng Dashboard; nếu giữ ở góc trái thì chuyển thành status compact có nghĩa rõ, nếu không thì đưa đến vị trí dễ quản lý hơn.
- Không để khoảng trống lớn vô ích trên desktop.

**Đạt khi:** Desktop tận dụng diện tích, tablet không vỡ cột, mobile không bị ảnh hưởng bởi progress/sidebar desktop.

## Prompt 6C - Popup, shadow và icon audit

**Mục tiêu:** Giảm chi tiết dư nhưng giữ phong cách SketchTask.

**Phạm vi:**

- Loại blur/backdrop blur không cần thiết theo design contract.
- Dùng hard offset shadow theo token; không dùng `shadow-sm`, `shadow-lg`, `shadow-xl`, `shadow-2xl` cho component chính.
- Dùng một hệ icon rõ ràng; rà icon dư, emoji cũ và label legacy.
- Tạo tool/script audit icon: quét source, xuất file và dòng sử dụng icon đáng rà soát.

**Đạt khi:** Tool audit chạy được, report có file/dòng cần xem và không còn popup/icon vi phạm trong phạm vi đã sửa.

## Prompt 6D - Animation có chủ đích

**Mục tiêu:** Animation mượt, tiết chế và không làm khó chịu.

**Phạm vi:**

- Chỉ giữ một animation chuyển section/tab, không fade kép do remount.
- Sidebar, bottom sheet, toast và task completion có trạng thái rõ.
- Có `prefers-reduced-motion` cho animation mới và animation chính.
- Không animate input, calendar grid hoặc container scroll.

**Đạt khi:** Chuyển tab không nhấp nháy/giật và reduced motion hoạt động.

## Bổ sung bắt buộc - Declutter UI và kiểm soát mật độ

Phần này là tiêu chí bổ sung cho Prompt 6A-6D, không phải một phase độc lập.

### 1. Thứ tự thông tin của TaskCard

- Giữ thứ tự cố định: checkbox/trạng thái -> tiêu đề -> một chip thời gian chính -> tối đa hai metadata quan trọng.
- Chỉ hiển thị một chip thời gian theo semantics: `Lịch hẹn`, `Hạn` hoặc `Chưa sắp lịch`; không lặp ngày/giờ ở badge khác.
- Nếu task không có giờ, chỉ hiển thị ngày khi ngữ cảnh cần; không tự gán giờ mặc định.
- Sổ tay, tag, ưu tiên và quan hệ cha/con phải có giới hạn chiều rộng; phần dư đi vào menu chi tiết, không làm card cao bất thường.
- Task cha có thể hiển thị một chỉ báo gọn cho số việc con; task con có nhãn `Việc con` và thụt vào nhất quán.
- Không gạch ngang tiêu đề task đã hoàn thành; dùng checkbox, màu trạng thái và nhóm `Đã xong`.
- Không đổi logic `scheduled`, `deadline`, quá hạn hoặc cha/con trong prompt tinh giản giao diện.

### 2. Khu vực lịch hẹn trong Today

- `TodayScheduleNotes` chỉ là một khu vực lịch hẹn/khung giờ, không lặp lại cùng task ở danh sách bên dưới.
- Sắp xếp theo thời gian hiệu lực từ helper semantics; scheduled thiếu giờ phải có trạng thái rõ, không hiện `09:00` giả.
- Dùng màu token và nền dịu từ `.design/TOKENS.md`, không hardcode thêm màu ngoài design system.
- Mỗi item có một điểm bấm rõ ràng để mở đúng task; không biến toàn bộ khu vực thành popup che màn hình.

### 3. Content frame, header và progress

- Desktop dùng `w-full` trong content frame chung, có padding ổn định; không đặt một `max-width` nhỏ khiến app bị co vào giữa và bỏ trống hai bên.
- Header, page title, section title, body, label và micro-copy phải dùng cùng type scale; app brand là cấp lớn nhất trong header, không để page title lấn át logo/brand.
- Progress chỉ có một nguồn hiển thị chính: giữ `SidebarProgress` dạng compact trên desktop nếu còn giá trị; ẩn khỏi sidebar mobile/tablet hoặc đưa vào khu vực summary, không hiển thị trùng Dashboard.
- Với màn hình rộng, danh sách task dùng grid phù hợp để tăng lượng thông tin nhìn thấy; không kéo card thành các khối cao chỉ vì tăng padding.

### 4. Responsive và tương tác

- Desktop từ 1024px: có thể dùng cột lịch hẹn/danh sách hoặc panel thêm bên phải nếu source hiện tại hỗ trợ.
- Tablet 768-1023px: giảm số cột trước khi giảm chữ; không để card, filter hoặc header tràn ngang.
- Mobile 320/390px: chuyển panel thành flow một cột/bottom sheet phù hợp, nút chạm tối thiểu 36px, metadata không ép tiêu đề vỡ dòng.
- Không animate input, calendar grid hoặc vùng cuộn; animation chỉ áp dụng cho mở/đóng panel, sidebar, toast và trạng thái hoàn thành.
- Tất cả animation mới phải có `prefers-reduced-motion`; không tạo fade kép khi component remount.

### 5. File và phạm vi được phép

- Trước khi sửa, tìm component canonical thật trong source. Nếu không có `client/src/components/features/shared/FilterBar.tsx`, không tạo file trùng; dùng `TodayFilterBar`, `PlannerFilterBar` hoặc component chung đang tồn tại.
- Chỉ sửa các component giao diện liên quan và style token; không đổi API, schema, field thời gian, persistence hoặc dữ liệu mẫu trong prompt này.
- Không thay toàn bộ giao diện bằng placeholder và không xóa component cũ nếu chưa xác định nơi sử dụng.

### 6. Definition of Done

- Có screenshot hoặc kiểm tra trực tiếp ở 320/390/768/1024/1280px cho Header, Today, TaskCard, Dashboard, Note và Settings.
- Kiểm tra click card, checkbox, menu chi tiết, filter, mở/đóng sidebar và panel thêm; không chỉ kiểm tra bằng mắt.
- Chạy `npx tsc --noEmit` và `npm --prefix client run build`.
- Báo cáo phải ghi file thật sự đổi, phần đã kiểm tra, phần chưa kiểm tra và lỗi còn lại; không ghi `PASS` cho case chỉ suy đoán.

---

## Prompt 7A - Regular Note

**Mục tiêu:** Note thường có flow giống app Note thực tế.

**Phạm vi:**

- Card là điểm vào; click card mở detail.
- Desktop dùng master-detail ổn định, đổi note giữa hai cột được.
- Mobile dùng list/detail toàn màn hình có Back.
- Search, chọn sổ, sửa, xóa và autosave không làm đơ khi đổi note.

**Đạt khi:** Tạo, mở, đổi, sửa, xóa note và quay lại list đều hoạt động.

## Prompt 7B - Journal

**Mục tiêu:** Nhật ký là timeline theo ngày/giờ, không phải danh sách card task.

**Phạm vi:**

- Lọc theo sổ tay đúng phạm vi.
- Điều hướng ngày không làm mất entry.
- Hiển thị mốc giờ, nội dung và task liên kết rõ.
- Composer ngắn gọn, không kéo dài cuốn sổ vô hạn.
- Giữ nút gợi ý nếu tính năng đang được hỗ trợ; không đưa ý tưởng cũ trở lại.

**Đạt khi:** Tạo, sửa, xóa entry ở ngày hiện tại và ngày cũ đều đúng dữ liệu sau reload.

## Prompt 7C - Dashboard

**Mục tiêu:** Dashboard là overview, không phải Task workspace thứ hai.

**Phạm vi:**

- Chỉ giữ chỉ số và shortcut thật sự cần.
- Không lặp toàn bộ danh sách task của Today.
- Shortcut mở đúng Task/Note sub-tab.
- Progress có nghĩa rõ và không lặp Sidebar.

**Đạt khi:** Người dùng hiểu nhanh tình hình và đi tới đúng nơi xử lý tiếp.

## Prompt 7D - Settings và Notebook

**Mục tiêu:** Hai màn hình phụ đồng nhất với ba nhóm workspace chính.

**Phạm vi:**

- Settings dùng chung hierarchy, type scale, spacing, border, button và empty/error states.
- Notebook lọc đúng phạm vi sổ, không trộn task/note/journal của sổ khác.
- Xóa hoặc đánh dấu rõ implementation cũ không còn dùng.
- Không tự thêm tab Tổng kết vào navigation.

**Đạt khi:** Settings/Notebook không còn cảm giác dùng bộ UI cũ tách khỏi app chính.

## Prompt 7E - Nghiệm thu cuối

**Mục tiêu:** Kiểm tra toàn app trước khi báo hoàn thành.

**Phạm vi:**

- Chạy `npx tsc --noEmit` trong `client` và `npm run build` theo cấu hình repo.
- Kiểm tra desktop 1280px, tablet 768/1024px, mobile 320/390px.
- Kiểm tra header, navigation, search, notification, auth, modal, task, note, journal, notebook và settings.
- Kiểm tra dữ liệu sau reload, export/import nếu đã hỗ trợ và không có regression Phase 0/1.
- Cập nhật `.design/CURRENT-STATE.md`, `.docs/FEATURES.md` và `.agents/reports/ANTIGRAVITY-REPORT.md` theo source thật.
- Ghi rõ case đạt, case chưa kiểm tra được, blocker và lỗi còn tồn tại.

**Đạt khi:** Có report cuối trung thực; không dùng chữ `PASS` cho case chưa test thực tế.

---

## Quy trình báo cáo sau một lượt

Report phải có các phần:

1. `EXECUTION_SUMMARY`: prompt nào đã chạy, theo đúng thứ tự nào.
2. `CHANGED_FILES`: chỉ file thực sự thay đổi.
3. `PROMPT_RESULTS`: từng mã prompt với `PASS`/`PARTIAL`/`BLOCKED`.
4. `VERIFICATION`: lệnh đã chạy và kết quả.
5. `REMAINING_ISSUES`: lỗi còn lại, file/dòng liên quan và nguyên nhân.
6. `UNVERIFIED`: phần chưa thể kiểm tra bằng source/test.

Sau khi Anti hoàn tất, không tự sửa report thành `DONE_VERIFIED` nếu chưa có bằng chứng kiểm tra. Codex sẽ đọc diff và tạo prompt fix riêng nếu phát hiện lỗi.

## Tài liệu nguồn

- Kế hoạch chi tiết: `.agent/plans/CODEX-ANTI-PHASE-PLAN.md`.
- Trạng thái chính thức: `.agent/plans/PLAN-STATUS.md`.
- Verification log: `.agent/verification/VERIFICATION-LOG.md`.
- Report: `.agents/reports/ANTIGRAVITY-REPORT.md`.
- Prompt lịch sử: `.agents/prompts/archive/`.
- Prompt 17 legacy: `SKIPPED`, không thực hiện lại.
