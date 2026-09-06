# Codex Verification Workspace

`.agent/` là khu vực điều phối và nghiệm thu của Codex. Đây là nguồn chuẩn cho kế hoạch phase, checklist và verdict độc lập.

## Tài Liệu Chuẩn

- [`plans/CODEX-ANTI-PHASE-PLAN.md`](./plans/CODEX-ANTI-PHASE-PLAN.md): kế hoạch giao Anti theo 8 phase và các prompt nhỏ.
- [`plans/PLAN-STATUS.md`](./plans/PLAN-STATUS.md): bảng đánh dấu plan/prompt đã xác minh, đang chờ hoặc còn lỗi.
- [`CODEX-DOCS-INDEX.md`](./CODEX-DOCS-INDEX.md): bản đồ tài liệu, trạng thái và quy tắc ưu tiên khi tài liệu mâu thuẫn.
- [`verification/CODEX-CHECKLIST.md`](./verification/CODEX-CHECKLIST.md): checklist nghiệm thu source và UX/UI.
- [`verification/VERIFICATION-LOG.md`](./verification/VERIFICATION-LOG.md): verdict độc lập của Codex.

## Thứ Tự Ưu Tiên

1. `AGENTS.md` và `.design/` là quy tắc kỹ thuật/design bắt buộc.
2. `.agent/plans/CODEX-ANTI-PHASE-PLAN.md` là kế hoạch công việc hiện hành.
3. `.agents/prompts/ANTIGRAVITY-TASK.md` là prompt Anti đang chạy; prompt cũ nằm trong thư mục archive.
4. `.agents/reports/ANTIGRAVITY-REPORT.md` là log do Anti ghi, không thay thế nghiệm thu độc lập.

## Luồng Nghiệm Thu

1. Đọc prompt hiện hành trong `.agents/prompts/` và report trong `.agents/reports/`.
2. Kiểm tra source thực tế, không chỉ tin claim trong report.
3. Chạy test, typecheck, build hoặc kiểm tra thủ công cần thiết.
4. Ghi kết quả vào `.agent/verification/VERIFICATION-LOG.md`.
5. Chỉ đánh dấu `VERIFIED` khi case đã được kiểm tra; nếu chưa đủ bằng chứng dùng `DONE_UNVERIFIED` hoặc `NEEDS_FIX`.
