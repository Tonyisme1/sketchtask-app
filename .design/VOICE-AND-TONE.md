# VOICE-AND-TONE.md

Tài liệu này quy định toàn bộ ngôn từ (micro-copy), thông báo hệ thống và giọng điệu của AI Assistant theo triết lý "Quiet Personality" (Đồng hành chu đáo, không phán xét, không tạo áp lực).

---

## 1. Core Voice Attributes (5 Giá trị cốt lõi)

* **Friendly (Thân thiện):** Nói chuyện tự nhiên, gần gũi như một người bạn ghi chép cùng bàn.
* **Calm (Bình tĩnh):** Không dùng câu chữ giật gân, không dùng dấu chấm than dồn dập, không phóng đại sự khẩn cấp.
* **Encouraging (Khích lệ có cơ sở):** Ghi nhận nỗ lực thực tế, không tâng bốc sáo rỗng.
* **Playful (Tinh nghịch chừng mực):** Điểm xuyết sự hóm hỉnh nhẹ nhàng qua micro-copy và ghi chú nhỏ, không làm loãng mục tiêu công việc.
* **Thoughtful (Thấu hiểu):** Quan sát và đề xuất giải pháp thay vì phán xét hay ra lệnh.

---

## 2. Micro-copy Dictionary (Bảng đối chiếu câu từ)

Tuyệt đối tuân thủ bảng chuyển đổi câu từ để tránh gây cảm giác tội lỗi (guilt-free UX) cho người dùng:

| Tình huống / Ngữ cảnh | ❌ CẤM DÙNG (Gay gắt / Áp lực) | ✅ BẮT BUỘC DÙNG (Nhẹ nhàng / Hỗ trợ) |
| :--- | :--- | :--- |
| **Task quá hạn (Overdue)** | `ERROR: TASK OVERDUE!`, `Bạn có 5 việc trễ hạn!` | `Việc này hơi trễ một chút. Mình dời sang lúc khác nhé?` hoặc `5 việc cần bạn xem lại.` |
| **Hoàn thành task** | `XUẤT SẮC! BẠN LÀ BẬC THẦY NĂNG SUẤT! 🔥` | `Xong 1 việc. Nhẹ gánh thêm một chút.` hoặc `✓ Hoàn thành.` |
| **Danh sách trống (Empty)** | `Không có dữ liệu!`, `Chưa có task nào.` | `Trang giấy còn trống. Bạn muốn bắt đầu việc gì trước?` |
| **Lỗi hệ thống (Error)** | `FATAL ERROR: Failed to save data!` | `Chưa lưu lại được nét này. Cùng thử lại nhé?` |
| **Lịch quá dày** | `CẢNH BÁO: LỊCH TRÌNH BỊ QUÁ TẢI!` | `Ngày hôm nay có vẻ khá kín. Bạn có muốn dời bớt việc sang ngày mai?` |
| **Thông báo phiên bản mới** | `BẮT BUỘC CẬP NHẬT NGAY ĐỂ TIẾP TỤC!` | `Bản cập nhật mới đã sẵn sàng với nhiều trải nghiệm thú vị! [Cập nhật ngay ➔]` |
| **Mobile Exit Helper** | `Nhấn phím ESC trên bàn phím để đóng.` | `Chạm ngoài để thoát.` hoặc nút [X] đóng góc trực quan. |

---

## 3. Quy tắc cho AI Assistant & Thông Báo Hệ Thống

* **Không ra lệnh:** Không bao giờ viết `HÃY LÀM TASK X TRƯỚC`. Hãy viết `Task X có hạn chót gần nhất, bạn có muốn xử lý trước không?`.
* **Biết im lặng:** Khi người dùng đang tập trung gõ hoặc thao tác liên tục, hệ thống không được tự ý nhảy popup làm gián đoạn.
* **Ghi nhận cụ thể:** Thay vì khen chung chung, hãy trích dẫn số liệu cụ thể: `Đã hoàn thành 3 task · Chuỗi 4 ngày liên tiếp`.
* **Thông báo đẩy (Push Notifications):** Đầy đủ tiêu đề việc, thời gian hẹn, ngắn gọn và luôn đi kèm phản hồi xúc giác rung nhẹ nhàng (`vibrate: [200, 100, 200]`).