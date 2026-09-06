# Current Antigravity Task

## CURRENT TASK: Prompt 1 - Tạo khung điều hướng Dashboard / Task / Note

Đây là prompt đầu tiên trong chuỗi tái quy hoạch SketchTask. Chỉ thực hiện đúng phạm vi bên dưới. Không làm trước các task về Dashboard, Task Workspace, Note/Journal, dữ liệu hoặc UI bên trong.

### Mục tiêu

Chuẩn bị khung điều hướng cấp cao mới với 3 khu vực chính:

```text
Dashboard | Task | Note
```

Các màn hình hiện tại chưa được xóa và chưa được chuyển logic trong task này.

### Được phép sửa

- `client/src/types/index.ts`: bổ sung key điều hướng tối thiểu nếu cần.
- `client/src/App.tsx`: thêm route/render placeholder cho `Dashboard`, `Task`, `Note`.
- `client/src/components/layout/Sidebar.tsx`.
- `client/src/components/layout/MobileNav.tsx`.
- Tạo component placeholder tối giản trong:
  - `client/src/components/features/dashboard/`.
  - `client/src/components/features/tasks/`.
  - `client/src/components/features/notes/`.

### Yêu cầu điều hướng

- Mobile chỉ hiển thị 3 khu vực chính và nút `+`:

```text
Dashboard | Task | + | Note | Thêm
```

- Desktop Sidebar hiển thị:
  - Dashboard.
  - Task.
  - Note.
  - Nhóm `Khác` chứa Sổ tay, Tổng kết, Cài đặt.
- Nút `+` chỉ là placeholder hoặc menu chưa triển khai; chưa tạo flow task/note thật.
- `Thông báo` vẫn giữ ở header/global panel, không đưa thành tab chính.
- Giữ các key cũ và khả năng quay lại màn hình cũ nếu việc xóa ngay có thể làm hỏng dữ liệu hoặc route. Có thể tạm ẩn khỏi navigation nhưng không xóa component cũ.
- Không đổi `TaskDto`, `JournalEntryDto`, API, localStorage hoặc dữ liệu mẫu.
- Không đổi `TodayTab`, `PlannerTab`, `NotebooksTab`, `ReviewTab`, `IdeasTab` ngoài việc nối placeholder nếu thật sự cần.
- Không tạo thêm tab thứ tư hoặc thứ sáu.

### Quy tắc UI

- Placeholder dùng style SketchTask hiện có và token trong `.design/TOKENS.md`.
- Không thêm gradient, emoji UI, native select hoặc style mới lan sang component cũ.
- Mobile không được overflow ngang và bottom navigation không che nội dung.
- Không sửa logic task, note, journal, calendar, notification hoặc filter.

### Kiểm tra

1. App vẫn khởi động được.
2. Desktop Sidebar hiển thị Dashboard, Task, Note và nhóm Khác.
3. Mobile hiển thị Dashboard, Task, nút `+`, Note và Thêm.
4. Bấm Dashboard/Task/Note không làm mất dữ liệu hoặc lỗi runtime.
5. Các màn hình cũ vẫn còn trong source và chưa bị xóa.
6. Kiểm tra mobile khoảng 390px và desktop khoảng 1280px.
7. Chạy trong thư mục `client`:

```text
npx tsc --noEmit
npm run build
```

### Báo cáo bắt buộc

Cập nhật `.agents/ANTIGRAVITY-REPORT.md`, không xóa lịch sử. Ghi rõ:

- File đã thay đổi.
- Navigation mới đang hoạt động ở viewport nào.
- Component cũ nào được giữ nguyên.
- Kết quả typecheck/build.
- Lỗi runtime hoặc điểm chưa kiểm tra được.

Không tự chuyển sang Prompt 2 khi chưa có yêu cầu mới.

## Trạng Thái

`READY`

## Prompt

## LATEST TASK OVERRIDE: TASK 30

Task cần thực hiện hiện tại là **Task 30: Thiết kế lại hoàn chỉnh modal Chỉnh sửa công việc** ở phía dưới file. Bỏ qua các prompt cũ đang nằm trong mục lịch sử.

Đính chính quan trọng cho Task 30:

- Trường thứ ba trong modal là **Nhãn/Tag**, không phải `Thuộc task nào` hay bộ chọn task liên kết thông thường.
- Nếu cần thêm trường quan hệ, dùng tên **Thuộc công việc nào** hoặc **Công việc cha**, với mục tiêu chuẩn bị nâng cấp thành `subtask`; không coi nó là tag.
- Không tự bịa field/API để lưu quan hệ cha-con. Nếu model chưa hỗ trợ, chỉ ghi rõ trong báo cáo.

## LATEST TASK OVERRIDE: TASK 31

Task hiện tại là **Task 31: Cập nhật Task View và TaskCard** ở phía dưới file. Bỏ qua các prompt cũ trong lịch sử.

- Hợp nhất hai `TaskDetailModal` hiện có thành một component canonical dùng chung; không để cùng một hành vi nhưng hiển thị khác nhau giữa các tab.
- Tinh gọn `TaskCard`: ưu tiên tiêu đề, trạng thái hoàn thành, một thông tin lịch chính và metadata cần thiết; tránh lặp ngày/giờ/tag/sổ.
- Giữ phân biệt màu `deadline quá hạn`, `scheduled đã qua`, `đã xong`; không dùng strikethrough cho task đã xong.
- Task view phải hiển thị rõ nội dung, lịch, sổ, tag, ưu tiên và hành động; mobile là Bottom Sheet, desktop là modal.
- Không đổi logic dữ liệu task ngoài việc chuẩn hóa cách đọc/hiển thị.

## LATEST TASK OVERRIDE: TASK 33

Task hiện tại là **Task 33: Đồng bộ Quick Add với modal Sửa theo từng context** ở phía dưới file. Bỏ qua các prompt cũ trong lịch sử.

- Dùng chung thứ tự và ngôn ngữ UI với modal Sửa nhưng không bê nguyên toàn bộ control vào mọi tab.
- Hôm Nay không hiển thị control chọn ngày; ngày tự động là hôm nay. Chỉ hiển thị giờ hẹn/giờ chót khi người dùng mở phần chi tiết.
- Sổ tay có context riêng: cuốn sổ hiện tại được gán ngầm, task có thể chưa quyết định ngày; cần có cách chọn ngày nếu người dùng muốn xếp lịch.
- Giữ Planner không bị đổi logic ngày đang chọn.
- Không để Quick Add hiển thị dropdown ngày, tag, sổ, giờ và ưu tiên cùng lúc ngay từ đầu; phần chi tiết phải mở gọn.

## LATEST TASK OVERRIDE: TASK 34

Task hiện tại là **Task 34: Hiển thị rõ quan hệ Task cha / Task con** ở phía dưới file. Bỏ qua các prompt cũ trong lịch sử.

- Dựa trên `parentTaskId`, không dùng tag hoặc màu sắc để đoán quan hệ cha/con.
- Xử lý grouping ở tầng danh sách trước; `TaskCard` chỉ nhận thông tin hierarchy cần hiển thị.
- Task cha có thể hiển thị số lượng task con và nút mở/thu gọn.
- Task con phải thụt vào, có connector/đường dọc và nhãn rõ `Công việc con`.
- Task độc lập không có connector hoặc nhãn cha/con.
- Khi task con xuất hiện riêng trong search/filter/notification, hiển thị `Con của: ...`.
- Không tự động hoàn thành task con khi hoàn thành task cha.

## LATEST TASK OVERRIDE: TASK 35

Task hiện tại là **Task 35: Không ẩn Task cha khi Task con xuất hiện trong danh sách đã lọc** ở phía dưới file. Bỏ qua các prompt cũ trong lịch sử.

- Khi một task con đang hiển thị trong Today/Planner/Notebook/Filter nhưng task cha bị loại khỏi mảng lọc, không được chỉ hiện `Con của: ...` khiến task cha trông như bị ẩn.
- Phải hiển thị task cha làm context/group header hoặc một parent context card ngay phía trên task con; task con vẫn thụt vào và có connector.
- Task cha được thêm để cung cấp context không được tính nhầm vào tổng số task/ngày đang lọc.
- Nếu parent thật sự không tồn tại trong toàn bộ store, mới hiển thị `Công việc cha không còn tồn tại`.
- Grouping phải nhận danh sách task đang hiển thị và danh sách toàn bộ task để resolve parent, không chỉ dùng một mảng đã lọc.

## LATEST TASK OVERRIDE: TASK 36

Tạm dừng xử lý hierarchy cha/con. Task hiện tại là **Task 36: Thiết kế lại Planner theo hướng Calendar-first** ở phía dưới file.

- Màn hình mặc định của Planner là lịch tháng toàn chiều rộng.
- Bỏ chế độ xem theo tuần và bỏ nút `Hôm nay` riêng trong Planner; ngày hiện tại chỉ highlight nhẹ trên lịch.
- Bỏ control thiết lập ngày khỏi Quick Add trong Planner; Quick Add tự dùng ngày đang được mở.
- Bấm một ô ngày chuyển sang DayPlanView/danh sách task của ngày đó; có nút `Quay lại lịch`.
- Không hiển thị lịch tháng phía sau danh sách task của ngày.
- Giữ Hộp chờ là một lối vào riêng, không trộn vào việc chọn ngày.

## LATEST TASK OVERRIDE: TASK 37

Task hiện tại là **Task 37: Làm lại visual Planner Calendar và Hộp chờ chọn ngày** ở phía dưới file. Bỏ qua các prompt cũ trong lịch sử.

- Thiết kế lại lịch tháng, không giữ nguyên giao diện lưới nhỏ và marker chen chúc hiện tại.
- Lịch phải tận dụng chiều rộng mới, hierarchy rõ giữa ngày, số lượng và trạng thái.
- Hộp chờ dùng mini calendar để chọn ngày trực tiếp.
- Chỉ cho phép chọn hôm nay và ngày tương lai; khóa toàn bộ ngày quá khứ.
- Bỏ action/label kiểu `Dời sang ngày mai` hoặc `Dời sang ngày X`.

## LATEST TASK OVERRIDE: TASK 38

Bổ sung vào Task 37: mọi màn hình Planner có ngày trong quá khứ đều là **view-only về việc tạo task**.

- Ngày quá khứ trên Calendar vẫn được bấm để xem task, nhưng không được tạo task mới.
- DayPlanView của ngày quá khứ phải ẩn hoàn toàn Quick Add, không chỉ disabled một phần.
- Ngày hôm nay và tương lai mới được hiển thị Quick Add.
- Không hiển thị các action tạo/chuyển task kiểu `Dời sang...` trong Hộp chờ; chọn ngày trực tiếp trên lịch.
- Task chưa hoàn thành của ngày đã qua nên dùng nền muted/giảm tương phản và nhãn `Ngày đã qua`, không dùng gạch ngang vì gạch ngang biểu thị đã hoàn thành.
- Task đã hoàn thành giữ badge `Đã xong`; không gạch ngang title.

## LATEST TASK OVERRIDE: TASK 39

Task hiện tại là **Task 39: Tăng kích thước tấm lịch trong tab Kế hoạch** ở phía dưới file.

- Tăng kích thước Calendar tháng để tận dụng chiều rộng màn hình hiện tại.
- Ô ngày desktop/tablet rộng và cao hơn, dễ đọc và dễ bấm.
- Giữ lưới 7 cột cân đối, không để lịch bị co thành một khối nhỏ giữa màn hình.
- Mobile vẫn vừa viewport, không cuộn ngang; chỉ tăng khoảng chạm trong giới hạn hợp lý.
- Không thay đổi logic ngày quá khứ, Quick Add, Hộp chờ hoặc hierarchy.

## LATEST TASK OVERRIDE: TASK 40

Task hiện tại là **Task 40: Thiết kế lại visual Calendar Planner, không chỉ phóng to bản cũ**.

- Bản hiện tại bị quá nhiều ô card nhỏ, weekday thành nút riêng, viền lặp và marker bé; không tiếp tục vá kích thước trên layout đó.
- Thiết kế lịch như một mặt lịch lớn: một container chính, header weekday phẳng, lưới ngày thoáng, hierarchy rõ.
- Bỏ style mỗi ngày là một card nổi độc lập và bỏ các ô weekday dạng button/pill.
- Số ngày phải lớn/dễ đọc; số lượng task và marker đặt ở hàng phụ, không chen vào số ngày.
- Chỉ hiển thị marker trạng thái cần thiết, tối đa 3 marker + `+N`, tránh nhiều chip màu nhỏ.
- Mobile 390px ưu tiên dễ đọc và vùng chạm; desktop/tablet tận dụng chiều rộng nhưng không kéo lịch thành khối quá cao.

## CURRENT TASK: Thay tab Ý tưởng bằng Nhật ký theo ngày và giờ

Đọc trước khi sửa: `AGENTS.md`, `.design/README.md`, `.design/CURRENT-STATE.md`, `.design/PRINCIPLES.md`, `.design/TOKENS.md`, `.design/COMPONENTS.md`, `.docs/FEATURES.md` và báo cáo mới nhất trong `.agents/`.

Đây là task feature mới. Tab `Ý tưởng` bị thay thế hoàn toàn bằng `Nhật ký`. Không giữ UI Ý tưởng, không tự động chuyển ý tưởng cũ thành nhật ký và không tự động tạo nhật ký khi hoàn thành task.

### Mục tiêu

Nhật ký là nơi ghi lại người dùng đã làm được gì trong ngày, có thể liên kết với task nhưng không bắt buộc. Một ngày có thể có nhiều entry theo giờ:

```text
Nhật ký · 30/08/2026
09:00  Đã hoàn thành task nghiên cứu Design System [Task liên kết]
12:30  Đã xử lý xong giao diện Planner [Task liên kết]
21:00  Hôm nay mình làm việc khá hiệu quả [Không liên kết]
```

### Điều hướng và cấu trúc feature

- Đổi nhãn `Ý tưởng` thành `Nhật ký` trong MobileNav, Sidebar, NotebookTabs và nơi điều hướng liên quan.
- Đổi icon sang Lucide như `BookOpen` hoặc `NotebookPen`, không dùng emoji.
- Giữ đúng 5 tab chính, không tạo tab thứ sáu.
- Ngừng render toàn bộ UI Ideas/Sticky Notes trong tab này.
- Không migrate ý tưởng cũ thành nhật ký. Không tự ý xóa dữ liệu local/backend nếu chưa xác định nơi lưu; ghi rõ trong report.

```text
features/journal/
├── JournalTab.tsx
├── JournalHeader.tsx
├── JournalCalendar.tsx
├── JournalTimeline.tsx
├── JournalEntryComposer.tsx
├── JournalEntryCard.tsx
└── JournalTaskLinkPicker.tsx
```

- `JournalTab` điều phối ngày, entries và state.
- `JournalCalendar` chọn ngày và đánh dấu ngày có entry.
- `JournalTimeline` hiển thị entry theo giờ tăng dần.
- `JournalEntryComposer` thêm entry với giờ và nội dung.
- `JournalEntryCard` xem/sửa/xóa entry.
- `JournalTaskLinkPicker` tìm task bằng UI custom và cho phép bỏ liên kết.
- Tái sử dụng `ui` và `features/shared`, không copy TaskCard hoặc CustomSelect.

### Flow và dữ liệu

- Composer mặc định dùng ngày đang chọn; giờ mặc định là giờ hiện tại nhưng sửa được.
- Nội dung bắt buộc; liên kết task là tùy chọn.
- Entry liên kết task hiển thị title/trạng thái và mở được detail.
- Nếu task bị xóa, entry vẫn đọc được với `Task không còn tồn tại`.
- Khi hoàn thành task, chỉ hiện gợi ý `Ghi vào nhật ký`; không tự tạo entry. Người dùng bấm gợi ý mới mở composer với task đã chọn.
- Nếu chưa có journal API, tạo model local-first theo pattern hiện có, không phá schema task:

```ts
{ id: string; date: string; time: string; content: string; linkedTaskId?: string; createdAt: string; updatedAt: string }
```

- Không thêm cảm xúc/tag trong flow đầu tiên.
- Không sửa logic task, deadline, notification hoặc picker ngoài gợi ý nhật ký.

### Kiểm tra bắt buộc

1. Navigation hiển thị `Nhật ký` thay cho `Ý tưởng`, vẫn đúng 5 tab.
2. Một ngày tạo được nhiều entry và entry sắp xếp đúng theo giờ.
3. Tạo entry có và không liên kết task; sửa/xóa hoạt động.
4. Hoàn thành task chỉ hiện gợi ý; bấm gợi ý mới mở composer với task.
5. Calendar đánh dấu ngày có entry.
6. Kiểm tra empty state, nội dung dài, keyboard và scroll ở mobile/tablet/desktop.
7. Chạy `npx tsc --noEmit` và `npm run build` trong `client`.

Cập nhật `.agents/ANTIGRAVITY-REPORT.md` bằng task mới, ghi quyết định bỏ Ideas, mapping file, model journal, flow gợi ý và kết quả kiểm tra. Không xóa lịch sử.

---

## Prompt mới: Note Workspace không dùng popup nặng

### Phạm vi

Chỉ thay đổi trải nghiệm xem và sửa **Ghi chú** trong `client/src/components/features/notes/`. Không thay đổi logic task, Planner, Today, Notification, EditTaskModal, TaskDetailModal hoặc các popup xác nhận hệ thống trong prompt này.

### Mục tiêu UX

Biến Note Workspace thành một không gian sổ tay liền mạch, không còn cảm giác một hộp popup đè lên toàn bộ ứng dụng.

1. **Desktop/tablet rộng**
   - Dùng bố cục master-detail hai cột trong chính Note Workspace.
   - Cột trái là danh sách note và nút `Tạo ghi chú`.
   - Cột phải là trang chi tiết của note đang chọn.
   - Khi chưa chọn note, hiển thị empty state nhẹ ở cột phải.
   - Không dùng backdrop toàn màn hình cho việc xem/sửa note.

2. **Mobile**
   - Khi chưa chọn note: hiển thị danh sách note như hiện tại.
   - Khi chọn note: chuyển sang trang chi tiết trong cùng workspace, có nút `Quay lại` ở đầu trang.
   - Không render NoteDetail như bottom-sheet phủ lên danh sách.
   - Nút back của trình duyệt/Android phải quay về danh sách, không thoát app.

3. **Chỉnh sửa note**
   - Ở trang chi tiết, cho phép chuyển sang chế độ sửa ngay tại chỗ.
   - Tiêu đề và nội dung dùng input/textarea hiện có, không dùng popup riêng.
   - Có `Lưu` và `Hủy`; chưa tự động lưu nếu persistence hiện tại chưa hỗ trợ an toàn.
   - Khi đang gõ nội dung dài, vùng nội dung phải cuộn được độc lập và không làm vỡ layout.
   - Giữ nguyên dữ liệu `id`, `createdAt`, `updatedAt`; không tạo note mới khi sửa.

### Quy tắc giao diện

- Giữ token và pattern trong `.design/`.
- Bỏ nền đen `rgba(0,0,0,0.75)` và `backdrop-filter` khỏi luồng xem/sửa note.
- Không thêm gradient, shadow mờ, pill shape hoặc emoji UI.
- Desktop dùng panel/card trong layout; mobile dùng chuyển cảnh nhẹ giữa danh sách và chi tiết.
- Không thay đổi `ConfirmModal`, `GlobalSearchModal`, `SettingsModal`, popup chọn ngày/giờ hoặc modal task.
- Không đổi API/data model. Tái sử dụng `NoteList`, `NoteComposer`, `NoteDetail` nếu hợp lý; được phép đổi tên thành component workspace rõ nghĩa nhưng phải cập nhật toàn bộ import.

### Kiểm tra bắt buộc

1. Mở Note Workspace trên desktop: danh sách và chi tiết nằm cùng layout, không có backdrop phủ màn hình.
2. Chọn note: nội dung hiển thị đúng, không mất dữ liệu.
3. Bấm sửa, thay đổi tiêu đề/nội dung, lưu: note trong danh sách cập nhật đúng một item.
4. Bấm hủy khi đang sửa: dữ liệu cũ vẫn giữ nguyên.
5. Note có nội dung dài: vùng chi tiết cuộn được, không cuộn xuyên ra layout phía sau.
6. Trên mobile khoảng 320px và 390px: danh sách/chi tiết không tràn ngang; `Quay lại` hoạt động.
7. Nhật ký vẫn hoạt động như trước; không chuyển Nhật ký thành popup trong prompt này.
8. Chạy `npx tsc --noEmit`, `npm run build`, và cập nhật `.agents/ANTIGRAVITY-REPORT.md` với file thật sự thay đổi, các case đã kiểm tra và lỗi chưa xác minh được. Không báo PASS nếu chưa kiểm tra trực tiếp.

### Ranh giới triển khai

Đây là một prompt UI/UX độc lập. Nếu phát hiện vấn đề thuộc Task/Planner hoặc modal dùng chung, chỉ ghi vào báo cáo, không tự sửa trong prompt này.

---

# PROMPT 2 FIX: Loại task chưa có ngày khỏi badge Hôm nay

## Lỗi cần sửa

Trong `client/src/components/features/tasks/TasksTab.tsx`, `pendingTodayCount` hiện đang tính cả task không có ngày hiệu lực:

```ts
return taskDate === todayStr || !taskDate;
```

Điều này làm badge số lượng trên nút `Hôm nay` đếm cả task chưa sắp lịch, trong khi task chưa có ngày chỉ được xuất hiện trong Hộp chờ của Planner.

## Phạm vi

- Chỉ sửa `client/src/components/features/tasks/TasksTab.tsx` nếu không bắt buộc phải sửa file khác.
- Đổi logic badge để chỉ đếm task chưa hoàn thành có `getTaskEffectiveDate(task) === todayStr`.
- Không thay đổi cách `TodayTab` lọc task, không thay đổi `PlannerTab`, Hộp chờ, API, store hoặc semantics.
- Không đổi UI/điều hướng khác.

## Kiểm tra bắt buộc

1. Task có ngày hôm nay được tính trong badge Hôm nay.
2. Task không có ngày không được tính trong badge Hôm nay và chỉ còn ở Hộp chờ Planner.
3. Task đã hoàn thành không được tính.
4. Chuyển Hôm nay/Kế hoạch không lỗi runtime.
5. Chạy `npx tsc --noEmit` và `npm run build` trong thư mục `client`.

## Báo cáo

Cập nhật phần mới nhất của `.agents/ANTIGRAVITY-REPORT.md` với file thực sự thay đổi, kết quả từng case và kết quả typecheck/build. Không ghi `PASS` cho case chưa kiểm tra trực tiếp. Sau khi hoàn tất, dừng lại và không tự chuyển sang Prompt 3.

---

# PROMPT 3: Dựng Note Workspace từ Note và Nhật ký

## Mục tiêu

Triển khai khung không gian `Note` bên trong tab Note, gồm hai chế độ:

```text
Note
├── Ghi chú
└── Nhật ký
```

Chỉ dựng workspace và tái sử dụng component hiện có. Chưa triển khai editor vô hạn, liên kết task, lịch theo giờ, AI gợi ý hoặc thay đổi API/dữ liệu.

## Phạm vi được phép sửa

- `client/src/components/features/notes/NotesTab.tsx`
- Tạo component con trong `client/src/components/features/notes/` nếu cần, ví dụ `NoteWorkspaceTabs.tsx`.
- Chỉ sửa `App.tsx` nếu cần để giữ route Note hiện tại.
- Không sửa `JournalTab`, `IdeasTab`, `NotebooksTab`, task logic, store, API hoặc model.

## Yêu cầu giao diện

- Header hiển thị `Ghi chú & Nhật ký`.
- Có segmented switch rõ ràng:
  - `Ghi chú`
  - `Nhật ký`
- Mặc định mở `Ghi chú`.
- Màn hình `Ghi chú` chỉ hiển thị placeholder có hướng dẫn ngắn, không giả vờ đã có editor thật.
- Màn hình `Nhật ký` chỉ hiển thị placeholder có hướng dẫn ngắn, không tự tạo entry hoặc dữ liệu mẫu.
- Giữ style/token SketchTask hiện có; không gradient, không native select, không emoji UI, không overflow ngang.
- Responsive ở mobile khoảng 390px và desktop khoảng 1280px.

## Bảo toàn hệ thống

- Dashboard, Task Workspace, Hôm nay, Kế hoạch, Sổ tay, Tổng kết và Cài đặt không được thay đổi hành vi.
- Không xóa `JournalTab` hoặc component cũ.
- Không thêm field/API/localStorage mới.
- Không tự chuyển sang triển khai editor hoặc tính năng liên kết task.

## Kiểm tra bắt buộc

1. Bấm Note mở đúng workspace và mặc định ở `Ghi chú`.
2. Chuyển `Ghi chú` sang `Nhật ký` không lỗi runtime và không tạo dữ liệu ngoài ý muốn.
3. Quay lại Task, Dashboard và Sổ tay vẫn hoạt động.
4. Không có scroll ngang ở mobile.
5. Chạy `npx tsc --noEmit` và `npm run build` trong thư mục `client`.

## Báo cáo bắt buộc

Cập nhật đầu `.agents/ANTIGRAVITY-REPORT.md`, ghi file thực sự thay đổi, các viewport đã kiểm tra và kết quả từng case. Dừng ở Prompt 3.

---

# PROMPT 4: Dựng danh sách Note card cơ bản

## Mục tiêu

Thay placeholder của chế độ `Ghi chú` trong Note Workspace bằng danh sách Note card cơ bản. Chỉ làm phần hiển thị và flow tạo Note tối thiểu; chưa làm editor vô hạn hay Nhật ký theo timeline.

## Phạm vi được phép sửa

- `client/src/components/features/notes/NotesTab.tsx`
- Tạo component con trong `client/src/components/features/notes/`:
  - `NoteCard.tsx`.
  - `NoteList.tsx`.
  - `NoteComposer.tsx`.
- Chỉ thêm type nội bộ nếu thật sự cần và không thay đổi API/contract hiện tại.
- Không sửa Task Workspace, Dashboard, JournalTab, store hoặc dữ liệu task.

## Yêu cầu chức năng

- Chế độ `Ghi chú` hiển thị danh sách Note card; trạng thái rỗng có hướng dẫn rõ ràng.
- Có nút `Tạo ghi chú` mở form gọn gồm tiêu đề và nội dung ngắn.
- Có thể hủy form; không tạo Note rỗng.
- Note card bên ngoài ưu tiên tiêu đề, đoạn xem trước và thời điểm cập nhật.
- Nếu model/API Note chưa hỗ trợ persistence, không tự bịa endpoint; dựng UI state tối thiểu và ghi rõ giới hạn trong báo cáo.
- Không tạo dữ liệu mẫu tự động.

## Yêu cầu UI

- Note card dùng đúng token SketchTask, border mực và hard shadow.
- Không dùng emoji làm icon UI, không native select, không gradient và không làm card thành pill.
- Mobile khoảng 390px không overflow ngang; form có thể cuộn nội bộ nếu nội dung dài.
- Chế độ `Nhật ký` giữ nguyên placeholder của Prompt 3.

## Kiểm tra bắt buộc

1. Note mở đúng chế độ Ghi chú và hiển thị empty state khi chưa có dữ liệu.
2. Mở form, nhập tiêu đề/nội dung, tạo Note không rỗng và card hiển thị đúng.
3. Hủy form không tạo Note.
4. Chuyển sang Nhật ký rồi quay lại không lỗi.
5. Task, Dashboard và Sổ tay vẫn hoạt động.
6. Kiểm tra mobile 390px và desktop 1280px.
7. Chạy `npx tsc --noEmit` và `npm run build` trong thư mục `client`.

## Báo cáo bắt buộc

Cập nhật đầu `.agents/ANTIGRAVITY-REPORT.md` với file thật sự thay đổi, persistence thực tế có hay chưa, kết quả từng case và viewport đã kiểm tra. Dừng ở Prompt 4.

---

# PROMPT 5: Mở chi tiết Note card

## Mục tiêu

Khi người dùng bấm một Note card trong chế độ `Ghi chú`, mở một màn hình chi tiết gọn để đọc nội dung Note. Chỉ làm flow xem chi tiết; chưa làm editor vô hạn, timeline Nhật ký, liên kết task hoặc persistence backend.

## Phạm vi được phép sửa

- `client/src/components/features/notes/NotesTab.tsx`
- `client/src/components/features/notes/NoteCard.tsx`
- `client/src/components/features/notes/NoteList.tsx`
- Tạo `NoteDetail.tsx` trong cùng thư mục nếu cần.
- Không sửa Task, Dashboard, JournalTab, store, API hoặc model hiện có.

## Yêu cầu chức năng

- Bấm Note card mở đúng Note đã chọn, không mở nhầm card khác.
- Chi tiết hiển thị tiêu đề, toàn bộ nội dung và thời điểm cập nhật.
- Có nút `Đóng` rõ ràng; mobile có thể đóng bằng nút hoặc chạm nền.
- Desktop dùng modal gọn; mobile dùng Bottom Sheet có grab handle và nội dung cuộn nội bộ.
- Khi mở chi tiết, khóa cuộn nền; đóng chi tiết phải khôi phục cuộn nền.
- Không tự sửa nội dung, không tạo bản ghi mới và không thêm persistence.
- Nếu Note card chưa có nội dung thì hiển thị empty copy rõ ràng, không lỗi layout.

## Yêu cầu UI

- Dùng token SketchTask, border mực, hard shadow và pattern modal hiện có.
- Không dùng nút X làm hành động duy nhất trên mobile; không native dialog, không gradient, không emoji UI.
- Nội dung dài phải cuộn trong sheet/modal, footer hoặc nút Đóng vẫn thao tác được.
- Không làm thay đổi layout của chế độ Nhật ký.

## Kiểm tra bắt buộc

1. Tạo một Note bằng flow Prompt 4, bấm card và thấy đúng chi tiết.
2. Nội dung dài cuộn được trong modal/sheet, nền phía sau không cuộn xuyên qua.
3. Đóng chi tiết khôi phục trang Note và không mất danh sách trong cùng phiên.
4. Chuyển Ghi chú/Nhật ký và Task không lỗi.
5. Kiểm tra mobile 390px và desktop 1280px.
6. Chạy `npx tsc --noEmit` và `npm run build` trong thư mục `client`.

## Báo cáo bắt buộc

Cập nhật đầu `.agents/ANTIGRAVITY-REPORT.md` với file thật sự thay đổi, trạng thái scroll lock, các case đã kiểm tra và viewport. Dừng ở Prompt 5.

---

# PROMPT 6: Lưu Note trong phiên và sau khi reload

## Mục tiêu

Làm cho các Note đã tạo ở Prompt 4 được giữ lại sau khi chuyển tab và reload app. Chỉ xử lý persistence cho Note, không đụng dữ liệu task hoặc Nhật ký.

## Phạm vi

- `client/src/components/features/notes/NotesTab.tsx`
- `client/src/components/features/notes/NoteTypes.ts`
- Tạo helper riêng trong `client/src/utils/` nếu cần.
- Chỉ dùng localStorage với key riêng, có prefix rõ ràng cho Note.
- Không sửa API, TaskDto, store task, JournalTab hoặc Dashboard.

## Yêu cầu

- Load Note an toàn khi mở app.
- Lưu Note mới sau khi tạo.
- Dữ liệu localStorage lỗi hoặc sai schema không được làm crash app; fallback về danh sách rỗng.
- Không ghi đè key localStorage hiện có.
- Giữ nguyên empty state, Note card, Note detail và chuyển Ghi chú/Nhật ký.
- Thời điểm tạo/cập nhật dùng định dạng ổn định, không phụ thuộc chuỗi hiển thị để xử lý dữ liệu.

## Kiểm tra

1. Tạo Note, chuyển tab rồi quay lại vẫn còn.
2. Reload localhost vẫn còn Note.
3. Xóa key hoặc ghi JSON lỗi không làm app crash.
4. Task/Dashboard/Nhật ký không bị ảnh hưởng.
5. Chạy `npx tsc --noEmit` và `npm run build`.

Cập nhật đầu `.agents/ANTIGRAVITY-REPORT.md` với key/schema, file thật sự đổi và kết quả từng case. Dừng ở Prompt 6.

---

# PROMPT 7: Chỉnh sửa Note từ màn hình chi tiết

## Mục tiêu

Cho phép chỉnh sửa tiêu đề và nội dung Note từ màn hình chi tiết của Prompt 5. Sau khi lưu, Note card và thời điểm cập nhật phải đồng bộ.

## Phạm vi

- `client/src/components/features/notes/NoteDetail.tsx`
- `client/src/components/features/notes/NoteCard.tsx`
- `client/src/components/features/notes/NotesTab.tsx`
- Không sửa Task, Nhật ký, API hoặc cấu trúc localStorage ngoài schema Note đã chốt ở Prompt 6.

## Yêu cầu

- Có hành động `Chỉnh sửa` trong chi tiết.
- Form sửa hiển thị đúng Note đang chọn, không mở nhầm dữ liệu.
- Nội dung dùng textarea có thể cuộn/giãn hợp lý; không khóa thao tác trên mobile.
- `Lưu` cập nhật đúng card và `updatedAt`.
- `Hủy` khôi phục nội dung cũ, không ghi dữ liệu.
- Không cho lưu Note hoàn toàn rỗng.
- Mobile là Bottom Sheet, nền khóa cuộn; desktop là modal gọn.

## Kiểm tra

1. Sửa tiêu đề và nội dung, lưu rồi kiểm tra card.
2. Hủy sửa không thay đổi Note.
3. Reload vẫn giữ nội dung đã sửa.
4. Nội dung dài không làm vỡ modal ở mobile 390px.
5. Chạy `npx tsc --noEmit` và `npm run build`.

Cập nhật đầu `.agents/ANTIGRAVITY-REPORT.md` với file thật sự đổi và kết quả từng case. Dừng ở Prompt 7.

---

# PROMPT 8: Nền tảng Nhật ký theo ngày và giờ

## Mục tiêu

Thay placeholder của chế độ `Nhật ký` bằng nền tảng timeline tối thiểu: hiển thị entry theo ngày và giờ, chưa liên kết task và chưa làm editor nâng cao.

## Phạm vi

- `client/src/components/features/notes/NotesTab.tsx`
- Tạo trong `client/src/components/features/notes/`:
  - `JournalTimeline.tsx`.
  - `JournalEntryComposer.tsx`.
  - `JournalEntryCard.tsx`.
- Chỉ dùng model/API nhật ký hiện có nếu đã kiểm tra contract; không tự bịa field/API.
- Không sửa `JournalTab` cũ, Task, Dashboard hoặc Note persistence.

## Yêu cầu

- Nhật ký hiển thị theo nhóm ngày; trong mỗi ngày sắp xếp entry theo giờ mới nhất trước.
- Có nút `Thêm nhật ký` mở form gọn gồm nội dung; thời điểm tạo tự ghi bằng dữ liệu thời gian chuẩn.
- Hiển thị giờ trên entry; ngày chỉ hiển thị ở tiêu đề nhóm, không lặp trên từng card.
- Nếu persistence nhật ký chưa có contract, dùng state tạm và ghi rõ giới hạn, không phá dữ liệu cũ.
- Ghi chú vẫn giữ nguyên flow Prompt 6/7.
- Không dùng native date/time/select, không emoji UI, không overflow ngang.

## Kiểm tra

1. Mở Nhật ký thấy empty state khi chưa có entry.
2. Tạo entry hiển thị đúng giờ và đúng nhóm ngày.
3. Có nhiều entry thì nhóm ngày và thứ tự giờ chính xác.
4. Chuyển Ghi chú/Nhật ký không mất Note.
5. Kiểm tra mobile 390px và desktop 1280px.
6. Chạy `npx tsc --noEmit` và `npm run build`.

Cập nhật đầu `.agents/ANTIGRAVITY-REPORT.md` với contract/model đã dùng, file thật sự đổi, persistence thực tế và kết quả từng case. Dừng ở Prompt 8.

---

# PROMPT 6-8 FIX: Rà lại phạm vi, schema Note và hard-shadow

## Lý do

Lượt vừa rồi đã triển khai gộp Prompt 6, 7 và 8. Không cần hoàn tác chức năng đã có, nhưng phải rà lại theo đúng phạm vi và sửa các điểm sau trước khi chuyển prompt mới.

## Bắt buộc sửa

1. Trong `client/src/utils/noteStorage.ts`, validator phải kiểm tra đầy đủ `id`, `title`, `content`, `createdAt` và `updatedAt` đều là chuỗi. Item thiếu field hoặc sai kiểu phải bị loại an toàn; không để type assertion biến dữ liệu hỏng thành `NoteItem` hợp lệ.
2. Trong `client/src/components/features/notes/NoteDetail.tsx`, thay mọi `shadow-sm` hoặc shadow mặc định bằng hard-offset shadow theo token, ví dụ `shadow-[1px_1px_0px_#262626]`.
3. Không tự tạo thêm dữ liệu kiểm thử trong localStorage. Không tự xóa dữ liệu hiện có của người dùng; nếu có dữ liệu kiểm thử do quá trình xác minh tạo ra thì chỉ ghi rõ trong báo cáo để chủ dự án quyết định.

## Rà soát phạm vi

- Giữ nguyên chức năng đã hoàn thành của Prompt 6, 7, 8.
- Không triển khai Prompt 9 hoặc tính năng mới.
- Không sửa Task, Dashboard, API contract hoặc `JournalTab` cũ.
- Ghi rõ trong báo cáo rằng 3 prompt đã bị thực hiện trong cùng một lượt, đồng thời tách danh sách file và kết quả kiểm tra theo từng phần 6/7/8.

## Kiểm tra bắt buộc

1. Note hợp lệ load được sau reload.
2. Note thiếu `createdAt` hoặc `updatedAt`, JSON lỗi, hoặc schema sai không làm app crash và không được nhận như Note hợp lệ.
3. Mở, chỉnh sửa và đóng Note Detail vẫn hoạt động; nền vẫn khóa cuộn.
4. Nhật ký và Task Workspace không lỗi.
5. Không còn `shadow-sm` trong các file Note vừa thay đổi.
6. Chạy `npx tsc --noEmit` và `npm run build` trong thư mục `client`.

Cập nhật đầu `.agents/ANTIGRAVITY-REPORT.md` với file thật sự đổi, kết quả từng case và ghi chú dữ liệu kiểm thử nếu có. Dừng lại sau Prompt 6-8 FIX.

---

# PROMPT 9: Biến Dashboard thành màn hình tổng quan thật

## Mục tiêu

Thay placeholder của `DashboardTab` bằng dashboard tổng quan chỉ đọc, giúp người dùng nhìn nhanh trạng thái công việc và ghi chép hiện có. Không thêm flow tạo mới trong prompt này.

## Phạm vi được phép sửa

- `client/src/components/features/dashboard/DashboardTab.tsx`
- Có thể tạo component con trong `client/src/components/features/dashboard/` nếu cần.
- Không sửa Task Workspace, Today, Planner, Note, JournalTab, store, API hoặc model.

## Nội dung bắt buộc

- Header `Tổng quan` và mô tả ngắn.
- Các thẻ thống kê đọc từ dữ liệu hiện có:
  - Việc cần làm.
  - Đã hoàn thành.
  - Quá hạn.
  - Ghi chú/Nhật ký.
- Một khu vực tóm tắt hành động gần nhất hoặc trạng thái rỗng rõ ràng nếu chưa có dữ liệu.
- Số liệu phải dùng cùng semantics hiện có, không tự suy luận deadline/scheduled bằng logic mới.
- Các thẻ không được làm thao tác thay đổi dữ liệu; nếu có điều hướng thì chỉ chuyển sang tab tương ứng.

## Yêu cầu UI

- Desktop bố cục thoáng, mobile 390px xếp một cột hoặc lưới không tràn ngang.
- Dùng token SketchTask, hard-offset shadow, không gradient, không emoji UI, không native control.
- Không hiển thị nội dung placeholder kiểu “đang chuẩn bị” sau khi hoàn tất.

## Kiểm tra bắt buộc

1. Dashboard mở được với dữ liệu rỗng và có empty state hợp lý.
2. Khi có task/note/journal hiện có, số liệu hiển thị đúng.
3. Task scheduled không bị tính nhầm là deadline quá hạn.
4. Bấm điều hướng từ dashboard không làm mất dữ liệu.
5. Kiểm tra mobile 390px và desktop 1280px.
6. Chạy `npx tsc --noEmit` và `npm run build` trong thư mục `client`.

Cập nhật đầu `.agents/ANTIGRAVITY-REPORT.md` với file thật sự đổi, nguồn dữ liệu của từng số liệu, các viewport và kết quả từng case. Dừng ở Prompt 9.

---

# PROMPT 2: Dựng Task Workspace từ Today và Planner

## Mục tiêu

Sau khi khung điều hướng Dashboard / Task / Note đã được kiểm tra trực tiếp, hãy triển khai **riêng không gian Task**. Task Workspace là nơi chứa hai chế độ xem công việc hiện có:

```text
Task
├── Hôm nay
└── Kế hoạch
```

Không triển khai Note, Dashboard chi tiết, tổng kết mới hoặc tính năng mới khác trong prompt này.

## Phạm vi được phép sửa

- `client/src/components/features/tasks/TasksTab.tsx`
- Tạo component con trong `client/src/components/features/tasks/` nếu cần, ví dụ `TaskWorkspaceTabs.tsx`.
- `client/src/App.tsx` chỉ khi cần truyền callback/context tối thiểu để giữ route hiện tại.
- Có thể sửa rất hạn chế `TodayTab.tsx` hoặc `PlannerTab.tsx` chỉ để tái sử dụng trong workspace; không viết lại logic task.
- Không sửa API, `TaskDto`, store, task semantics, `TaskCard`, modal, calendar hoặc Note.

## Yêu cầu giao diện

- Khi bấm `Task`, hiển thị header `Công việc` và một segmented switch rõ ràng:
  - `Hôm nay`
  - `Kế hoạch`
- Mặc định mở `Hôm nay`.
- Bấm `Hôm nay` phải render đúng `TodayTab` hiện tại.
- Bấm `Kế hoạch` phải render đúng `PlannerTab` hiện tại.
- Giữ nguyên quick add, filter, task card, calendar, Hộp chờ, modal sửa và các thao tác hiện có.
- Không nhân đôi danh sách task hoặc gọi API hai lần chỉ vì chuyển sub-tab.
- Mobile không overflow ngang; switch có vùng chạm tối thiểu phù hợp.
- Desktop giữ bố cục rộng; không biến toàn bộ Task Workspace thành một placeholder.
- Dùng token/style hiện có, không thêm gradient, emoji UI, native select hay style mới lan sang màn hình cũ.

## Điều hướng và trạng thái

- Dashboard, Note, Sổ tay, Tổng kết và Cài đặt tiếp tục hoạt động như trước.
- Khi rời Task rồi quay lại, có thể giữ sub-tab đang chọn trong phiên hiện tại; không cần persistence mới.
- Không thay đổi ý nghĩa dữ liệu: Today và Planner vẫn dùng pipeline semantics hiện tại.
- Không đưa task chưa có ngày vào Today; không làm thay đổi quy tắc Hộp chờ của Planner.

## Kiểm tra bắt buộc

1. App khởi động và mở `Task` mặc định ở `Hôm nay`.
2. Chuyển `Hôm nay` -> `Kế hoạch` -> `Hôm nay` không mất dữ liệu và không lỗi runtime.
3. Quick add, filter, mở TaskCard, sửa task và hoàn thành task vẫn hoạt động ở đúng màn hình cũ.
4. Hộp chờ và lịch Planner vẫn hiển thị đúng; không xuất hiện task chưa có ngày trong Today.
5. Dashboard, Note, Sổ tay, Tổng kết và Cài đặt vẫn chuyển được.
6. Kiểm tra trực tiếp viewport mobile khoảng 390px và desktop khoảng 1280px.
7. Chạy trong thư mục `client`:

```text
npx tsc --noEmit
npm run build
```

## Báo cáo bắt buộc

Cập nhật `.agents/ANTIGRAVITY-REPORT.md` ở đầu phần báo cáo, không xóa lịch sử. Ghi rõ:

- File thực sự thay đổi.
- Cách Today/Planner được tái sử dụng, không nhân đôi logic/API.
- Kết quả từng kiểm tra ở trên.
- Viewport đã kiểm tra và lỗi chưa xác minh được.
- Chỉ dừng ở Prompt 2, không tự triển khai Note hoặc Dashboard chi tiết.

---

# TASK 40: Thiết kế lại visual Calendar Planner

## Vấn đề bản hiện tại

Calendar sau khi phóng to đang xấu hơn: mỗi ngày thành một card nhỏ có viền riêng, weekday thành các nút/pill, quá nhiều đường viền lặp, số ngày và marker quá bé, lịch cao nhưng không tạo thêm khả năng đọc.

## Hướng thiết kế mới

- Thiết kế Calendar như **một mặt lịch lớn**, không phải tập hợp các card nhỏ.
- Chỉ dùng một container chính với border/shadow của SketchTask.
- Header tháng/năm gọn, nút chuyển tháng cân đối.
- Weekday (`T2` đến `CN`) hiển thị dạng text phẳng trong một hàng, không border riêng từng ngày, không button/pill.
- Lưới ngày có đường phân cách nhẹ hoặc khoảng cách phẳng nhất quán; không tạo 42 shadow/card độc lập.
- Số ngày là thông tin chính, font đủ lớn và đặt nhất quán ở góc ô.
- Số lượng task là thông tin phụ rõ ràng, ví dụ `3 việc`, không biến thành nhiều chip nhỏ.
- Marker trạng thái tối đa 3 dấu/chấm có tooltip/aria-label; nếu nhiều hơn dùng `+N`, không xếp hàng loạt chip bé.
- Ngày hiện tại highlight bằng một vùng vàng/viền rõ nhưng không làm ô ngày phình bất thường.
- Ngày quá khứ muted; deadline quá hạn có dấu đỏ dễ nhận biết nhưng không phủ đỏ cả ô.
- Ngày thuộc tháng kế trước/kế sau hiển thị mờ hoặc ẩn theo pattern nhất quán, không cạnh tranh với tháng đang xem.

## Responsive

- Mobile 390px: lịch full width, ô ngày đủ vùng chạm, số ngày vẫn đọc được; không cuộn ngang.
- Tablet: tăng khoảng thở và kích thước số ngày vừa phải.
- Desktop: lịch tận dụng chiều rộng khả dụng, nhưng không kéo chiều cao quá lớn chỉ để “phóng to”. Có thể giới hạn max-width hợp lý và căn giữa.
- Không để header, Hộp chờ hoặc bottom navigation bị đẩy lệch.

## Giữ nguyên logic

- Không đổi click ngày, DayPlanView, nút quay lại, Hộp chờ hoặc khóa ngày quá khứ.
- Không đổi cách tính số lượng task và marker.
- Không thêm Quick Add vào lịch tháng.

## Kiểm tra bắt buộc

1. Đối chiếu mobile 390px với ảnh hiện tại: không còn weekday dạng nút và 42 card nổi rời nhau.
2. Số ngày, số task và marker đọc được ngay.
3. Ngày hiện tại, ngày quá khứ và deadline quá hạn phân biệt rõ.
4. Desktop 1280px tận dụng chiều rộng nhưng không quá cao.
5. Bấm ô ngày vẫn mở đúng DayPlanView.
6. Chạy `npx tsc --noEmit` và `npm run build` trong `client`.

Cập nhật `.agents/ANTIGRAVITY-REPORT.md` kèm ảnh UI sau khi sửa. Không báo PASS chỉ dựa trên compile/build.

---

# TASK 39: Tăng kích thước tấm lịch trong tab Kế hoạch

## Phạm vi

Chỉ chỉnh kích thước và layout visual của Calendar tháng trong Planner. Không thay đổi logic ngày quá khứ, Quick Add, Hộp chờ hoặc hierarchy cha/con.

## Yêu cầu

- Calendar phải chiếm toàn bộ chiều rộng khả dụng của vùng nội dung Planner, không bị co thành khối nhỏ.
- Desktop 1280px: lưới 7 cột rộng, ô ngày cao đủ để đọc số ngày, số lượng task và marker; tận dụng khoảng trống hai bên.
- Tablet 768px: lưới vẫn cân đối, ô ngày dễ bấm, không làm header hoặc Hộp chờ bị ép.
- Mobile khoảng 390px: giữ 7 cột vừa viewport, không phát sinh scroll ngang; tăng vùng chạm trong giới hạn hợp lý.
- Giữ khoảng cách nội bộ, typography và marker rõ ràng; không làm các marker chen chúc.
- Không thay đổi hành vi bấm ngày, DayPlanView, nút quay lại hoặc bộ lọc.
- Dùng token/layout hiện có, không thêm style mới không cần thiết.

## Kiểm tra

1. Kiểm tra desktop, tablet và mobile 390px.
2. Calendar chiếm đúng chiều rộng, không bị co hoặc tràn.
3. Các ô ngày, số lượng task và marker vẫn đọc được.
4. Ngày quá khứ, Hộp chờ và Quick Add giữ nguyên hành vi.
5. Chạy `npx tsc --noEmit` và `npm run build` trong `client`.

Cập nhật `.agents/ANTIGRAVITY-REPORT.md` bằng ảnh hoặc mô tả kiểm tra UI thực tế.

---

# TASK 38: Khóa Quick Add ở ngày quá khứ trong Planner

## Phạm vi

Bổ sung vào Planner Calendar và DayPlanView sau Task 37. Không thay đổi Today, Sổ tay hoặc dữ liệu task ngoài hành vi xem ngày quá khứ.

## Quy tắc ngày

- Ngày quá khứ vẫn có thể bấm để xem task.
- DayPlanView của ngày quá khứ phải ẩn hoàn toàn Quick Add và mọi lời mời tạo task.
- Ngày hôm nay và tương lai mới có Quick Add.
- Hộp chờ chọn ngày chỉ cho hôm nay và tương lai; ngày quá khứ disabled.
- Bỏ mọi action dạng `Dời sang ngày mai/ngày X`; chọn trực tiếp ngày trên mini calendar.

## Hiển thị task quá khứ

- Task chưa hoàn thành ở ngày quá khứ: nền muted, giảm tương phản, nhãn `Ngày đã qua` hoặc `Chưa xử lý`.
- Không dùng strikethrough cho task chưa hoàn thành vì dễ bị hiểu là đã xong.
- Task đã hoàn thành chỉ hiển thị `Đã xong`, không gạch title.
- Không đổi deadline scheduled thành quá hạn sai loại; chỉ deadline mới có trạng thái quá hạn.

## Kiểm tra

1. Bấm ngày quá khứ trên lịch: xem được task, không có Quick Add.
2. Bấm hôm nay/tương lai: Quick Add hoạt động bình thường.
3. Hộp chờ: ngày quá khứ không chọn được.
4. Task chưa xong ở ngày cũ có style muted/nhãn ngày qua.
5. Task đã xong không bị gạch ngang.
6. Kiểm tra mobile 390px, tablet và desktop.
7. Chạy `npx tsc --noEmit` và `npm run build` trong `client`.

Cập nhật `.agents/ANTIGRAVITY-REPORT.md` bằng kiểm tra UI thực tế.

---

# TASK 37: Làm lại visual Planner Calendar và Hộp chờ chọn ngày

## Phạm vi

Chỉ xử lý visual/lưu đồ của Planner Calendar và Hộp chờ. Không xử lý hierarchy cha/con trong task này.

## Planner Calendar

- Giữ Calendar-first nhưng thiết kế lại hoàn toàn phần hiển thị đang quá nhỏ, nhiều khoảng trống và marker chen chúc.
- Desktop/tablet tận dụng chiều rộng: lưới 7 cột cân đối, ô ngày rộng và cao hơn, số ngày nổi bật, khoảng cách thoáng.
- Header gọn: `Kế hoạch`, tháng/năm, nút tháng trước/sau và lối vào `Hộp chờ`.
- Không có chế độ theo tuần và không có nút `Hôm nay` riêng.
- Ngày hiện tại chỉ highlight nhẹ bằng viền/nền.
- Mỗi ô ngày chỉ hiển thị:
  - số ngày;
  - số lượng task;
  - tối đa vài marker trạng thái nhỏ.
- Không nhồi toàn bộ TaskCard vào ô lịch.
- Marker phải tối giản: scheduled sắp tới, deadline quá hạn, đã xong. Không để nhiều chấm màu cạnh nhau làm ô ngày rối.
- Ngày quá khứ bị muted; ngày có deadline quá hạn có dấu đỏ rõ nhưng không gây áp lực.
- Mobile 390px: giữ 7 cột, chỉ hiện số ngày/số lượng/marker; không cuộn ngang.
- Bấm ô ngày chuyển sang DayPlanView riêng; có nút `Quay lại lịch` và giữ đúng tháng đang xem.

## Hộp chờ

- Khi mở Hộp chờ, hiển thị danh sách task chưa quyết định ngày và một mini calendar để chọn ngày.
- Không hiển thị `Dời sang ngày mai`, `Dời sang ngày X` hoặc text tính toán ngày.
- Quy trình: chọn task -> bấm `Chọn ngày` -> chọn trực tiếp một ngày trên mini calendar -> task được gán ngày và rời Hộp chờ.
- Chỉ cho phép chọn từ hôm nay trở về sau.
- Toàn bộ ngày trước hôm nay phải disabled, không click được, có style muted và không thể thêm task vào quá khứ.
- Hôm nay và ngày tương lai được chọn bình thường.
- Nếu chọn ngày nhưng chưa chọn giờ, task chỉ có ngày; không tự gán scheduled/deadline.
- Mini calendar dùng custom CalendarMonth hiện có, không dùng native date input.

## Không phá logic

- Không thay đổi dữ liệu của task khác ngoài task đang được chọn trong Hộp chờ.
- Không đưa task có ngày nhưng chưa có giờ vào Hộp chờ.
- Không tự động sửa ngày/giờ của task con hoặc task cha.
- Giữ các bộ đếm và trạng thái deadline/scheduled hiện tại.

## Kiểm tra bắt buộc

1. Planner mở lên đẹp, thoáng trên desktop/tablet và không bị lưới bé trên mobile.
2. Bấm ngày mở đúng DayPlanView; nút quay lại hoạt động.
3. Hộp chờ mở mini calendar, không còn action `Dời sang...`.
4. Ngày quá khứ bị khóa hoàn toàn.
5. Chọn hôm nay và ngày tương lai gán đúng task.
6. Task sau khi gán ngày nhưng chưa có giờ không bị gán scheduled/deadline.
7. Kiểm tra mobile 390px, tablet 768px và desktop 1280px.
8. Chạy `npx tsc --noEmit` và `npm run build` trong `client`.

Cập nhật `.agents/ANTIGRAVITY-REPORT.md` bằng ảnh hoặc mô tả kiểm tra UI thực tế, không chỉ ghi PASS dựa trên compile/build.

---

# TASK 36: Thiết kế lại Planner theo hướng Calendar-first

## Phạm vi

Chỉ xử lý tab `Planner/Kế hoạch` và Quick Add được dùng bên trong Planner. Tạm thời không xử lý hierarchy cha/con, Task View, Today, Notification hoặc Journal.

## Màn hình mặc định: Lịch tháng

- Khi mở Planner, hiển thị lịch tháng làm nội dung chính, chiếm toàn bộ chiều rộng khả dụng.
- Header gồm tên `Kế hoạch`, tháng/năm hiện tại và nút chuyển tháng trước/sau.
- Bỏ chế độ `Theo tuần`.
- Bỏ nút `Hôm nay` riêng trong Planner. Ngày hiện tại vẫn được đánh dấu nhẹ bằng viền/nền, không phải một action button.
- Có nút/lối vào `Hộp chờ` riêng, hiển thị số lượng task chưa quyết định ngày nếu có.
- Không hiển thị Quick Add và danh sách task chi tiết cùng lúc trên màn hình lịch mặc định.

## Nội dung mỗi ô ngày

- Số ngày rõ ràng.
- Số lượng task của ngày.
- Chấm trạng thái nhỏ:
  - scheduled sắp tới: vàng.
  - deadline quá hạn: đỏ.
  - task đã hoàn thành: mint.
- Ngày đã qua làm mờ nhẹ; có deadline quá hạn thì vẫn có chấm đỏ.
- Desktop/tablet có thể hiển thị tối đa 2 dòng preview task và dòng `+N việc`.
- Mobile chỉ hiển thị số ngày, số lượng và chấm trạng thái để tránh chật.
- Không render toàn bộ TaskCard trong ô lịch.

## Khi bấm một ngày

- Chuyển từ CalendarView sang DayPlanView riêng cho ngày được chọn.
- Có header:
  - `Quay lại lịch`.
  - Ngày đầy đủ và số lượng task.
- Chỉ trong DayPlanView mới hiển thị:
  - Quick Add.
  - Bộ lọc cần thiết.
  - Danh sách toàn bộ task của ngày đó.
- Không để lịch tháng nằm phía sau hoặc cạnh danh sách task trên mobile.
- Quick Add trong DayPlanView tự gán ngày đang mở; không hiển thị dropdown chọn ngày.
- Khi quay lại, giữ nguyên tháng đang xem và ô ngày vừa chọn.

## Hộp chờ

- Task chưa quyết định ngày đi vào Hộp chờ qua lối vào riêng.
- Không dùng control chọn ngày trong Quick Add để mô phỏng Hộp chờ.
- Không tự đưa task có ngày nhưng chưa có giờ vào Hộp chờ.

## Responsive

- Desktop: lưới 7 cột rộng, mỗi ô đủ cao để xem số lượng và tối đa 2 preview.
- Tablet: giữ lưới 7 cột, giảm preview nếu thiếu không gian.
- Mobile khoảng 390px: lưới 7 cột gọn, bấm ngày chuyển toàn màn hình sang DayPlanView.
- Không để lịch bị cuộn ngang; chỉ phần nội dung ngày được cuộn dọc nếu danh sách dài.

## Không phá logic hiện tại

- Giữ cách phân loại scheduled/deadline và tính quá hạn hiện có.
- Giữ helper ngày/tháng và các token UI hiện có.
- Không tự đổi dữ liệu task chỉ vì thay đổi màn hình Planner.
- Không thêm tab mới hoặc native select/date control.

## Kiểm tra bắt buộc

1. Mở Planner mặc định thấy lịch tháng, không có view tuần và nút Hôm nay riêng.
2. Lịch hiển thị đúng số lượng task và marker trạng thái cho nhiều ngày.
3. Bấm ngày chuyển sang DayPlanView, có nút quay lại hoạt động.
4. Quick Add trong DayPlanView tự gán đúng ngày đang mở, không có dropdown ngày.
5. Task chưa quyết định ngày chỉ xuất hiện trong Hộp chờ.
6. Desktop, tablet và mobile 390px không tràn ngang.
7. Quay lại lịch giữ đúng tháng và ngày đang xem.
8. Chạy `npx tsc --noEmit` và `npm run build` trong `client`.

Cập nhật `.agents/ANTIGRAVITY-REPORT.md` bằng file thật sự sửa, ảnh hưởng logic Planner/Quick Add và kết quả kiểm tra UI trực tiếp. Không báo PASS chỉ dựa trên compile/build.

---

# TASK 35: Không ẩn Task cha khi Task con xuất hiện trong danh sách đã lọc

## Vấn đề thực tế

Trong ảnh kiểm tra Today, task con `dsfsd` đang hiển thị dòng `Con của: aaaaaaaa` nhưng task cha `aaaaaaaa` không xuất hiện. Nguyên nhân là `TaskList` gọi `groupTasksByHierarchy(tasks)` trên mảng đã lọc theo ngày/tab; parent nằm ngoài mảng nên child bị coi là orphan.

## Yêu cầu logic

- `TaskList`/helper hierarchy phải nhận thêm danh sách toàn bộ task hoặc một resolver parent từ store để tìm parent thật.
- Nếu child đang hiển thị mà parent có tồn tại trong toàn bộ store, phải hiển thị parent làm context phía trên child.
- Parent context có thể là:
  - TaskCard cha đầy đủ, có chevron mở/thu gọn; hoặc
  - Parent context card gọn, ghi rõ task cha và lý do `Task cha nằm ngoài bộ lọc hiện tại`.
- Child vẫn phải thụt vào, có connector và hiển thị đúng metadata của chính nó.
- Không hiển thị child như orphan khi parent chỉ bị loại bởi filter/ngày/tab.
- Chỉ khi parent không tồn tại trong toàn bộ store mới hiển thị `Công việc cha không còn tồn tại`.

## Không làm sai số liệu

- Parent được thêm chỉ để làm context không được cộng vào số lượng task của ngày/tab hiện tại.
- Không làm thay đổi progress count, overdue count, completed count hoặc bộ lọc hiện tại.
- Nếu parent nằm ở ngày khác, vẫn hiển thị dưới dạng context nhưng không chuyển parent sang ngày của child.
- Mở/thu gọn parent chỉ ảnh hưởng phần hierarchy, không thay đổi dữ liệu task.

## UI/UX

- Trên Today/Planner/Notebook, người dùng phải nhìn thấy mối quan hệ cha-con ngay lập tức.
- Mobile 390px: parent context không chiếm toàn bộ màn hình hoặc đẩy child ra ngoài; title dài được xuống dòng.
- Nếu parent ngoài filter, dùng badge nhẹ `Công việc cha` hoặc `Ngoài bộ lọc`, tránh màu cảnh báo đỏ.
- Không chỉ dựa vào màu; bắt buộc có connector/indent/label.
- Giữ click checkbox, sửa, xóa, dời ngày độc lập; không mở Task View ngoài ý muốn.

## Kiểm tra bắt buộc

1. Parent và child cùng xuất hiện trong Today: group hiển thị bình thường.
2. Child xuất hiện trong Today nhưng parent ở ngày khác: parent context vẫn xuất hiện, không cộng vào count Today.
3. Child xuất hiện trong filter nhưng parent bị loại bởi filter: không hiện orphan giả.
4. Parent bị xóa thật: child hiện `Công việc cha không còn tồn tại`.
5. Parent/child ở Notebook: vẫn group đúng.
6. Mở/thu gọn parent không mất child và không đổi dữ liệu.
7. Kiểm tra mobile 390px và desktop.
8. Chạy `npx tsc --noEmit` và `npm run build` trong `client`.

Cập nhật `.agents/ANTIGRAVITY-REPORT.md` bằng nguyên nhân, giải pháp parent context, ảnh hưởng bộ đếm và kết quả kiểm tra trực tiếp. Không báo PASS chỉ dựa trên compile/build.

---

# TASK 34: Hiển thị rõ quan hệ Task cha / Task con

## Mục tiêu

Người dùng phải nhìn danh sách là biết ngay task nào độc lập, task nào là task cha và task nào là task con. Không chỉ hiển thị quan hệ trong Task View.

## Logic dữ liệu

- Dùng `parentTaskId` làm nguồn sự thật duy nhất.
- Không dùng tag, notebook, màu hoặc vị trí ngẫu nhiên để suy đoán quan hệ.
- Task cha không tự động hoàn thành task con; giữ hành vi hoàn thành độc lập.
- Không cho task tự làm cha của chính nó hoặc tạo vòng lặp cha-con.

## Hiển thị trong danh sách

### Task cha

- Hiển thị như một task chính.
- Nếu có task con, hiển thị dòng phụ nhỏ: `N công việc con`.
- Có nút chevron để mở/thu gọn danh sách con.
- Trạng thái mở/thu gọn không làm mất dữ liệu task.

### Task con

- Hiển thị ngay dưới task cha khi nhóm đang mở.
- Thụt vào khoảng 20–28px.
- Có connector/đường dọc bên trái và nhãn nhẹ `Công việc con`.
- Vẫn giữ checkbox, lịch, tag và action của chính task con.
- Không làm title bị bóp quá hẹp trên mobile.

### Task độc lập

- Không thụt vào.
- Không có connector.
- Không hiện nhãn cha/con.

## Các context cần thống nhất

- Today task list.
- Planner task list và các nhóm theo ngày.
- Notebook task list.
- Notification/Overdue khi task con xuất hiện riêng.
- Search hoặc filter khi chỉ trả về task con.

Khi task con xuất hiện mà không có task cha bên cạnh, hiển thị metadata nhẹ `Con của: [Tên task cha]` nếu tìm thấy parent; nếu parent đã bị xóa, hiển thị `Công việc cha không còn tồn tại`.

## Kiến trúc đề xuất

- Tách helper/grouping dùng chung, ví dụ `TaskHierarchyGroup` hoặc `TaskListHierarchy`.
- Grouping nên nằm ở tầng list/orchestrator, không đặt toàn bộ logic hierarchy vào `TaskCard`.
- `TaskCard` nhận props tối thiểu như `depth`, `isParent`, `childCount`, `isExpanded`, `onToggleExpand`.
- Tái sử dụng TaskCard hiện có, không copy một card mới cho từng tab.

## UI/UX

- Không chỉ dùng màu để phân biệt; bắt buộc có thụt lề, connector, nhãn hoặc số lượng.
- Mobile khoảng 390px: connector không che checkbox, action không đẩy title vỡ dòng.
- Desktop: hierarchy dễ quét, không tạo khoảng trắng quá lớn.
- Giữ style SketchTask hiện có, border mực và hard shadow; không thêm emoji hoặc native control.

## Kiểm tra bắt buộc

1. Task độc lập hiển thị không có connector.
2. Task cha có 1, 2 và nhiều task con hiển thị đúng số lượng.
3. Mở/thu gọn task cha hoạt động đúng.
4. Task con có thể hoàn thành độc lập.
5. Task con hiển thị đúng dưới task cha ở Today, Planner và Notebook.
6. Task con trong Notification/Search hiển thị `Con của: ...`.
7. Parent bị xóa không làm crash UI.
8. Kiểm tra mobile 390px và desktop.
9. Chạy `npx tsc --noEmit` và `npm run build` trong `client`.

Cập nhật `.agents/ANTIGRAVITY-REPORT.md` với file thật sự sửa, cách grouping, trạng thái mở/thu gọn và kết quả từng case. Không báo PASS nếu chưa kiểm tra UI trực tiếp.

---

# TASK 33: Đồng bộ Quick Add với modal Sửa theo từng context

## Mục tiêu

Quick Add phải có cùng ngôn ngữ và hierarchy với modal `Chỉnh sửa công việc`, nhưng không dùng một giao diện cứng cho mọi tab. Tạo phần nội thất dùng chung nếu phù hợp, truyền `context` để bật/tắt đúng control.

## Context Hôm Nay

- Giữ ngày tự động là hôm nay; không hiển thị dropdown/chip chọn ngày trong Quick Add.
- Giao diện mặc định chỉ gồm textarea nội dung và nút `+`.
- Khi mở `Thêm chi tiết`, hiển thị theo thứ tự gọn:
  1. Nhãn/Tag.
  2. Cuốn sổ.
  3. Thiết lập thời gian: chỉ các lựa chọn giờ, không có ngày.
  4. `Giờ hẹn` và `Giờ chót` nằm cạnh nhau khi chưa chọn loại; chọn một loại thì loại còn lại ẩn.
  5. Mức độ ưu tiên.
- Task tạo ở Hôm Nay không có giờ vẫn lưu ngày hôm nay nhưng không tự gán scheduled/deadline.

## Context Sổ tay

- Composer phải nhận biết cuốn sổ hiện tại; không cần hiển thị lại dropdown chọn sổ nếu task chắc chắn thuộc cuốn sổ đó.
- Có thể tạo task chưa quyết định ngày; trạng thái đó lưu vào Hộp chờ của Planner.
- Trong phần chi tiết, hiển thị control `Ngày` riêng:
  - Có ngày: hiển thị ngày đã chọn.
  - Chưa có ngày: `Chưa thiết lập ngày`.
  - Bấm mở CalendarMonth để chọn ngày; không tự gán ngày hôm nay chỉ vì mở form.
- `Giờ hẹn` và `Giờ chót` dùng cùng quy tắc conditional như modal Sửa và dùng TimeSliderAdjuster dạng thanh kéo ngang.
- Nếu chọn giờ khi chưa có ngày, yêu cầu người dùng chọn ngày trước hoặc hiển thị cảnh báo rõ ràng; không âm thầm dùng ngày hôm nay.
- Tag và ưu tiên nằm trong phần chi tiết, tránh làm composer mặc định phình to.

## Context Planner

- Giữ ngày đang chọn làm ngày mặc định của task.
- Không phá flow chọn `Chưa sắp lịch` hiện tại.
- Nếu mở chi tiết ngày, vẫn tách riêng ngày và giờ như modal Sửa.

## Quy tắc dùng chung

- Tái sử dụng component UI đã có; không copy một bản Quick Add riêng cho mỗi tab.
- Có thể tách nội thất như `QuickAddContent`, `QuickAddMetadata`, `QuickAddSchedule` và để component context điều phối.
- Không dùng native select/date/time control.
- Nút `+` cân đối với textarea; tag/sổ/priority không được làm lệch chiều cao.
- Không hiển thị ngày ISO raw.
- Không thêm emoji, gradient hoặc style ngoài token SketchTask.
- Giữ khóa scroll nền và picker con có scroll nội bộ nếu mở sheet.

## Kiểm tra bắt buộc

1. Hôm Nay: Quick Add mặc định không có control ngày, tạo task lưu đúng ngày hôm nay.
2. Hôm Nay: mở chi tiết, chọn giờ hẹn bằng slider => không sinh deadline.
3. Hôm Nay: mở chi tiết, chọn giờ chót bằng slider => không sinh scheduled.
4. Sổ tay: task mới chưa ngày => vào Hộp chờ; không tự gán hôm nay.
5. Sổ tay: chọn ngày rồi chọn giờ hẹn/hạn => lưu đúng mode và ngày.
6. Planner: ngày đang chọn và flow cũ vẫn hoạt động.
7. Mobile 390px: composer không phình ngang/dọc bất thường, picker không làm nền cuộn.
8. Chạy `npx tsc --noEmit` và `npm run build` trong `client`.

Cập nhật `.agents/ANTIGRAVITY-REPORT.md` với file thật sự sửa, khác biệt từng context và kết quả kiểm tra. Không báo PASS nếu chưa kiểm tra giao diện trực tiếp.

---

# TASK 32: Sửa Task View theo giao diện thực tế trên mobile

## Phạm vi

Sửa trực tiếp giao diện `TaskDetailModal` theo ảnh kiểm tra thực tế mobile khoảng 390px. Không chỉ kiểm tra code hoặc báo cáo; phải mở app và đối chiếu UI sau khi sửa.

## Các vấn đề thấy rõ trong giao diện hiện tại

- Khối thời gian đang hiển thị ngày dạng raw ISO `2026-08-30`, không thân thiện với người dùng.
- `Lịch hẹn diễn ra` đang gộp giờ và ngày trong một dòng, khó quét nhanh.
- Các metadata `Mức độ`, `Sổ tay`, `Nhãn` đang thành nhiều card ngang có chiều cao và cách căn chỉnh chưa đồng nhất.
- Task View nhìn giống một form dữ liệu hơn là một màn hình xem nhanh; thứ bậc giữa nội dung chính và metadata chưa đủ rõ.
- Cần kiểm tra lại chiều cao sheet, khoảng trắng, footer và khả năng cuộn khi title dài hoặc có đủ metadata.

## Yêu cầu giao diện

1. Header mobile giữ grab handle, trạng thái task và nút `Chỉnh sửa`; không thêm nút X desktop-style trên mobile.
2. Tên task là vùng nổi bật nhất, cho phép xuống dòng tự nhiên.
3. Khối thời gian phải hiển thị theo cấu trúc rõ ràng:
   - Scheduled:
     - Nhãn `Lịch hẹn`.
     - Dòng `Ngày hẹn: 30/08/2026`.
     - Dòng `Giờ hẹn: 09:30 - 10:00`.
   - Deadline:
     - Nhãn `Hạn hoàn thành`.
     - Dòng `Ngày hạn: 30/08/2026`.
     - Dòng `Giờ hạn: 18:00`.
   - Có ngày nhưng chưa có giờ: hiển thị ngày và `Chưa chọn giờ`.
   - Chưa có ngày: `Chưa thiết lập ngày`.
4. Không được hiển thị ngày ISO raw. Dùng helper format ngày hiện có.
5. Metadata hiển thị thành các hàng compact, không để các box có kích thước lệch:
   - `Mức độ` + giá trị.
   - `Sổ tay` + giá trị.
   - `Nhãn` + giá trị.
   - `Công việc cha` chỉ hiển thị nếu đã có quan hệ subtask.
6. Không lặp lại thông tin lịch trong metadata.
7. Footer gọn, rõ, luôn thao tác được; nội dung dài chỉ cuộn ở phần thân sheet.
8. Giữ style SketchTask hiện có: border mực, hard shadow, màu token; không thêm emoji, gradient hoặc native control.

## Logic hiển thị cần xác minh

- Ngày scheduled phải lấy từ ngày scheduled, không lấy nhầm `deadlineDate`.
- Ngày deadline phải lấy `deadlineDate`, fallback `dueDate` chỉ khi đúng mode.
- Scheduled đã qua chỉ hiện trạng thái `Lịch hẹn đã qua`, không đổi thành quá hạn.
- Deadline quá hạn vẫn hiện trạng thái đỏ nhẹ.
- Task hoàn thành không dùng strikethrough.

## Kiểm tra bắt buộc

1. Mở Task View trên mobile 390px với task scheduled có ngày + khoảng giờ như ảnh.
2. Mở task deadline có ngày + giờ.
3. Mở task có ngày nhưng chưa có giờ.
4. Mở task chưa quyết định ngày.
5. Mở task có đủ sổ, tag, ưu tiên và công việc cha; metadata không làm sheet phình bất thường.
6. Mở task title dài nhiều dòng; footer vẫn dùng được và không có scroll nền.
7. Kiểm tra desktop không bị biến thành mobile sheet.
8. Chạy `npx tsc --noEmit` và `npm run build` trong `client`.

Cập nhật `.agents/ANTIGRAVITY-REPORT.md` bằng ảnh/chụp kiểm tra thực tế hoặc mô tả viewport đã kiểm tra. Không chỉ ghi PASS dựa trên compile/build.

---

# TASK 31: Cập nhật Task View và TaskCard

## Phạm vi

Chỉ cập nhật giao diện xem chi tiết task và thẻ task hiển thị bên ngoài. Không đổi logic tạo task, lịch, notification, Journal hoặc các tab khác ngoài việc thay component dùng chung.

## 1. Hợp nhất Task View

Hiện có hai file `TaskDetailModal`:

- `client/src/components/features/shared/TaskDetailModal.tsx`
- `client/src/components/ui/overlays/TaskDetailModal.tsx`

Chọn một component canonical duy nhất phù hợp với kiến trúc `features/shared` + `ui/overlays`, sau đó re-export hoặc cập nhật import để mọi nơi dùng cùng một giao diện. Không được để hai modal tiếp tục lệch hành vi.

Task View cần có hierarchy:

1. Header trạng thái task và nút `Chỉnh sửa`.
2. Tên/nội dung task là phần nổi bật nhất.
3. Thông tin thời gian:
   - Scheduled: ngày hẹn, giờ hẹn, giờ kết thúc nếu có.
   - Deadline: ngày hạn, giờ hạn.
   - Có ngày nhưng chưa có giờ: hiển thị ngày và `Chưa chọn giờ`.
   - Chưa quyết định ngày: `Chưa thiết lập ngày`.
4. Metadata gọn: sổ, nhãn, mức độ ưu tiên.
5. Thời điểm tạo đặt ở cuối, giảm nhấn mạnh và định dạng dễ đọc theo locale.
6. Footer: `Đóng` và `Chỉnh sửa` rõ ràng, không lặp nút ở nhiều vị trí.

Không dùng gạch ngang tên task khi hoàn thành. Trạng thái hoàn thành dùng badge/nền muted theo pattern hiện có.

## 2. Tinh gọn TaskCard bên ngoài

- Ưu tiên theo thứ tự: checkbox, tiêu đề, trạng thái/lịch chính, metadata phụ, hành động.
- Không hiển thị lặp cùng lúc ngày đầy đủ và ngày trong chip nếu đang ở Today.
- Chỉ hiển thị một chip thời gian chính:
  - `Lịch hẹn 09:00` cho scheduled.
  - `Hạn 18:00` cho deadline.
  - `Chưa sắp lịch` cho task trong Hộp chờ.
- Ngày chỉ xuất hiện khi context cần, ví dụ Planner/Notification; Today không lặp lại `Hôm nay`.
- Tag và sổ chỉ hiển thị khi có dữ liệu; giới hạn chiều rộng và cắt chữ an toàn.
- Ưu tiên chỉ hiển thị khi khác mặc định hoặc theo pattern hiện có, không để card phình do metadata.
- Giữ nền đỏ nhẹ cho deadline quá hạn, nền muted cho scheduled đã qua, nền muted nhẹ cho task đã xong.
- Không dùng strikethrough cho task đã xong.
- Desktop hiển thị action cần thiết; mobile gom action phụ vào menu, không làm tiêu đề bị bóp quá hẹp.
- Click vào vùng card mở Task View; click checkbox/action không được mở Task View ngoài ý muốn.

## 3. Responsive và kiến trúc

- Mobile Task View là Bottom Sheet; desktop là modal giữa màn hình.
- Nội dung dài cuộn nội bộ, khóa scroll nền.
- Dùng component badge/metadata dùng chung nếu đã có; không copy một phiên bản riêng cho từng tab.
- Giữ token, border mực và hard-offset shadow trong `.design`; không thêm emoji, gradient, pill hoặc native control.

## Kiểm tra bắt buộc

1. Mở Task View từ Today, Planner, Notebooks, Journal và Notification: cùng một giao diện.
2. Task scheduled, deadline, chỉ có ngày, chưa quyết định ngày, đã xong, quá hạn và scheduled đã qua.
3. Card mobile 390px không làm vỡ tiêu đề hoặc chip.
4. Card desktop action không che nội dung.
5. Click card mở view; click checkbox, sửa, xóa, dời ngày không mở view ngoài ý muốn.
6. Không còn hai implementation TaskDetailModal lệch nhau.
7. Chạy `npx tsc --noEmit` và `npm run build` trong `client`.

Cập nhật `.agents/ANTIGRAVITY-REPORT.md` bằng file thật sự đã sửa, quyết định component canonical, ảnh hưởng từng nơi dùng TaskCard/TaskView và kết quả kiểm tra. Không báo PASS nếu chưa kiểm tra trực tiếp.

---

## Previous Current Task (Archived)

## CURRENT TASK: Fix Today overdue count và Notification mobile width

Đọc trước khi sửa: `AGENTS.md`, `.design/README.md`, `.design/CURRENT-STATE.md`, `.design/PRINCIPLES.md`, `.design/TOKENS.md`, `.design/COMPONENTS.md`, `.docs/FEATURES.md` và Task 25 trong `.agents/ANTIGRAVITY-REPORT.md`.

Đây là task sửa lỗi rất nhỏ, chỉ xử lý hai vấn đề dưới đây. Không chỉnh TaskCard, Planner Calendar, Quick-Add, Picker hoặc flow `Chưa sắp lịch`.

### 1. Sửa `overdueCount` của Today

Trong `TodayTab.tsx`, `overdueCount` hiện đang đếm mọi task chưa hoàn thành có ngày nhỏ hơn hôm nay. Điều này làm scheduled đã qua bị tính nhầm là quá hạn.

Logic đúng:

- Chỉ task chưa hoàn thành.
- Chỉ task dạng `deadline` hoặc legacy `task` có ngày deadline nhỏ hơn hôm nay.
- Scheduled/event đã qua không được tính vào `overdueCount`.
- Scheduled/event đã qua chỉ thuộc nhóm `Lịch hẹn đã qua` trong Notification.
- Giữ nguyên shortcut Today và hành vi mở Notification vào tab `overdue`.
- Không thay đổi dữ liệu task hoặc cách tính `todayList`.

Kiểm tra các trường hợp:

```text
deadline 17/08 chưa xong -> overdueCount +1
scheduled 17/08 chưa xong -> overdueCount không tăng
deadline hôm nay -> không quá hạn
task đã xong dù ngày cũ -> không tăng
```

### 2. Sửa kích thước Notification panel mobile

Kiểm tra trực tiếp trên viewport mobile khoảng 390px. Panel đang có dấu hiệu không phủ hết chiều ngang và để lộ Planner phía bên phải dù class có `w-full`.

- Tìm nguyên nhân ở wrapper fixed, parent flex, width/max-width, scrollbar hoặc CSS breakpoint.
- Mobile panel phải phủ đúng toàn bộ chiều ngang viewport, không để lộ phần app phía sau ở hai bên.
- Không làm thay đổi panel desktop/tablet đang là popover gọn.
- Giữ backdrop, khóa scroll nền, grab handle, nút đóng và các tab hiện có.
- Các tab `Tất cả`, `Chưa đọc`, `Quá hạn`, `Lịch hẹn đã qua` phải đọc được đầy đủ; nếu thiếu chỗ thì dùng cuộn ngang có chủ đích.
- Không dùng native select và không đổi logic notification.

### 3. Kiểm tra bắt buộc

1. Today chỉ đếm deadline quá hạn, không đếm scheduled đã qua.
2. Notification vẫn tách đúng `Quá hạn` và `Lịch hẹn đã qua`.
3. Notification mobile ở 390px phủ hết chiều ngang, không lộ Planner phía sau.
4. Notification tablet 768px và desktop 1280px vẫn giữ popover/modal phù hợp.
5. Chạy `npx tsc --noEmit` và `npm run build` trong `client`.

Cập nhật `.agents/ANTIGRAVITY-REPORT.md` bằng cách thêm task mới, ghi nguyên nhân, file đã sửa, kết quả kiểm tra 4 case overdue và 3 viewport. Không xóa lịch sử.

---

## Previous Current Task (Archived)

## CURRENT TASK: Sửa các lỗi UX/UI mobile và logic cảnh báo task

Đọc trước khi sửa: `AGENTS.md`, `.design/README.md`, `.design/CURRENT-STATE.md`, `.design/PRINCIPLES.md`, `.design/TOKENS.md`, `.design/COMPONENTS.md`, `.docs/FEATURES.md` và báo cáo mới nhất trong `.agents/`.

Đây là task sửa lỗi có phạm vi giới hạn. Không redesign Picker thời gian, không thay đổi flow tạo task `Chưa sắp lịch`, không thay đổi cơ chế hoàn thành task đã chốt ở task trước nếu không liên quan trực tiếp đến các lỗi dưới đây.

### 1. Panel Thông báo trên mobile

- Panel phải rộng theo viewport mobile, không để lộ một dải nội dung Planner ở bên phải.
- Không bị cắt tab `Lịch hẹn đã qua`.
- Có thể dùng full-width mobile sheet hoặc panel chiếm toàn bộ chiều ngang, nhưng phải giữ header và nút đóng dễ chạm.
- Filter `Tất cả`, `Chưa đọc`, `Quá hạn`, `Lịch hẹn đã qua` phải hiển thị đầy đủ; nếu không đủ chỗ thì cho cuộn ngang có chủ đích hoặc chia thành layout phù hợp, không cắt chữ.
- Nền phía sau phải bị khóa cuộn khi panel mở.
- Tách thị giác giữa:
  - `Cảnh báo công việc`: Quá hạn, Lịch hẹn đã qua.
  - `Thông báo hệ thống`: offline, quyền thông báo, cập nhật.
- Không dùng emoji trong icon UI nếu đã có Lucide icon tương ứng.
- Desktop vẫn giữ panel gọn, không biến thành full-screen nếu không cần.

### 2. Task Card mobile

- Trên mobile không hiển thị đồng thời ba nút `Dời`, `Sửa`, `Xóa` nếu làm title bị ép hẹp.
- Gom các thao tác phụ vào nút `...` hoặc menu hành động gọn; thao tác phải có label accessible và không mở nhầm TaskDetailModal.
- Giữ `ArrowRight` cho thao tác dời ngày.
- Title được ưu tiên chiều rộng và vẫn line-clamp đúng quy chuẩn.
- Chip thời gian không được gãy giữa chừng thành dạng `09:30 -` rồi xuống dòng `10:00`; cho phép chip tự xuống dòng theo khối hoặc rút micro-copy hợp lý.
- Card ít metadata không được tạo khoảng trống bất thường; card nhiều metadata vẫn không vượt quá mức cần thiết.
- Mobile giữ touch target tối thiểu khoảng 36px.
- Desktop có thể giữ action buttons trực tiếp nếu không gây chật.

### 3. Logic Quá hạn và Tab Hôm nay

- Tab Hôm nay không render toàn bộ danh sách task quá hạn nếu cảnh báo đã thuộc khu vực Thông báo.
- Nếu có task quá hạn, Today chỉ hiển thị shortcut gọn:

```text
2 việc cần xử lý → Xem trong Thông báo
```

- Bấm shortcut mở đúng nhóm `Quá hạn` trong NotificationBell/panel.
- Không tạo task trùng và không làm thay đổi dữ liệu task khi chuyển nơi hiển thị.
- Task deadline quá hạn, chưa hoàn thành: hiển thị nền hồng/đỏ rất nhạt, viền rose và badge `Quá hạn`.
- Task scheduled đã qua: dùng muted và badge `Đã qua lịch`, không dùng trạng thái `Quá hạn`.
- Task đã hoàn thành không được ửng đỏ dù ngày cũ hoặc deadline cũ.

### 4. Cân lại Quick-Add

- Nút `+` phải cùng chiều cao và baseline với ô nhập.
- Không để nút `+` cao/to hơn input khi input có placeholder hai dòng.
- Mục tiêu khoảng 38-40px ở mobile/desktop, không nhỏ hơn vùng chạm tối thiểu 36px.
- Icon `Plus` khoảng 20-22px; giữ hard shadow và tactile feedback.
- Không làm hỏng wrap của placeholder hoặc nút `+ Thêm chi tiết`.

### 5. Planner và Hộp việc chưa sắp lịch

- Ngày đã qua trên Month View và Week View dùng muted/opacity vừa phải, vẫn bấm chọn được.
- Ngày có deadline quá hạn chỉ thêm chấm đỏ nhỏ cạnh số lượng task; không tô đỏ cả ngày.
- Ngày chỉ có lịch hẹn đã qua không dùng chấm đỏ.
- Header ngày đang chọn không phình thông tin; ưu tiên một dòng tổng quan như `18 việc · 2 đã xong`, chi tiết phụ chỉ hiện khi cần.
- `Việc chưa xếp lịch` mặc định thu gọn, chỉ hiện tên và số lượng.
- Khi mở, dùng drawer/panel nhỏ có scroll nội bộ; không chiếm toàn màn hình mobile nếu không cần.
- Mỗi item backlog chỉ cần title, metadata chính và nút `Xếp vào DD/MM`.
- Xếp lịch không được mất title, tag, notebook, priority hoặc thời gian hợp lệ.
- Empty state rõ ràng khi không còn việc chờ xếp lịch.

### 6. Kiểm tra bắt buộc

Kiểm tra tối thiểu ở viewport mobile 390px, tablet 768px và desktop 1280px:

1. Mở NotificationBell: panel không bị hẹp/cắt tab và nền không cuộn.
2. Notification tách rõ cảnh báo task và thông báo hệ thống.
3. Today có task quá hạn: chỉ có shortcut, không lặp danh sách.
4. Task deadline quá hạn ửng đỏ nhẹ; scheduled quá ngày hiển thị `Đã qua lịch`; task hoàn thành không đỏ.
5. Task Card mobile không bị title/chip ép bởi action buttons.
6. Quick-Add: nút `+` cân với ô nhập.
7. Planner: ngày cũ muted, ngày có deadline quá hạn có chấm đỏ.
8. Backlog đóng/mở được, xếp lịch không mất metadata.
9. Kiểm tra không còn native `<select>`, `<input type="date">`, `<input type="time">` trong phạm vi sửa.
10. Chạy `npx tsc --noEmit` và `npm run build` trong `client`.

Cập nhật `.agents/ANTIGRAVITY-REPORT.md` bằng cách thêm task mới, ghi file đã sửa, các viewport đã kiểm tra, case logic đã kiểm tra và vấn đề chưa thể xác nhận trực quan. Không xóa lịch sử.

---

## Previous Current Task (Archived)

## CURRENT TASK: Bổ sung flow tạo task “Chưa sắp lịch”

Đọc trước khi sửa: `AGENTS.md`, `.design/README.md`, `.design/CURRENT-STATE.md`, `.design/PRINCIPLES.md`, `.design/TOKENS.md`, `.design/COMPONENTS.md`, `.docs/FEATURES.md` và báo cáo mới nhất trong `.agents/`.

### Mục tiêu duy nhất

Hiện tại Quick-Add luôn tự gán ngày nên Hộp việc chờ lên lịch không có flow tạo dữ liệu rõ ràng. Bổ sung lựa chọn `Chưa sắp lịch` mà không làm mất hành vi mặc định hiện tại.

### Hành vi theo ngữ cảnh

- Today mặc định tạo task vào hôm nay.
- Planner mặc định tạo task vào `selectedDate` đang chọn.
- Sổ tay mặc định tạo task chưa sắp lịch nếu flow hiện tại của Sổ tay không có ngày.
- Người dùng có thể chủ động chọn `Chưa sắp lịch` trong Quick-Add.

### UI/UX bắt buộc

- Trong Quick-Add, thêm một control nhỏ dạng custom dropdown, không dùng native `<select>`:

```text
Ngày: 30/08 ▼
```

- Các lựa chọn tối thiểu:
  - `Ngày đang chọn` hoặc ngày cụ thể hiện tại.
  - `Hôm nay` nếu phù hợp với ngữ cảnh.
  - `Ngày mai` nếu phù hợp với ngữ cảnh.
  - `Chưa sắp lịch`.
- Không bung nhiều chip hoặc thêm một panel lớn mặc định.
- Khi chưa chọn ngày, hiển thị micro-copy gọn `Chưa sắp lịch`.
- Khi đã chọn giờ hẹn/hạn chót, không cho lưu thành task chưa sắp lịch nếu điều đó làm mất dữ liệu; cần hiển thị hướng dẫn ngắn rằng phải xóa thời gian trước.
- Nếu chọn `Chưa sắp lịch` trước khi chọn giờ, ẩn hoặc disable picker thời gian để tránh trạng thái mâu thuẫn.

### Quy tắc dữ liệu

Khi tạo task ở trạng thái `Chưa sắp lịch`, phải lưu:

```ts
dueDate: undefined
deadlineDate: undefined
startTime: undefined
endTime: undefined
deadlineTime: undefined
```

- Giữ nguyên title, tag, notebook và priority.
- Không tạo task trùng và không tự gán ngày hiện tại trong store/backend.
- Không sửa schema nếu không cần; tương thích với task cũ.
- Hộp `Việc chưa sắp lịch` chỉ lấy task chưa hoàn thành khi tất cả trường ngày/giờ ở trên đều rỗng.
- Khi task được xếp vào một ngày từ Backlog, chỉ đổi ngày cần thiết và giữ metadata còn lại.

### Kiểm tra bắt buộc

1. Quick-Add Today mặc định vẫn tạo task hôm nay.
2. Quick-Add Planner mặc định vẫn tạo task vào ngày đang chọn.
3. Chọn `Chưa sắp lịch` tạo task không có `dueDate`, `deadlineDate` hoặc trường giờ.
4. Task mới xuất hiện trong Hộp việc chưa sắp lịch.
5. Xếp task từ Hộp việc vào ngày đang chọn thì task biến mất khỏi hộp và xuất hiện đúng ngày.
6. Task chưa sắp lịch vẫn giữ title, tag, notebook và priority.
7. Không có native select/date/time control.
8. Chạy `npx tsc --noEmit` và `npm run build` trong `client`.

Cập nhật `.agents/ANTIGRAVITY-REPORT.md` bằng cách thêm mục mới, ghi rõ flow từng ngữ cảnh, payload trước/sau, file đã sửa và kết quả kiểm tra. Không xóa lịch sử.

---

## Previous Current Task (Archived)

## CURRENT TASK: Tối ưu Planner Calendar, Quá hạn, Filter và Hộp việc chờ lịch

Đọc trước khi sửa: `AGENTS.md`, `.design/README.md`, `.design/CURRENT-STATE.md`, `.design/PRINCIPLES.md`, `.design/TOKENS.md`, `.design/COMPONENTS.md`, `.docs/FEATURES.md` và báo cáo mới nhất trong `.agents/`.

Đây là task UX/UI giới hạn trong Planner và khu vực Thông báo. Không tạo hoặc giữ một tab Quá hạn riêng trong navigation. Không redesign TodayTab, Picker hoặc cơ chế hoàn thành task đã xử lý ở task trước.

### 1. Calendar Planner

- Ngày đã qua so với hôm nay phải được làm mờ vừa phải, vẫn đủ tương phản và vẫn bấm chọn được.
- Không tô đỏ toàn bộ ngày đã qua.
- Nếu ngày có deadline chưa hoàn thành và đã quá ngày, thêm chấm đỏ nhỏ cạnh số lượng task.
- Nếu ngày chỉ có lịch hẹn đã qua nhưng không có deadline quá hạn, không dùng chấm đỏ; chỉ giữ muted và có thể dùng chấm xám nhẹ.
- Ngày hôm nay vẫn highlight vàng; ngày đang chọn vẫn có border/shadow rõ ràng.
- Số lượng trên ngày là tổng task, không tạo nhiều badge làm lịch phình to.
- Tooltip/aria-label của ngày nên rõ, ví dụ `17/08, 3 việc, 1 quá hạn`.
- Áp dụng nhất quán cho Month View và Week View, không vỡ layout tablet/mobile.

### 2. Khu vực Thông báo: nhóm Quá hạn và Lịch hẹn đã qua

- Phân tích notification UI hiện tại trước. Quá hạn là một nhóm trong khu vực Thông báo, không phải tab điều hướng độc lập.
- Nếu source đang có `OverdueTab`, chuyển logic hiển thị cần thiết vào notification panel/page phù hợp, giữ tương thích route nếu cần nhưng không thêm vào bottom navigation.
- Khu vực Thông báo nên có nhóm hoặc filter rõ: `Tất cả`, `Chưa đọc`, `Quá hạn`, `Lịch hẹn đã qua`.
- Nhóm `Quá hạn` task theo ngày deadline thực tế.
- Mỗi nhóm có header rõ ràng, ví dụ `17/08/2026 · Quá hạn 3 ngày · 2 việc`.
- Sắp xếp nhóm nhất quán từ ngày cũ nhất đến gần nhất hoặc ngược lại, ghi rõ lựa chọn trong report.
- Trong mỗi nhóm, giữ thứ tự task ổn định.
- Scheduled đã qua lịch nằm trong nhóm `Lịch hẹn đã qua`, không đưa vào `Quá hạn` nếu không có deadline.
- Task đã hoàn thành không xuất hiện trong danh sách Quá hạn.
- Không lặp lại ngày trên từng card nếu header nhóm đã có ngày.
- Có empty state riêng cho từng nhóm nếu không có cảnh báo.
- Bấm notification phải mở task detail hoặc đưa người dùng đến đúng ngày trong Planner.
- Badge trên icon chuông hiển thị số cảnh báo chưa xử lý, không nhất thiết là tổng task quá hạn.

### 3. Filter Planner

- Hàng filter chính phải gọn, không render toàn bộ sổ tay/nhãn thành chip hoặc button cùng lúc.
- `Sổ tay` mở bằng custom dropdown với `Tất cả sổ tay`, `Không thuộc sổ tay` và các sổ tay hiện có.
- `Nhãn` mở bằng custom dropdown với `Tất cả nhãn`, `Không gắn nhãn` và các nhãn hiện có.
- Dropdown có đóng/mở, focus, keyboard, empty; danh sách dài cuộn trong panel riêng.
- Khi active, nút hiển thị trạng thái hoặc số lượng filter; không bung lựa chọn ra ngoài.
- Không dùng native `<select>` và không làm Planner phình chiều cao trên mobile.

### 4. Hộp việc chờ lên lịch

Trước khi sửa, kiểm tra `PlannerBacklog` và ghi ngắn trong report:

- Task nào được đưa vào hộp.
- Hộp mở ở đâu và có khóa scroll hay không.
- Khi bấm xếp lịch, task được cập nhật vào ngày nào.
- Có nguy cơ task biến mất, nhân bản hoặc mất metadata hay không.

Sau đó tối ưu:

- Mặc định thu gọn, chỉ hiện `Việc chưa xếp lịch` và số lượng.
- Khi mở dùng drawer/panel nhỏ, không chiếm toàn bộ màn hình nếu không cần.
- Mỗi task có title, notebook/tag chính và nút `Xếp vào DD/MM` theo ngày đang chọn.
- Bấm xếp lịch chỉ đổi ngày, giữ title, tag, notebook, priority và thời gian hợp lệ.
- Xếp thành công thì task biến mất khỏi backlog và xuất hiện ở ngày đang chọn.
- Có empty state `Không còn việc chờ xếp lịch`.
- Danh sách dài chỉ cuộn bên trong panel, không khóa trang chính ngoài thời gian modal/panel cần thiết.

### 5. Icon dời ngày

- Đổi icon lịch của nút dời task sang icon `ArrowRight` từ Lucide.
- Giữ nguyên label accessible: Today là `Dời sang ngày mai`, Planner là `Dời sang DD/MM`.
- Không đổi icon của nút mở lịch hoặc picker thời gian ở nơi khác.

### 6. Kiểm tra bắt buộc

1. Ngày cũ được làm mờ; ngày có deadline quá hạn có chấm đỏ.
2. Ngày cũ chỉ có lịch hẹn không bị tô đỏ toàn bộ.
3. Thông báo có nhóm Quá hạn và Lịch hẹn đã qua; Quá hạn được nhóm theo ngày, không trộn scheduled.
4. Filter Sổ tay/Nhãn là custom dropdown, không làm phình layout.
5. Backlog đóng/mở được; xếp task không mất metadata.
6. Nút dời task hiển thị `ArrowRight` và vẫn dời đúng ngày.
7. Kiểm tra mobile/tablet/desktop.
8. Chạy `npx tsc --noEmit` và `npm run build` trong `client`.

Cập nhật `.agents/ANTIGRAVITY-REPORT.md` bằng cách thêm mục mới, ghi file đã sửa, phân tích backlog, case kiểm tra và vấn đề còn lại. Không xóa lịch sử.

---

## Previous Current Task (Archived)

## CURRENT TASK: Sửa logic “Dời sang ngày kế tiếp”

Đọc trước khi sửa: `AGENTS.md`, `.design/README.md`, `.design/CURRENT-STATE.md`, `.design/PRINCIPLES.md`, `.design/TOKENS.md`, `.design/COMPONENTS.md` và `.docs/FEATURES.md`.

### Mục tiêu duy nhất

Sửa riêng thao tác dời task sang ngày kế tiếp. Không chỉnh trạng thái quá hạn, giao diện lịch, hộp việc chưa xếp lịch hoặc cách đánh dấu hoàn thành trong task này.

### Logic bắt buộc

- Trong Tab Hôm nay, nếu task thuộc hôm nay, nút có thể hiển thị `Dời sang ngày mai`.
- Trong Tab Kế hoạch, không được dùng cố định chữ `Dời sang ngày mai`.
- Với ngày đang chọn là `30/08`, hiển thị `Dời sang 31/08`.
- Với ngày đang chọn là `17/08`, hiển thị `Dời sang 18/08`.
- Nếu qua tháng hoặc năm, phải tính đúng ngày kế tiếp, ví dụ `31/08 -> 01/09`, `31/12 -> 01/01`.
- Ngày đích phải được tính từ `selectedDate` hoặc ngày hiện tại của task trong ngữ cảnh Planner, không tính cứng từ `new Date()` nếu người dùng đang xem ngày khác.
- Khi bấm nút, chỉ cập nhật ngày của task sang ngày kế tiếp; không đổi title, tag, notebook, priority, scheduled time hoặc deadline ngoài phần ngày cần dời.
- Nếu task có `deadlineDate`, phải cập nhật đúng trường ngày liên quan theo model hiện tại và không làm mất giờ.
- Không tạo thêm một task mới và không nhân bản task.

### UI/UX

- Giữ nguyên style, icon, kích thước nút và layout hiện tại nếu không cần thiết.
- Chỉ thay nội dung label và logic xử lý ngày.
- Không dùng native date picker.
- Không sửa các component ngoài phạm vi nếu không liên quan trực tiếp đến thao tác này.

### Kiểm tra bắt buộc

Kiểm tra thủ công tối thiểu:

1. Tab Hôm nay: task ngày hôm nay hiển thị `Dời sang ngày mai` và dời đúng sang ngày mai.
2. Planner chọn ngày `17/08`: label là `Dời sang 18/08`, bấm xong task sang đúng ngày `18/08`.
3. Planner chọn ngày `31/08`: task sang đúng `01/09`.
4. Planner chọn ngày `31/12`: task sang đúng `01/01` của năm sau.
5. Task có giờ hẹn/hạn chót vẫn giữ nguyên giờ sau khi dời.
6. Chạy `npx tsc --noEmit` trong `client`.

Ghi báo cáo vào `.agents/ANTIGRAVITY-REPORT.md`, nêu rõ file đã sửa, logic ngày trước/sau và kết quả từng case kiểm tra. Không xóa lịch sử báo cáo.

---

## Previous Current Task (Archived)

## CURRENT TASK: Tái cấu trúc cây component theo Feature-based Composition

Đọc trước khi sửa: `AGENTS.md`, `.design/README.md`, `.design/CURRENT-STATE.md`, `.design/PRINCIPLES.md`, `.design/TOKENS.md`, `.design/COMPONENTS.md`, `.docs/FEATURES.md` và các báo cáo trong `.agents/`.

### Mục tiêu kiến trúc

Tái cấu trúc thư mục frontend theo mô hình:

> Mỗi tab là một feature/khu vực riêng. Feature nhận các component nội thất từ `shared` hoặc `ui`, sau đó lắp ghép và trang trí theo ngữ cảnh riêng.

Đây là **Feature-based Architecture + Component Composition + Shared Design System**.

Không chỉ đổi tên thư mục. Hãy khảo sát dependency hiện tại, phân loại component theo phạm vi sử dụng, di chuyển an toàn, cập nhật toàn bộ import/export và giữ nguyên behavior/UI hiện có.

### 1. Cây thư mục mục tiêu

Trong `client/src/components/features/`, tổ chức theo feature:

```text
features/
├── today/
│   ├── TodayTab.tsx
│   ├── TodayHeader.tsx
│   ├── TodayQuickAdd.tsx
│   ├── TodayFilterBar.tsx
│   ├── TodayTaskList.tsx
│   └── TodayOverdueShortcut.tsx
├── planner/
│   ├── PlannerTab.tsx
│   ├── PlannerHeader.tsx
│   ├── PlannerCalendar.tsx
│   ├── PlannerTimeline.tsx
│   ├── PlannerQuickAdd.tsx
│   ├── PlannerFilterBar.tsx
│   ├── PlannerTaskList.tsx
│   └── PlannerBacklog.tsx
├── notebooks/
│   ├── NotebooksTab.tsx
│   ├── NotebookHeader.tsx
│   ├── NotebookList.tsx
│   ├── NotebookEditor.tsx
│   └── NotebookTaskList.tsx
├── ideas/
│   ├── IdeasTab.tsx
│   ├── IdeasHeader.tsx
│   ├── IdeaComposer.tsx
│   └── IdeaList.tsx
├── review/
│   ├── ReviewTab.tsx
│   ├── ReviewHeader.tsx
│   ├── ReviewStats.tsx
│   └── ReviewCharts.tsx
├── overdue/
│   ├── OverdueTab.tsx
│   ├── OverdueHeader.tsx
│   ├── OverdueFilterBar.tsx
│   └── OverdueTaskList.tsx
└── shared/
    ├── QuickAddTaskComposer.tsx
    ├── TaskCard.tsx
    ├── TaskList.tsx
    ├── FilterBar.tsx
    └── TaskDetailModal.tsx
```

Giữ các nhóm nền tảng hiện có:

```text
client/src/components/
├── features/       # Các khu vực nghiệp vụ theo từng tab
├── ui/              # Design system và UI nguyên tử/dùng chung
├── layout/          # AppShell, Sidebar, MobileNav
└── index.ts         # Chỉ export public component nếu dự án đang dùng barrel export
```

### 2. Quy tắc phân loại

- Component chỉ phục vụ một tab phải nằm trong thư mục feature của tab đó.
- Component được dùng từ hai feature trở lên đưa vào `features/shared`.
- Component nguyên tử hoặc primitive như Button, Input, Checkbox, Picker, Modal, Icon đặt trong `components/ui`.
- Layout điều hướng không đặt trong feature, giữ ở `components/layout`.
- Logic state/data lớn vẫn do tab/container điều phối; component con nhận props rõ ràng.
- Nếu hai tab dùng chung logic nhưng khác giao diện, tạo wrapper riêng ở feature và bên trong gọi component shared. Không copy nguyên khối code.
- Không tạo file chỉ để bọc một dòng nếu file đó không tạo ra ranh giới trách nhiệm rõ ràng.
- Không tách file một cách máy móc; ưu tiên ranh giới theo trách nhiệm và khả năng tái sử dụng.
- Không thay đổi tên domain, schema, API, route hoặc behavior chỉ vì việc tổ chức thư mục.

### 3. Quy tắc riêng cho Planner

`PlannerTab.tsx` chỉ làm nhiệm vụ điều phối layout, state và callback chính. Tách phần hiển thị thành:

- `PlannerHeader.tsx`: tiêu đề, nút Hôm nay, chuyển Tuần/Tháng.
- `PlannerCalendar.tsx`: lịch tháng/tuần và chọn ngày.
- `PlannerTimeline.tsx`: timeline/ngữ cảnh thời gian nếu đang tồn tại.
- `PlannerQuickAdd.tsx`: wrapper giao diện Planner, tái sử dụng `QuickAddTaskComposer` từ shared.
- `PlannerFilterBar.tsx`: filter riêng của Planner.
- `PlannerTaskList.tsx`: task của ngày đang chọn.
- `PlannerBacklog.tsx`: nhóm việc chưa xếp lịch.

Không được làm mất logic `selectedDate`, `forcedMode`, `initialDate`, `deadlineDate`, `dueDate` của picker sau khi di chuyển.

### 4. Quy tắc tái sử dụng nội thất

- `QuickAddTaskComposer` tiếp tục là nguồn logic chung cho Today và Planner.
- `TaskCard`/`TaskList` dùng chung khi cấu trúc giống nhau; dùng prop `variant` hoặc wrapper feature khi cần khác cách trình bày.
- Các picker thời gian tiếp tục nằm trong `ui/pickers/time`, không kéo vào riêng Planner hay Today.
- Không tạo bản sao `PlannerQuickAdd` chứa toàn bộ logic Quick-Add nếu chỉ khác layout.
- Cập nhật barrel exports và import path sau khi di chuyển; không để import tương đối trỏ vào file cũ.

### 5. Quy trình thực hiện bắt buộc

1. Liệt kê cây `client/src/components` và tìm toàn bộ nơi import các component sẽ di chuyển.
2. Lập bảng mapping `file cũ -> file mới` trước khi sửa.
3. Di chuyển/tách component theo từng feature, ưu tiên Planner rồi Today, sau đó các tab còn lại.
4. Cập nhật import/export và kiểm tra không còn file trùng hoặc file chết.
5. Chỉ chỉnh UI khi cần sửa import hoặc giữ layout; không redesign trong task này.
6. Chạy `npx tsc --noEmit` và `npm run build` trong thư mục `client`.
7. Kiểm tra thủ công các flow: mở Today, Planner, Sổ tay, Ý tưởng, Tổng kết; Quick-Add Today/Planner; mở picker scheduled/deadline; chuyển mobile/desktop.
8. Ghi báo cáo vào `.agents/ANTIGRAVITY-REPORT.md`, không xóa lịch sử báo cáo. Báo cáo phải có mapping file, file nào đã tạo/di chuyển, test đã chạy và vấn đề còn lại.

### Tiêu chí hoàn thành

- Cây thư mục phản ánh rõ từng feature/tab.
- Component dùng chung không bị nhân bản.
- Không còn import hỏng, file chết hoặc export bị thiếu.
- Behavior hiện tại không bị thay đổi ngoài việc tổ chức code.
- TypeScript check và production build đều đạt.

---

## Previous Current Task (Archived)

## CURRENT TASK: Sửa logic Picker Planner và tối ưu UX/UI Tab Kế hoạch

Đọc trước khi sửa: `.design/README.md`, `.design/CURRENT-STATE.md`, `.design/PRINCIPLES.md`, `.design/TOKENS.md`, `.design/COMPONENTS.md` và `.docs/FEATURES.md`.

Phạm vi chính:

- `client/src/components/features/shared/QuickAddTaskComposer.tsx`
- `client/src/components/features/planner/PlannerTab.tsx`
- `client/src/components/ui/pickers/time/CustomDuePicker.tsx`
- `client/src/components/ui/pickers/time/PlannerDateTimeView.tsx`
- `client/src/components/ui/pickers/time/TimePickerSheet.tsx`

Mục tiêu: khi người dùng chọn `Lịch hẹn` hoặc `Hạn chót` trong Quick-Add của Tab Kế hoạch, picker phải mở đúng loại, dùng đúng ngày đang chọn và có UI rõ ràng, gọn gàng. Sau đó tối ưu hierarchy của Tab Kế hoạch mà không làm giống Tab Sổ tay.

### 1. Sửa mode picker theo lựa chọn bên ngoài

Flow bắt buộc:

```text
Bấm Lịch hẹn
→ Picker mở mode scheduled
→ Chỉ hiện Ngày diễn ra + Giờ hẹn

Bấm Hạn chót
→ Picker mở mode deadline
→ Chỉ hiện Ngày phải hoàn thành + Giờ hạn
```

- `forcedMode` phải thực sự khóa mode trong picker khi được truyền từ QuickAdd.
- Khi `forcedMode` tồn tại, không render hoặc không cho tương tác với nút chuyển mode còn lại.
- Không để người dùng bấm từ `Lịch hẹn` rồi chuyển sang `Hạn chót` trong cùng flow, và ngược lại.
- Today variant chỉ chọn giờ; Planner variant chọn ngày + giờ.
- Planner/Edit chỉ cho chuyển mode khi component cha không truyền `forcedMode`.
- Tiêu đề và mô tả đổi theo mode:
  - scheduled: `Thiết lập lịch hẹn` / `Chọn thời gian công việc diễn ra`.
  - deadline: `Thiết lập hạn hoàn thành` / `Chọn thời điểm công việc phải xong`.

### 2. Sửa ngày mặc định của Planner

Lỗi cần xử lý:

```text
Planner đang chọn 05/09
→ Bấm Lịch hẹn hoặc Hạn chót
→ Picker phải mở với ngày 05/09
→ Chọn giờ và áp dụng
→ Task phải được lưu vào 05/09
```

- Truyền `selectedDateStr` từ `PlannerTab`/`QuickAddTaskComposer` xuống `CustomDuePicker` bằng prop rõ ràng, ví dụ `initialDate` hoặc `selectedDate`.
- Khi context là Planner, ngày khởi tạo của picker phải là ngày đang chọn, không tự rơi về hôm nay.
- Nếu người dùng không đổi ngày trong picker, vẫn lưu đúng ngày Planner đang chọn.
- Nếu người dùng chủ động đổi ngày trong picker, lưu ngày mới.
- scheduled/event lấy ngày diễn ra từ `dueDate`.
- deadline/task lấy ngày từ `deadlineDate`, fallback về ngày trong `dueDate`.
- Không để `deadlineDate` ghi đè lịch hẹn.
- Không dùng chuỗi ISO dài trong UI.

### 3. Tối ưu UX/UI Picker Planner

- Khi picker mở theo một mode, phần mode đó phải là tiêu điểm chính, không hiển thị hai khối cạnh tranh nhau.
- Label ngày phải cụ thể:
  - scheduled: `Ngày diễn ra`.
  - deadline: `Ngày phải hoàn thành`.
- Label giờ phải cụ thể:
  - scheduled: `Giờ bắt đầu hẹn`, tùy chọn `Có giờ kết thúc`.
  - deadline: `Phải hoàn thành trước`.
- Giảm padding và khoảng trống dư, nhưng vẫn giữ vùng chạm tối thiểu 36-44px.
- Calendar là vùng chọn ngày chính; giờ là vùng chọn thời điểm phụ.
- Nút `Áp dụng` là action chính; `Đóng/Hủy` là action phụ.
- Mobile dùng Bottom Sheet, desktop/tablet giữ modal phù hợp breakpoint.
- Grab handle mobile có thể chạm/kéo để đóng; không xung đột với calendar hoặc picker giờ.
- Khi modal mở, khóa cuộn nền; chỉ nội dung hợp lệ bên trong modal được cuộn.
- Không dùng native date/time/select control.

### 4. Tối ưu UX/UI Tab Kế hoạch

- Hierarchy ưu tiên:

```text
Kế hoạch
[ Hôm nay ] [ Tuần ] [ Tháng ]
Lịch / Timeline
Ngày đang chọn
Quick-Add theo ngày
Task trong ngày
```

- Lịch/ngày phải nổi bật hơn filter và danh sách task.
- Filter chính gọn: `Tất cả`, `Có lịch`, `Có hạn`, `Đã xong`, `Lọc`.
- Tag, notebook, priority nằm trong filter nâng cao.
- Task card gọn hơn TodayTab vì calendar đã cung cấp ngữ cảnh ngày.
- Card vẫn phân biệt rõ Lịch hẹn, Hạn hoàn thành và Cả ngày bằng icon + label.
- Không để Planner trông như bản sao của Sổ tay.
- Chuẩn hóa font, icon, chip, spacing, border, radius và hard shadow theo token hiện có.
- Animation chuyển ngày/tuần/tháng nhẹ 150-240ms, không làm scroll position nhảy.
- Tôn trọng `prefers-reduced-motion`.
- Sửa label `Kệ Sổ Tay` nếu gặp thành `Sổ tay`.

### 5. Kiểm tra bắt buộc

Test toàn bộ flow:

1. Planner chọn ngày hôm nay, bấm Lịch hẹn, chọn giờ, áp dụng.
2. Planner chọn ngày tương lai, bấm Lịch hẹn, chọn giờ, áp dụng.
3. Planner chọn ngày tương lai, bấm Hạn chót, chọn giờ, áp dụng.
4. Xác nhận không đổi mode ngoài ý muốn.
5. Xác nhận task lưu đúng ngày đang chọn.
6. Chủ động đổi ngày trong picker và xác nhận lưu ngày mới.
7. Task lịch hẹn có giờ kết thúc.
8. Task hạn hoàn thành.
9. Task cả ngày.
10. Calendar Month/Week và nút Hôm nay.
11. Filter và detail task.
12. Mobile/tablet/desktop, resize và scroll lock.

Chạy:

```text
npx tsc --noEmit
npm run build
```

Cập nhật `.agents/ANTIGRAVITY-REPORT.md` bằng cách bổ sung task mới, không xóa lịch sử cũ. Ghi rõ lỗi đã sửa, file thay đổi, flow đã test và kết quả typecheck/build.

## Previous Current Task (Archived)

## CURRENT TASK: Dùng chung Quick-Add giữa Tab Hôm nay và Tab Kế hoạch

Đọc `.design/README.md`, `.design/CURRENT-STATE.md`, `.design/PRINCIPLES.md`, `.design/TOKENS.md`, `.design/COMPONENTS.md` và `.docs/FEATURES.md` trước khi sửa.

Mục tiêu: đưa Quick-Add của Tab Hôm nay sang phần `Quick-Add Theo Ngày Đang Chọn` của Tab Kế hoạch. Hai nơi dùng chung logic, không copy-paste hai form.

### Yêu cầu

1. Tách Quick-Add hiện tại thành component dùng chung, đặt ở vị trí hợp lý, ví dụ:
   `client/src/components/features/shared/QuickAddTaskComposer.tsx`
   hoặc `client/src/components/ui/composites/QuickAddTaskComposer.tsx`.

2. Component dùng chung phải bao gồm:
   - nhập title,
   - nút thêm,
   - mở rộng/thu gọn chi tiết,
   - tag nhanh và tạo tag mới,
   - notebook,
   - priority,
   - Lịch hẹn/Hạn hoàn thành,
   - metadata chips,
   - validation title rỗng,
   - Enter xuống dòng và Ctrl/Cmd+Enter để submit.

3. Component nhận context:

```ts
type QuickAddContext = "today" | "planner";
```

và nhận `selectedDate`/callback submit cần thiết. Component không tự quyết định business logic ngày.

4. Context `today`:
   - ngày ngầm định là hôm nay,
   - không hiển thị ngày trong UI,
   - picker Today chỉ chọn giờ,
   - giữ nguyên behavior hiện tại của TodayTab.

5. Context `planner`:
   - thay thế form Quick-Add hiện tại trong `PlannerTab.tsx`,
   - placeholder dạng `Thêm việc vào DD/M...`,
   - có micro-copy `Thêm vào DD/M`,
   - task được tạo vào đúng `selectedDateStr`, không luôn dùng hôm nay,
   - picker Planner chọn ngày + giờ đầy đủ,
   - mở Lịch hẹn thì dùng mode `scheduled`, mở Hạn hoàn thành thì dùng mode `deadline`.

6. Quy tắc dữ liệu:
   - `scheduled/event`: ngày diễn ra từ `dueDate`,
   - `deadline/task`: ngày từ `deadlineDate`, fallback `dueDate`,
   - không tự tạo deadline cho task thường,
   - không chọn tag thì lưu `tag: undefined`.

7. Layout:
   - Today và Planner dùng chung typography, spacing, chip height và button size,
   - metadata chips nằm hàng riêng và wrap,
   - nút `Thêm chi tiết` nằm hàng riêng, không lệch khi có 1-3 chip,
   - nút thêm tối thiểu 44px trên mobile,
   - textarea tối đa 2 dòng mobile và chỉ cuộn nội bộ,
   - không dùng native select/date/time control.

8. Refactor an toàn:
   - xóa state/helper Quick-Add trùng sau khi chuyển sang component chung,
   - giữ nguyên reset form, validation, tag, notebook, priority và time picker,
   - không sửa Tab Sổ tay trong task này.

### Kiểm tra

Test thêm task thường/lịch hẹn/hạn hoàn thành ở Today; thêm task ở hôm nay và ngày tương lai trong Planner; chọn/không chọn tag; chọn notebook/priority; metadata wrap; mobile/tablet/desktop.

Chạy:

```text
npx tsc --noEmit
npm run build
```

Cập nhật `.agents/ANTIGRAVITY-REPORT.md` bằng cách bổ sung task mới, không xóa lịch sử cũ. Ghi component dùng chung, file đã sửa, flow đã test và kết quả build/typecheck.

## Previous Current Task (Archived)

## CURRENT TASK: Tái cấu trúc UX/UI cho Tab Kế hoạch

Đọc trước khi sửa: `.design/README.md`, `.design/CURRENT-STATE.md`, `.design/PRINCIPLES.md`, `.design/TOKENS.md`, `.design/COMPONENTS.md` và `.docs/FEATURES.md`.

Phạm vi chính: `client/src/components/features/planner/PlannerTab.tsx`, các component picker thời gian liên quan và layout dùng chung khi thật sự cần. Không sửa Tab Sổ tay ngoài các import hoặc component dùng chung bắt buộc. Không đổi business logic/backend nếu không cần.

Mục tiêu: biến Tab Kế hoạch thành công cụ điều phối theo ngày/tuần, không giống một danh sách task khác của Tab Sổ tay.

### 1. Hierarchy

Ưu tiên hiển thị theo thứ tự:

```text
Kế hoạch
[ Hôm nay ] [ Tuần ] [ Tháng ]

Lịch / Timeline

Ngày đang chọn
[ Thêm task vào ngày này ]

Task trong ngày
```

- Lịch/ngày phải là nội dung chính nhìn thấy đầu tiên.
- Filter và danh sách task không được lấn át lịch.
- Giữ Month/Week nếu đang hoạt động; active state, kích thước và khoảng cách phải đồng nhất.
- Nút `Hôm nay` đưa về đúng ngày hiện tại.
- Chọn ngày trên lịch phải cập nhật rõ ngày đang chọn và danh sách phía dưới.

### 2. Calendar và Timeline

- Month view: làm rõ ngày hôm nay, ngày đang chọn và ngày có task.
- Week view: hiển thị các ngày, số lượng task và trạng thái chọn.
- Không xoay calendar hoặc container cuộn.
- Không dùng `window.innerWidth` trực tiếp trong render; dùng CSS responsive hoặc cơ chế resize ổn định.
- Mobile có thể thu gọn lịch nhưng ngày đang chọn luôn phải dễ nhận biết.
- Touch target vùng ngày khoảng 36-44px tùy breakpoint.

### 3. Phân biệt loại thời gian

- `scheduled/event`: `Lịch hẹn`, icon `Clock`, thời gian công việc diễn ra.
- `deadline/task`: `Hạn hoàn thành`, icon `Hourglass`, thời điểm phải xong.
- Không có giờ: nhóm `Cả ngày`.
- Lịch hẹn lấy ngày từ `dueDate`.
- Hạn hoàn thành lấy ngày từ `deadlineDate`, fallback về ngày trong `dueDate`.
- Nếu có giờ kết thúc, hiển thị khoảng giờ rõ ràng.
- Không hiển thị giờ/ngày giả.

Ví dụ:

```text
09:00  Lịch hẹn
       Họp nhóm dự án

11:00  Hạn hoàn thành
       Gửi báo cáo
```

### 4. Quick-add theo ngày

- Hiển thị micro-copy ngắn như `Thêm vào 30/8`, không dùng chuỗi ISO dài.
- Không tự gán tag nếu người dùng chưa chọn.
- Không hiển thị metadata giả khi chưa chọn thời gian.
- Planner chọn ngày + giờ đầy đủ bằng `CustomDuePicker`.
- Lịch hẹn và hạn hoàn thành phải mở đúng mode.
- Không dùng native select/date/time controls.

### 5. Filter tinh gọn

Filter chính:

```text
[ Tất cả ] [ Có lịch ] [ Có hạn ] [ Đã xong ] [ Lọc ]
```

- `Có lịch` = scheduled/event.
- `Có hạn` = deadline/task.
- Tag, notebook, priority nằm trong filter nâng cao.
- Các nút cùng chiều cao, cỡ chữ và active state.
- Không để filter chiếm nhiều chiều cao hoặc overflow ngang ngoài vùng có chủ đích.

### 6. Task card

- Card gọn hơn TodayTab vì lịch đã cung cấp ngữ cảnh ngày.
- Giữ title, checkbox, thời gian/loại thời gian và trạng thái.
- Badge tag/notebook/priority nhỏ, không lặp thông tin quá mức.
- Phân biệt rõ Lịch hẹn và Hạn hoàn thành bằng icon + label, không chỉ bằng màu.
- Task không có giờ nằm trong nhóm `Cả ngày`.
- Bấm nội dung mở `TaskDetailModal`; checkbox/sửa/xóa/dời ngày không được mở detail ngoài ý muốn.
- Action mobile tối thiểu 36px.

### 7. Responsive và animation

- Mobile: lịch có thể thu gọn, task list không bị bottom nav che.
- Tablet: không chật hoặc vỡ cột.
- Desktop: có thể dùng chiều ngang cho calendar và timeline/list nhưng vẫn rõ hierarchy.
- Chuyển Month/Week, đổi ngày và cập nhật danh sách có transition nhẹ 150-240ms.
- Không làm scroll position nhảy mạnh, không animation lặp vô hạn.
- Tôn trọng `prefers-reduced-motion`.

### 8. Kiểm tra

Test: Month/Week, Hôm nay, chọn ngày, thêm task theo ngày, task lịch hẹn, task hạn, task cả ngày, filter, mở detail, action card, resize mobile/tablet/desktop và scroll.

Chạy:

```text
npx tsc --noEmit
npm run build
```

Cập nhật `.agents/ANTIGRAVITY-REPORT.md` bằng cách bổ sung task mới, không xóa lịch sử cũ. Ghi file đã sửa, flow đã test, kết quả typecheck/build và điểm chưa thể xác nhận trực quan.

## Previous Prompt (Archived)

### Task: Tối ưu UX/UI và animation cho Tab Hôm nay

Đọc bắt buộc trước khi sửa:

- `.design/README.md`
- `.design/CURRENT-STATE.md`
- `.design/PRINCIPLES.md`
- `.design/TOKENS.md`
- `.design/COMPONENTS.md`
- `.docs/FEATURES.md`

Mục tiêu: làm Tab Hôm nay đồng nhất về typography, kích thước item, box, chip, button, icon và animation; không để chỗ quá to, chỗ quá nhỏ. Giữ phong cách SketchTask, không đổi business logic ngoài phạm vi cần thiết.

#### 1. Header và shortcut Quá hạn

File chính: `client/src/components/features/today/TodayTab.tsx`

- Giữ tiêu đề `Hôm Nay` nổi bật nhưng không quá lớn.
- Badge ngày, tiến độ và tiêu đề phải cùng baseline hợp lý.
- Progress bar cao khoảng 5-6px, không làm header quá cao.
- Shortcut Quá hạn phải là một shortcut nhỏ, nhẹ, có icon `ArrowUpRight`, không cạnh tranh với phần việc hôm nay.
- Không render danh sách task quá hạn lớn trong Tab Hôm nay.
- Shortcut chỉ hiển thị khi có task quá hạn và mở đúng view Quá hạn.

#### 2. Quick-add

Trạng thái mặc định chỉ gồm:

```text
[ Thêm việc mới...                         ] [ + ]
[ + Thêm chi tiết                            ]
```

- Không hiển thị ngày hôm nay, giờ mặc định hoặc tag mặc định khi chưa chọn.
- Placeholder chỉ là `Thêm việc mới...`.
- Nếu không chọn tag, lưu `tag: undefined`.
- Tag nhanh chỉ gồm `Không gắn nhãn`, `Công việc`, `Cá nhân`, `Học tập`.
- Metadata chỉ hiện khi người dùng thực sự chọn.
- Chip metadata nằm ở hàng riêng, được phép wrap.
- Nút `Thêm chi tiết` hoặc `Chỉnh sửa chi tiết` luôn nằm ở hàng riêng, không bị lệch khi có 1, 2 hoặc 3 chip.
- Tab Hôm nay không hiển thị ngày trong metadata.
- Lịch hẹn chỉ hiển thị giờ, ví dụ `09:00` hoặc `09:00 - 10:30`.
- Hạn hoàn thành chỉ hiển thị `Hạn 11:00`.
- Textarea tối đa 2 dòng trên mobile; chỉ textarea được cuộn khi nội dung dài.
- Không dùng `scrollIntoView` gây nhảy giao diện khi bàn phím mở.
- Nút thêm có vùng chạm tối thiểu 44px.

#### 3. Bộ lọc

Giữ hàng filter chính gọn:

```text
[ Tất cả ] [ Cần làm ] [ Đã xong ] [ Lọc ]
```

- Các nút cùng chiều cao, khoảng 28-32px tùy breakpoint.
- Label khoảng 11-12px trên mobile.
- Filter nâng cao mở riêng bằng UI của app, không dùng native dropdown.
- Không để filter chiếm quá nhiều chiều cao hoặc gây overflow ngang ngoài vùng có chủ đích.

#### 4. Task card

- Padding mobile vừa phải, khoảng cách giữa card đồng nhất.
- Border 1.5px, radius nhỏ, hard shadow dùng thống nhất.
- Tiêu đề task 13-14px mobile, 14-15px desktop; line-height dễ đọc.
- Tiêu đề tối đa 2 dòng mobile, 3 dòng desktop.
- Badge metadata cùng chiều cao khoảng 20px, chữ 10-11px, baseline đồng nhất.
- Nút dời ngày, chỉnh sửa, xóa tối thiểu 36px trên mobile.
- Bấm vùng nội dung card mở `TaskDetailModal`.
- Checkbox, dời ngày, sửa, xóa phải `stopPropagation`, không mở detail ngoài ý muốn.
- Phân biệt rõ:
  - Lịch hẹn: `Clock`, nhãn `Lịch hẹn`, hiển thị giờ diễn ra.
  - Hạn hoàn thành: `Hourglass`, nhãn `Hạn hoàn thành`, hiển thị giờ phải xong.
  - Quá hạn: `AlertCircle`, nhãn `Quá hạn`, màu đỏ nhẹ.
  - Không có thời gian: không hiển thị badge thời gian.

#### 5. Animation

Thêm animation đẹp nhưng tiết chế:

- Khi Tab Hôm nay xuất hiện: header, quick-add, filter và danh sách xuất hiện theo stagger rất nhẹ.
- Task card mới: fade-in + translateY khoảng 6-10px.
- Khi hoàn thành task: checkbox, strike-through và opacity chuyển tiếp nhẹ.
- Khi mở rộng Quick-add: fade/height transition nhẹ, không làm trang nhảy mạnh.
- Shortcut Quá hạn chỉ fade/slide một lần, không nhấp nháy hoặc rung liên tục.
- Thời lượng chung khoảng 150-240ms; danh sách dài không được chậm rõ rệt.
- Tôn trọng `prefers-reduced-motion`; khi bật reduced motion thì tắt stagger và chuyển động lớn.
- Không xoay input, filter hoặc container cuộn.
- Không dùng gradient tím/hồng/cyan đại trà, soft blur shadow hoặc pill shape cho button chính.

#### 6. Responsive

Kiểm tra tối thiểu tại:

- Mobile 320px và 390px.
- Tablet 768px và 1024px.
- Desktop từ 1280px.

Đảm bảo:

- Không overflow ngang ngoài vùng được thiết kế để cuộn.
- Không icon chồng chữ.
- Không label bị cắt.
- Không button bị lệch khi chip wrap.
- Bottom nav không che task card.
- Khi bàn phím mở, bottom nav ẩn đúng và trang vẫn thao tác được.
- Khi modal mở, nền phía sau không cuộn.

#### 7. Kiểm tra và báo cáo

Rà soát các file liên quan, ưu tiên tái sử dụng token/component chung. Không tạo style riêng trùng lặp nếu pattern hiện có đáp ứng được.

Chạy:

```text
npx tsc --noEmit
npm run build
```

Kiểm tra không còn native `<select>`, `<input type="date">`, `<input type="time">`.

Sau khi làm xong, cập nhật `.agents/ANTIGRAVITY-REPORT.md` bằng cách **bổ sung task mới ở đầu hoặc cuối file, không xóa lịch sử báo cáo cũ**. Báo cáo phải ghi rõ:

- File đã thay đổi.
- Animation đã thêm.
- Scale kích thước đã chuẩn hóa.
- Responsive đã kiểm tra.
- Kết quả typecheck/build.
- Bất kỳ điểm nào chưa thể xác nhận trực quan.

## Hướng Dẫn

- Chỉ xử lý task trong mục Prompt.
- Không tự ý chuyển sang task khác.
- Không git push, không xóa file, không reset thay đổi.
- Sau khi làm xong, ghi báo cáo vào `ANTIGRAVITY-REPORT.md`.
# TASK 28: Ổn định flow chỉnh sửa task và thiết lập lịch trong EditTaskModal

## Mục tiêu

Chỉ xử lý flow bấm nút **Sửa** của task và bộ chọn lịch được mở từ modal sửa. Không chỉnh các tab khác, không đổi Quick-Add, không đổi Notification hay Journal.

## Vấn đề đã xác định

1. `EditTaskModal` nạp `timeData` nhưng không nạp `dueDate` vào state draft. Khi người dùng chỉ sửa tiêu đề/tag rồi lưu, `handleSave` có thể gửi `dueDate: undefined` và làm mất ngày/giờ hiện tại.
2. Modal sửa không truyền `forcedMode`/`initialMode` cho `CustomDuePicker`. Task lịch hẹn có thể mở nhầm giao diện hạn hoàn thành, và ngược lại.
3. Các trường `scheduled` và `deadline` chưa được làm rõ trong UI. Người dùng cần biết mình đang sửa “Lịch hẹn” hay “Hạn hoàn thành”, không thấy một form ngày giờ kép khó hiểu.
4. Modal sửa hiện quá dày trên mobile, picker lại mở thêm một lớp lớn, làm giảm không gian nội dung và cảm giác không đồng nhất với SketchTask.

## Yêu cầu thực hiện

### A. Sửa tính đúng của dữ liệu

- Khi mở modal, tạo draft đầy đủ từ task hiện tại: `title`, `notebookId`, `priority`, `tag`, `dueDate` và toàn bộ `timeData`.
- Reset draft mỗi lần `task` hoặc `isOpen` thay đổi; không để state của task trước lọt sang task sau.
- Chuẩn hóa legacy type: `event` => `scheduled`, `task` => `deadline`.
- Với task đã có `scheduled`, truyền `forcedMode="scheduled"` và `initialMode="scheduled"` vào `CustomDuePicker`.
- Với task đã có `deadline`, truyền `forcedMode="deadline"` và `initialMode="deadline"`.
- Với task chưa có lịch, cho phép chọn loại lịch trong picker và hiển thị nhãn trung tính rõ ràng.
- Khi lưu, payload phải nhất quán:
  - `scheduled`: giữ `dueDate` theo ngày + giờ bắt đầu, giữ `date/startTime/endTime`, xóa sạch `deadlineDate/deadlineTime`.
  - `deadline`: giữ `dueDate` theo ngày + giờ hạn, giữ `deadlineDate/deadlineTime`, xóa sạch `date/startTime/endTime`.
  - Xóa lịch: xóa toàn bộ `dueDate`, `timeType`, `date/startTime/endTime`, `deadlineDate/deadlineTime`.
- Không được làm mất lịch nếu người dùng không đụng vào khu vực lịch.
- Không dùng `any` mới để né lỗi type; giữ tương thích với `TaskDto` hiện tại.

### B. Tối giản UI modal sửa

- Giữ modal theo Bottom Sheet trên mobile và modal gọn ở desktop.
- Header rõ: icon sửa + “Chỉnh sửa công việc”, nút đóng trên desktop; mobile vẫn có grab handle và đóng bằng chạm nền/nút đóng hiện có.
- Bố cục theo thứ tự ưu tiên:
  1. Nội dung công việc.
  2. Một card “Lịch hẹn” hoặc “Hạn hoàn thành” theo loại task, kèm trạng thái hiện tại và nút “Thay đổi”.
  3. Cuốn sổ, ưu tiên, nhãn trong các section gọn.
  4. Footer hành động cố định trong modal: “Hủy” và “Lưu thay đổi”.
- Không hiển thị đồng thời hai khối lịch cạnh tranh nếu task đã xác định loại.
- Không để footer bị cuộn mất khi nội dung dài; phần form ở giữa được cuộn riêng.
- Kích thước input, button, khoảng cách và hard-shadow phải tái sử dụng tokens/pattern hiện có trong `.design`; không tạo palette mới, không pill card, không strikethrough.
- Khi picker mở, khóa cuộn nền và không cho modal phía sau cuộn xuyên qua. Sheet lịch phải có vùng cuộn nội bộ nếu cần.
- Các label phải dùng đúng ngữ nghĩa:
  - `Lịch hẹn`: “Công việc diễn ra lúc nào”
  - `Hạn hoàn thành`: “Phải xong trước khi nào”

### C. Không phá hành vi hiện tại

- Không đổi contract public của `CustomDuePicker` nếu không thật sự cần.
- Không sửa logic của Planner/Today/Quick-Add trong task này.
- Không thay đổi cách phân biệt task scheduled đã qua và deadline quá hạn.
- Không thêm emoji vào label/icon UI.

## Kiểm tra bắt buộc

Chạy `npx tsc --noEmit` và `npm run build`.

Kiểm tra thủ công tối thiểu:

1. Mở task scheduled, chỉ đổi tiêu đề, lưu => ngày/giờ hẹn vẫn nguyên.
2. Mở task deadline, chỉ đổi tag, lưu => ngày/giờ hạn vẫn nguyên.
3. Mở task chưa có lịch, chọn lịch hẹn rồi lưu => payload chỉ có scheduled fields.
4. Mở task chưa có lịch, chọn hạn hoàn thành rồi lưu => payload chỉ có deadline fields.
5. Bấm xóa lịch rồi lưu => mọi trường lịch đều được xóa.
6. Test viewport mobile khoảng 390px và desktop: modal không làm nền phía sau cuộn, footer luôn thao tác được, picker không bị cắt.

## Báo cáo

Cập nhật `.agents/ANTIGRAVITY-REPORT.md` với file đã sửa, cách xử lý state/payload, kết quả 6 case trên và kết quả hai lệnh kiểm tra. Nếu có điểm chưa làm được, ghi rõ thay vì đánh dấu PASS.

---
# TASK 29: Tách riêng chọn ngày/giờ trong modal Sửa

## Phạm vi

Tiếp tục xử lý riêng flow **Sửa task**. Không sửa Today, Planner, Quick-Add, Notification hoặc Journal ngoài việc tái sử dụng component picker giờ đã có.

## Quyết định UX bắt buộc

Trong `EditTaskModal`, không dùng một nút picker kép vừa chọn ngày vừa chọn giờ trong cùng một màn hình. Ngày và giờ phải là hai hành động riêng, đồng thời phải phân biệt rõ `Lịch hẹn` và `Hạn hoàn thành`.

## Đính chính mô hình task tạo nhanh

- Task tạo nhanh **mặc định đã có ngày lịch `YYYY-MM-DD`** theo ngày hiện tại/ngữ cảnh tab; chưa có giờ không có nghĩa là chưa sắp lịch.
- Chỉ khi người dùng chủ động chọn `Chưa quyết định ngày` thì task mới trở thành task chưa sắp lịch và đi vào `Hộp chờ` của Planner.
- Vì vậy phải phân biệt ba trạng thái:
  1. **Đã có ngày, chưa có giờ**: hiển thị ngày hiện tại đã chọn; nút giờ là `Chọn giờ hẹn` hoặc `Chọn giờ hạn` tùy mode.
  2. **Đã có ngày + giờ**: hiển thị đầy đủ ngày và giờ tương ứng.
  3. **Chưa quyết định ngày**: hiển thị `Chưa sắp lịch`; không sinh ngày/giờ mặc định.
- Không tự chuyển task có ngày nhưng thiếu giờ vào Hộp chờ.
- Không xóa ngày hiện tại chỉ vì người dùng mở modal sửa hoặc chỉ sửa tiêu đề/tag/sổ.

### 1. Task chưa quyết định ngày

Khi mở một task đã được người dùng chọn `Chưa quyết định ngày`:

- Hiển thị trạng thái `Chưa sắp lịch`, không tự thêm ngày hôm nay, `09:00`, lịch hẹn hoặc hạn chót.
- Hiển thị hai lựa chọn độc lập:
  - `Lịch hẹn` -> `Chọn ngày` và `Chọn giờ hẹn`.
  - `Hạn hoàn thành` -> `Chọn ngày hạn` và `Chọn giờ hạn`.
- Các nút chưa chọn phải có placeholder rõ ràng, không hiển thị dữ liệu mẫu.

### 1b. Task đã có ngày nhưng chưa có giờ

- Giữ nguyên ngày đã có trong task và hiển thị ở control ngày.
- Không hiển thị ngày như placeholder và không đưa task vào Hộp chờ.
- Cho phép chọn riêng `Giờ hẹn` hoặc `Giờ hạn` bằng thanh kéo ngang.
- Nếu task chưa có `timeType`, sau khi người dùng chọn giờ phải xác định rõ mode trước khi lưu; không tự đoán bằng giá trị `dueDate`.

### 2. Task đã là scheduled

- Header/section ghi rõ `Lịch hẹn` và mô tả `Công việc diễn ra lúc nào`.
- Tách thành hai nút:
  - `Ngày hẹn`: chọn ngày.
  - `Giờ hẹn`: chọn giờ bắt đầu, có thể bật giờ kết thúc nếu model hiện tại hỗ trợ.
- Không hiển thị control `Hạn hoàn thành` trong cùng section.
- Khi mở picker giờ, tiêu đề phải là `Chọn giờ hẹn`, không được ghi `Hạn chót` hay `Thiết lập thời gian` chung chung.

### 3. Task đã là deadline

- Header/section ghi rõ `Hạn hoàn thành` và mô tả `Phải xong trước khi nào`.
- Tách thành hai nút:
  - `Ngày hạn`: chọn ngày.
  - `Giờ hạn`: chọn giờ.
- Không hiển thị control `Lịch hẹn` trong cùng section.
- Khi mở picker giờ, tiêu đề phải là `Chọn giờ hạn`, không được dùng nhãn giờ hẹn.

## Yêu cầu picker giờ

- Picker giờ trong modal sửa phải dùng lại kiểu **thanh kéo ngang** đang được sử dụng ở phần chọn giờ của tab Hôm Nay, ưu tiên `TimeSliderAdjuster` hoặc component tương đương hiện có.
- Không dùng wheel picker, native `<input type="time">`, native dropdown hoặc danh sách giờ dài cho thao tác chọn giờ này.
- Có hiển thị giờ đang chọn, vùng kéo dễ chạm trên mobile, bước phút nhất quán với Today.
- Scheduled có thể có `Giờ bắt đầu` và tùy chọn `Giờ kết thúc`; deadline chỉ có một `Giờ hạn`.
- Sheet giờ có thể vuốt/kéo thanh grab handle để đóng nhẹ nhàng; vẫn có nút hành động rõ ràng.
- Khi picker giờ mở, khóa cuộn nền và không cho modal phía sau cuộn xuyên qua.

## Yêu cầu picker ngày

- Ngày là một hành động riêng, mở calendar phù hợp với context.
- Với task mở từ Today, nếu ngày bị khóa theo quy tắc Today thì nói rõ `Hôm nay`; không biến ngày ngầm thành một chip dữ liệu giả.
- Với modal sửa dùng chung từ Planner/Sổ tay, cho phép chọn ngày đầy đủ.
- Tiêu đề phải phân biệt `Chọn ngày hẹn` và `Chọn ngày hạn`.

## Dữ liệu và trạng thái

- Không làm mất lịch cũ khi người dùng chỉ sửa tiêu đề/tag/sổ.
- Chọn giờ phải cập nhật đúng field theo mode:
  - scheduled: `startTime`, `endTime`, `dueDate` và ngày hẹn.
  - deadline: `deadlineTime`, `deadlineDate`, `dueDate`.
- Không để field của mode còn lại tồn tại sau khi đổi mode.
- Nút xóa lịch phải xóa toàn bộ trường liên quan.
- Giữ tương thích `event` => `scheduled`, `task` => `deadline`.

## Kiểm tra bắt buộc

1. Task đã có ngày nhưng chưa có giờ: ngày vẫn hiển thị, không vào Hộp chờ; chọn giờ bằng thanh kéo => giữ nguyên ngày.
2. Task `Chưa quyết định ngày`: hiển thị Hộp chờ, không có ngày/giờ mẫu; chọn ngày hạn rồi giờ hạn => không sinh field scheduled.
3. Task scheduled: mở sửa, picker ghi đúng `Chọn giờ hẹn`, chỉ có control scheduled.
4. Task deadline: mở sửa, picker ghi đúng `Chọn giờ hạn`, chỉ có control deadline.
5. Chỉ sửa tiêu đề/tag rồi lưu task có lịch => lịch cũ không đổi.
6. Mở mobile khoảng 390px và desktop: modal/picker không bị tràn, footer dùng được, nền không cuộn.

Chạy `npx tsc --noEmit` và `npm run build`. Cập nhật `.agents/ANTIGRAVITY-REPORT.md` với file, state/payload, ảnh hưởng viewport và kết quả từng case; không đánh dấu PASS nếu chưa kiểm tra thật.

---
# TASK 30: Thiết kế lại hoàn chỉnh modal Chỉnh sửa công việc

## Phạm vi

Thay thế bố cục hiện tại của `EditTaskModal` theo đúng cấu trúc dưới đây. Chỉ tập trung vào modal chỉnh sửa task và các picker con được modal sử dụng. Không sửa giao diện các tab khác.

## Thứ tự giao diện bắt buộc

Modal phải hiển thị theo thứ tự:

1. **Nội dung**
   - Textarea chỉnh sửa tên/nội dung task.
   - Đây là phần ưu tiên cao nhất và chiếm chiều rộng chính.

2. **Thuộc sổ nào**
   - Dùng dropdown custom hiện có.
   - Có lựa chọn `Không thuộc cuốn sổ`.

3. **Nhãn/Tag**
   - Đây mới là trường phân loại cần có trong modal sửa, không phải `Thuộc task nào`.
   - Dùng custom select/popover hiện có, không dùng native `<select>`.
   - Có lựa chọn `Không gắn nhãn`.
   - Không để danh sách tag làm modal phình to; nếu nhiều tag thì mở danh sách cuộn nội bộ hoặc popover gọn.

4. **Thuộc công việc nào (chuẩn bị cho Subtask)**
   - Có thể đặt sau trường Nhãn/Tag hoặc để ở trạng thái nâng cao, nhưng phải hiểu đây là quan hệ **task cha**, không phải tag và không phải liên kết task tùy ý.
   - Label hiển thị là `Thuộc công việc nào` hoặc `Công việc cha`.
   - Có lựa chọn `Không thuộc công việc nào`.
   - Không cho task tự làm cha của chính nó.
   - Nếu `TaskDto`/API hiện tại chưa có field quan hệ cha-con, chỉ dựng UI/contract tối thiểu khi đã kiểm tra model; không tự bịa persistence. Ghi rõ trong báo cáo nếu phần subtask chưa thể lưu thật.

5. **Thiết lập thời gian**
   - Hiển thị một control **Ngày** riêng.
   - Có ngày: hiển thị đúng ngày đã lưu, ví dụ `30/08/2026`.
   - Không có ngày: hiển thị `Chưa thiết lập ngày`, tuyệt đối không tự hiện ngày hôm nay.
   - Bấm control ngày mở một sheet/layer có lịch `CalendarMonth` phía sau để người dùng chọn và thay đổi ngày.
   - Không dùng ngày mẫu, không tự ghi ngày vào task chỉ vì mở picker.

6. **Giờ hẹn và giờ chót**
   - Nếu task có `scheduled`/giờ hẹn: hiển thị control `Giờ hẹn`, ẩn control `Giờ chót`.
   - Nếu task có `deadline`/giờ chót: hiển thị control `Giờ chót`, ẩn control `Giờ hẹn`.
   - Nếu task chưa có loại giờ: hiển thị hai control nằm cạnh nhau: `Chọn giờ hẹn` và `Chọn giờ chót`.
   - Khi người dùng chọn một loại, chuyển sang loại đó và ẩn loại còn lại; không hiển thị hai mode cạnh tranh sau khi đã xác định loại.
   - Picker giờ phải dùng `TimeSliderAdjuster` dạng thanh kéo ngang như tab Hôm Nay.
   - Tiêu đề picker phải phân biệt chính xác `Chọn giờ hẹn` và `Chọn giờ chót`.
   - Không dùng wheel picker, native time input hoặc dropdown giờ mặc định của trình duyệt.

7. **Mức độ ưu tiên**
   - Giữ ba lựa chọn `Gấp`, `Vừa`, `Thấp` theo token hiện có.

8. **Nút hành động**
   - Cuối modal chỉ có `Lưu thay đổi` và `Hủy`.
   - Bỏ nút `X` trên đầu modal hoàn toàn.
   - Mobile vẫn có thể đóng bằng chạm nền, nút `Hủy` hoặc back handler.

## Quy tắc trạng thái và dữ liệu

- Task có ngày nhưng chưa có giờ: giữ ngày, hiển thị `Chưa chọn giờ`; không tự gán `scheduled` hay `deadline`.
- Task chưa quyết định ngày: hiển thị `Chưa thiết lập ngày`; chỉ vào Hộp chờ khi trạng thái này đã tồn tại/chủ động được chọn.
- Chỉ sửa nội dung, sổ, task liên kết hoặc ưu tiên không được làm mất ngày/giờ cũ.
- Khi lưu scheduled, xóa sạch field deadline cũ.
- Khi lưu deadline, xóa sạch field scheduled cũ.
- Khi xóa thiết lập thời gian, xóa toàn bộ date/time fields liên quan.
- Không tự gán ngày hôm nay khi bấm chọn loại giờ; ngày chỉ thay đổi sau khi người dùng chọn lịch.
- Giữ tương thích legacy `event` => `scheduled`, `task` => `deadline`.

## Yêu cầu giao diện

- Modal mobile là Bottom Sheet, desktop là modal gọn; phần nội dung giữa có scroll nội bộ và footer luôn thao tác được.
- Khi date/time picker mở, khóa scroll toàn bộ lớp phía sau, không để modal hoặc tab nền cuộn xuyên qua.
- Giữ style SketchTask: border mực, hard-offset shadow, màu từ `.design/TOKENS.md`, không thêm gradient/bo tròn pill/emoji UI.
- Không để các section ngày/giờ phình to hoặc lặp lại cùng một thông tin.

## Kiểm tra bắt buộc

1. Task tạo nhanh có ngày, chưa có giờ: ngày hiển thị; không tự chọn hẹn/hạn.
2. Task Hộp chờ: hiển thị `Chưa thiết lập ngày`, không tự hiện hôm nay.
3. Chọn `Giờ hẹn`: slider mở đúng nhãn, `Giờ chót` ẩn.
4. Chọn `Giờ chót`: slider mở đúng nhãn, `Giờ hẹn` ẩn.
5. Task không có loại giờ: hai control nằm cạnh nhau.
6. Chỉ sửa nội dung/sổ/ưu tiên rồi lưu: lịch cũ giữ nguyên.
7. Nút đầu modal không còn `X`; `Hủy` và backdrop/back handler vẫn đóng được.
8. Kiểm tra mobile khoảng 390px và desktop.

Chạy `npx tsc --noEmit` và `npm run build`. Cập nhật `.agents/ANTIGRAVITY-REPORT.md` với file thật sự đã sửa, field liên kết task đã hỗ trợ hay chưa, kết quả từng case và kết quả kiểm tra. Không báo PASS nếu chưa kiểm tra trực tiếp.

---

## LATEST TASK OVERRIDE: NOTE WORKSPACE POPUP REFACTOR

Chỉ thực hiện task này, không tự làm task khác:

- Trong `client/src/components/features/notes/`, bỏ cách mở `NoteDetail` bằng popup phủ toàn màn hình.
- Desktop/tablet rộng: chuyển Note Workspace sang master-detail hai cột; danh sách note ở trái, chi tiết note ở phải. Không dùng backdrop toàn màn hình.
- Mobile: danh sách và chi tiết là hai trạng thái trong cùng workspace; khi mở note có nút `Quay lại`, back Android/trình duyệt quay về danh sách. Không dùng bottom sheet phủ danh sách.
- Chế độ sửa nằm ngay trong trang chi tiết, dùng input/textarea hiện có, có `Lưu` và `Hủy`; giữ nguyên `id`, `createdAt`, `updatedAt` và không tạo note mới khi sửa.
- Nội dung dài phải cuộn trong vùng chi tiết, không cuộn xuyên ra nền. Không tràn ngang ở 320px và 390px.
- Giữ nguyên Nhật ký và các flow task. Không sửa `EditTaskModal`, `TaskDetailModal`, `ConfirmModal`, `SettingsModal`, `GlobalSearchModal`, picker ngày/giờ hoặc API/data model.
- Bỏ nền `rgba(0,0,0,0.75)` và `backdrop-filter` khỏi luồng xem/sửa note; giữ token `.design/`, hard-offset shadow, không gradient/emoji/native select.
- Chạy `npx tsc --noEmit` và `npm run build`.
- Cập nhật `.agents/ANTIGRAVITY-REPORT.md` với file thật sự thay đổi, kiểm tra desktop/mobile, lưu/hủy, back mobile, scroll nội bộ và lỗi chưa xác minh. Không báo PASS nếu chưa kiểm tra trực tiếp.

Không mở rộng phạm vi sang Task/Planner trong lần này.

---

## LATEST TASK OVERRIDE: DESKTOP TASK CANVAS WIDTH

Chỉ thực hiện tối ưu layout desktop/tablet cho khu vực **Task Workspace**. Không sửa logic task, dữ liệu, Note Workspace hoặc modal.

### Vấn đề

Trên desktop, nội dung app đang bị khóa bởi `max-w-5xl w-full mx-auto` trong `AppShell`, khiến toàn bộ Task Workspace nằm thành một cột hẹp ở chính giữa dù hai bên còn nhiều khoảng trống.

### Yêu cầu

- Từ breakpoint desktop (`lg` hoặc breakpoint phù hợp), main content phải chiếm toàn bộ chiều rộng còn lại sau Sidebar.
- Bỏ giới hạn `max-w-5xl` và `mx-auto` ở lớp main dùng chung, hoặc thay bằng `w-full max-w-none` cho desktop.
- Giữ padding ngang responsive vừa phải để nội dung không dính sát mép: mobile nhỏ, tablet vừa, desktop khoảng `32–48px` tùy token/layout hiện có.
- Task Workspace phải trải rộng theo canvas còn lại; header `Công việc`, thanh chọn `Hôm nay/Kế hoạch`, quick add, filter và danh sách phải cùng một trục trái/phải.
- Không làm card kéo quá dài khó đọc: nếu cần, dùng giới hạn hợp lý cho vùng danh sách hoặc bố cục nội dung bên trong, nhưng không đặt lại một `max-w` hẹp cho toàn bộ app.
- Planner calendar phải được phép dùng gần hết chiều rộng desktop/tablet, không bị ép vào cột giữa.
- Mobile vẫn giữ một cột, không overflow ngang, không thay đổi bottom navigation.
- Giữ nguyên style SketchTask, token, border mực và hard-offset shadow.

### Kiểm tra bắt buộc

1. Desktop khoảng 1280px và 1440px: nội dung Task chiếm phần còn lại sau Sidebar, không còn nằm giữa một cột hẹp.
2. Header, quick add, filter và task list thẳng cùng trục.
3. Planner calendar dùng được chiều rộng mới, không vỡ grid.
4. Tablet khoảng 768px/1024px không tràn ngang.
5. Mobile khoảng 320px/390px giữ nguyên bố cục một cột và bottom nav không che nội dung.
6. Không sửa logic hoặc component Note/Journal.
7. Chạy `npx tsc --noEmit` và `npm run build`.
8. Cập nhật `.agents/ANTIGRAVITY-REPORT.md` với file thật sự thay đổi, ảnh hưởng từng viewport và lỗi chưa xác minh. Không báo PASS nếu chưa kiểm tra trực tiếp.

Không tự triển khai các thay đổi UX khác ngoài việc mở rộng canvas.

---

## LATEST TASK OVERRIDE: TODAY DESKTOP WORKSPACE LAYOUT

Chỉ thực hiện thay đổi bố cục **Tab Hôm nay trên desktop**. Không sửa Dashboard, Planner, Note/Journal hoặc layout mobile trong prompt này.

### Bố cục desktop bắt buộc

- Khu vực bộ lọc nằm ngay trên đầu danh sách task.
- Không tạo một section `Lịch hẹn` riêng phía trên danh sách.
- Dùng một danh sách task thống nhất bên dưới bộ lọc.
- Task có lịch hẹn hiển thị giờ ngay trong card, ví dụ `09:00 Daily Standup` hoặc `09:00 - 10:30`.
- Task có deadline hiển thị deadline trong card.
- Task có ngày nhưng chưa có giờ vẫn hiển thị như task bình thường.
- Task quá hạn giữ trạng thái cảnh báo trong card, không chen thành một danh sách riêng làm vỡ luồng đọc.
- Giữ nhóm `Đã xong` ở cuối danh sách theo pipeline task hiện có.

### Nút `+` trên task card

- Mỗi task chưa hoàn thành có một nút `+` nhỏ, có accessible label và tooltip rõ là `Thêm việc con`.
- Nút này là hành động gắn với task hiện tại, không phải nút thêm task độc lập.
- Khi bấm, mở panel `Thêm việc` ở cạnh phải và tự đặt task đang bấm làm `Công việc cha`.
- Nếu model/API hiện tại chưa hỗ trợ lưu quan hệ cha-con, không tự bịa field mới; kiểm tra contract và ghi rõ giới hạn trong báo cáo.
- Màu của nút `+` không được thay đổi theo priority. Priority phải tiếp tục hiển thị bằng badge riêng trong task card.
- Task độc lập được tạo từ nút thêm chính ở panel/header, không có `Công việc cha`.

### Panel thêm việc bên phải

- Trên desktop, panel mở bằng cách trượt/đẩy từ cạnh phải và làm vùng danh sách bên trái co lại; không dùng backdrop popup phủ lên danh sách.
- Khi panel đóng, chỉ còn nút mở panel ở cạnh phải.
- Bỏ nút `Thêm chi tiết`/`Thu gọn chi tiết` khỏi Quick Add desktop.
- Form hiển thị trực tiếp các trường cần thiết theo ngữ cảnh: tên task, tag, sổ tay, lịch/ngày nếu được phép, giờ hẹn/hạn và priority.
- Khi mở từ nút `+` trên card, hiển thị rõ dòng context `Việc con của: [tên task]` và kế thừa giới hạn ngày/giờ của task cha theo logic hiện có.
- Khi mở từ nút thêm chính, form không tự gán task cha.
- Không tạo bản sao hoặc làm mất metadata task cha.

### Responsive boundary

- Chỉ áp dụng panel phải và bố cục một danh sách mới cho desktop (`min-width` theo breakpoint hiện có, thường `lg`).
- Không thay đổi cấu trúc mobile trong prompt này. Mobile vẫn dùng flow hiện tại và không được xuất hiện panel desktop gây tràn ngang.
- Tablet cần giữ an toàn layout: nếu không đủ rộng thì fallback về một cột, không ép panel và danh sách nằm cạnh nhau.

### Kiểm tra bắt buộc

1. Desktop: filter ở trên, bên dưới chỉ có một danh sách task; không có section lịch hẹn riêng.
2. Task scheduled/deadline hiển thị đúng thời gian trong card, không mất phân biệt loại.
3. Bấm `+` trên task: panel phải mở bên phải, context task cha đúng, không mở popup backdrop.
4. Bấm nút thêm chính: panel tạo task độc lập, không tự gắn task cha.
5. Quick Add desktop không còn `Thêm chi tiết`/`Thu gọn chi tiết`.
6. Priority không điều khiển màu nút `+`; badge priority vẫn rõ.
7. Tablet khoảng 768px/1024px và mobile 320px/390px không tràn ngang, không làm thay đổi flow mobile.
8. Chạy `npx tsc --noEmit` và `npm run build`.
9. Cập nhật `.agents/ANTIGRAVITY-REPORT.md` với file thật sự thay đổi, ảnh hưởng desktop/tablet/mobile, test nút `+`, context task cha và lỗi chưa xác minh. Không báo PASS nếu chưa kiểm tra trực tiếp.

Không tự triển khai thay đổi Dashboard, Planner, Note/Journal hoặc thiết kế lại modal dùng chung.

---

## LATEST TASK OVERRIDE: FIX TASK DESKTOP OVERSTRETCH

Prompt này sửa trực tiếp task mở rộng canvas trước đó. Chỉ sửa layout desktop/tablet của Task Workspace, không sửa logic task, Note Workspace, API hoặc dữ liệu.

### Vấn đề thực tế

Sau khi bỏ giới hạn chiều rộng toàn bộ main, giao diện desktop bị kéo quá rộng: TaskCard thành các dải ngang rất dài, khoảng trống bên phải lớn, mật độ thông tin thấp và khó quét nhanh. Mục tiêu không phải là làm mọi card rộng hết màn hình, mà là dùng diện tích rộng để hiển thị thêm thông tin theo bố cục hợp lý.

### Yêu cầu sửa

- Giữ main canvas rộng sau Sidebar, nhưng tạo vùng nội dung Task có chiều rộng đọc cân bằng, không dùng `w-full` vô hạn cho danh sách card.
- Với desktop khoảng 1280px trở lên, vùng Task Workspace nên rộng khoảng `min(100%, 1100px–1280px)` tùy bề rộng viewport, căn giữa trong canvas còn lại; không quay về cột hẹp `max-w-5xl` cũ.
- Quick Add, filter và header dùng cùng chiều rộng với vùng task list.
- TaskCard không bị dẹt thành một hàng quá dài. Tổ chức lại nội dung card để tận dụng chiều ngang vừa phải:
  - Cột trái: checkbox + tiêu đề.
  - Khu metadata: thời gian chính, tag, sổ tay, ưu tiên, trạng thái cha/con.
  - Cụm action ở bên phải, không đẩy card dài vô hạn.
- Không làm title hoặc metadata nhỏ đến mức khó đọc. Không hiển thị thêm thông tin giả chỉ để lấp khoảng trống.
- Khoảng cách dọc giữa các card phải gọn; card không tăng chiều cao bất thường.
- Planner calendar có thể dùng gần hết chiều rộng vùng workspace, nhưng không làm Today task list kéo theo cùng chiều rộng vô hạn.
- Tablet 768px/1024px phải chuyển sang bố cục một cột hợp lý, không overflow ngang.
- Mobile 320px/390px giữ nguyên một cột, action menu và quick add không bị che bởi bottom nav.

### Không làm

- Không đưa lại `max-w-5xl mx-auto` cho toàn bộ AppShell nếu nó làm bó cả Planner và các màn hình khác.
- Không dùng CSS scale, transform hoặc font nhỏ để chữa overflow.
- Không thay đổi dữ liệu, thứ tự lọc, semantics task, modal, Note/Journal.
- Không dùng grid nhiều cột cho TaskCard ở mobile.

### Kiểm tra bắt buộc

1. Desktop 1280px: card có bề rộng vừa phải, không còn dải ngang trống lớn; nhiều metadata nhìn thấy rõ hơn.
2. Desktop 1440px: vùng Task không vượt quá giới hạn đọc hợp lý và không bị bó giữa màn hình.
3. Header, Quick Add, Filter và TaskCard thẳng cùng trục.
4. Planner calendar vẫn tận dụng được canvas rộng.
5. Tablet 768px/1024px và mobile 320px/390px không tràn ngang.
6. Không có thay đổi ngoài phạm vi layout Task.
7. Chạy `npx tsc --noEmit` và `npm run build`.
8. Cập nhật `.agents/ANTIGRAVITY-REPORT.md` bằng file thật sự thay đổi, ảnh hưởng từng viewport và lỗi chưa xác minh. Không báo PASS nếu chưa kiểm tra trực tiếp.

---

## LATEST TASK OVERRIDE: TODAY DESKTOP WORKSPACE LAYOUT

Chỉ làm lại bố cục **Tab Hôm nay trên desktop**. Không sửa Dashboard, Planner, Note/Journal, mobile flow, API hoặc logic dữ liệu ngoài phần cần thiết để mở task con.

- Bộ lọc nằm ngay trên đầu.
- Bên dưới chỉ có một danh sách task thống nhất; không tạo section `Lịch hẹn` riêng.
- Task scheduled/deadline hiển thị giờ hoặc hạn ngay trong card, vẫn phân biệt rõ loại.
- Task quá hạn giữ cảnh báo trong card, không tách thành danh sách chen vào luồng chính.
- Giữ nhóm `Đã xong` ở cuối pipeline hiện có.
- Mỗi task chưa hoàn thành có nút `+` nhỏ với label/tooltip `Thêm việc con`.
- Bấm `+` phải mở panel `Thêm việc` từ cạnh phải, tự gắn task đang chọn làm `Công việc cha`; không dùng backdrop popup. Nếu API/model chưa lưu được quan hệ cha-con thì không tự bịa field, ghi rõ trong report.
- Nút `+` không đổi màu theo priority. Priority vẫn là badge riêng.
- Nút thêm chính tạo task độc lập, không tự gắn task cha.
- Desktop panel phải đẩy danh sách sang trái. Bỏ `Thêm chi tiết` và `Thu gọn chi tiết` khỏi Quick Add desktop; form hiển thị trực tiếp các trường cần thiết.
- Chỉ áp dụng bố cục panel phải từ breakpoint desktop. Tablet không đủ rộng phải fallback một cột; mobile giữ flow hiện tại và không tràn ngang.
- Không thay đổi modal dùng chung hoặc thiết kế các tab khác.

### Kiểm tra bắt buộc

1. Desktop: filter ở trên, một danh sách task bên dưới, không có section lịch hẹn riêng.
2. Bấm `+` trên task mở đúng panel bên phải và context task cha.
3. Bấm nút thêm chính tạo task độc lập.
4. Quick Add desktop không còn nút chi tiết/thu gọn chi tiết.
5. Desktop 1280/1440, tablet 768/1024, mobile 320/390 không overflow; mobile không đổi flow.
6. Chạy `npx tsc --noEmit` và `npm run build`.
7. Cập nhật `.agents/ANTIGRAVITY-REPORT.md` với file thật sự thay đổi, từng viewport, test nút `+`, context cha-con và lỗi chưa xác minh. Không báo PASS nếu chưa kiểm tra trực tiếp.

---

## LATEST TASK OVERRIDE: FIX TODAY DESKTOP INFORMATION HIERARCHY

Chỉ sửa `TodayTab` và các component Today được nó sử dụng. Không sửa Dashboard, Planner, Note/Journal, API hoặc logic task ngoài phần lọc/render cần thiết.

### Trạng thái hiện tại và mục tiêu

- Code hiện tại đã có đúng hai khu: `TodayScheduleNotes` cho Lịch hẹn ở trên và `TodayTaskList` cho Task ở dưới.
- Giữ nguyên cấu trúc hai khu này. Không gom thành một list duy nhất, không xóa khu Lịch hẹn và không tạo thêm khu thứ ba.
- Chỉ tinh chỉnh mật độ, heading, thứ tự, card và panel bên phải để hai khu dễ đọc hơn.
- Panel chi tiết bên phải không được tự mở khi vào tab nếu người dùng chưa chọn task.

### Bố cục bắt buộc

- Header Today và bộ lọc nằm trên cùng.
- **Khu Lịch hẹn** nằm ở phía trên danh sách task, dành riêng cho scheduled có giờ. Hiển thị dạng timeline/grid gọn: `09:00 - 10:30 · Daily Standup`.
- **Khu Task** nằm bên dưới, chỉ dành cho task cần làm trong ngày: task cả ngày, deadline hôm nay và task có ngày nhưng chưa có giờ.
- Không lặp task scheduled xuống khu Task bên dưới.
- Card ở khu Task hiển thị một dòng thời gian chính: `Hạn · 17:00`, `Cả ngày` hoặc không hiển thị giờ nếu chỉ có ngày.
- Hai khu được phân biệt bằng heading/divider rõ ràng, nhưng dùng chung pipeline lọc và không tạo thêm danh sách thứ ba.
- Task chưa có ngày không hiển thị ở Today.
- Quá hạn không chen vào Today nếu đã thuộc Hạn định/Thông báo theo semantics hiện có.

### Panel bên phải

- Panel `Thêm việc` chỉ mở sau khi bấm nút thêm chính hoặc nút `+` trên task.
- Nếu chưa chọn task và chưa bấm thêm, không tự mở panel chi tiết.
- Bấm `+` trên task mở chế độ thêm việc con và hiển thị `Việc con của: [task cha]`.
- Bấm card hoặc nút xem/sửa mới mở panel chi tiết; đóng panel trả về danh sách.
- Panel desktop đẩy nội dung sang trái, không phủ backdrop toàn màn hình và không ép card thành dải quá dài.

### Dọn UI trong Today

- Bỏ emoji khỏi heading/label UI như `⏰`, `📋`; dùng icon Lucide hoặc text thuần.
- Không dùng native `input type="time"`, `input type="date"` hoặc `<select>` trong Today; dùng picker custom hiện có.
- Thay `shadow-sm` bằng hard-offset shadow theo `.design/TOKENS.md` ở các control Today được chạm tới.
- Không dùng `rounded-full` cho badge/button chính; dot trạng thái nhỏ được phép tròn.
- Không gạch ngang title task khi hoàn thành.

### Kiểm tra bắt buộc

1. Today desktop có hai khu rõ ràng: `Lịch hẹn` ở trên và `Task` ở dưới.
2. Scheduled chỉ xuất hiện trong khu Lịch hẹn; deadline/task cả ngày chỉ xuất hiện trong khu Task.
3. Panel phải không tự mở; mở/đóng đúng theo thao tác.
4. Nút `+` tạo đúng task con, không nhân bản task cha.
5. Kiểm tra task cha/con, hoàn thành, quá hạn và không có ngày.
6. Không còn native date/time/select và emoji heading trong phạm vi Today.
7. Desktop 1280/1440, tablet 768/1024, mobile 320/390 không overflow.
8. Chạy `npx tsc --noEmit` và `npm run build`.
9. Cập nhật `.agents/ANTIGRAVITY-REPORT.md` với file thật sự thay đổi, viewport đã kiểm tra, trạng thái panel và các case dữ liệu. Không báo PASS nếu chưa kiểm tra trực tiếp.

---

# ACTIVE TASK QUEUE: SỔ TAY, CÀI ĐẶT, TỔNG KẾT

Ba prompt dưới đây là ba nhiệm vụ độc lập. **Chỉ thực hiện Prompt 01 trước.** Sau khi hoàn thành và báo cáo Prompt 01, chờ yêu cầu tiếp theo mới xử lý Prompt 02. Prompt 03 chỉ xử lý sau khi Prompt 02 hoàn tất.

## Prompt 01 - Tái cấu trúc Sổ tay

Chỉ xử lý tab Sổ tay. Không thay đổi Dashboard, Today, Planner, Note, Journal, Tổng kết hoặc Cài đặt.

- Màn danh sách sổ hiển thị tên, mô tả ngắn, màu sổ, số Note, số Task và tiến độ nếu có.
- Có nút tạo sổ mới; card sổ gọn, không render toàn bộ task/note bên trong.
- Bấm vào sổ mở màn chi tiết của đúng sổ đó, có nút quay lại.
- Chi tiết chia rõ Note trong sổ và Task trong sổ; Journal chỉ hiển thị entry có `notebookId` tương ứng.
- Không hiển thị dữ liệu của sổ khác, không tự chuyển hoặc nhân bản dữ liệu.
- Dùng dữ liệu `notebooks`, `notes`, `tasks`, `journalEntries` hiện có; không thêm field/API nếu chưa hỗ trợ.
- Desktop dùng layout cân đối; mobile danh sách và chi tiết là hai màn hình liền mạch có Back.
- Theo token/component trong `.design/`; không gradient, glassmorphism, soft shadow, native select.
- Kiểm tra sổ có dữ liệu, sổ rỗng, tạo/mở/quay lại, lọc đúng sổ ở 320/768/1280px.
- Chạy `npx tsc --noEmit` và `npm run build`.

Báo cáo file thực tế đã đổi, logic lọc và kết quả kiểm tra. Không xử lý Prompt 02/03 trong lượt này.

## Prompt 02 - Tái cấu trúc Cài đặt (chờ Prompt 01)

Chỉ xử lý Cài đặt. Không thay đổi các tab khác.

- Chia nhóm: Tài khoản, Giao diện, Ngôn ngữ, Thông báo, Đồng bộ & Dữ liệu, Về ứng dụng.
- Desktop có danh sách nhóm và panel chi tiết; mobile danh sách nhóm rồi mở trang chi tiết có Back.
- Chỉ triển khai setting đã có state/persistence; phần chưa có cơ chế phải ghi rõ Planned, không tạo setting giả.
- Notification phải dùng Service Worker registration, không gọi `new Notification()` trực tiếp.
- Version lấy từ nguồn version chung, không hardcode thêm.
- Không xóa dữ liệu nếu chưa có xác nhận rõ ràng; không đổi schema/API ngoài phạm vi.
- Kiểm tra 320/768/1280px, reload persistence, `npx tsc --noEmit`, `npm run build`.

## Prompt 03 - Tái cấu trúc Tổng kết (chờ Prompt 02)

Chỉ xử lý Tổng kết. Không thay đổi các tab khác.

- Tổng kết trả lời người dùng đã làm được gì, không lặp Dashboard và không render toàn bộ TaskCard.
- Có bộ chọn Tuần/Tháng/khoảng tùy chọn nếu hệ thống hỗ trợ; không dùng native date picker.
- Hiển thị task đã hoàn thành, đang làm, quá hạn và tỷ lệ hoàn tất bằng logic task dùng chung.
- Có tiến độ theo ngày, phân tích theo sổ/nhãn nếu có dữ liệu, và tối đa vài journal entry gần nhất.
- Ngày không có dữ liệu phải hiện 0; không để NaN/undefined; không kéo dữ liệu ngoài khoảng chọn.
- Desktop 2-3 cột, tablet giảm cột, mobile xếp dọc; dùng token/design system hiện có.
- Kiểm tra 320/768/1280px, dữ liệu rỗng và dữ liệu đầy đủ, `npx tsc --noEmit`, `npm run build`.

Không báo cáo PASS nếu chưa kiểm tra trực tiếp. Chỉ đọc Prompt 02/03 khi được yêu cầu.

## FOLLOW-UP PROMPT 01A - Hoàn tất xác minh Sổ tay

Chỉ sửa các thiếu sót của Prompt 01, không mở rộng sang Prompt 02/03.

- Kiểm tra card sổ và vùng `Mở sổ`: expose đúng semantics tương tác (`button` hoặc link/button rõ ràng), hỗ trợ click, Enter/Space và vùng chạm tối thiểu 44px.
- Giữ nguyên luồng mở chi tiết và `Quay lại Kệ Sổ`; không tạo thêm dữ liệu khi click.
- Xác minh sổ A chỉ hiển thị Note/Task/Journal có đúng `notebookId` của sổ A; sổ B không bị trộn dữ liệu.
- Kiểm tra sổ rỗng và sổ có dữ liệu trên 320/768/1280px.
- Cập nhật `.agents/ANTIGRAVITY-REPORT.md` bằng một mục mới ghi rõ Prompt 01/01A, file thực tế đã đổi, case đã kiểm tra và kết quả TypeScript/build. Không sử dụng lại kết quả PASS của task cũ.
- Chạy `npx tsc --noEmit` và `npm run build`; nếu môi trường không chạy được phải ghi đúng lỗi, không báo PASS giả.

Sau khi hoàn tất Follow-up 01A, dừng lại và chờ yêu cầu mới. Không đọc hoặc xử lý Prompt 02/03.

## LATEST TASK OVERRIDE - Đồng bộ giao diện 3 tab còn lại

Trước khi xử lý Prompt 01, 02 hoặc 03, bắt buộc đối chiếu trực tiếp `TodayTab`, `PlannerTab`, `TasksTab`, `AppShell` và component dùng chung. Sổ tay, Tổng kết và Cài đặt phải là cùng một sản phẩm với ba tab chính, không được tự tạo visual language riêng.

Áp dụng chung cho cả ba prompt:

- Giữ cùng page shell, content width, page padding, header hierarchy, typography scale, line-height và spacing rhythm như Today/Planner/Task.
- Dùng cùng token màu, border `1.5px`, radius, hard offset shadow, button/input height, focus ring và trạng thái active/disabled/loading/error/empty.
- Ưu tiên component dùng chung trong `client/src/components/ui` và `features/shared`; không copy-paste style hoặc tạo variant riêng nếu pattern hiện có đã đáp ứng.
- Desktop, tablet và mobile dùng cùng breakpoint/responsive rules; chỉ thay đổi cấu trúc nội dung theo nhu cầu của tab.
- Không dùng gradient, glassmorphism, soft shadow, native select/date/time hoặc emoji thay icon Lucide.
- Mật độ thông tin phải tương đương các tab chính; không dùng card/panel quá cao hoặc khoảng trống quá rộng.
- Mỗi prompt vẫn chỉ xử lý đúng một tab. Không sửa chéo tab khác ngoài component dùng chung thật sự cần thiết.
- Khi báo cáo phải so sánh trực tiếp tab đang làm với Today/Planner/Task ở cùng viewport và ghi rõ file dùng chung được tái sử dụng.
- Không báo PASS nếu chức năng đúng nhưng giao diện vẫn nhìn như một sản phẩm khác.

## LATEST TASK OVERRIDE - Hợp nhất UI Sổ tay, bỏ layout cũ/mới lẫn lộn

Chỉ xử lý tab Sổ tay. Không thay đổi Dashboard, Today, Planner, Task, Note, Journal, Tổng kết hoặc Cài đặt.

### Vấn đề cần xử lý

UI Sổ tay hiện đang trộn hai kiến trúc:
- Header/kệ sách màu vàng và form thêm việc kiểu cũ.
- Layout Task/Kế hoạch mới với page header, toolbar và card gọn.

Kết quả là header Sổ tay quá lớn, form thêm việc mở sẵn chiếm gần toàn màn hình, nhiều field/chip xuất hiện cùng lúc và mật độ khác hẳn các tab chính.

### Chuẩn layout bắt buộc

Đưa Sổ tay về cùng shell và nhịp layout với `TodayTab`, `PlannerTab` và `TasksTab`:

```text
Page Header gọn
-> Toolbar / bộ lọc gọn
-> Nội dung chính
-> Composer chỉ mở sau khi bấm nút thêm
-> Danh sách card đồng nhất
```

- Dùng cùng content width, page padding, header height, typography, border, radius, hard shadow và button/input height của các tab chính.
- Không tạo giao diện “kệ sách” riêng biệt với header vàng quá lớn.
- Giữ accent màu của từng notebook ở mức phụ, không tô toàn bộ panel lớn.

### Composer

- Không render form `Thêm việc` đầy đủ ngay khi mở Sổ tay.
- Chỉ hiển thị một nút thêm gọn ở toolbar hoặc đầu khu vực nội dung.
- Khi bấm nút thêm mới mở composer inline hoặc panel gọn.
- Composer đóng lại sau khi lưu hoặc hủy.
- Các field nâng cao không được phình ra mặc định; chỉ mở khi người dùng chủ động chọn.
- Không tự tạo task/note khi component render.

### Nội dung sổ

- Màn danh sách chỉ hiển thị các notebook card gọn, cùng style với card của Task/Note.
- Bấm một notebook mở chi tiết đúng notebook đó.
- Chi tiết có header gọn, nút `Quay lại`, summary ngắn và segmented section `Công việc | Ghi chú | Nhật ký`.
- Không render task/note/journal của notebook khác.
- Dùng lại `TaskList`, `NoteCard`/preview note và các component shared hiện có; không copy lại một bộ card/style thứ hai.
- Task trong Sổ tay vẫn hiển thị theo `TaskCard` chuẩn, không tạo card task riêng cho Notebook.

### Dọn kiến trúc cũ

- Kiểm tra `NotebookHeader`, `NotebookList`, `NotebookDetail`, `NotebookTaskList` và các component liên quan để loại bỏ markup/style trùng lặp hoặc không còn được dùng.
- Không xóa component nếu còn import; nếu thay thế, cập nhật toàn bộ import và kiểm tra build.
- Không thay đổi schema/API, `notebookId`, dữ liệu localStorage hoặc logic CRUD.

### Responsive và kiểm tra

- Desktop 1280/1440: content chiếm vùng làm việc hợp lý, không nằm trong panel hẹp giữa màn hình.
- Tablet 768/1024: giảm cột nhưng giữ cùng hierarchy.
- Mobile 320/390: danh sách -> chi tiết, composer không che bottom nav và không tràn ngang.
- So sánh trực tiếp screenshot Sổ tay với Today/Planner/Task ở cùng viewport.
- Chạy `npx tsc --noEmit` và `npm run build`; nếu runner lỗi phải ghi đúng lỗi, không báo PASS giả.
- Cập nhật `.agents/ANTIGRAVITY-REPORT.md` bằng mục mới, ghi file thật sự thay đổi và component cũ đã loại bỏ/tái sử dụng.

Chỉ xử lý override này, không đọc hoặc làm Prompt 02/03.

## FOLLOW-UP PROMPT 01B - Chặn scope creep và dữ liệu mẫu ngoài phạm vi

Prompt 01/01A hiện chưa đạt để chuyển tiếp. Báo cáo mới ghi nhận thay đổi ngoài phạm vi Sổ tay, bao gồm Journal picker, `TwoPageJournalBook`, `JournalEntryCard`, dữ liệu mẫu Journal/Note và các luồng Nhật ký. Chỉ tiếp tục sau khi kiểm tra lại.

- Đối chiếu toàn bộ file thay đổi của lượt Prompt 01/01A với phạm vi Sổ tay.
- Không tự ý thêm, reset, nhân bản hoặc thay đổi dữ liệu mẫu trong `appStore.tsx` và `noteStorage.ts`.
- Không thay đổi logic, UI hoặc dữ liệu Nhật ký cho nhiệm vụ này. Nếu các thay đổi Journal là do lượt này tạo ra, khôi phục đúng hành vi trước nhiệm vụ bằng cách đọc diff/commit liên quan; không dùng lệnh destructive và không đụng thay đổi người dùng không liên quan.
- Không tạo thêm picker, component hoặc flow mới ngoài phạm vi Sổ tay nếu không cần cho việc lọc `notebookId`.
- Giữ Sổ tay dùng cùng visual language với Today/Planner/Task, nhưng không bê nguyên toàn bộ UI Journal/Today vào Sổ tay làm phát sinh scope mới.
- Kiểm tra lại dữ liệu sau reload: không có bản ghi mới chỉ vì mở tab, chuyển sổ hoặc render component.
- Cập nhật `.agents/ANTIGRAVITY-REPORT.md` bằng một mục riêng `FOLLOW-UP 01B`, liệt kê chính xác file trong phạm vi và file ngoài phạm vi đã được xử lý.
- Chạy `npx tsc --noEmit` và `npm run build` thật sự; nếu không chạy được phải ghi đúng lỗi.

Chưa được xử lý Prompt 02/03 cho đến khi Follow-up 01B đạt.

## LATEST ACTIVE TASK - PROMPT 02: TÁI CẤU TRÚC CÀI ĐẶT

Prompt 01 đã được người dùng cho phép kết thúc. Từ thời điểm này, chỉ xử lý Prompt 02 - Tái cấu trúc Cài đặt trong file này.

- Đọc đầy đủ phần `Prompt 02 - Tái cấu trúc Cài đặt` và `Visual contract bắt buộc` của Prompt 02.
- Đối chiếu trực tiếp với `Today`, `Planner`, `Task` và `AppShell` trước khi sửa.
- Không xử lý Prompt 03 - Tổng kết.
- Không thay đổi logic hoặc UI của Today, Planner, Task, Note, Journal hoặc Sổ tay, trừ component dùng chung thật sự cần thiết.
- Cập nhật `.agents/ANTIGRAVITY-REPORT.md` bằng mục riêng cho Prompt 02, ghi file thực tế thay đổi, setting thực sự hoạt động, setting Planned và kết quả kiểm tra thật.

## LATEST ACTIVE TASK - PROMPT 04: CHUẨN HÓA NGỮ CẢNH TASK VÀ NGÀY QUÁ HẠN

Prompt 04 là lượt đang hoạt động mới nhất. Đọc toàn bộ nội dung tại `.agents/PROMPT-04-TASK-CONTEXT-LOGIC.md` và chỉ thực hiện đúng phạm vi đó.

- Ưu tiên logic dùng chung trước, chưa chỉnh UI lớn.
- Giữ task quá hạn ở ngày gốc trong Planner; chỉ không kéo task quá hạn ngày trước vào Today.
- Cùng task được phép xuất hiện ở ngày gốc và Hạn định/Thông báo, không tạo bản sao dữ liệu.
- Không xử lý Prompt 02 hoặc Prompt 03 trong lượt này.
- Cập nhật `.agents/ANTIGRAVITY-REPORT.md` bằng mục riêng `PROMPT 04` và ghi kết quả kiểm tra thật.

## LATEST ACTIVE TASK - PROMPT 05: KHÓA TẠO TASK Ở NGÀY QUÁ KHỨ VÀ GOM HẠN THEO NGÀY

Prompt 05 là lượt đang hoạt động mới nhất. Đọc toàn bộ nội dung tại `.agents/PROMPT-05-PLANNER-PAST-DATE-DEADLINE-GROUPING.md` và chỉ thực hiện đúng phạm vi đó.

- Ngày quá khứ trong Planner chỉ được xem và xử lý task cũ, không được tạo task mới.
- Hạn định/Thông báo phải gom các task quá hạn theo ngày hiệu lực.
- Không làm lại Prompt 04 nếu không có regression trực tiếp.
- Không xử lý Prompt 02 hoặc Prompt 03.
- Cập nhật `.agents/ANTIGRAVITY-REPORT.md` bằng mục riêng `PROMPT 05` và ghi kết quả kiểm tra thật.

## LATEST ACTIVE TASK - PROMPT 06: ĐỒNG BỘ VISUAL TODAY VÀ PLANNER

Prompt 06 là lượt đang hoạt động mới nhất. Đọc toàn bộ nội dung tại `.agents/PROMPT-06-TODAY-PLANNER-VISUAL-CONSISTENCY.md` và chỉ thực hiện đúng phạm vi đó.

- Chỉ đồng bộ UI Today và Planner.
- Không thay đổi logic task đã đạt ở Prompt 04/05.
- Không bỏ các mode Tuần/Tháng/Năm hoặc cấu trúc Sidebar phân cấp.
- Không xử lý Dashboard, Note, Journal, Sổ tay hoặc Cài đặt.
- Cập nhật `.agents/ANTIGRAVITY-REPORT.md` bằng mục riêng `PROMPT 06` và ghi kết quả kiểm tra thật.

## LATEST ACTIVE TASK - PROMPT 07: FINAL POLISH TODAY / PLANNER

Prompt 07 là lượt đang hoạt động mới nhất. Đọc toàn bộ nội dung tại `.agents/PROMPT-07-TODAY-PLANNER-FINAL-POLISH.md` và chỉ thực hiện đúng phạm vi đó.

- Chỉ sửa các lỗi visual còn sót lại của Today và Planner sau Prompt 06.
- Không thay đổi logic task, dữ liệu, API, Note, Journal, Sổ tay, Cài đặt hoặc Dashboard.
- Giữ nguyên các khác biệt có chủ đích giữa Today và Planner, cũng như các mode Tuần/Tháng/Năm.
- Cập nhật `.agents/ANTIGRAVITY-REPORT.md` bằng mục riêng `PROMPT 07`, ghi file thực tế thay đổi và kết quả kiểm tra thật.

## LATEST ACTIVE TASK - PROMPT 08: AUDIT CONTROL TODAY / PLANNER

Prompt 08 là lượt đang hoạt động mới nhất. Đọc toàn bộ nội dung tại `.agents/PROMPT-08-TODAY-PLANNER-CONTROL-AUDIT.md` và chỉ thực hiện đúng phạm vi đó.

- Chỉ audit các control visual còn lệch chuẩn trong Today và Planner.
- Không thay đổi logic task, dữ liệu, API hoặc các tab khác.
- Giữ nguyên hierarchy Today/Planner và các mode Tuần/Tháng/Năm.
- Cập nhật `.agents/ANTIGRAVITY-REPORT.md` bằng mục riêng `PROMPT 08`, ghi kết quả kiểm tra thật.

## LATEST ACTIVE TASK - PROMPT 09: COMPLETE TODAY / PLANNER CONTROLS

Prompt 09 là lượt đang hoạt động mới nhất. Đọc toàn bộ nội dung tại `.agents/PROMPT-09-COMPLETE-TODAY-PLANNER-CONTROLS.md` và chỉ thực hiện đúng phạm vi đó.

- Chỉ hoàn tất các control visual còn sót sau Prompt 08.
- Không thay đổi logic task, dữ liệu, API, layout lớn hoặc các tab khác.
- Giữ nguyên hierarchy Today/Planner và các mode Tuần/Tháng/Năm.
- Cập nhật `.agents/ANTIGRAVITY-REPORT.md` bằng mục riêng `PROMPT 09`, ghi file thực tế thay đổi và kết quả kiểm tra thật.

## LATEST ACTIVE TASK - PROMPT 10: FINAL QUICK-ADD CONTROL CLEANUP

Prompt 10 là lượt đang hoạt động mới nhất. Đọc toàn bộ nội dung tại `.agents/PROMPT-10-FINAL-QUICKADD-CONTROL-CLEANUP.md` và chỉ thực hiện đúng phạm vi đó.

- Chỉ sửa các class visual còn sót trong QuickAdd dùng bởi Today/Planner và progress container của TodayHeader.
- Không thay đổi logic task, dữ liệu, API, layout hoặc các tab khác.
- Cập nhật `.agents/ANTIGRAVITY-REPORT.md` bằng mục riêng `PROMPT 10`, ghi file thực tế thay đổi và kết quả kiểm tra thật.

## LATEST ACTIVE TASK - PROMPT 11: PLANNER CALENDAR SEMANTIC VISUAL FIX

Prompt 11 là lượt đang hoạt động mới nhất. Đọc toàn bộ nội dung tại `.agents/PROMPT-11-PLANNER-CALENDAR-SEMANTIC-VISUAL.md` và chỉ thực hiện đúng phạm vi đó.

- Chỉ sửa visual/accessible semantics của Planner Calendar.
- Không thay đổi task logic, API, dữ liệu, Today, Notification, Quick Add hoặc các tab khác.
- Giữ nguyên mode Tuần/Tháng/Năm và quy tắc không lấy task từ ô tháng phụ.
- Cập nhật `.agents/ANTIGRAVITY-REPORT.md` bằng mục riêng `PROMPT 11`, ghi kết quả kiểm tra thật.

## LATEST ACTIVE TASK - PROMPT 12: NOTIFICATION OVERDUE / PAST SCHEDULED

Prompt 12 là lượt đang hoạt động mới nhất. Đọc toàn bộ nội dung tại `.agents/PROMPT-12-NOTIFICATION-OVERDUE-SCHEDULED.md` và chỉ thực hiện đúng phạm vi đó.

- Chỉ xử lý grouping, filter và control visual của Notification.
- Không sửa Today, Planner Calendar, Quick Add hoặc các tab khác.
- Giữ nguyên bottom sheet mobile, task detail và công thức badge cảnh báo.
- Cập nhật `.agents/ANTIGRAVITY-REPORT.md` bằng mục riêng `PROMPT 12`, ghi kết quả kiểm tra thật.

## LATEST ACTIVE TASK - PROMPT 13: PLANNER FILTER COMPACT AUDIT

Prompt 13 là lượt đang hoạt động mới nhất. Đọc toàn bộ nội dung tại `.agents/PROMPT-13-PLANNER-FILTER-COMPACT.md` và chỉ thực hiện đúng phạm vi đó.

- Chỉ audit giao diện và callback filter của Planner.
- Không sửa Calendar, Backlog logic, Notification, Today hoặc tab khác.
- Giữ nguyên CustomSelect, giá trị filter và pipeline lọc hiện có.
- Cập nhật `.agents/ANTIGRAVITY-REPORT.md` bằng mục riêng `PROMPT 13`, ghi kết quả kiểm tra thật.

## LATEST ACTIVE TASK - PROMPT 14: PLANNER BACKLOG FLOW AUDIT

Prompt 14 là lượt đang hoạt động mới nhất. Đọc toàn bộ nội dung tại `.agents/PROMPT-14-PLANNER-BACKLOG-FLOW.md` và chỉ thực hiện đúng phạm vi đó.

- Chỉ audit flow Hộp chờ và việc xếp task vào ngày.
- Không sửa Calendar visual, Notification, Today, Filter hoặc các tab khác.
- Giữ nguyên metadata task, không tạo bản sao và khóa đúng ngày quá khứ.
- Cập nhật `.agents/ANTIGRAVITY-REPORT.md` bằng mục riêng `PROMPT 14`, ghi kết quả kiểm tra thật.

## LATEST ACTIVE TASK - PROMPT 15: APP SHELL CONTENT FRAME CONSISTENCY

Prompt 15 là lượt đang hoạt động mới nhất. Đọc toàn bộ nội dung tại `.agents/PROMPT-15-APP-SHELL-CONTENT-FRAME.md` và chỉ thực hiện đúng phạm vi đó.

- Chỉ chuẩn hóa content frame bên ngoài giữa các tab.
- Không redesign nội dung, không đổi logic/data/API/navigation và không khôi phục Tổng kết.
- Giữ giới hạn nội bộ hợp lý của editor/book/settings khi cần, nhưng không để page bị co hẹp bất thường.
- Cập nhật `.agents/ANTIGRAVITY-REPORT.md` bằng mục riêng `PROMPT 15`, ghi kết quả kiểm tra thật.

## LATEST ACTIVE TASK - PROMPT 16: CONTENT FRAME FOLLOW-UP

Prompt 16 là lượt đang hoạt động mới nhất. Đọc toàn bộ nội dung tại `.agents/PROMPT-16-CONTENT-FRAME-FOLLOWUP.md` và chỉ thực hiện đúng phạm vi đó.

- Chỉ sửa khung ngoài của Dashboard, Note/Journal, Sổ tay và Cài đặt.
- Không redesign nội dung nội bộ, không đổi logic/data/API/navigation và không khôi phục Tổng kết.
- Giữ max-width nội bộ khi nó phục vụ editor, modal, card hoặc panel có chủ đích.
- Cập nhật `.agents/ANTIGRAVITY-REPORT.md` bằng mục riêng `PROMPT 16`, ghi kết quả kiểm tra thật.

## LATEST ACTIVE TASK - PROMPT 17: TYPOGRAPHY, APP HEADER & PROGRESS CARD

Prompt 17 là lượt đang hoạt động mới nhất. Đọc toàn bộ nội dung tại `.agents/PROMPT-17-TYPOGRAPHY-HEADER-PROGRESS.md` và chỉ thực hiện đúng phạm vi đó.

- Chỉ sửa typography hierarchy, AppHeader và ProgressCard/sidebar progress.
- Không sửa logic task, icon inventory, Note/Sổ tay, animation toàn app hoặc API.
- Cập nhật `.agents/ANTIGRAVITY-REPORT.md` bằng mục riêng `PROMPT 17`, ghi kết quả kiểm tra thật.
