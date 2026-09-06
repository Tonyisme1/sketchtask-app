# Antigravity Workspace

Thư mục này là khu vực giao tiếp giữa Codex, người dùng và Antigravity.

## Luồng làm việc

1. Codex chuẩn bị prompt trong `prompts/ANTIGRAVITY-TASK.md` hoặc gửi trực tiếp cho người dùng.
2. Người dùng gửi prompt đó cho Antigravity.
3. Antigravity sửa source và ghi kết quả vào `reports/ANTIGRAVITY-REPORT.md`.
4. Codex đọc báo cáo, kiểm tra source và ghi verdict trong `.agent/verification/VERIFICATION-LOG.md`.

Không ghi kết quả nghiệm thu của Codex vào báo cáo của Antigravity.

## Cấu trúc thư mục

- `prompts/`: prompt hiện hành và hướng dẫn prompt.
- `prompts/archive/`: prompt lịch sử, chỉ dùng để tra cứu.
- `reports/`: report thực hiện của Antigravity.
- `.agent/plans/`: kế hoạch và bảng trạng thái plan.
- `.agent/verification/`: checklist và verdict nghiệm thu độc lập.
- `.agent/archive/`: bản lưu nguyên vẹn của task cũ.
