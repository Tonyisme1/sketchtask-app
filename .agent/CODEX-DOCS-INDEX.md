# Bản Đồ Tài Liệu SketchTask

Tài liệu này giải quyết tình trạng nhiều file Markdown cùng chứa luật, prompt và trạng thái cũ. Không dùng mọi file `.md` như một bộ luật ngang hàng.

## Nguồn Chuẩn Theo Mục Đích

| Mục đích | Nguồn chuẩn | Cách dùng |
|---|---|---|
| Quy tắc coding và workflow | `AGENTS.md` | Bắt buộc trước khi sửa code |
| UX/UI hiện hành | `.design/CURRENT-STATE.md`, `.design/PRINCIPLES.md`, `.design/TOKENS.md`, `.design/COMPONENTS.md` | Đọc trước khi sửa giao diện |
| Mô tả sản phẩm | `.docs/FEATURES.md` | Mô tả feature đã có hoặc ghi rõ Planned |
| Kế hoạch phase | `.agent/plans/CODEX-ANTI-PHASE-PLAN.md` | Dùng để giao Anti từng prompt |
| Trạng thái plan | `.agent/plans/PLAN-STATUS.md` | Đánh dấu prompt/phase đã xác minh hoặc còn lỗi |
| Nghiệm thu độc lập | `.agent/verification/CODEX-CHECKLIST.md`, `.agent/verification/VERIFICATION-LOG.md` | Codex cập nhật sau khi kiểm tra |
| Prompt Anti đang chạy | `.agents/prompts/ANTIGRAVITY-TASK.md` | Chỉ đọc block prompt hiện tại |
| Prompt lịch sử | `.agents/prompts/archive/` | Chỉ tra cứu, không dùng để giao task mới |
| Báo cáo Anti | `.agents/reports/ANTIGRAVITY-REPORT.md` | Chỉ là bằng chứng tham khảo, phải đối chiếu source |

## Phân Loại File Prompt Cũ

Các file trong `.agents/prompts/archive/` là lịch sử giao việc theo từng lượt. Không gộp các file này thành luật hiện hành và không dùng prompt cũ để phủ định `.agent/plans/CODEX-ANTI-PHASE-PLAN.md`.

`.agents/prompts/ANTIGRAVITY-TASK.md` là file task hiện hành duy nhất. Nội dung cũ được lưu nguyên vẹn tại `.agent/archive/ARCHIVE-ANTIGRAVITY-TASK-2026-09-05.md`; không đọc bản archive để thực hiện task mới.

## Trạng Thái Đã Xác Minh

- Prompt 0A: report đúng về branch `main`, HEAD `44ce61f2`, `.git/index` thiếu và `.git/index.lock` còn tồn tại; chưa xử lý Git vì có rủi ro dữ liệu.
- Prompt 17: đã bỏ qua theo quyết định hiện tại; chỉ giữ trong archive, không giao lại.
- Build/typecheck gần nhất: đạt; bundle client vẫn có cảnh báo kích thước lớn.

## Quy Tắc Cập Nhật

- Không sửa lịch sử report để biến claim chưa kiểm tra thành `VERIFIED`.
- Khi tài liệu lệch source, ghi sai lệch vào `.agent/verification/VERIFICATION-LOG.md` và cập nhật tài liệu chuẩn ở lượt riêng.
- Không xóa prompt cũ trong `.agents/prompts/archive/`; chúng là lịch sử có thể tra cứu. Chỉ cập nhật `.agents/prompts/ANTIGRAVITY-TASK.md` và giữ bản archive nguyên vẹn.
