# Prompt Guide

## Mục Đích

Dùng file này để viết prompt rõ ràng, có phạm vi và tiêu chí kiểm tra cho Antigravity.

## Mẫu Prompt

```text
Hãy xử lý [mục tiêu cụ thể] trong [phạm vi file/chức năng].

Hiện trạng:
- [vấn đề quan sát được]

Yêu cầu:
- [thay đổi 1]
- [thay đổi 2]
- Giữ nguyên [logic/API/dữ liệu không được phá].

Kiểm tra:
- Chạy [lệnh test/build].
- Rà [tiêu chí hoặc command cần kiểm tra].
- Cập nhật .agents/ANTIGRAVITY-REPORT.md.

Không git push, không xóa file, không reset thay đổi.
```

## Quy Tắc

- Một prompt nên có một mục tiêu chính.
- Nêu file và hành vi cần sửa, không chỉ mô tả cảm giác chung.
- Tách rõ yêu cầu bắt buộc và ý tưởng tùy chọn.
- Yêu cầu Antigravity báo file đã đổi, lệnh đã chạy và lỗi còn lại.
- Không yêu cầu Antigravity tự đánh dấu `VERIFIED`; Codex là người nghiệm thu.
