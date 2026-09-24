# Design Tokens

Đây là token visual đang có trong `client/src/index.css`. Component mới phải ưu tiên CSS variable hoặc token semantic tương đương; không tạo bảng màu riêng theo từng tab.

## 1. Màu nền và chữ (3-Tier Ergonomic Material Elevation)

| Token                | Light     | Dark      | Dùng cho                                                              |
| -------------------- | --------- | --------- | --------------------------------------------------------------------- |
| `--bg-canvas`        | `#F5F7FA` | `#12161B` | Nền app, shell và vùng trống                                          |
| `--bg-surface`       | `#FFFFFF` | `#1E222A` | Bề mặt thẻ, panel, box chứa đen xám tro, bottom sheet                |
| `--bg-surface-muted` | `#EEF2F6` | `#262C36` | Input, popover và surface nâng cao                                    |
| `--bg-interactive`   | `#E3E9F0` | `#2D3542` | Hover/active surface                                                   |
| `--border-ink`       | `#182230` | `#3A4652` | Viền chính                                                            |
| `--border-ink-muted` | `#D7DEE7` | `#2B343D` | Divider và lưới lịch                                                  |
| `--text-main`        | `#182230` | `#EEF3F8` | Văn bản chính                                                         |
| `--text-strong`      | `#0D1622` | `#FFFFFF` | Heading hoặc tiêu đề quan trọng                                       |
| `--text-muted`       | `#5F6B78` | `#B6C1CD` | Metadata, subtitle, ngày giờ                                          |
| `--text-subtle`      | `#8995A3` | `#85919D` | Placeholder, disabled, hint                                           |

### Palette Dark Mode đang áp dụng

Dark mode dùng canvas đen/xám đen và surface xám đen riêng biệt để giữ chiều sâu mà không tạo nền trắng.

| Token | Giá trị Dark | Vai trò |
| --- | --- | --- |
| `--bg-canvas` | `#12161B` | Header, sidebar và app chrome |
| `--bg-surface` | `#1E222A` | Bề mặt thẻ, box nhóm cài đặt ("đen xám tro") |
| `--bg-surface-muted` | `#262C36` | Input, search bar và bề mặt công cụ nâng cao |
| `--border-ink` / `--border-ink-muted` | `#3A4652` / `#2B343D` | Viền chính và divider |
| `--text-main` / `--text-muted` | `#EEF3F8` / `#B6C1CD` | Chữ chính và metadata |
| `--accent-blue` | `#1D4ED8` | Event, primary action, active state |
| `--accent-sky` | `#0284C7` | Task surface (Xanh da trời tươi sáng) |
| `--accent-coral` | `#FF9F98` | Chỉ quá hạn, lỗi và thao tác nguy hiểm |

Dark Mode surface invariant: không dùng nền trắng, trắng trong suốt, hoặc
`dark:bg-white` cho card, CTA, active state, input hay popover. Các surface
phải dùng `--bg-surface` hoặc `--bg-surface-muted`; chữ chính dùng
`--text-main` thay vì trắng tuyệt đối.

## 2. Hệ 4 Màu Ngữ Nghĩa Độc Quyền (Exclusive Semantic Palette)

| Ngữ Nghĩa                | Token CSS         | Light Mode            | Dark Mode                   | Ý nghĩa & Vị trí sử dụng                    |
| :----------------------- | :---------------- | :-------------------- | :-------------------------- | :------------------------------------------ |
| **Sự kiện (Event)**      | `--task-card-event-bg` / `--task-card-event-text` | `#1D4ED8` / `#FFFFFF` | `#1D4ED8` / `#FFFFFF` | Card event, timeline event |
| **Công việc (Task)**     | `--task-card-task-bg` / `--task-card-task-text` | `#E0F2FE` / `#075985` | `#0284C7` / `#FFFFFF` | Card task, timeline task (Sky Blue tươi sáng) |
| **Hạn chót / Quá hạn**   | `--task-card-overdue-bg` / `--task-card-overdue-text` | `#FDE8E7` / `#9F2F2A` | `#49262A` / `#FFB4AE` | Quá hạn, lỗi, thao tác nguy hiểm |
| **Hoàn thành**           | `--task-card-completed-bg` / `--task-card-completed-text` | `#EEF2F6` / `#5F6B78` | `#283039` / `#B6C1CD` | Card đã xong, metadata muted |
| **Accent phụ**           | `--accent-blue` / `--accent-sky` | Xanh dương | Xanh da trời tươi | Highlight, category và AI status |

Badge hoặc trạng thái phải kết hợp màu với text/icon. Không dùng chấm màu đơn độc cho thông tin quan trọng.

Các alias legacy `--accent-mint`, `--accent-yellow` và `--accent-lavender` vẫn tồn tại để không làm hỏng component cũ, nhưng đều trỏ về palette xanh mới. Không tạo màu riêng theo feature.

## 3. Typography

- `--font-sans`: `Inter`, `Plus Jakarta Sans`, fallback `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `system-ui`, `sans-serif`.
- `--font-mono` và `--font-hand` hiện trỏ về font sans chung để giữ cùng hình dáng chữ trong skin tối giản; không tự đưa font viết tay vào title hoặc dữ liệu.
- Font family người dùng chọn: `inter`, `jakarta`, `system`.
- Font size: `normal = 100%`, `large = 108%`, `xlarge = 116%`; mặc định hiện tại là `large` nếu chưa có preference lưu trên thiết bị.
- Phân cấp đề xuất: heading > title/label > body > metadata. Dùng `font-weight` và token màu để tạo hierarchy trước khi tăng quá nhiều cỡ chữ.

## 4. Góc bo, viền và elevation

Skin iOS hiện tại remap nhiều class legacy sang góc bo mềm hơn:

- Control nhỏ/input: khoảng `12px`.
- Card/section: khoảng `18px`.
- Bottom sheet/top sheet: khoảng `22px` ở cạnh mở.
- Badge có thể dùng pill; card và primary button không dùng pill toàn phần.
- Border mặc định mảnh, ưu tiên `1px`; chỉ dùng nét dày hơn khi pattern cũ thật sự cần và phải được skin iOS xử lý nhất quán.

Trong skin tối giản, shadow và rotation của lớp giấy được tắt. Hard offset shadow chỉ còn là compatibility behavior của các component/pattern giấy cũ; không dùng Gaussian blur cho component mới.

## 5. Responsive và motion

- `mobile < 768px`, `tablet 768-1023px`, `desktop >= 1024px`.
- Touch target chính khoảng `40px`; icon-only nhỏ hơn chỉ dùng cho action phụ và phải có label.
- Animation ngắn, phục vụ mở/đóng hoặc đổi trạng thái; tôn trọng reduced motion.
- Không dùng token transform để xoay lưới lịch, input, bảng hoặc vùng cuộn.

## 6. Quy tắc sử dụng token

1. Dùng semantic token trước màu literal.
2. Khi thêm accent mới, chứng minh token hiện tại không đáp ứng được và cập nhật tài liệu trước.
3. Light và dark phải được kiểm tra cùng một component; tránh tương phản ngược như chữ mờ trên nền active.
4. Không tạo token chỉ phục vụ một màn hình nếu token đó không có ý nghĩa ở cấp hệ thống.
