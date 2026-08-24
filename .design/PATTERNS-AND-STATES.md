# PATTERNS-AND-STATES.md

Source of truth quy định các mẫu tương tác UX (Interaction Patterns) và cách hiển thị các trạng thái giao diện (System States).

---

## 1. Interaction Patterns

### 1.1. Progressive Disclosure (Tiết lộ lũy tiến)
* **Quick Add mặc định:** Chỉ hiển thị 1 ô input duy nhất để gõ tên task -> Nhấn `Enter` là lưu ngay.
* **Expanded Details (Khi cần):** Khi click vào task hoặc bấm phím tắt `Tab`, mở rộng vùng chọn Ngày hạn, Độ ưu tiên, Tag, Ghi chú phụ.
* **Nguyên tắc:** Giữ giao diện ban đầu luôn tinh gọn như một dòng kẻ sổ tay.

### 1.2. Tactical Selection & Filtering
* Bộ lọc (Filters) hiển thị dưới dạng các thẻ kẹp sách (tabs/pills) nằm ngang ở đầu trang.
* Khi chọn bộ lọc, cập nhật danh sách mượt mà, không giật layout.

---

## 2. System States (Trạng thái giao diện)

Mọi màn hình và component bắt buộc phải có đủ 4 trạng thái:

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
* Khi hoàn thành một chuỗi task, hiển thị một dấu tích vẽ tay SVG (`✓`) nhỏ kèm nét gạch ngang (strikethrough) mượt mà trên tên task.