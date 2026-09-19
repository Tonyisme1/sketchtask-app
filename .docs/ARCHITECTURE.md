# Architecture

## Tổng quan

```text
client/       React + Vite + TypeScript + PWA
server/       Express + TypeScript + Prisma + PostgreSQL
api-contract/ DTO và hợp đồng dữ liệu dùng chung
```

## Client

- Entry point: `client/src/main.tsx`.
- App routing, shell và back orchestration: `client/src/App.tsx`.
- Responsive shells: `client/src/desktop`, `client/src/tablet`, `client/src/mobile`.
- Feature surfaces: `client/src/components/features`.
- UI dùng chung: `client/src/components/ui`.
- State và persistence/sync hooks: `client/src/stores/appStore.tsx`.
- API client: `client/src/services/api.ts`.

Breakpoints dùng chung: mobile `<768px`, tablet `768-1023px`, desktop `>=1024px`. Shell có thể khác bố cục nhưng không được đổi semantics task, note, journal hoặc back stack.

## Điều hướng và back

`App.tsx` giữ `activeTab`, `activeTaskSubTab` và navigation stack. Handler chung xử lý lần lượt task detail, settings subview, note detail, journal book, stack location, task today rồi mới cho browser/native back thoát app. Feature không được tự cài một history contract khác.

## Backend

- Entry point: `server/src/app.ts`.
- Routes: `server/src/routes`.
- Controllers/services: `server/src/controllers`, `server/src/services`.
- Prisma schema: `server/prisma/schema.prisma`.
- Database provider hiện tại: PostgreSQL.
- `DATABASE_URL` dùng cho runtime; `DIRECT_URL` dùng cho migration/session connection theo cấu hình Prisma.
- Route cần xác thực phải lấy `userId` từ JWT/session server, không tin `userId` client gửi lên.

## Đồng bộ và lưu trữ

- Client có persistence cục bộ để giữ trải nghiệm khi reload/offline tùy adapter hiện tại.
- Remote sync là lớp bổ sung; không được ghi đè toàn bộ store bằng payload partial.
- CRUD local cập nhật UI trước khi chờ network khi an toàn; lỗi sync phải giữ dữ liệu local và cung cấp trạng thái/retry.
- Merge phải theo entity/field semantics và timestamp hiện có; không tự tạo conflict policy mới trong component UI.

## Hợp đồng dữ liệu

- DTO thay đổi phải cập nhật `api-contract`, backend và client cùng lúc.
- `scheduled`, `deadline`, `dueDate`, `parentTaskId` phải giữ đúng semantics trong mọi adapter.
- Notebook là quan hệ phân loại, không phải navigation entity.

## Quy tắc thay đổi

- UI change phải đọc `.design/CURRENT-STATE.md`, `.design/PRINCIPLES.md`, `.design/TOKENS.md` và `.design/COMPONENTS.md`.
- Feature mới phải ghi rõ active hay `Planned`; không thêm vào sidebar/dock chỉ bằng cách tạo file.
- Version chuẩn nằm ở `client/src/services/updateService.ts`.
- Thay đổi lớn cần chạy typecheck/build và cập nhật QA checklist phù hợp.
