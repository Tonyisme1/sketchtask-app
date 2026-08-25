# AGENTS.md

Tài liệu này là chỉ thị tối cao dành cho AI Coding Agent khi làm việc trên dự án **SketchTask App**.
Trước khi viết hoặc chỉnh sửa bất kỳ dòng code UI/Frontend/Backend nào, bạn BẮT BUỘC phải đọc và áp dụng các quy tắc dưới đây cùng toàn bộ tài liệu trong thư mục `.design/`.

---

## 1. Mandatory Workflow (Quy trình làm việc bắt buộc)

Mỗi khi nhận yêu cầu tạo mới hoặc sửa giao diện, Agent phải tuân theo 4 bước tuần tự:

1. **Đọc ngữ cảnh:** Tham chiếu `.design/DESIGN-PRINCIPLES.md`, `.design/TOKENS.md`, `.design/COMPONENTS.md` và `.design/FEATURES-AND-TABS.md`.
2. **Kiểm tra Token & Component:** Ưu tiên tái sử dụng component đã đặc tả trong `COMPONENTS.md`. Tuyệt đối không tự sáng chế style mới nếu pattern cũ đã đáp ứng được.
3. **Thực thi Code:** Viết code có cấu trúc, có comment chia theo từng phần rõ ràng (`// === PHẦN X: ... ===`). Đảm bảo đủ các trạng thái giao diện (Default, Hover, Active, Disabled, Loading, Error, Empty).
4. **Tự kiểm tra (Self-Audit):** Rà soát lại mã nguồn dựa trên danh sách _Negative Constraints_ ở Mục 2 và _Thực Chiến Quy Chuẩn_ ở Mục 4.

---

## 2. Negative Constraints (Luật cấm tuyệt đối - Chống AI Slop)

Agent vi phạm các lỗi sau sẽ bị coi là sinh code hỏng:

- ❌ **CẤM Gradient đại trà:** Không dùng gradient tím/hồng/cyan (`bg-gradient-to-r from-purple-500 to-indigo-500`) nếu không có yêu cầu cụ thể.
- ❌ **CẤM Glassmorphism mờ mềm:** Không dùng `backdrop-blur` lan tỏa kết hợp viền mờ màu trắng để tạo hiệu ứng kính hiện đại.
- ❌ **CẤM Soft Blur Shadows:** Không dùng `shadow-lg`, `shadow-xl`, `shadow-2xl` dạng Gaussian blur. Chỉ được dùng **Hard Offset Shadow** (`shadow-[2px_2px_0px_#262626]`).
- ❌ **CẤM Xoay tùy tiện (Unconstrained Rotation):**
  - Không bao giờ xoay ô nhập liệu (Input), bảng dữ liệu (Table), lưới Calendar, hoặc container cuộn danh sách (`overflow-y-auto`).
  - Chỉ xoay Card độc lập hoặc Sticky Note trong tập giá trị cố định: `-1deg`, `-0.5deg`, `0deg`, `0.5deg`, `1deg`.
- ❌ **CẤM Bo tròn hoàn toàn (Pill Shape):** Không dùng `rounded-full` cho Card hoặc Button chính.
- ❌ **CẤM Font viết tay tràn lan:** Chỉ dùng font viết tay (`--font-hand`) cho Sticky Note, note phụ, micro-copy. Tuyệt đối không dùng font viết tay cho tiêu đề task chính, form label, hoặc nội dung dữ liệu dài.
- ❌ **CẤM Hardcode mã màu lạ:** Toàn bộ màu sắc phải lấy từ bảng màu định nghĩa trong `TOKENS.md`.
- ❌ **CẤM Giả lập Desktop trên Mobile:** Tuyệt đối không để chữ "Nhấn ESC để đóng" hay phím tắt bàn phím trên giao diện di động. Phải có nút đóng [X] hoặc hướng dẫn "Chạm ngoài để thoát".

---

## 3. Implementation Rules (Quy tắc viết code)

### 3.1. Phân tầng Visual (Tiered Application)

- **Tier 1 (Core UI - Thẳng hàng, sắc nét):** Input, Checkbox, Calendar Grid, Table -> Dùng viền nét mực `1.5px`, `rotate-0`, góc bo `4px`.
- **Tier 2 (Expressive - Thủ công có kiểm soát):** TaskCard, StickyNote, Modal -> Viền `1.5px`, hard shadow `2px 2px 0px`, xoay nhẹ tối đa `1deg`.
- **Tier 3 (Decoration - Nhấn nhá):** Chỉ xuất hiện ở Empty State, gạch chân highlight hoặc icon phụ.

### 3.2. Tactile Feedback (Phản hồi xúc giác)

Mọi phần tử click được (Button, Checkbox, Clickable Card) bắt buộc phải có hiệu ứng nhấn vật lý:

```css
/* Trạng thái mặc định */
border-[1.5px] border-[#262626] shadow-[2px_2px_0px_#262626]

/* Khi active/click */
active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-none
```

---

## 4. Kinh Nghiệm Thực Chiến Đúc Kết (Real-World Architecture Rules)

### 4.1. Quy chuẩn Quản lý Phiên bản (Single Source of Truth)
- **Tập trung tại một nơi:** Mọi phiên bản ứng dụng phải xuất phát từ `updateService.ts` (`CURRENT_APP_VERSION = "1.6.0"`). Tuyệt đối không rải rác hardcode version ở nhiều file.
- **Phân loại cập nhật:**
  - *Cập nhật nhỏ (Patch - fix lỗi nhỏ):* Nạp ngầm âm thầm, tự kích hoạt khi reload.
  - *Cập nhật lớn (Feature/Major/Minor):* Bật popup phác thảo nét mực thông báo danh sách tính năng mới + nút `[Cập nhật ngay ➔]`.

### 4.2. Mobile Ergonomics & Bottom Sheet Modal
- Toàn bộ Modal trên Mobile (Cài đặt, Đăng nhập, Bộ lọc nâng cao, Chi tiết) phải hiển thị dạng **Bottom Sheet** trượt từ đáy màn hình (`slide-in-from-bottom-6`, `rounded-t-[22px]`, thanh kéo grab handle trên đầu, nền làm mờ sâu `backdrop-filter: blur(16px)`).

### 4.3. Hệ Thống Bộ Lọc Phân Tầng (Two-Tier Segmented Filter)
- Không nhồi nhét tất cả nút lọc trên 1 hàng cuộn dài gây rối mắt.
- **Tầng 1 (Cốt lõi):** `[ Tất cả ] [ ⏳ Cần làm ] [ ✓ Đã xong ]` + Nút `[ ⚡ Bộ lọc nâng cao (activeCount) ]` + Nút `[ ✕ Xóa lọc ]` (khi có lọc active).
- **Tầng 2 (Khung mở rộng):** Mở ra phân loại chuyên sâu: Ưu tiên (`🔴 Gấp` / `🟡 Vừa` / `🟢 Thấp`), Sổ tay, Khung thời gian, và Nhãn `#Tag`.

### 4.4. Thông Báo Hệ Thống PWA / Android Chrome
- Không bao giờ gọi `new Notification()` trực tiếp trên Android Chrome (sẽ dính lỗi `Illegal constructor`).
- Bắt buộc phải dùng `ServiceWorkerRegistration.showNotification()` với rung phản hồi `vibrate: [200, 100, 200]`.

### 4.5. Khởi Động Không Chớp Trắng (0ms Splash Placeholder)
- Cấu hình trọn bộ Android 12+ Splash Theme (`values-v31/styles.xml` với `windowSplashScreenAnimatedIcon`).
- Nhúng sẵn SVG/HTML placeholder bên trong thẻ `<div id="root">` trong `index.html` để app hiển thị giao diện tức thì trong lúc bundle JavaScript đang nạp.
