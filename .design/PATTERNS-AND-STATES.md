# PATTERNS-AND-STATES.md

Source of truth quy định các mẫu tương tác UX (Interaction Patterns) và cách hiển thị các trạng thái giao diện (System States).

---

## 1. Interaction Patterns

### 1.1. Progressive Disclosure (Tiết lộ lũy tiến)
* **Quick Add mặc định:** Chỉ hiển thị 1 ô input duy nhất để gõ tên task -> Nhấn `Enter` là lưu ngay.
* **Expanded Details (Khi cần):** Khi bấm nút `Tùy chọn`, mở rộng vùng gán Giờ hẹn, Mức độ ưu tiên (`🔴 Gấp` / `🟡 Vừa` / `🟢 Thấp`), Sổ tay, Tag.
* **Nguyên tắc:** Giữ giao diện ban đầu luôn tinh gọn như một dòng kẻ sổ tay sạch sẽ.

### 1.2. Two-Tier Segmented Filtering (Hệ thống bộ lọc 2 tầng)
* **Tầng 1 (Cốt lõi - Luôn sẵn sàng):** `[ Tất cả ] [ ⏳ Cần làm ] [ ✓ Đã xong ]` + nút `[ ⚡ Bộ lọc (activeCount) ]`.
* **Tầng 2 (Khung mở rộng):** Chỉ mở ra khi bấm hoặc có bộ lọc active. Chứa các nhóm lọc chuyên sâu: Mức độ ưu tiên, Sổ tay, Khung thời gian, và Nhãn `#Tag`.
* **Nút Xóa lọc:** Tự động xuất hiện màu đỏ nhạt khi người dùng đang áp dụng bất kỳ bộ lọc nào khác mặc định.

### 1.3. Mobile Bottom Sheet Ergonomics (Trượt đáy trên di động)
* Toàn bộ Modal trên Mobile (Cài đặt, Đăng nhập, Bộ lọc, Chi tiết) trượt mượt mà từ đáy (`slide-in-from-bottom-6`).
* Bo góc trên `rounded-t-[22px]`, thanh gạt grab handle ở trên đầu.
* Nền đằng sau làm mờ sâu `backdrop-filter: blur(16px)` kết hợp màu đen mờ `rgba(0,0,0,0.75)`. Chạm vào vùng mờ hoặc vuốt nhẹ để đóng.

---

## 2. System States (Trạng thái giao diện)

Mọi màn hình và component bắt buộc phải có đủ các trạng thái sau:

### 2.1. Loading State (Chất liệu giấy phác thảo)
* Không dùng vòng quay spinner quay tít dạng công nghệ cao.
* Dùng Skeleton placeholder dạng đường nét đứt (`border-dashed border-[#D4CEBF]`) hoặc hiệu ứng gợn nét bút nhẹ trên nền giấy ngà `#F3EFE6`.

### 2.2. Empty State (Minh họa thủ công)
* Bắt buộc có 1 hình vẽ phác thảo nhỏ (doodle icon chiếc bút chì, trang sổ trống hoặc tách cà phê).
* Đi kèm lời nhắn khích lệ dùng font chữ `--font-hand` hoặc `--font-sans` nhẹ nhàng.
* Có 1 nút CTA chính: `[ + Viết task đầu tiên ]`.

### 2.3. Error State (Cảnh báo mềm)
* Viền chuyển sang màu san hô dịu (`border-[#FECDD3]`), nền hồng phấn nhẹ (`bg-rose-50`).
* Tuyệt đối không dùng màu đỏ tươi chói gắt (`#FF0000`) tràn ngập màn hình.
* Luôn cung cấp nút hành động khắc phục: `[ Thử lại ]`.

### 2.4. Success State (Phản hồi xúc giác)
* Khi tick hoàn thành một việc, xuất hiện dấu tích vẽ tay SVG (`✓`) kèm nét gạch ngang mực đen `animate-ink-strike` mượt mà trên tên task.

### 2.5. Realtime Cloud Sync States (Trạng thái đồng bộ đám mây)
* **Idle (Đã đồng bộ):** Chấm xanh lá nhỏ `bg-emerald-500` kèm thời gian đồng bộ gần nhất.
* **Syncing (Đang đồng bộ):** Chấm vàng chanh `bg-amber-400 animate-pulse` nhấp nháy êm ái.
* **Offline (Ngoại tuyến):** Chấm xám `bg-stone-400` báo hiệu app đang chạy chế độ Local-first an toàn, sẵn sàng đồng bộ khi có mạng trở lại.