# Kế Hoạch Giao Task Cho Anti

Tài liệu này là kế hoạch điều phối dài hạn của Codex. Anti chỉ thực hiện **một prompt tại một thời điểm**, theo đúng thứ tự phase. Không gộp nhiều phase vào một lần làm.

## Quy Tắc Chung

- Trước mỗi prompt, đọc `AGENTS.md`, `.design/` và prompt hiện tại trong `.agents/prompts/ANTIGRAVITY-TASK.md`.
- Chỉ sửa đúng phạm vi của prompt đang giao.
- Không đổi API hoặc tạo field mới nếu chưa kiểm tra contract.
- Sau mỗi prompt, cập nhật `.agents/reports/ANTIGRAVITY-REPORT.md` với file thật sự thay đổi, cách kiểm tra và lỗi còn lại.
- Không chuyển sang prompt kế tiếp nếu tiêu chí đạt của prompt hiện tại chưa hoàn thành.
- Mỗi prompt phải giữ giao diện đang hoạt động; không thay bằng placeholder.
- Sau các phase có thay đổi logic, chạy `npx tsc --noEmit` và kiểm tra các case liên quan.

## Thứ Tự Tổng Quan

| Phase | Chủ đề | Prompt dự kiến | Phụ thuộc |
|---|---|---:|---|
| 0 | Ổn định repo và baseline | 0A-0B | Không |
| 1 | Gom điều hướng và sub-tab | 1A-1C | Phase 0 |
| 2 | Chuẩn hóa logic Task | 2A-2D | Phase 1 |
| 3 | Chuẩn hóa persistence và sync | 3A-3C | Phase 2 |
| 4 | Header, Search, Notification, Auth | 4A-4D | Phase 1-3 |
| 5 | Modal và mobile interaction | 5A-5D | Phase 4 |
| 6 | Đồng bộ UI/UX toàn app | 6A-6D | Phase 1-5 |
| 7 | Note, Journal, Dashboard và nghiệm thu | 7A-7E | Phase 6 |

---

## Phase 0: Ổn Định Repo Và Baseline

### Prompt 0A - Kiểm tra trạng thái repo

**Mục tiêu:** Xác định chính xác trạng thái Git trước khi sửa tiếp.

**Giao Anti:**

- Kiểm tra `.git/index`, `.git/index.lock`, branch hiện tại và file đang thay đổi.
- Không tự xóa, reset, checkout hoặc khôi phục file khi chưa có xác nhận.
- Phân biệt file do người dùng/Anti tạo với file build hoặc file tạm.
- Ghi rõ trong report nếu Git chưa thể dùng để xem diff.

**Đạt khi:** Có báo cáo baseline rõ ràng và không làm mất thay đổi hiện có.

### Prompt 0B - Baseline kỹ thuật

**Mục tiêu:** Tạo mốc kiểm tra trước chuỗi thay đổi.

**Giao Anti:**

- Chạy `npx tsc --noEmit`.
- Chạy `npm run build`.
- Ghi warning, lỗi build, kích thước bundle và các giới hạn chưa xác minh.
- Không refactor hoặc đổi UI trong prompt này.

**Đạt khi:** Có kết quả build/type-check làm mốc so sánh cho các phase sau.

---

## Phase 1: Gom Điều Hướng Và Sub-tab

### Prompt 1A - Chốt mô hình điều hướng

**Mục tiêu:** Chỉ còn một nguồn sự thật cho tab chính và sub-tab.

**Giao Anti:**

- Giữ mô hình tab chính: `dashboard`, `tasks`, `notes`, `notebooks`, `settings`.
- `Hôm nay`, `Kế hoạch`, `Hạn định` chỉ là sub-tab của `tasks`.
- `Ghi chú`, `Nhật ký` chỉ là sub-tab của `notes`.
- Không render song song route độc lập cho `today`, `planner`, `journal`.
- Không làm thay đổi giao diện ngoài phạm vi cần để giữ active state đúng.

**Đạt khi:** Click mọi mục Sidebar đều mở đúng workspace cha và sub-tab tương ứng; Sidebar không mất trạng thái active.

### Prompt 1B - Sửa điều hướng từ Dashboard

**Mục tiêu:** Dashboard mở đúng ngữ cảnh.

**Giao Anti:**

- Card việc hôm nay mở `tasks + today`.
- Card quá hạn mở `tasks + deadlines`.
- Card lịch gần nhất mở `tasks + planner`.
- Card nhật ký mở `notes + journal`.
- Không chỉ đổi tab; phải truyền đúng sub-tab bằng state hiện có.

**Đạt khi:** Mỗi card Dashboard mở đúng nơi người dùng cần xử lý tiếp.

### Prompt 1C - Sửa điều hướng mobile và Back

**Mục tiêu:** Mobile không bị kẹt giữa tab chính và sub-tab.

**Giao Anti:**

- Nút More vẫn dùng cho `Sổ tay` và `Cài đặt`, không thêm dropdown mới.
- Active state của More phải đúng khi đang ở `notebooks` hoặc `settings`.
- Nút Back trên mobile quay về workspace trước hoặc tab cha hợp lý.
- Không làm mất trạng thái sub-tab khi đổi từ Dashboard sang Task/Note.

**Đạt khi:** Mobile có hierarchy rõ và không mở màn hình rời không có active navigation.

---

## Phase 2: Chuẩn Hóa Logic Task

### Prompt 2A - Một pipeline thời gian

**Mục tiêu:** Today, Planner, Notification và TaskCard dùng cùng logic.

**Giao Anti:**

- Dùng helper thuần cho `scheduled`, `deadline`, ngày có nhưng chưa có giờ và chưa có ngày.
- Không đọc `deadlineDate` như deadline nếu task đang là scheduled.
- So sánh ngày bằng `YYYY-MM-DD`, giờ bằng `HH:mm`.
- Task có ngày nhưng chưa có giờ không vào Hộp chờ.
- Task không có ngày chỉ xuất hiện trong Hộp chờ Planner.

**Đạt khi:** Cùng một task cho cùng một trạng thái ở Today, Planner, Notification và TaskCard.

### Prompt 2B - Phân vùng danh sách

**Mục tiêu:** Mỗi workspace chỉ lấy đúng task của nó.

**Giao Anti:**

- Today chỉ lấy task của ngày đang xem và giữ task quá hạn trong đúng ngày đó.
- Planner chỉ lấy task của ngày được chọn; task tháng khác không tràn vào ô phụ.
- Hạn định nhóm theo ngày, phân biệt lịch hẹn đã qua và deadline quá hạn.
- Sổ tay lọc theo đúng notebook.
- Task hoàn thành nằm cuối nhóm hiện tại, không mất ngữ cảnh.

**Đạt khi:** Không có task của ngày khác xuất hiện sai danh sách hoặc sai ô lịch.

### Prompt 2C - Chuẩn hóa cây task cha/con

**Mục tiêu:** Hiển thị và ràng buộc task cha/con rõ ràng.

**Giao Anti:**

- Hiển thị task cha, số lượng task con và trạng thái hoàn thành.
- Task con thụt vào và có nhãn `Việc con`.
- Chặn tự liên kết và vòng lặp.
- Khi chọn task cha, con kế thừa ngày/giờ hợp lệ.
- Task con không vượt hạn cha; với scheduled có thời lượng, dùng mốc kết thúc hợp lý, không tự ép sai về giờ bắt đầu.
- Chốt rõ có cho chọn task cha đã hoàn thành/quá hạn hay không và ghi trong report.

**Đạt khi:** Tạo, sửa, đổi cha và đổi hạn cha đều không tạo dữ liệu mâu thuẫn.

### Prompt 2D - Hoàn thành và dời task

**Mục tiêu:** Sửa các thao tác dễ gây sai ngày/giờ.

**Giao Anti:**

- Hoàn thành task không gạch ngang tiêu đề; chuyển vào nhóm `Đã xong`.
- Bỏ hoàn thành phải khôi phục đúng loại thời gian.
- Deadline chỉ dùng field deadline; scheduled chỉ dùng field scheduled.
- Dời sang ngày mai không làm sai ngày gốc, không kéo task sang tháng khác.
- Notification schedule/cancel dùng cùng helper thời gian.

**Đạt khi:** Các case hoàn thành, bỏ hoàn thành, dời ngày, deadline-only và scheduled-only đều giữ đúng dữ liệu.

---

## Phase 3: Persistence Và Đồng Bộ Dữ Liệu

### Prompt 3A - Gom Note thường vào data model chung

**Mục tiêu:** Note thường không còn nằm ngoài store chính.

**Giao Anti:**

- Kiểm tra contract/API trước khi đổi model.
- Đưa Note thường vào nguồn dữ liệu được quản lý thống nhất với Journal/Notebook.
- Không làm mất dữ liệu đang có trong `sketchtask_notes_v1`.
- Có migration hoặc fallback an toàn cho dữ liệu cũ.

**Đạt khi:** Reload app vẫn giữ Note thường và dữ liệu có một nguồn đọc/ghi rõ ràng.

### Prompt 3B - Sửa export/import

**Mục tiêu:** Backup chứa đủ dữ liệu người dùng.

**Giao Anti:**

- Export phải gồm Note thường, Journal, task, notebook, tag, habit và các dữ liệu hiện được hỗ trợ.
- Import phải ghi đúng key/store tương ứng.
- Có kiểm tra version/schema và báo lỗi file không hợp lệ.
- Không `localStorage.clear()` trong flow import.

**Đạt khi:** Export rồi import lại khôi phục được Note thường và không mất dữ liệu khác.

### Prompt 3C - Sửa cloud sync

**Mục tiêu:** Note thường đồng bộ đúng giữa thiết bị.

**Giao Anti:**

- Kiểm tra server contract và schema trước.
- Thêm Note thường vào payload chỉ khi API hỗ trợ đúng.
- Nếu API chưa hỗ trợ, không bịa field; ghi rõ blocker và giữ local data an toàn.
- Kiểm tra merge không xóa Note local.

**Đạt khi:** Có bằng chứng source/API hoặc report rõ giới hạn persistence.

---

## Phase 4: Header, Search, Notification Và Auth

### Prompt 4A - Header và avatar menu

**Mục tiêu:** Header dùng được và nhất quán trên mọi kích thước.

**Giao Anti:**

- Search, Notification, Avatar có kích thước, focus và active state thống nhất.
- Avatar menu mở/đóng bằng click ngoài và Escape.
- Focus không bị mất khi menu mở.
- Avatar mở đúng Settings/Auth flow.

**Đạt khi:** Header không có nút hiển thị nhưng no-op và thao tác bàn phím cơ bản hoạt động.

### Prompt 4B - Global Search đúng item

**Mục tiêu:** Search mở đúng đối tượng, không chỉ mở tab chung.

**Giao Anti:**

- Tìm đúng dữ liệu Note thường mới, Journal, task, notebook và habit.
- Task được phân loại bằng helper thời gian.
- Click hoặc Enter mở đúng item/detail và đúng workspace.
- Sửa nhãn `Ý tưởng` cũ thành tên hiện tại.
- Highlight tiếng Việt không dấu không bị lệch ký tự.

**Đạt khi:** Tìm một kết quả cụ thể và mở đúng chính kết quả đó.

### Prompt 4C - Notification

**Mục tiêu:** Notification rõ ràng và không lẫn loại quá hạn.

**Giao Anti:**

- Nhóm deadline quá hạn theo ngày.
- Tách lịch hẹn đã qua khỏi deadline quá hạn.
- Card có semantic button hoặc keyboard interaction tương đương.
- Không dùng full-screen popup nặng hơn cần thiết.

**Đạt khi:** Người dùng biết cần xử lý việc nào và click được tới task đúng.

### Prompt 4D - Auth và Settings account

**Mục tiêu:** Login/password và Settings hoạt động thật.

**Giao Anti:**

- Nối `onOpenAuth` từ AppShell/App vào Settings.
- Kiểm tra đăng nhập, đăng ký, logout, lỗi API và loading.
- Không dùng timeout giả để tự tắt loading khi OAuth còn đang chạy.
- Thêm show/hide password nếu không phá thiết kế.

**Đạt khi:** Nút đăng nhập trong Header, Settings và Cloud Sync mở cùng một flow Auth hợp lệ.

---

## Phase 5: Modal Và Mobile Interaction

### Prompt 5A - Một cơ chế khóa cuộn

**Mục tiêu:** Modal che nền nhưng nền không cuộn được.

**Giao Anti:**

- Dùng một cơ chế `useScrollLock` thống nhất.
- Loại bỏ việc modal tự sửa body style song song.
- Hỗ trợ modal lồng nhau, đóng nhanh và khôi phục đúng vị trí scroll.
- Không khóa vùng scroll nội dung bên trong modal.

**Đạt khi:** Không thể vuốt/cuộn nền phía sau, nhưng nội dung modal vẫn cuộn được.

### Prompt 5B - Modal accessibility

**Mục tiêu:** Popup không gây kẹt thao tác.

**Giao Anti:**

- Thêm `role="dialog"`, `aria-modal`, label phù hợp.
- Focus vào nội dung chính khi mở và trả focus khi đóng.
- Escape đóng modal nếu không phải màn hình khóa bắt buộc.
- Nút đóng rõ trên mobile, không phụ thuộc ESC.

**Đạt khi:** Keyboard, screen reader semantics và touch đều có đường thoát rõ.

### Prompt 5C - Mobile quick action

**Mục tiêu:** Nút `+` mobile tạo task/note thật.

**Giao Anti:**

- Cho người dùng chọn tạo Task hoặc Note.
- Mở đúng composer hiện có, không tạo thêm form trùng.
- Tôn trọng context đang ở Task hoặc Note.
- Không dùng `rounded-full` cho card/form chính nếu trái design contract.

**Đạt khi:** Nút `+` tạo được dữ liệu thật và reload vẫn còn dữ liệu.

### Prompt 5D - Responsive mobile riêng

**Mục tiêu:** Không bê nguyên desktop xuống mobile.

**Giao Anti:**

- Note Master-Detail chuyển thành list/detail toàn màn hình có Back.
- Journal không dùng chiều cao tối thiểu gây tràn khi mở keyboard.
- Thêm safe-area cho MobileNav.
- Kiểm tra 320px, 390px và orientation cơ bản.

**Đạt khi:** Không có vùng bị che, card 1200px bất ngờ hoặc nút nằm ngoài viewport.

---

## Phase 6: Đồng Bộ UI/UX Toàn App

### Prompt 6A - Type scale và spacing

**Mục tiêu:** Các tab nhìn cùng một sản phẩm.

**Giao Anti:**

- Tạo type scale dùng chung cho app title, page title, section title, body, label và micro-copy.
- Tiêu đề app lớn nhất trong header/brand theo đúng hierarchy.
- Chuẩn hóa padding, gap, border, button height và icon size.
- Không tự thêm font/style riêng từng tab.

**Đạt khi:** Dashboard, Task, Note, Notebook và Settings có cùng nhịp thị giác.

### Prompt 6B - Sidebar, content frame và progress

**Mục tiêu:** Phân bổ diện tích hợp lý.

**Giao Anti:**

- Sidebar thu gọn/mở rộng có animation thật.
- Content frame dùng chung, không tab rộng tab hẹp bất thường.
- Di chuyển progress khỏi góc trái nếu bị trùng Dashboard; nếu giữ lại phải chuyển thành status compact có ngữ nghĩa đúng.
- Không để khoảng trống lớn vô ích trên desktop.

**Đạt khi:** Desktop tận dụng diện tích, tablet không vỡ cột và mobile không bị ảnh hưởng.

### Prompt 6C - Popup, shadow và icon

**Mục tiêu:** Giữ phong cách SketchTask nhưng giảm cảm giác nặng.

**Giao Anti:**

- Loại các blur/backdrop blur không cần thiết.
- Dùng hard offset shadow theo token, không dùng `shadow-sm/lg/xl/2xl` cho component chính.
- Dùng một hệ icon rõ ràng, không trộn icon dư, emoji cũ và label cũ.
- Tạo tool/script audit icon chỉ đọc source và xuất file + dòng sử dụng icon đáng rà soát.

**Đạt khi:** Có báo cáo icon tự động và không còn popup/icon vi phạm trong phạm vi đã sửa.

### Prompt 6D - Animation có chủ đích

**Mục tiêu:** Animation mượt nhưng không làm app chậm hoặc khó chịu.

**Giao Anti:**

- Chỉ giữ một animation chuyển section/tab, không fade kép do remount.
- Animation sidebar, bottom sheet, toast và task completion có trạng thái rõ.
- Bổ sung `prefers-reduced-motion` cho animation mới và animation chính.
- Không animate container scroll hoặc input.

**Đạt khi:** Chuyển tab không nhấp nháy, không giật và có thể giảm motion.

### Bổ sung bắt buộc - Declutter UI và kiểm soát mật độ

Đây là phần bổ sung cho Prompt 6A-6D, không tạo phase độc lập.

**TaskCard:**

- Giữ thứ tự: trạng thái -> tiêu đề -> một chip thời gian chính -> tối đa hai metadata quan trọng.
- Chỉ hiển thị một chip `Lịch hẹn`, `Hạn` hoặc `Chưa sắp lịch`; không lặp ngày/giờ ở badge khác.
- Không tự gán giờ mặc định nếu task chưa có giờ.
- Sổ tay, tag, ưu tiên và cha/con bị giới hạn chiều rộng; phần dư đưa vào menu chi tiết.
- Task cha hiển thị chỉ báo gọn số việc con; task con có nhãn `Việc con` và thụt vào nhất quán.
- Task hoàn thành không gạch ngang tiêu đề; dùng checkbox, màu trạng thái và nhóm `Đã xong`.
- Không thay đổi semantics `scheduled`, `deadline`, quá hạn hoặc cha/con trong đợt tinh giản này.

**TodayScheduleNotes:**

- Là một khu vực lịch hẹn/khung giờ duy nhất; không lặp task với danh sách bên dưới.
- Sắp xếp theo helper thời gian; scheduled thiếu giờ không hiện `09:00` giả.
- Dùng màu token trong `.design/TOKENS.md`, không thêm màu hardcode ngoài design system.
- Item phải mở đúng task bằng vùng bấm rõ ràng, không dùng popup nặng để xem chi tiết.

**Khung nội dung, header và progress:**

- Desktop dùng content frame `w-full` với padding chung; không đặt max-width nhỏ khiến app co giữa và bỏ trống hai bên.
- Dùng cùng type scale; brand/app title là cấp lớn nhất trong header, page title không lấn át brand.
- Chỉ giữ một nguồn progress: `SidebarProgress` compact trên desktop nếu còn giá trị; ẩn ở mobile/tablet hoặc đưa vào summary, không lặp Dashboard.
- Màn hình rộng dùng grid để tăng lượng thông tin nhìn thấy, không làm card cao bất thường chỉ vì tăng padding.

**Responsive và tương tác:**

- 1024px trở lên: có thể dùng cột lịch hẹn/danh sách hoặc panel thêm bên phải nếu source hỗ trợ.
- 768-1023px: giảm số cột trước khi giảm chữ; không để card/filter/header tràn ngang.
- 320/390px: một cột hoặc bottom sheet phù hợp, vùng chạm tối thiểu 36px, metadata không ép tiêu đề vỡ layout.
- Không animate input, calendar grid hoặc vùng cuộn; animation mới phải có `prefers-reduced-motion` và không fade kép khi remount.

**Giới hạn file:**

- Tìm component canonical thật trước khi sửa. Nếu không có `client/src/components/features/shared/FilterBar.tsx`, không tạo file trùng; dùng `TodayFilterBar`, `PlannerFilterBar` hoặc component chung hiện có.
- Chỉ sửa UI/style liên quan; không đổi API, schema, field thời gian, persistence hoặc dữ liệu mẫu.
- Không thay toàn bộ giao diện bằng placeholder và không xóa component cũ khi chưa kiểm tra nơi sử dụng.

**Definition of Done:**

- Kiểm tra Header, Today, TaskCard, Dashboard, Note và Settings ở 320/390/768/1024/1280px.
- Thử thật click card, checkbox, menu, filter, sidebar và panel thêm; không chỉ đánh giá bằng ảnh.
- Chạy `npx tsc --noEmit` và `npm --prefix client run build`.
- Report ghi file thật sự đổi, case đã kiểm tra, case chưa kiểm tra và lỗi còn lại; không ghi `PASS` cho case chỉ suy đoán.

---

## Phase 7: Note, Journal, Dashboard Và Nghiệm Thu

### Prompt 7A - Regular Note

**Mục tiêu:** Note thường giống một app Note thực tế.

**Giao Anti:**

- Card là điểm vào; click card mở detail.
- Desktop dùng master-detail ổn định.
- Mobile dùng list/detail và Back.
- Tìm kiếm, chọn sổ, sửa, xóa và autosave không làm đơ khi đổi note.

**Đạt khi:** Tạo, mở, đổi note, sửa nội dung và quay lại list đều hoạt động.

### Prompt 7B - Journal

**Mục tiêu:** Nhật ký là timeline theo ngày/giờ, không phải danh sách card task.

**Giao Anti:**

- Lọc theo sổ tay đúng.
- Điều hướng ngày không làm mất entry.
- Hiển thị mốc giờ, nội dung và task liên kết rõ.
- Composer ngắn gọn, không kéo dài cuốn sổ vô hạn.

**Đạt khi:** Tạo/sửa/xóa entry ở ngày hiện tại và ngày cũ đều đúng dữ liệu.

### Prompt 7C - Dashboard

**Mục tiêu:** Dashboard là nơi nhìn nhanh, không trùng Task workspace.

**Giao Anti:**

- Chỉ giữ chỉ số và các shortcut thật sự cần.
- Không lặp toàn bộ danh sách task của Today.
- Shortcut mở đúng Task/Note sub-tab.
- Progress có ngữ nghĩa rõ và không lặp Sidebar.

**Đạt khi:** Dashboard giúp định hướng trong vài giây và không biến thành một tab Task thứ hai.

### Prompt 7D - Settings và Notebook

**Mục tiêu:** Hai màn hình phụ vẫn đồng nhất với app chính.

**Giao Anti:**

- Settings giữ hierarchy, type scale, spacing và button states chung.
- Notebook lọc đúng phạm vi sổ, không trộn task/note của sổ khác.
- Xóa hoặc đánh dấu rõ implementation cũ không còn dùng.

**Đạt khi:** Không còn cảm giác một số tab dùng bộ UI cũ, một số tab dùng bộ UI mới.

### Prompt 7E - Nghiệm thu cuối

**Mục tiêu:** Kiểm tra toàn app trước khi gọi là hoàn thành.

**Giao Anti:**

- Chạy `npx tsc --noEmit` và `npm run build`.
- Kiểm tra desktop 1280px, tablet 768/1024px, mobile 320/390px.
- Kiểm tra toàn bộ header, navigation, search, notification, auth, modal, task, note, journal, notebook và settings.
- Ghi rõ case đạt, case chưa kiểm tra được và lỗi còn tồn tại.
- Cập nhật tài liệu `.design/CURRENT-STATE.md`, `.docs/FEATURES.md` và `.agents/reports/ANTIGRAVITY-REPORT.md` cho khớp source thật.

**Đạt khi:** Có report cuối cùng trung thực, không dùng chữ “đạt” cho case chưa test thực tế.

---

## Cách Giao Cho Anti

Mỗi lần chỉ gửi một câu lệnh dạng:

```text
Đọc file .agent/plans/CODEX-ANTI-PHASE-PLAN.md và thực hiện đúng Prompt 1A.
Chỉ làm phạm vi Prompt 1A, không làm sang prompt khác.
Sau khi xong, cập nhật .agents/reports/ANTIGRAVITY-REPORT.md với file thật sự thay đổi,
các case đã kiểm tra và lỗi còn lại.
```

Sau khi Anti báo cáo, Codex phải kiểm tra source độc lập. Chỉ khi đạt mới giao prompt tiếp theo; nếu chưa đạt thì tạo prompt fix riêng cho đúng phase, không nhảy phase.
