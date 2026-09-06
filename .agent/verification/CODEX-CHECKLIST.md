# Codex Verification Checklist

## Phạm Vi Và Diff

- [ ] Diff đúng phạm vi task.
- [ ] Không có file lạ, file generated hoặc thay đổi ngoài ý muốn.
- [ ] Không có xóa/reset/push ngoài yêu cầu.

## Code Và Logic

- [ ] TypeScript không lỗi.
- [ ] Luồng dữ liệu/API không bị phá.
- [ ] Quyền truy cập và dữ liệu người dùng vẫn đúng.
- [ ] Không có lỗi runtime rõ ràng.

## UX/UI

- [ ] Đúng `.design/CURRENT-STATE.md` và `.design/PRINCIPLES.md`.
- [ ] Đúng token trong `.design/TOKENS.md`.
- [ ] Có trạng thái default, hover, active, disabled, loading, empty và error phù hợp.
- [ ] Kiểm tra desktop, tablet và mobile.
- [ ] Keyboard, touch, focus-visible và overflow hoạt động đúng.

## Kiểm Tra Cuối

- [ ] Chạy lệnh test/typecheck/build phù hợp.
- [ ] Đối chiếu báo cáo Antigravity với diff thật.
- [ ] Ghi verdict vào `VERIFICATION-LOG.md`.
