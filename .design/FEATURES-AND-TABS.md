# FEATURES-AND-TABS.md

Tài liệu này đặc tả chi tiết kiến trúc và luồng tương tác của **5 Tab Chức Năng Chính** trong ứng dụng **SketchTask (Digital Sketchbook)**.

---

## 1. Tab 1: Hôm nay (Today) - Trang Nhật ký Trọng tâm

- **Mục tiêu:** Giúp người dùng tập trung vào các đầu việc cần giải quyết trong ngày mà không bị ngợp.
- **Thành phần chính:**
  1. **Daily Progress (Tiến độ vẽ tay):** Thanh hiển thị số lượng task đã xong và tỷ lệ hoàn thành dạng nét mực trên nền giấy.
  2. **Quick Add Bar (Tier 1 Core UI):** Ô nhập liệu nhanh với phím Enter, hỗ trợ gán nhanh Tag (`Công việc`, `Cá nhân`, `Ý tưởng`, `Học tập`) và giờ hẹn.
  3. **Tactical Filter Pills:** Bộ lọc trạng thái (_Tất cả_, _Cần làm_, _Đã xong_) và bộ lọc theo Tag.
  4. **Task Cards (Tier 2 Expressive):** Thẻ task viền nét mực `1.5px`, Hard shadow `2px 2px 0px #262626`, góc xoay nhẹ luân phiên `[-0.5deg, 0deg, 0.5deg]`, nút xóa và checkmark vẽ tay.
  5. **Quiet Motivational Sticky Note:** Lời nhắn nhẹ nhàng, không gây cảm giác tội lỗi.

---

## 2. Tab 2: Kế hoạch (Planner) - Weekly Spread

- **Mục tiêu:** Mô phỏng trang đôi trải dài 7 ngày trong tuần của sổ tay kế hoạch.
- **Thành phần chính:**
  1. **Week Navigator:** Điều hướng _Tuần trước_, _Tuần này_, _Tuần sau_ hiển thị số thứ tự tuần trong năm.
  2. **7-Day Grid (Tier 1 Core UI):** Lưới 7 cột (Thứ 2 -> Chủ nhật) giữ góc phẳng `rotate-0` để đảm bảo khả năng đọc.
  3. **Day Action & Task List:** Hiển thị các công việc có hạn chót rơi vào ngày đó, kèm nút `+ Thêm việc` cho từng ngày cụ thể.

---

## 3. Tab 3: Sổ tay & Dự án (Notebooks) - Kệ Sổ Chuyên biệt

- **Mục tiêu:** Phân chia không gian công việc theo từng dự án hoặc chủ đề cuộc sống.
- **Thành phần chính:**
  1. **Notebooks Grid (Kệ sổ tay):** Hiển thị các cuốn sổ dạng bìa cứng với màu sắc từ bảng Token (`yellow`, `coral`, `mint`, `sky`, `lavender`), icon sketch và số lượng task.
  2. **Modal Tạo Sổ mới:** Dialog vẽ tay cho phép chọn tên sổ, mô tả, màu bìa và icon.
  3. **Drill-down Detail View:** Khi nhấp vào cuốn sổ, chuyển sang chế độ xem chi tiết cuốn sổ đó, liệt kê riêng các task thuộc cuốn sổ và có form thêm task trực tiếp vào sổ.

---

## 4. Tab 4: Brain Dump - Bảng Gom nhặt Ý tưởng Tự do

- **Mục tiêu:** Nơi người dùng ghi nhanh mọi suy nghĩ ngẫu hứng mà không cần bận tâm về cấu trúc hay hạn chót.
- **Thành phần chính:**
  1. **Quick Note Form:** Ô nhập liệu ý tưởng kèm nút chọn màu giấy dán.
  2. **Sticky Notes Canvas:** Lưới các tờ giấy note dán băng keo tape ở mép trên, xoay nhẹ `-1deg` hoặc `1deg`.
  3. **Hành động Chuyển đổi (Action: Convert to Task):** Nút `[ ➔ Chuyển thành việc hôm nay ]` giúp đưa ý tưởng thành một task chính thức ở Tab Hôm nay.

---

## 5. Tab 5: Tổng kết & Thói quen (Review & Habit Tracker)

- **Mục tiêu:** Theo dõi tính kỷ luật hàng ngày và nhìn lại bài học sau mỗi tuần.
- **Thành phần chính:**
  1. **Habit Tracker Table:** Bảng điểm danh thói quen 7 ngày trong tuần với dấu tích vẽ tay SVG và tự động tính chuỗi (streak).
  2. **Form Thêm Thói quen:** Nhập tên thói quen mới cần rèn luyện.
  3. **Weekly Wrap-up Journal:** Khung ghi chép cảm nhận tuần dạng giấy kẻ dòng, tự động lưu trữ ghi chú.
