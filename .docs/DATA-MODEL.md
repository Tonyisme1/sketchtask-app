# Data Model

## Task và Event

- Cùng lưu trong `TaskDto` để offline sync và tombstone nhất quán, nhưng luôn có `itemType`: `task` hoặc `event`.
- Task có `completed`, một `tag` tùy chọn, và một hạn tùy chọn: `deadlineDate` cùng `deadlineTime` khi có giờ. Task không tự có khoảng thời gian.
- Event không có checkbox. Event có `startDate`/`startTime`; `endDate`/`endTime` chỉ có khi người dùng nhập điểm kết thúc. Event chỉ có giờ bắt đầu là một mốc, không suy diễn thời lượng.
- `dueDate`, `tags` và `timeType: "scheduled"` là compatibility fields. Client backfill `tag` từ `tags`; task `scheduled` cũ chỉ được chuyển loại bằng thao tác người dùng khi sửa.
- `createdAt`, `updatedAt`, `parentTaskId` phục vụ sync, audit và quan hệ cha/con.

## Notebook

- `id`, `name`, `description`, `color`, `icon`.
- `taskCount` là dữ liệu đếm từ task.

## Habit

- `id`, `name`, `frequency`, `targetDaysPerWeek`.
- `completedDates`: danh sách ngày `YYYY-MM-DD`.
- `streak`: giá trị được server tính lại.

## Ghi chú và Nhật ký

- Sticky note có `id`, `title`, `content`, `color`, `isPinned`, `createdAt`, `updatedAt`; được đồng bộ trong collection `stickyNotes`.
- Journal entry có `id`, `date`, `time`, `content`, `linkedTaskId`, `createdAt`, `updatedAt`; là model riêng nhưng chung điểm vào `Ghi chép` ở mobile/tablet.

## Quy Tắc Dữ Liệu

- Dữ liệu phải được giới hạn theo user hiện tại.
- Không xóa trường legacy nếu chưa có migration tương thích.
- Migration ghi chú đọc local storage cũ một lần, giữ `title`, `content`, `pin` và timestamp trước khi xóa khóa local cũ.
- Khi thêm trường, cập nhật type client, contract, Prisma và service liên quan.
