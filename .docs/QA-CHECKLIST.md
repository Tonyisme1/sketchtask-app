# QA Checklist

## Client

- [ ] `npx tsc --noEmit` pass.
- [ ] `npm run build` pass.
- [ ] Không có native dropdown/date/time control ngoài ngoại lệ đã ghi rõ.
- [ ] Không có lỗi console nghiêm trọng khi mở app.

## TodayTab

- [ ] Tạo task nhanh.
- [ ] Nhập nhiều dòng không khóa scroll.
- [ ] Keyboard không che input hoặc menu cần thiết.
- [ ] Lọc trạng thái, priority, notebook, tag.
- [ ] Task quá hạn được phân biệt đúng.
- [ ] Hoàn thành, sửa, xóa và dời sang ngày mai.

## Responsive

- [ ] Desktop.
- [ ] Tablet.
- [ ] Mobile.
- [ ] Modal/bottom sheet, touch, keyboard và focus-visible.
- [ ] Không có horizontal overflow.

## Backend Và Dữ Liệu

- [ ] Auth thiếu/sai mật khẩu bị từ chối.
- [ ] Route bảo vệ yêu cầu JWT.
- [ ] CRUD giới hạn theo user.
- [ ] Sync partial không xóa dữ liệu ngoài payload.
- [ ] Stale write bị xử lý đúng.
- [ ] Streak được server tính lại.

## Release

- [ ] Version client/server/metadata đồng nhất.
- [ ] Không commit thêm dependency/cache/build artifact ngoài chủ đích.
- [ ] Báo cáo Antigravity khớp với diff thực tế.
- [ ] Codex ghi verdict trong `.agent/verification/VERIFICATION-LOG.md`.
