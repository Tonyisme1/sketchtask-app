# Local Development

## Khởi Động

Từ thư mục gốc project:

```powershell
npm run dev:server
npm run dev:client
```

Hoặc chạy `npm run dev` riêng trong từng thư mục `client` và `server`.

## Địa Chỉ

- Client: `http://localhost:5173`
- Backend: `http://localhost:5000`
- Health: `http://localhost:5000/health`
- API base: `/api/v1`
- WebSocket: `ws://localhost:5000/ws`

Vite tự reload frontend khi file thay đổi. Backend chạy `tsx watch` và tự khởi động lại khi source server thay đổi.

## Kiểm Tra Client

```powershell
cd client
npx tsc --noEmit
npm run build
```

Không cần `git push` chỉ để kiểm tra giao diện local.
