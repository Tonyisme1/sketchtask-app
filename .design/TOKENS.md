# Design Tokens

Đây là token visual đang có trong `client/src/index.css`. Component mới phải ưu tiên CSS variable hoặc token semantic tương đương; không tạo bảng màu riêng theo từng tab.

## 1. Màu nền và chữ

| Token | Light | Dark | Dùng cho |
| --- | --- | --- | --- |
| `--bg-canvas` | `#F2F2F7` | `#121214` | Nền app và vùng trống chính |
| `--bg-surface` | `#FFFFFF` | `#1C1C1E` | Card, dialog, header, sheet |
| `--bg-surface-muted` | `#E5E5EA` | `#27272A` | Input, toolbar, vùng phụ |
| `--border-ink` | `#E5E5EA` | `#000000` | Viền và divider chính của skin hiện tại |
| `--border-ink-muted` | `#F2F2F7` | `#000000` | Divider/lưới nhẹ |
| `--text-main` | `#1C1C1E` | `#F2F2F7` | Nội dung chính |
| `--text-strong` | `#000000` | `#FFFFFF` | Heading hoặc emphasis mạnh |
| `--text-muted` | `#8E8E93` | `#8E8E93` | Metadata, subtitle, ngày giờ |
| `--text-subtle` | `#AEAEB2` | `#636366` | Placeholder, disabled, hint |

Dark mode phải dùng cặp token trên theo ngữ cảnh. Không thay mọi `text-muted` thành `#FFFFFF`.

## 2. Accent và trạng thái

| Token | Light | Dark/ghi chú | Ý nghĩa |
| --- | --- | --- | --- |
| `--accent-yellow` | `#FFCC00` | `#FFD60A` | Tạo mới, highlight, action chính |
| `--accent-blue` | `#007AFF` | `#0A84FF` | Link, focus, thông tin |
| `--accent-coral` | `#FF3B30` | dùng cùng semantic | Xóa, lỗi, quá hạn/cảnh báo |
| `--accent-mint` | `#34C759` | dùng cùng semantic | Hoàn thành, success, kết nối |
| `--accent-sky` | `#5AC8FA` | dùng cùng semantic | Lịch hẹn/scheduled |
| `--accent-lavender` | `#AF52DE` | dùng cùng semantic | Nhóm/phân loại phụ |

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
