# Prompt 01: Tái cấu trúc Sổ tay

## Visual contract bắt buộc

Tab Sổ tay phải dùng cùng visual language với `Today`, `Planner` và `Task`: cùng page shell, content width, header hierarchy, typography scale, spacing rhythm, border `1.5px`, màu token, hard offset shadow, button height, focus/active state và responsive breakpoint. Không tạo một phong cách “kệ sách” riêng làm lệch app; chỉ dữ liệu Sổ tay được khác biệt.

Chỉ xử lý tab Sổ tay. Không thay đổi Dashboard, Today, Planner, Note, Journal, Tổng kết hoặc Cài đặt.

## Mục tiêu

Biến Sổ tay thành nơi quản lý nội dung theo chủ đề, không phải một bản sao của tab Task.

## Yêu cầu

1. Màn hình danh sách sổ
- Hiển thị tên sổ, mô tả ngắn, màu sổ.
- Hiển thị số lượng Note và Task trong sổ.
- Hiển thị tiến độ gọn nếu có dữ liệu.
- Có nút tạo sổ mới.
- Card sổ gọn, không render toàn bộ task/note bên trong.

2. Màn hình chi tiết sổ
- Bấm vào sổ để mở nội dung của riêng sổ đó.
- Có nút quay lại danh sách sổ.
- Chia nội dung thành hai khu vực rõ ràng: Note trong sổ và Task trong sổ.
- Nhật ký liên quan chỉ hiển thị nếu entry có `notebookId` tương ứng.
- Không hiển thị dữ liệu của sổ khác.

3. Dữ liệu
- Dùng `notebooks`, `notes`, `tasks`, `journalEntries` hiện có.
- Không tạo field mới nếu API/store chưa hỗ trợ.
- Không tự chuyển Note hoặc Task sang sổ khác.
- Không tạo dữ liệu mẫu và không nhân bản dữ liệu.

4. Responsive
- Desktop: danh sách sổ ở trái hoặc dạng lưới cân đối; chi tiết chỉ mở sau khi chọn.
- Mobile: danh sách và chi tiết là hai màn hình liền mạch, có nút Back.
- Không tràn ngang, vùng click tối thiểu 44px.

5. UI
- Theo `.design/TOKENS.md` và `.design/COMPONENTS.md`.
- Border nét mực, hard offset shadow, không gradient, không glassmorphism.
- Không dùng native select.
- Không dùng font, radius, shadow, màu hoặc trạng thái tương tác riêng chỉ cho Sổ tay.

## Kiểm tra

- Tạo, mở và quay lại một sổ.
- Sổ A không hiển thị nội dung của sổ B.
- Sổ rỗng có empty state.
- Kiểm tra 320px, 768px, 1280px.
- Chạy `npx tsc --noEmit` và `npm run build`.

Báo cáo file thực tế đã đổi, logic lọc dữ liệu và kết quả kiểm tra.
