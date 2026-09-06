# Data Model

## Task

- `id`, `title`, `description`: nhận diện và nội dung.
- `completed`, `status`: trạng thái xử lý.
- `priority`: `low`, `medium`, `high`.
- `tag`, `notebookId`: phân loại.
- `dueDate`: trường thời gian legacy.
- `timeType`: `scheduled`, `deadline` và giá trị legacy `event`, `task`.
- `startTime`, `endTime`: thời gian lịch làm việc.
- `deadlineDate`, `deadlineTime`: thời hạn hoàn thành.
- `createdAt`, `updatedAt`: đồng bộ và audit.

## Notebook

- `id`, `name`, `description`, `color`, `icon`.
- `taskCount` là dữ liệu đếm từ task.

## Habit

- `id`, `name`, `frequency`, `targetDaysPerWeek`.
- `completedDates`: danh sách ngày `YYYY-MM-DD`.
- `streak`: giá trị được server tính lại.

## Sticky Note

- `id`, `content`, `color`.
- `position`: tọa độ hiển thị trên vùng ý tưởng.

## Quy Tắc Dữ Liệu

- Dữ liệu phải được giới hạn theo user hiện tại.
- Không xóa trường legacy nếu chưa có migration tương thích.
- Khi thêm trường, cập nhật type client, contract, Prisma và service liên quan.
