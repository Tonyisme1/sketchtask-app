# FEATURES-AND-TABS.md

Tài liệu mô tả chức năng và cấu trúc phân bổ trải nghiệm qua 5 Tab chính của ứng dụng **SketchTask App** (Phiên bản 1.6.0).

---

## 1. Tab 1: Hôm Nay (TodayTab - Thao Tác Trọng Tâm)

- **Mục đích:** Giúp người dùng tập trung hoàn thành các công việc trong ngày mà không bị phân tâm bởi các kế hoạch xa xôi.
- **Tính năng chủ đạo:**
  - Ô thêm việc nhanh 1 chạm: Hỗ trợ gán giờ hẹn, nhãn `#Tag`, sổ tay và chọn mức độ ưu tiên `🔴 Gấp` / `🟡 Vừa` / `🟢 Thấp`.
  - Bộ Lọc Nhanh 2 Tầng: Lọc Trạng thái (`Cần làm` / `Đã xong`), Ưu tiên (`🔴 Gấp`), Hạn chót (`Quá hạn` / `Hôm nay`), và Nhãn `#Tag`.
  - Tự động cảnh báo quá hạn bằng huy hiệu đỏ nhấp nháy tinh tế.

---

## 2. Tab 2: Kế Hoạch (PlannerTab - Trung Tâm Điều Khiển Task Toàn Diện)

- **Mục đích:** Task Command Center — Nơi quản lý, lên lịch và điều phối toàn bộ công việc theo ngày, tuần, tháng.
- **Tính năng chủ đạo:**
  - Chuyển đổi linh hoạt giữa **Lịch Tháng** (Month Matrix) và **Lịch Tuần** (Week Strip).
  - Khung Điều Khiển Bộ Lọc Đa Chiều (Super Command Filter):
    - 🎯 Lọc theo Mức độ ưu tiên (`🔴 Gấp` / `🟡 Vừa` / `🟢 Thấp`).
    - 📚 Lọc theo từng Cuốn Sổ Tay riêng biệt (`📘 Sổ A`, `📙 Sổ B`, `📂 Chưa gán sổ`).
    - ⏰ Lọc theo Thời gian (`Có giờ hẹn cụ thể` / `Cả ngày`).
    - 🏷️ Lọc theo Nhãn dự án `#Tag`.
  - Chuyển việc nhanh: Dời việc sang ngày mai, kéo việc về hôm nay chỉ bằng 1 nút bấm.

---

## 3. Tab 3: Sổ Tay (NotebooksTab - Quản Lý Dự Án Theo Chủ Đề)

- **Mục đích:** Kệ sách phân loại công việc theo từng cuốn sổ chủ đề (Công việc, Học tập, Gia đình, Dự án khởi nghiệp...).
- **Tính năng chủ đạo:**
  - Tạo và cá nhân hóa cuốn sổ với bìa màu pastel ấm và biểu tượng vẽ tay phong phú.
  - Drill-down xem danh sách việc bên trong từng cuốn sổ với thanh tiến độ hoàn thành trực quan.
  - Hỗ trợ chuyển đổi nhanh ghi chú từ Brain Dump thành việc trong sổ tay.

---

## 4. Tab 4: Brain Dump (StickyNotesTab - Không Gian Xả Não)

- **Mục đích:** Nơi ghi nhanh các suy nghĩ vụn vặt, ý tưởng bất chợt chưa cần lên lịch ngay.
- **Tính năng chủ đạo:**
  - Bảng giấy nhớ dán tường với hiệu ứng xoay tự nhiên `-1deg` đến `1deg` và ghim băng keo thủ công.
  - Chuyển đổi 1 chạm: Biến ghi chú thành Task trong Hôm Nay hoặc đưa vào Cuốn Sổ Tay chỉ định.

---

## 5. Tab 5: Nhìn Lại & Năng Suất (ReviewTab - Nhật Ký Trưởng Thành)

- **Mục đích:** Tổng kết năng suất, theo dõi chuỗi thói quen và ghi nhận cảm xúc.
- **Tính năng chủ đạo:**
  - **Productivity Sketch Chart:** Biểu đồ cột nét mực 7 ngày, thống kê tổng số việc hoàn thành, điểm năng suất /100 và ngày đạt đỉnh.
  - **Habit Tracker:** Theo dõi chuỗi ngày liên tiếp (Streak) xây dựng thói quen tốt.
  - **Mood Tracker & Weekly Reflection:** Chọn tâm trạng mỗi ngày và ghi lại bài học sau một tuần làm việc.

---

## 6. Hệ Thống Tiện Ích Toàn Cục (Global Utilities)

- **Global Search:** Tìm kiếm tức thì theo từ khóa, lọc theo sổ tay và gắn thẻ. Tối ưu UX trên Mobile (nút Đóng và làm mờ sâu).
- **Settings & Account (Bottom Sheet):** Quản lý hồ sơ, chọn avatar vẽ tay, đồng bộ hóa Realtime hai chiều (Online/Offline) và kiểm tra phiên bản Single Source of Truth.
