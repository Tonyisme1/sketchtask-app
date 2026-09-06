# Architecture

## Tổng Quan

```text
client/       React + Vite + TypeScript + PWA
server/       Express + TypeScript + Prisma + SQLite
api-contract/ DTO và hợp đồng dữ liệu dùng chung
```

## Client

- Entry point: `client/src/main.tsx`.
- App shell và điều hướng: `client/src/components/layout`.
- Tính năng theo tab: `client/src/components/features`.
- UI dùng chung: `client/src/components/ui`.
- State: `client/src/stores/appStore.tsx`.
- API client: `client/src/services/api.ts`.

Trong development, client gọi API bằng `/api/v1`; Vite proxy chuyển tiếp sang backend.

## Backend

- Entry point: `server/src/app.ts`.
- Route: `server/src/routes`.
- Controller: `server/src/controllers`.
- Service: `server/src/services`.
- Prisma schema: `server/prisma/schema.prisma`.
- Database development: SQLite local.

Các route API cần xác thực phải lấy `userId` từ JWT, không tin `userId` do client tự gửi.

## Đồng Bộ

- App ưu tiên local-first.
- Sync merge từng nhóm dữ liệu, không xóa toàn bộ dữ liệu khi payload là partial.
- Server kiểm tra timestamp để hạn chế stale write.
- Streak habit được tính ở server.

## Quy Tắc Thay Đổi

- DTO thay đổi phải cập nhật `api-contract` và cả client/backend.
- UI thay đổi phải đọc `.design/CURRENT-STATE.md` và `.design/COMPONENTS.md`.
- Version chuẩn nằm ở `client/src/services/updateService.ts`.
