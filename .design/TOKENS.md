# TOKENS.md

Source of truth cho toàn bộ giá trị biến giao diện (Design Tokens) của phong cách **Hand-Drawn Productivity / Digital Sketchbook**. Coding Agent bắt buộc sử dụng các biến/class dưới đây, không tự ý hardcode giá trị tùy tiện.

---

## 1. Color Palette (Paper & Ink)

### 1.1. Base Canvas (Giấy & Mực)

| Token Name           | Light Mode (Hex) | Dark Mode (Hex) | Ý nghĩa / Ứng dụng                             |
| :------------------- | :--------------- | :-------------- | :--------------------------------------------- |
| `--bg-canvas`        | `#FBF9F4`        | `#18181B`       | Nền toàn trang (chất giấy ngà / giấy than tối) |
| `--bg-surface`       | `#FFFFFF`        | `#27272A`       | Nền Card, Modal, Sheet                         |
| `--bg-surface-muted` | `#F3EFE6`        | `#3F3F46`       | Nền Sidebar, Toolbar, Dropdown                 |
| `--border-ink`       | `#262626`        | `#E4E4E7`       | Viền nét mực chính (Core UI & Card border)     |
| `--border-ink-muted` | `#D4CEBF`        | `#52525B`       | Đường kẻ lưới calendar, divider phụ            |
| `--text-main`        | `#1C1917`        | `#FAFAFA`       | Chữ chính (độ tương phản cao)                  |
| `--text-muted`       | `#78716C`        | `#A1A1AA`       | Metadata, date, secondary labels               |

### 1.2. Highlighter & Accent Palette (Màu bút dạ quang & Mực nhớ)

| Token Name          | Hex       | Class Gợi ý      | Ý nghĩa / Ứng dụng                         |
| :------------------ | :-------- | :--------------- | :----------------------------------------- |
| `--accent-yellow`   | `#FEF08A` | `bg-yellow-200`  | Highlight quan trọng, Sticky Note mặc định |
| `--accent-coral`    | `#FECDD3` | `bg-rose-200`    | Task ưu tiên cao, cảnh báo nhẹ             |
| `--accent-mint`     | `#BBF7D0` | `bg-emerald-200` | Task đã hoàn thành, tag tích cực           |
| `--accent-sky`      | `#BAE6FD` | `bg-sky-200`     | Sự kiện Calendar, link, focus badge        |
| `--accent-lavender` | `#DDD6FE` | `bg-violet-200`  | Project tag, category cá nhân              |

---

## 2. Typography

### 2.1. Font Families

- **`--font-sans` (Core UI):** `'Inter', 'Plus Jakarta Sans', system-ui, sans-serif`
  - Dùng cho 90% nội dung: task title, navigation, bảng dữ liệu, form input.
- **`--font-hand` (Handwritten Accent):** `'Caveat', 'Patrick Hand', cursive`
  - **Chỉ dùng cho:** Sticky note, lời nhắn động viên, tooltip ghi chú, doodle text, empty state annotations.
- **`--font-mono` (Data/Code):** `'JetBrains Mono', 'Fira Code', monospace`
  - Dùng cho: thời gian (09:00 AM), timestamp, shortcut keybinds.

### 2.2. Type Scale

- `text-xs`: 12px / Line height: 16px (Metadata, tags)
- `text-sm`: 14px / Line height: 20px (Task item, form label, table body)
- `text-base`: 16px / Line height: 24px (Body text, modal text)
- `text-lg`: 18px / Line height: 28px (Card header, sub-section)
- `text-xl`: 20px / Line height: 28px (Page sub-title)
- `text-2xl`: 24px / Line height: 32px (Page title)

---

## 3. Elevation & Hard Shadows (Đổ bóng dứt khoát)

Không dùng blur lan tỏa (`rgba(0,0,0,0.1)`). Mọi độ nổi đều sử dụng **Hard Offset Shadow** để giả lập các lớp giấy đặt lên nhau:

| Token           | CSS Box-Shadow                  | Tailwind Class Quy ước         | Ứng dụng                        |
| :-------------- | :------------------------------ | :----------------------------- | :------------------------------ |
| `--shadow-none` | `none`                          | `shadow-none`                  | Trạng thái Active/Pressed       |
| `--shadow-sm`   | `1px 1px 0px var(--border-ink)` | `shadow-[1px_1px_0px_#262626]` | Button nhỏ, Checkbox, Badge     |
| `--shadow-md`   | `2px 2px 0px var(--border-ink)` | `shadow-[2px_2px_0px_#262626]` | Task Card, Sticky Note, Input   |
| `--shadow-lg`   | `4px 4px 0px var(--border-ink)` | `shadow-[4px_4px_0px_#262626]` | Modal, Dialog, Floating Popover |

---

## 4. Borders & Roughness

- **Độ dày nét mực:** Cố định `border-width: 1.5px` (hoặc tối thiểu `1px` cho lưới dày).
- **Border Radius Tokens:**
  - `--radius-strict`: `4px` (Dùng cho Input, Checkbox, Data Grid).
  - `--radius-organic-1`: `255px 15px 225px 15px / 15px 225px 15px 255px` (Dùng cho Task Card).
  - `--radius-organic-2`: `20px 255px 20px 255px / 255px 20px 255px 20px` (Dùng cho Sticky Note, Pill Badges).

---

## 5. Rotation Tokens (Intentional Imperfection)

Tuyệt đối không xoay text chính hoặc container cuộn. Chỉ áp dụng xoay nhẹ lên các container độc lập:

| Token Name           | Value     | Class Gợi ý        | Ứng dụng                                             |
| :------------------- | :-------- | :----------------- | :--------------------------------------------------- |
| `--rot-flat`         | `0deg`    | `rotate-0`         | Bắt buộc cho toàn bộ Input, Grid, Table, Mobile view |
| `--rot-subtle-left`  | `-0.5deg` | `-rotate-[0.5deg]` | Task Card xen kẽ, Tag                                |
| `--rot-subtle-right` | `0.5deg`  | `rotate-[0.5deg]`  | Task Card xen kẽ                                     |
| `--rot-tilt-left`    | `-1deg`   | `-rotate-1`        | Sticky Note, Pinned card                             |
| `--rot-tilt-right`   | `1deg`    | `rotate-1`         | Sticky Note, Bookmark                                |

---

## 6. Spacing Scale

Dựa trên base grid 4px:

- `space-1`: 4px (Khoảng cách icon và text)
- `space-2`: 8px (Padding nội bộ của badge, gap giữa các tag)
- `space-3`: 12px (Padding của task row, small card)
- `space-4`: 16px (Padding chuẩn của Card, form control gap)
- `space-6`: 24px (Khoảng cách giữa các Section, Modal padding)
- `space-8`: 32px (Margin layout chính)
