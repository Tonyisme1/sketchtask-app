# PROMPT 10 - FINAL QUICK-ADD CONTROL CLEANUP

## Phạm vi duy nhất

Chỉ sửa các class visual còn sót trong `client/src/components/features/shared/QuickAddTaskComposer.tsx` và `client/src/components/features/today/TodayHeader.tsx`. Không thay đổi logic, dữ liệu, API, layout, hoặc tab khác.

## Yêu cầu

- Rà đúng các button chọn loại thời gian, chọn giờ, chọn hạn chót và chọn ưu tiên trong QuickAdd.
- Với control tương tác chính, thay `border` chung thành `border-[1.5px] border-[#262626]`; thêm hard offset shadow và `active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none` nếu control có shadow.
- Không sửa border của divider, input phụ, micro-badge, chip trạng thái hoặc chấm trang trí nhỏ.
- Progress bar trong TodayHeader chỉ là container, giữ kích thước nhỏ; không biến nó thành button.
- Không thay đổi text, trạng thái, event handler, ngày/giờ, filter hay hierarchy Today/Planner.

## Kiểm tra

- Kiểm tra Quick Add ở Today và Planner tại 320/390/1280px.
- Chạy thật `npx tsc --noEmit` và `npm run build`.
- Cập nhật `.agents/ANTIGRAVITY-REPORT.md` bằng mục `PROMPT 10`, liệt kê chính xác các class/control đã sửa và kết quả kiểm tra thật.

