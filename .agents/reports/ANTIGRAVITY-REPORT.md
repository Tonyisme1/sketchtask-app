# Báo Cáo Bàn Giao Cho Antigravity

**Ngày:** 2026-09-05  
**Phạm vi:** Tái cấu trúc điều hướng app và nút tạo mới theo phương án 4 luồng chính.

## Bổ Sung: Sửa API Khi Chạy Local

- Nguyên nhân lỗi `404` admin: `client/.env` đã trỏ `VITE_API_URL` tới `https://sketchtask-app.onrender.com/api/v1`, nên frontend local vẫn gọi backend production.
- Đã bỏ `VITE_API_URL` khỏi `client/.env` local.
- Đã gia cố `client/src/services/api.ts`: khi `import.meta.env.DEV` luôn dùng relative `/api/v1` và WebSocket theo host hiện tại qua Vite proxy.
- `client/.env.production` vẫn giữ URL Render để không ảnh hưởng bản deploy.
- Sau khi đổi `.env`, cần restart Vite vì biến môi trường được đọc lúc khởi động.
- Backend local đã phản hồi `200` tại `/health`.
- Endpoint admin local đã trả `401` khi chưa có token, xác nhận route tồn tại; lỗi `404` trước đó chỉ do gọi nhầm Render.

## Đã Cập Nhật

### 1. Điều hướng chính

- Đã bỏ `Dashboard` khỏi điều hướng chính.
- Điều hướng chính hiện gồm 4 luồng:
  - `Hôm nay`
  - `Kế hoạch`
  - `Ghi chép`
  - `Tổng kết`
- Nội dung tổng quan cũ của Dashboard được tái sử dụng trong `Tổng kết` qua `ReviewTab`.
- `Ghi chép` vẫn có các mục con `Ghi chú` và `Nhật ký`.
- `Sổ tay` và `Cài đặt` là mục phụ, không chiếm một tab chính.
- Nút quay về trong Cài đặt đã đổi từ `Về Dashboard` thành `Về tổng kết`.

### 2. FAB tạo mới theo ngữ cảnh

- Đã tạo `ContextAwareFab` dùng chung ở góc phải dưới.
- Đã bỏ FAB mobile riêng bị trùng trong Ghi chú và Nhật ký.
- Ngữ cảnh task:
  - `Hôm nay`: `Tạo task hôm nay`
  - `Kế hoạch`: `Tạo task trong kế hoạch`
  - `Hạn định`: `Tạo task có hạn`
- Ngữ cảnh `Ghi chú`: phát event tạo ghi chú mới.
- Ngữ cảnh `Nhật ký`: phát event viết nhật ký mới.
- Ngữ cảnh `Sổ tay`: mở form tạo sổ tay mới.
- Ngữ cảnh `Tổng kết` và `Cài đặt`: không hiển thị FAB.

### 3. Modal tạo task độc lập

- `GlobalTaskCreateModal` trước đây đã có state/import nhưng chưa được render.
- Đã render modal thật trong `AppShell`.
- FAB task hiện mở được modal tạo task đầy đủ thay vì không có phản hồi.

### 4. Đồng bộ trạng thái giao diện

- Đã truyền `activeTaskSubTab` xuống FAB và MobileNav.
- Trạng thái active của `Hôm nay` và `Kế hoạch` không còn nhầm khi cùng nằm trong workspace task.
- Thanh mobile chỉ còn 4 nút, không còn nút `+` riêng trong thanh điều hướng.
- Các nút thêm nội dung inline trong form vẫn giữ nguyên vì không phải nút điều hướng.

## File Đã Thay Đổi

- `client/src/App.tsx`
- `client/src/components/layout/AppShell.tsx`
- `client/src/components/layout/MobileNav.tsx`
- `client/src/components/layout/ContextAwareFab.tsx`
- `client/src/components/layout/Sidebar.tsx`
- `client/src/components/features/review/ReviewTab.tsx`
- `client/src/components/features/settings/SettingsTab.tsx`
- `client/src/components/features/notes/NotesTab.tsx`
- `client/src/components/features/journal/JournalBook.tsx`
- `client/src/components/features/notebooks/NotebooksTab.tsx`
- `client/src/types/index.ts`
- `client/src/services/api.ts`
- `client/.env` (chỉ cấu hình local, không commit secret)

## Đã Kiểm Tra

- `npx tsc --noEmit`: đạt, không có lỗi TypeScript.
- `npm run build` trong `client`: đạt.
- `git diff --check`: không có lỗi whitespace.
- Local backend `/health`: `200`.
- Local admin overview không token: `401` đúng với route bảo vệ.
- Build còn cảnh báo bundle JavaScript lớn hơn 500 kB; đây là cảnh báo tối ưu bundle, không chặn build.

## Antigravity Cần Đọc Trước Khi Sửa Tiếp

- Đây là báo cáo bàn giao trạng thái hiện tại, không phải yêu cầu làm lại toàn bộ.
- Khi sửa tiếp, giữ đúng 4 luồng chính và không đưa Dashboard trở lại sidebar/mobile nav.
- Không tạo thêm FAB riêng trong từng tab nếu chức năng đã thuộc `ContextAwareFab`.
- Nếu cần chỉnh giao diện, đối chiếu source thực tế trước vì worktree còn có các thay đổi khác chưa thuộc phạm vi bàn giao này.
- Chưa xác minh visual bằng trình duyệt ở các viewport; cần kiểm tra thủ công mobile, tablet và desktop trước khi đánh dấu hoàn tất UI.

## Bổ Sung: Back Trong App Và Guardrail Planner

- Đã bổ sung xử lý Back dùng chung trong `client/src/App.tsx`: ưu tiên đóng task detail, Settings detail, note detail, notebook detail, rồi mới quay về workspace trước đó.
- Trên Capacitor, nút Back phần cứng chỉ gọi thoát app sau khi không còn màn hình nội bộ nào để quay lại.
- Trên browser/PWA, history guard giữ người dùng trong app để Back lần đầu tháo lớp giao diện hiện tại thay vì rời app ngay.
- Planner không còn hiện Quick Add ở ngày quá khứ; các nút xóa và dời việc trong lịch tuần đã nối callback thật.
- Task detail đã bỏ autosave khi đang nhập/chọn; chỉ lưu khi bấm `Lưu`. Note và Journal không thuộc thay đổi này.
- Kiểm tra cuối lượt: `npx tsc --noEmit --pretty false` đạt, `npm run build` trong client đạt, `git diff --check` không phát hiện lỗi whitespace.
- Chưa thay thế được kiểm tra Back trên Android/iOS thật; cần kiểm tra thủ công khi đóng gói APK/PWA.

## Bổ Sung: Account Menu Và Swipe Task (2026-09-07)

- Header desktop, tablet và mobile hiện dùng luồng menu tài khoản thay vì mở thẳng AuthModal.
- Desktop mở Settings bằng popup lớn trong `DesktopShell`; tablet/mobile chuyển tới Settings fullscreen và giữ quy tắc ẩn bottom dock.
- Người dùng chưa đăng nhập chọn `Đăng nhập / Đăng ký` sẽ đi tới route `/login`; người dùng đã đăng nhập có hành động `Đăng xuất` dùng `logout` của store.
- Desktop và tablet dùng component dùng chung `client/src/components/layout/AccountMenu.tsx`; mobile giữ menu header nhưng đã nối cùng callback Settings/login/logout.
- `TaskCard` ở ngữ cảnh Today có action rail phía sau task. Vuốt trái đủ ngưỡng sẽ giữ task ở vị trí mở và hiện `Dời sang ngày mai`/`Xóa`; kéo ngược về vị trí ban đầu sẽ hủy.
- Long press trên touch vẫn mở action rail; chạm task bình thường vẫn mở chi tiết.
- Đã kiểm tra: `client/npx tsc --noEmit --pretty false`, `client/npm run build`, `git diff --check` đều đạt. Build còn cảnh báo bundle chính > 500 kB.
- Chưa xác minh bằng thiết bị thật: pointer capture trên Android Chrome/iOS Safari và vị trí dropdown ở mọi kích thước màn hình.

## Mobile Focus Pass - 2026-09-10

- Mobile notes hiện mở màn hình `Mục lục trang` trước; người dùng chạm vào một note mới vào editor. Nút `Danh sách ghi chú` quay lại list và không còn tự focus note đầu tiên.
- Mobile planner đã giữ đúng ngày người dùng chọn; không còn effect reset về hôm nay sau mỗi render. Day view phân tách rõ `Lịch hẹn` và `Công việc`.
- Header mobile bỏ icon khối cạnh tên `Kế hoạch`, `Hạn định`, `Ghi chú`, `Nhật ký`, `Sổ tay`; Hôm nay giữ logo gọn ở đầu app.
- Chuyển cảnh mobile bỏ fade cũ ở workspace chính: tab trượt từ dưới lên, màn chi tiết trượt từ phải vào, back quay lại bằng chiều ngược. Settings drill-down, note editor và task detail dùng cùng quy tắc.
- Mobile không còn gợi ý phím tắt trong placeholder/hướng dẫn tạo task; mục `Phím tắt bàn phím` tiếp tục bị ẩn khỏi Settings mobile.
- Toolbar rich-text của note vẫn ẩn khi chưa chạm vùng soạn thảo và chỉ fixed phía trên bàn phím khi editor được focus.
- Đã bỏ blur nền ở các overlay mobile để giữ đúng quy tắc giao diện nét mực, không glassmorphism.
- Đã kiểm tra trực tiếp viewport `390x844`: Today, Kế hoạch, Hạn định, Ghi chép, note editor/list, Settings, login, task detail, search overlay và back flow.
- Xác minh: `npx tsc --noEmit --pretty false` đạt; `npm run build:client` đạt; `git diff --check` đạt; console browser không có warning/error. Build còn cảnh báo chunk chính lớn hơn `500 kB`, không chặn build.
## Mobile Planner Follow-up - 2026-09-10

- Replaced the mobile Planner agenda's weekly strip plus inline selected-day task list with seven full-width day rows. Each row summarizes task, appointment, deadline, and completion counts, previews up to two task titles, and opens the selected day detail directly.
- Fixed mobile task swipe actions showing through untouched rows by giving the row surface an opaque background and disabling action hit targets until the row is actually translated.
- Renamed the mobile agenda control to `7 ngày` so the control matches the new list behavior while retaining the desktop `Lịch trình` label.
- Verification: mobile browser snapshot shows the seven-day list; `npx tsc --noEmit --pretty false` passes; `npm run build:client` passes; `git diff --check` passes. The existing Vite large-chunk warning remains non-blocking.

## Habit Surface Removal - 2026-09-10

- Removed habit cards and quick-check controls from Today on mobile, tablet, and desktop.
- Removed habit counts from active Settings sync statistics and account/auth data summaries so the current UI no longer presents an unfinished habit workflow.
- Kept habit data and sync/storage fields intact for backward compatibility; no existing habit records are deleted.
