# PROMPT 17 - TYPOGRAPHY, APP HEADER & PROGRESS CARD

## Phạm vi duy nhất

Chỉ xử lý hệ thống kích cỡ chữ dùng chung, AppHeader và ProgressCard/sidebar progress. Không sửa logic task, nội dung tab, icon inventory, Note/Sổ tay, animation toàn app hoặc API.

## Yêu cầu

1. Typography hierarchy:
   - Tên app `SketchTask` trong header là brand nổi bật nhất ở khu vực header.
   - Page title đứng sau brand nhưng lớn và rõ hơn subtitle/body.
   - Subtitle, label, badge, micro-copy có scale và line-height nhất quán.
   - Không dùng font viết tay cho title task, label form hoặc dữ liệu dài.
   - Không làm chữ header quá nhỏ trên desktop; mobile vẫn vừa một hàng, không tràn.
2. AppHeader:
   - Đồng bộ chiều cao, padding, divider và khoảng cách logo/brand với Search, Notification, Profile.
   - Brand title, logo và các icon cân cùng trục dọc; không để vùng header thừa hoặc icon bị dạt.
   - Giữ chức năng Search, Notification, Profile và responsive hiện có.
   - Các button header giữ border/hard shadow/tactile theo design contract.
3. ProgressCard/sidebar:
   - Căn chỉnh card tiến độ với chiều rộng Sidebar và padding sidebar.
   - Tiêu đề `Tiến độ công việc`, số liệu, progress bar, ngày và CTA có hierarchy rõ, không bị dồn xuống đáy hoặc thừa khoảng trắng.
   - Progress bar gọn, dễ đọc; CTA không vượt chiều rộng card và có vùng chạm đủ lớn.
   - Desktop/tablet/mobile không tràn, không che nội dung.
4. Chỉ dùng token màu/spacing/font đã có; không tạo style riêng cho từng tab.

## Kiểm tra bắt buộc

- So sánh AppHeader và ProgressCard tại 1280/1440px, 768/1024px, 320/390px.
- Kiểm tra title/subtitle/body/badge không bị cùng cỡ hoặc lệch hierarchy.
- Kiểm tra header không tràn ngang và sidebar progress không bị cắt.
- Cập nhật `.agents/ANTIGRAVITY-REPORT.md` mục `PROMPT 17`, ghi file thật sự đổi và screenshot/viewport đã kiểm tra.
- Chạy thật `npx tsc --noEmit` và `npm run build`; nếu bị chặn phải ghi lỗi thật.

