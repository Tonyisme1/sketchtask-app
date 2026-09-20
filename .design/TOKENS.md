# Design Tokens

Đây là token visual đang có trong `client/src/index.css`. Component mới phải ưu tiên CSS variable hoặc token semantic tương đương; không tạo bảng màu riêng theo từng tab.

## 1. Màu nền và chữ (3-Tier Ergonomic Material Elevation)

| Token                | Light     | Dark      | Dùng cho                                                              |
| -------------------- | --------- | --------- | --------------------------------------------------------------------- |
| `--bg-canvas`        | `#F4F4F6` | `#121214` | Nền app (Canvas xám tối sâu chống smearing/nhòe và giảm chói mắt)    |
| `--bg-surface`       | `#FFFFFF` | `#1C1C20` | Bề mặt thẻ Card, panel thanh bên, bottom sheet                        |
| `--bg-surface-muted` | `#EAEBEE` | `#25252A` | Ô nhập liệu (Input), popover, elevated modal, gutter lịch             |
| `--border-ink`       | `#262626` | `#2E2E36` | Viền nét mực chính của card, nút bấm, divider (dịu mắt, không gắt)    |
| `--border-ink-muted` | `#E4E4E7` | `#222228` | Divider/kẻ lưới lịch mờ                                               |
| `--text-main`        | `#18181B` | `#ECECF1` | Văn bản chính (xám sáng 87% chống chói mắt, đạt chuẩn WCAG > 12:1)    |
| `--text-strong`      | `#09090B` | `#FFFFFF` | Heading hoặc tiêu đề quan trọng                                       |
| `--text-muted`       | `#71717A` | `#A1A1AA` | Metadata, subtitle, ngày giờ (xám 60% đạt chuẩn WCAG)                 |
| `--text-subtle`      | `#A1A1AA` | `#71717A` | Placeholder, disabled, hint                                           |

### Palette Dark Mode đang áp dụng

Lớp ghi đè Dark Mode trong `client/src/index.css` dùng palette theo ảnh tham chiếu Google Calendar dưới đây. Các giá trị này có ưu tiên cao hơn bảng token cũ ở trên.

| Token | Giá trị Dark | Vai trò |
| --- | --- | --- |
| `--bg-canvas` | `#202124` | Header, sidebar và app chrome |
| `--bg-surface` | `#121212` | Vùng nội dung chính và card |
| `--bg-surface-muted` | `#202124` | Input và bề mặt công cụ nâng cao |
| `--border-ink` | `#3C4043` | Lưới calendar và viền chính |
| `--border-ink-muted` | `#303134` | Divider và hover |
| `--text-main` / `--text-muted` | `#E8EAED` / `#BDC1C6` | Chữ chính và metadata |
| `--accent-blue` / `--accent-sky` | `#8AB4F8` | Accent lịch và task |
| `--accent-coral` / `--accent-mint` / `--accent-yellow` | `#F28B82` / `#81C995` / `#FDD663` | Accent trạng thái ngữ nghĩa |

Dark Mode surface invariant: không dùng nền trắng, trắng trong suốt, hoặc
`dark:bg-white` cho card, CTA, active state, input hay popover. Các surface
phải dùng `--bg-surface` hoặc `--bg-surface-muted`; chữ chính dùng
`--text-main` thay vì trắng tuyệt đối.

## 2. Hệ 4 Màu Ngữ Nghĩa Độc Quyền (Exclusive Semantic Palette - Desaturated in Dark Mode)

| Ngữ Nghĩa                | Token CSS         | Light Mode            | Dark Mode (Desaturated)     | Ý nghĩa & Vị trí sử dụng                    |
| :----------------------- | :---------------- | :-------------------- | :-------------------------- | :------------------------------------------ |
| **Sự kiện (Event)**      | `--accent-blue`   | `#2563EB`             | `#60A5FA` / `rgba(...,0.15)`| Sự kiện trên lịch, tab active, link, focus  |
| **Công việc (Task)**     | `--accent-sky`    | `#0284C7` / `#E0F2FE` | `#38BDF8` / `rgba(...,0.15)`| Thẻ công việc trên lịch, khung giờ làm việc |
| **Hạn chót / Quá hạn**   | `--accent-coral`  | `#EF4444` / `#FEE2E2` | `#F87171` / `rgba(...,0.15)`| Quá hạn, mốc hạn chót, lỗi, cảnh báo đỏ     |
| **Hoàn thành / Success** | `--accent-mint`   | `#10B981`             | `#4ADE80`                   | Trạng thái đã xong, kết nối thành công      |
| **Highlight phụ**        | `--accent-yellow` | `#F59E0B`             | `#FCD34D`                   | Sticky note, điểm nhấn ghi chú              |

Badge hoặc trạng thái phải kết hợp màu với text/icon. Không dùng chấm màu đơn độc cho thông tin quan trọng.

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
