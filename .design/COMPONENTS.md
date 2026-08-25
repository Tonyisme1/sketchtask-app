# COMPONENTS.md

Tài liệu đặc tả các UI Component chuẩn mực trong hệ thống thiết kế sổ tay phác thảo (**SketchTask UI Library**).

---

## 1. Core Components

### 1.1. HandDrawnCheckbox (Hộp Kiểm Vẽ Tay)
- **Kích thước:** `20px x 20px`.
- **Viền:** `1.5px` nét mực `#262626`.
- **Hiệu ứng khi check:** Xuất hiện nét vẽ chữ V mực đen kèm hoạt ảnh phác thảo mượt mà.

### 1.2. Button (Nút Bấm Xúc Giác)
- **Biến thể:**
  - `primary`: Nền vàng chanh `#FEF08A`, viền `1.5px #262626`, bóng cứng `shadow-[2px_2px_0px_#262626]`.
  - `secondary`: Nền trắng `#FFFFFF`, viền `1.5px #262626`, bóng cứng `shadow-[2px_2px_0px_#262626]`.
  - `danger`: Nền hồng nhạt `#FFE4E6`, chữ đỏ đậm `#BE123C`, viền `1.5px #BE123C`.
- **Hiệu ứng Click (Tactile Feedback):**
  ```css
  active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-none
  ```

---

## 2. Advanced Interactive Components

### 2.1. SegmentedFilterToolbar (Thanh Bộ Lọc Phân Tầng 2 Lớp)
Được thiết kế để giải phóng không gian màn hình và tối ưu hóa trải nghiệm mobile:
- **Tầng 1 (Core Segment):** 
  - Bên trái: `[ Tất cả ] [ ⏳ Cần làm ] [ ✓ Đã xong ]`.
  - Bên phải: Nút `[ ⚡ Bộ lọc (activeCount) ]` kèm icon `SlidersHorizontal` + nút `[ ✕ Xóa lọc ]` khi có bộ lọc đang bật.
- **Tầng 2 (Expandable Command Drawer):**
  - Mở ra 4 nhóm tiêu chí: Mức độ ưu tiên (`🔴 Gấp` / `🟡 Vừa` / `🟢 Thấp`), Cuốn sổ, Hạn chót, và Nhãn `#Tag`.

### 2.2. MobileBottomSheetModal (Modal Dạng Bottom Sheet Trượt Đáy)
- **Vị trí trên Mobile:** Trượt từ đáy màn hình (`slide-in-from-bottom-6`).
- **Hình dáng:** Bo góc trên `rounded-t-[22px]`, thanh gạt grab handle `w-10 h-1 rounded-full bg-[#D4CEBF]` ở trên đầu.
- **Nền mờ:** `backdrop-filter: blur(16px)` kết hợp `rgba(0,0,0,0.75)` tối màu, chạm vào vùng mờ để đóng.

### 2.3. PriorityBadge (Huy Hiệu Mức Độ Ưu Tiên)
- `🔴 Gấp (High)`: `bg-rose-50 text-rose-700 border-rose-300 font-bold font-mono`.
- `🟡 Vừa (Medium)`: Ẩn mặc định để giảm nhiễu thị giác, hiển thị trong form tạo việc.
- `🟢 Thấp (Low)`: `bg-emerald-50 text-emerald-700 border-emerald-300 font-mono`.

### 2.4. TaskCard (Thẻ Công Việc Nét Mực)
- **Viền:** `1.5px #262626`, bo góc `6px`.
- **Bóng cứng:** `shadow-[2px_2px_0px_#262626]`.
- **Nghiêng nhẹ (Card Tilt):** Xoay nhẹ tự nhiên dựa trên vị trí index (`getCardTilt`).
- **Trạng thái hoàn thành:** Làm mờ 65%, gạch ngang bằng đường mực `animate-ink-strike`.

---

## 3. Feedback & Data Visualization Components

### 3.1. ProductivitySketchChart (Biểu Đồ Năng Suất Vẽ Tay)
- Biểu đồ 7 ngày thể hiện số việc hoàn thành bằng các cột nét mực có bóng đổ cứng.
- Hiển thị Điểm Năng Suất `/100`, Chuỗi Thói Quen (Streak), và Ngày Đạt Đỉnh Năng Suất.

### 3.2. EmptyStateDoodle (Trạng Thái Trống Nét Phác)
- Kết hợp icon minh họa vẽ nét với lời động viên nhẹ nhàng, tích cực, không gây áp lực.
