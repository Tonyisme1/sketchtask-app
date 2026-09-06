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
