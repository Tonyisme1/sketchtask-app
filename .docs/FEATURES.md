# Product Features

## Cấu Trúc Khu Vực

1. **Dashboard:** tổng quan tiến độ, lịch gần nhất và nhật ký gần đây.
2. **Task:** khu vực task, gồm các nhánh Hôm nay, Kế hoạch và Hạn định.
3. **Note:** khu vực note, gồm Ghi chú thường và Nhật ký.
4. **Sổ tay:** quản lý notebook, task và dữ liệu được phân loại theo sổ.
5. **Cài đặt:** tài khoản, giao diện, thông báo và đồng bộ dữ liệu.

`ReviewTab`/Tổng kết hiện chỉ còn là source legacy, chưa phải khu vực điều hướng hiện hành.

## Task

- Tạo, sửa, hoàn thành, xóa và dời task.
- Hỗ trợ priority, tag, notebook và thời gian.
- Thời gian gồm `scheduled` và `deadline`.
- `dueDate` được giữ để tương thích dữ liệu cũ.

## Tiện Ích Chung

- Tìm kiếm task, notebook, note và habit.
- Đăng nhập, cài đặt, đồng bộ local-first và realtime.
- PWA và giao diện responsive desktop/tablet/mobile.

## Phân Phạm Vi

- TodayTab là nơi hành động nhanh trong một ngày.
- PlannerTab là nơi lập lịch nhiều ngày.
- Chức năng chi tiết không nên được thêm vào TodayTab nếu đã thuộc Planner hoặc Edit flow.
