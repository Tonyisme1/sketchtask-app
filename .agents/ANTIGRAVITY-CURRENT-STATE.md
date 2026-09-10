# SketchTask - Bao Cao Hien Trang Ky Thuat

> Ngay cap nhat: 2026-09-06
> Muc dich: tai lieu ban giao cho Anti/AI coding agent.
> Pham vi: client, server, database, auth, dong bo, route, giao dien va moi truong deploy.

## 0. Quy tac doc va sua

Day la bao cao hien trang cua code, khong phai prompt thiet ke moi va khong phai cam ket rang moi chuc nang da hoan tat.

- Luon doc bao cao nay truoc khi sua.
- Uu tien code va API hien tai hon screenshot, prompt cu hoac mo ta giao dien cu.
- Khong tu y doi `TaskDto`, Prisma schema, route hoac storage key neu chua kiem tra tat ca noi dang dung.
- Khong tu y tao field API moi de phuc vu UI. Neu backend chua ho tro, phai ghi ro trong bao cao.
- Khong ghi secret, token, mat khau, URL database co credential vao tai lieu nay.
- Phan biet ba muc: `Dang hoat dong`, `Co khung nhung con gioi han`, `Chua xac minh/Chua hoan tat`.
- Sau moi thay doi phai chay typecheck/build phu hop va cap nhat `ANTIGRAVITY-REPORT.md`.

## 1. Tom tat nhanh

### Frontend dang co

- React + TypeScript + Vite trong `client/`.
- App shell dung History API tu viet, khong dung React Router.
- Co cac man hinh: Today, Planner, Deadlines, Notes, Journal, Notebooks, Review, Settings, Auth, Admin va Marketing.
- Task duoc quan ly local-first trong `appStore`; co co che push/pull sync khi dang nhap.
- Note thuong va Journal hien tai chu yeu la local-only; backend chua co model persistence tuong ung.
- Co responsive layout desktop/tablet/mobile, bottom navigation mobile va sidebar desktop.
- Co Context-aware FAB de phat event tao moi theo ngu canh.

### Backend dang co

- Express + TypeScript + Prisma.
- API prefix: `/api/v1`.
- Auth JWT va Google OAuth endpoint.
- CRUD task, notebook, habit, sync va admin.
- WebSocket realtime tai `/ws`.
- Prisma schema hien da chuyen sang PostgreSQL provider.
- Da co migration khoi tao PostgreSQL, nhung chua chay end-to-end voi mot PostgreSQL that trong moi truong nay.

### Database/deploy hien tai

- Local SQLite `server/prisma/dev.db` van ton tai nhu ban sao cu, bi ignore va khong con la database runtime theo code moi.
- Local `server/.env` dang dung mot PostgreSQL placeholder, khong phai database that.
- Render van dang co `DATABASE_URL` cu dang tro den SQLite `file:./dev.db`; gia tri nay khong phu hop voi code PostgreSQL moi.
- Chua thuc hien import du lieu tu SQLite sang PostgreSQL.
- Vercel chi build/serve client, khong doc `DATABASE_URL`.
- Khong duoc deploy code PostgreSQL len Render truoc khi cung cap PostgreSQL URL that va chay migration.

## 2. Cay thu muc chinh

```text
My_Task_App/
|- AGENTS.md
|- .design/
|- .docs/
|- .agents/
|  |- ANTIGRAVITY-TASK.md
|  |- ANTIGRAVITY-REPORT.md
|  |- ANTIGRAVITY-CURRENT-STATE.md
|  `- PROMPT-*.md
|- client/
|  |- src/
|  |  |- App.tsx
|  |  |- main.tsx
|  |  |- components/
|  |  |- hooks/
|  |  |- services/
|  |  |- stores/
|  |  `- utils/
|  |- package.json
|  `- capacitor.config.ts
|- server/
|  |- src/
|  |  |- app.ts
|  |  |- config/
|  |  |- db.ts
|  |  |- middleware/
|  |  |- routes/
|  |  |- services/
|  |  `- types/
|  |- prisma/
|  |  |- schema.prisma
|  |  |- migrations/
|  |  `- dev.db
|  |- package.json
|  `- .env.example
`- .gitignore
```

## 3. Frontend: diem vao va dieu huong

### 3.1 Entry point

`client/src/main.tsx`:

- Khoi tao React root.
- Bao ngoai boi `ErrorBoundary`.
- Dang ky service worker/PWA.
- Gan `GoogleOAuthProvider`.
- Xu ly back navigation thong qua helper cua app.

`client/src/App.tsx`:

- Tu phan tich `window.location.pathname`.
- Cac route web hien co: `/`, `/app`, `/login`, `/register`, `/admin`, `/features`, `/how-it-works`, `/pricing`.
- Tren web, `/` co the hien marketing; native root mo thang workspace app.
- `MainAppContent` hien dang dung state `activeTab` va task sub-tab `today | planner | deadlines`.
- Dashboard component co ton tai trong source nhung flow app hien tai khong render Dashboard nhu mot tab chinh.
- Main workspace render cac khu vuc task, notes/journal/notebooks, review va settings tuy theo tab.

### 3.2 Shell va navigation

`client/src/components/layout/AppShell.tsx`:

- Bao quanh workspace.
- Header desktop/mobile co logo, global search, notifications va avatar.
- Render sidebar desktop, mobile navigation va ContextAwareFab.
- Render cac modal/drawer cap ung dung.

`Sidebar.tsx`:

- Nhom chinh hien khai bao: Hôm nay, Kế hoạch, Ghi chú, Tổng kết.
- Nhom phu: Sổ tay, Cài đặt.
- Van con type/legacy key cho dashboard, tasks, deadlines, journal; can audit neu muon don dep hoan toan.
- Sidebar co badge so luong va trang thai active.

`MobileNav.tsx`:

- Bottom navigation hien co 4 muc: Hôm nay, Kế hoạch, Ghi chép, Cá nhân/Tổng kết tuy theo mapping hien tai.
- Tu an khi keyboard mo hoac nguoi dung cuon xuong.
- Khong duoc coi mobile nav la ban thu nho cua desktop sidebar; layout phai co logic rieng.

`ContextAwareFab.tsx`:

- Phat event `sketchtask:create`.
- Ngu canh hien tai quyet dinh tao task, note, journal hoac notebook.
- Khong them them mot dau cong vao bottom navigation.

## 4. Frontend: state, storage va sync

### 4.1 AppStore

File: `client/src/stores/appStore.tsx`.

- Day la nguon state trung tam cho task, notebook, sticky note, habit, mood, reflection, journal entry, preference va auth.
- Storage key local: `sketchtask_local_storage_v2`.
- App khoi dong local-first; co the dung du lieu da luu khi khong co mang.
- Khi online/dang nhap, store goi sync push/pull va smart merge.
- Khi offline, thao tac local van duoc ghi; viec day len server cho lan online tiep theo phu thuoc hang doi va logic hien tai.
- Khong duoc gia dinh moi entity deu da duoc server persist.

### 4.2 Muc do persistence thuc te

| Entity | Local client | API/server | Ghi chu |
|---|---:|---:|---|
| Task | Co | Co CRUD + sync | Ho tro parentTaskId |
| Notebook | Co | Co CRUD + sync | Quan he voi task la server-side |
| Sticky note/Note thuong | Co | Chua co model route rieng | Hien local-only trong client |
| Journal entry | Co | Chua co model route rieng | Hien local-only trong client |
| Habit | Co | Co route | Can kiem tra mapping local/server khi sua |
| Mood | Co | Co model qua sync | Khong co route CRUD rieng trong client api |
| Reflection | Co | Co model qua sync | Khong co route CRUD rieng trong client api |
| Tag | Theo task/schema | Co model Tag | Can kiem tra noi tao/sua tag |

### 4.3 API client va WebSocket

`client/src/services/api.ts`:

- Development dung `/api/v1` qua Vite proxy.
- Production dung `VITE_API_URL`.
- Luu JWT trong auth storage.
- Co nhom goi auth, sync va admin.
- Task/notebook CRUD trong UI dang phoi hop voi local store; khong duoc tu dong coi viec khong co ham trong `api.ts` la server khong co endpoint.

`client/src/services/syncSocket.ts`:

- Ket noi WebSocket `/ws`.
- Gui token theo query khi can auth.
- Tu suy ra WS URL tu `VITE_API_URL` neu `VITE_WS_URL` khong duoc dat.

## 5. Frontend: task va quy tac hien tai

### 5.1 Component task

- `TasksTab.tsx`: vo ngoai cho ba view Today, Planner, Deadlines.
- `TodayTab.tsx`: loc task theo ngay hien tai, khu lich hen o tren, danh sach task o duoi, filter va composer.
- `PlannerTab.tsx`: calendar, chi tiet ngay, week/year view theo code hien co va backlog.
- `DeadlinesTab.tsx`: cac nhom qua han/hẹn da qua/sap den, co grouping theo ngay.
- `TaskCard.tsx`: card hien badge thoi gian, notebook, tag, priority, quan he cha/con va thao tac.
- `TaskList.tsx`: render danh sach/cay task theo ngu canh.
- `QuickAddTaskComposer.tsx`: tao nhanh; Today co context date, Planner co chon ngay.
- `EditTaskModal.tsx`, `TaskDetailModal.tsx`, `CustomDuePicker.tsx`: sua, xem chi tiet va chon ngay/gio.

### 5.2 Logic task dung chung

Cac helper hien co:

- `client/src/utils/taskSemantics.ts`
- `client/src/utils/taskHierarchy.ts`
- `client/src/utils/taskDueStatus.ts`
- `client/src/utils/date.ts`

Y nghia can duy tri:

- `event`/scheduled: lich hen.
- `task`/deadline: han hoan thanh.
- Task co ngay nhung khong co gio la task co ngay, khong duoc tu gan scheduled/deadline.
- Task khong co ngay la task chua dat ngay va chi vao Hop cho khi dung ngu canh Planner.
- Scheduled da qua khac voi deadline qua han; khong duoc dung `deadlineDate` sai ngu canh.
- Today hien task cua ngay dang xem va task qua han chua xong theo pipeline hien tai; task qua han khong bi mat khoi ngay cu khi xem ngay qua khu.
- Planner calendar chi tinh badge task trong dung thang; o phu thang truoc/sau chi hoan thien luoi.

### 5.3 Parent/child task

- DTO hien co `parentTaskId` nullable.
- Client co helper de dung cay va kiem tra khong tu lam cha.
- Task con duoc hien thi thut vao va co thong tin quan he.
- Gioi han ngay/gio cua task con theo task cha da duoc mo ta trong logic client.
- Prisma schema co self relation, nhung can xac minh server validation cycle/self-parent khi tiep tuc nang cap.
- Khong tu y them database field moi neu khong can; dung `parentTaskId` hien co.

### 5.4 Hoan thanh task

- Task hoan thanh van duoc giu trong context danh sach.
- Duoc gom vao nhom `Da xong` tuy view.
- Khong gach ngang tieu de neu dieu nay lam mat kha nang doc; su dung checkbox/badge/trang thai card theo design token hien tai.

## 6. Frontend: Notes, Journal, Notebooks

### 6.1 Notes thuong

Files chinh:

- `NotesTab.tsx`
- `NoteList.tsx`
- `NoteCard.tsx`
- `NoteMasterDetailView.tsx`
- `NoteToolbar.tsx`
- `NoteTypes.ts`
- `noteStorage.ts`

Trang thai:

- Note thuong hien thi danh sach card/list, co title, excerpt, updated time va notebook filter.
- Desktop co huong Master-Detail/2 cot; mobile chuyen list sang detail.
- Click card phai mo dung detail; khong auto-focus card dau tien neu nguoi dung chua chon.
- Toolbar rich text tren mobile nen an khi chua focus editor va chi xuat hien gan keyboard khi dang soan thao.
- Note thuong dang luu local; backend chua co `Note` model route rieng.

### 6.2 Journal

Files chinh:

- `JournalTab.tsx`
- `JournalBook.tsx`
- `JournalEntryCard.tsx`

Trang thai:

- Journal entry co ngay, gio, noi dung, notebookId va linkedTaskId o client type.
- UI dang theo huong so/2 mat va timeline/ngay, co dieu huong truoc/sau.
- Journal phan bo theo notebook filter o client.
- Journal entry hien local-only; khong duoc bao cao la da sync cloud neu chua co server model.

### 6.3 Notebooks

- `NotebooksTab.tsx`, `NotebookList`, `NotebookDetail`, `NotebookHeader`, `NotebookEditor`.
- Notebook la entity server-side co CRUD.
- Trang chi tiet notebook co cac tab task/note/journal theo UI hien tai.
- Task gan notebook co the sync server.
- Note va Journal gan notebook hien van phu thuoc local storage.

## 7. Frontend: cac khu vuc con lai

### Review/Tong ket

`ReviewTab.tsx`:

- Hien quan ly habit, mood, reflection va cac chi so tong ket.
- Co uncommitted changes trong working tree; phai doc diff truoc khi tiep tuc sua.
- Dashboard component co ton tai, nhung Dashboard da bi loai khoi flow tab chinh theo huong da chot.

### Settings

`SettingsTab.tsx`:

- Co account, appearance, language, notification, sync/data, PIN, export/import/reset/archive.
- Trang con dang theo huong fullscreen drill-down tren mobile.
- Back navigation dung history helper; phai tranh header/back button bi lap.
- Settings va Auth co modal/route rieng; can test mobile khong co scroll nen.

### Auth

- `AuthPage.tsx`, `AuthModal.tsx`, `PinLockModal.tsx`.
- Co login/register, JWT auth va Google login endpoint.
- Login tren production tung co 400 khi API/env khong khop; phai kiem tra response body va VITE_API_URL, khong chi sua UI.
- Khong ghi credential that vao source, report hoac prompt.

### Admin

- `AdminPage.tsx` goi `/api/v1/admin/overview` va `/api/v1/admin/users`.
- Server hien co route admin va middleware `requireAdmin`.
- Render deployment cu tung tra 404 vi source deploy cu chua co route; 404 tren production khong dong nghia source local thieu route.
- Admin data availability can noi ro note/journal local-only.

### Marketing

- Landing/SEO nam trong client marketing route, co `LandingPage` va `SeoHead`.
- Web root co the mo landing page; native app root khong nen bi redirect sai sang marketing.
- Can giu route login/register tach khoi workspace.

## 8. Design system va UX infrastructure

Bat buoc tham chieu `AGENTS.md` va toan bo `.design/`.

- Mau nen giay va accent phai dung token trong `.design/TOKENS.md`.
- Core UI dung vien net muc 1.5px, khong xoay input/calendar/table.
- Card/button click duoc phai co tactile feedback hard-offset, khong dung soft blur shadow.
- Khong dung gradient dai, glassmorphism hoac pill shape cho card/button chinh.
- Modal mobile la bottom sheet; modal desktop khong duoc lam mat context qua muc can thiet.
- `client/src/hooks/useScrollLock.ts` co lockCount cho nested modal va bao toan scroll position.
- `useModalBackClose.ts` va `backNavigation.ts` xu ly nut Back theo LIFO.
- Animation can phan biet: tab mobile truot tu duoi len, drill-down/search tu phai sang trai, back chay nguoc lai. Khong giu song song animation cu va moi.
- Moi trang phai co Default, Hover/Active, Disabled, Loading, Error, Empty neu component co tuong tac.

## 9. Backend: bootstrap va runtime

### 9.1 App entry

`server/src/app.ts`:

- Express JSON limit 10mb.
- CORS hien dang mo rong; can siết origin khi len production neu phu hop.
- Mount API tai `/api/v1`.
- Health: `/health`.
- Version: `/api/version`.
- Root server co response thong tin co ban.
- WebSocket path `/ws`.
- Listen tren `0.0.0.0:${PORT}`.

### 9.2 Config

`server/src/config/index.ts`:

- Nap dotenv.
- Bat buoc co `DATABASE_URL`.
- Chi chap nhan `postgresql://` hoac `postgres://`.
- Production JWT secret phai du manh; secret da duoc rotate, khong in gia tri vao report.
- Co `NODE_ENV`, `PORT`, `ADMIN_EMAILS`.
- Khong con fallback runtime ve `file:./dev.db`.

### 9.3 Database client

`server/src/db.ts`:

- Singleton `PrismaClient`.
- Runtime phu thuoc hoan toan vao PostgreSQL URL hop le.
- Neu URL la placeholder/SQLite, server co the fail truoc khi listen hoac fail khi Prisma connect.

## 10. Backend: API hien co

Tat ca route duoi day nam sau prefix `/api/v1`.

| Nhom | Endpoint chinh | Auth |
|---|---|---|
| Auth | `POST /auth/register` | Public |
| Auth | `POST /auth/login` | Public |
| Auth | `POST /auth/google` | Public |
| Auth | `GET /auth/me` | JWT |
| Auth | `PATCH /auth/profile` | JWT |
| Tasks | CRUD task | JWT |
| Notebooks | CRUD notebook | JWT |
| Habits | list/create/log/toggle/delete | JWT |
| Sync | `GET /sync/pull`, `POST /sync/push` | JWT |
| Admin | `GET /admin/overview` | JWT + admin |
| Admin | `GET /admin/users` | JWT + admin |
| Admin | `GET /admin/users/:userId/data` | JWT + admin |

Service chinh:

- `auth.service.ts`: hash/password, login/register, JWT, profile.
- `task.service.ts`: task CRUD va time/parent data.
- `notebook.service.ts`: notebook CRUD.
- `habit.service.ts`: habit va log.
- `sync.service.ts`: pull/push snapshot va merge server.
- `admin.service.ts`: overview, users, user data.
- `websocket.service.ts`: realtime connection va broadcast.

Luu y:

- Khong co route backend rieng cho Note thuong/Journals theo schema hien tai.
- Khong sua client de goi endpoint Note/Journal gia dinh neu chua them model + migration + service + route.
- Admin overview/user route ton tai trong source hien tai; production can deploy dung commit moi va dung PostgreSQL.

## 11. Prisma schema va migration

`server/prisma/schema.prisma` hien co provider PostgreSQL.

Model dang co:

- `User`
- `Task`
- `Notebook`
- `StickyNote`
- `Habit`
- `DailyMood`
- `WeeklyReflection`
- `Tag`

Task co cac nhom du lieu:

- title/content/status/completedAt.
- date va time fields theo contract hien tai.
- `parentTaskId` nullable cho quan he cha/con.
- notebook va tag relation tuy schema hien tai.

Da them:

- `server/prisma/migrations/migration_lock.toml` voi provider PostgreSQL.
- `server/prisma/migrations/0001_init/migration.sql` tao bang/index/foreign key theo schema hien tai.

Chua lam:

- Chua migrate du lieu cu tu SQLite.
- Chua xac minh migration tren PostgreSQL that.
- Chua co migration cho JournalEntry va Note thuong rieng.
- Khong duoc xoa `dev.db` cho den khi co backup/import duoc xac nhan.

## 12. Moi truong va lenh chay

### Local

Backend:

```powershell
cd server
npm install
npm run prisma:generate
npm run prisma:migrate:deploy
npm run dev
```

Frontend:

```powershell
cd client
npm install
npm run dev
```

Cac script server dang co:

- `dev`: tsx watch.
- `build`: `prisma generate && prisma migrate deploy && tsc`.
- `start`: chay build output.
- `prisma:generate`.
- `prisma:migrate:deploy`.
- `prisma:migrate:status`.
- `prisma:push` cho local/thu nghiem, khong thay the migration production.

### Render

Service dang dung: `sketchtask-app`.

Environment key hien co:

- `DATABASE_URL`: dang la SQLite cu, can thay bang PostgreSQL URL that truoc khi deploy code moi.
- `JWT_SECRET`: da rotate, khong in gia tri.
- `PORT`: `5000`.
- `NODE_ENV`: `production`.
- `ADMIN_EMAILS`: email admin da cau hinh, khong them credential.

Render Free khong co persistent disk; SQLite tren filesystem deploy khong phu hop lam database production.

### Vercel

- `VITE_API_URL` la bien quan trong de client goi Render API.
- `VITE_GOOGLE_CLIENT_ID` phuc vu Google login.
- `VITE_WS_URL` la tuy chon; client co the tu suy ra tu `VITE_API_URL`.
- Khong dat `DATABASE_URL` tren Vercel.

## 13. Trang thai Git va file khong nen commit

`.gitignore` dang loai tru cac nhom nhay cam/tao tu dong:

- `.env`, `.env.*` va credential.
- `node_modules/`.
- build/dist output.
- `server/prisma/dev.db`.
- file generated cua Capacitor/Android theo rule hien tai.

Working tree tai thoi diem lap bao cao co thay doi ngoai pham vi bao cao:

- `.gitignore` co thay doi.
- `client/src/components/features/review/ReviewTab.tsx` co thay doi chua phan loai.
- `client/src/components/features/today/TodayHeader.tsx` co thay doi chua phan loai.
- Co file backup trong `.agent/archive/`.
- Cac thay doi PostgreSQL va tai lieu server la thay doi cua phien lam viec nay.

Anti phai doc `git diff` truoc khi gom commit; khong revert thay doi cua nguoi khac.

## 14. Ket qua kiem tra da chay

Da pass:

- Server TypeScript: `tsc --noEmit`.
- Client TypeScript: `tsc --noEmit`.
- Client production build: `npm run build`.
- Prisma schema validation voi PostgreSQL URL.
- Prisma Client generate.
- `git diff --check` khong co whitespace error dang ke.

Chua the xac minh end-to-end:

- Server build co ket noi PostgreSQL that.
- `prisma migrate deploy` tren database Render/Supabase that.
- Login/sync/admin tren production sau deploy commit PostgreSQL.
- Import va toan ven du lieu tu `dev.db` sang PostgreSQL.
- Offline-to-online conflict merge voi du lieu that.
- Mobile touch test tren thiet bi that.

## 15. Rủi ro va thu tu uu tien cho Anti

### P0 - Phai xu ly truoc khi deploy

1. Tao/cung cap PostgreSQL database that.
2. Dat `DATABASE_URL` dung tren Render.
3. Chay migration va kiem tra server start.
4. Xac minh Vercel `VITE_API_URL` tro dung Render service.
5. Test login, task CRUD, sync va admin endpoint.

### P1 - Phai xu ly truoc khi coi app on dinh

1. Khong de client va server tu dien giai thoi gian task khac nhau.
2. Kiem tra parent/child self-cycle va gioi han con theo cha ca client/server.
3. Giu task qua han trong ngay cu khi xem ngay qua khu; chi them vao Deadlines nhu mot context khac.
4. Xac dinh ro Note/Journal local-only trong UI va Admin.
5. Don navigation legacy key, tranh Sidebar/MobileNav hien ten khac voi route that.
6. Sua modal/back/scroll lock va animation mobile theo mot co che duy nhat.

### P2 - Polish

1. Dong bo typography, density va header tren tat ca tab.
2. Audit icon import va icon du.
3. Giam chunk client lon hon 500KB neu can.
4. Viet test cho task semantics, calendar month boundary, offline merge va mobile breakpoints.

## 16. Checklist bat buoc truoc khi bao Anti da xong

- [ ] Da doc `AGENTS.md`, `.design/*`, `.docs/FEATURES.md`.
- [ ] Da doc file nay va `ANTIGRAVITY-REPORT.md` moi nhat.
- [ ] Da xac dinh file that su thay doi, khong chi sua screenshot/UI mot cach doan.
- [ ] Khong them API/model gia cho Note/Journal.
- [ ] Khong dua secret vao source, report, prompt hoac commit.
- [ ] Da test mobile 320/390px va desktop/tablet.
- [ ] Da chay client typecheck/build.
- [ ] Da chay server typecheck/build voi PostgreSQL that neu thay doi backend.
- [ ] Da ghi ro test nao chua chay duoc.
- [ ] Da cap nhat `ANTIGRAVITY-REPORT.md` voi file va ket qua that.

## Ket luan

SketchTask hien la app local-first co lop sync/auth/server cho Task, Notebook va Habit. Phan task da co nhieu helper semantic va UI context, nhung can giu mot pipeline duy nhat. Note thuong va Journal co UI/local storage nhung chua phai entity cloud day du. Backend da co route admin trong source; loi 404 production truoc day phu hop voi kha nang Render dang chay source cu. Chuyen PostgreSQL da duoc chuan bi o code va migration, nhung chua hoan tat phan database that, import du lieu va deploy.

Anti chi duoc ket luan tinh nang da hoan tat sau khi doi chieu code, API, database va ket qua test, khong dua vao viec UI hien ra dung tren mot screenshot.
## 17. Doi chieu voi ke hoach "Xuong Noi That" va 3 khung giao dien

### 17.1 Ke hoach de xuat

Ke hoach dinh tach ba lop:

1. `desktop/`, `tablet/`, `mobile/`: chi chiu trach nhiem ve shell, navigation, header, dock, split-pane va vi tri lap rap.
2. `features/`: chua nghiep vu va cac component noi that cua Today, Planner, Notes, Journal, Notebooks, Review, Settings, Auth, Admin va Marketing.
3. `shared/`: chua UI primitives, store, hook, service, type va utility dung chung.

Day la huong kien truc hop ly cho muc tieu desktop/tablet/mobile co hanh vi khac nhau. Tuy nhien, ke hoach nay la target architecture, khong phai mo ta cay thu muc da ton tai.

### 17.2 Khoang cach voi code that

Hien tai `client/src` dang co:

- `components/features/*` thay cho `features/*`.
- `components/ui/*` thay cho `shared/ui/*`.
- `components/layout/*` thay cho cac shell desktop/tablet/mobile rieng.
- `hooks/`, `services/`, `stores/`, `types/`, `utils/` nam truc tiep duoi `src`, chua nam trong `shared/`.
- Chua co `client/src/desktop/`, `client/src/tablet/`, `client/src/mobile/`.
- Chua co `useResponsiveLayout.ts` voi hop dong `isDesktop`, `isTablet`, `isMobile`.
- `App.tsx` hien la dispatcher va `AppShell` hien phan chia responsive bang component/CSS hien co, chua phai root dispatcher cua ba shell doc lap.

Vi vay khong duoc bao cao rang da hoan tat mo hinh ba shell chi vi da co responsive CSS hoac `MobileNav`.

### 17.3 Cach trien khai an toan

Khong di chuyen ca cay trong mot commit. Anti phai di theo cac buoc sau:

1. Lap import graph: tim tat ca import cua layout, feature, ui, hook, service, store, type va utility.
2. Tao compatibility boundary/re-export neu can, de code cu va code moi co the chay song song trong mot giai doan.
3. Dua shared core vao mot noi chuan, cap nhat import tung nhom va chay typecheck sau moi nhom.
4. Chuan hoa `features/` theo domain, khong doi business logic trong luc doi duong dan.
5. Tao shell desktop/tablet/mobile chi lam layout; khong copy lai Task logic, date logic, sync logic hay modal logic vao tung shell.
6. Noi `App.tsx` voi `useResponsiveLayout`, sau do test tai 320, 390, 768, 1024 va 1280px.
7. Chi xoa duong dan cu khi `rg` khong con import cu, typecheck/build pass va da test click/back/scroll lock.

### 17.4 Ranh gioi khong duoc vi pham

- Khong tao ba ban sao cua `appStore`.
- Khong tao ba ban sao cua API client, WebSocket, task semantics hoac date helpers.
- Khong de shell tu tinh deadline/scheduled hay tu loc task.
- Khong sua API/database chi de phuc vu viec doi ten thu muc.
- Khong de `features` phu thuoc nguoc vao shell.
- `shared` khong duoc import component domain tu `features`.
- Neu chua the tach mot component vi dang co behavior phuc tap, giu duong dan cu va ghi ro ly do, khong tao file rong de danh dau da tach.

### 17.5 Tieu chi nghiem thu kien truc

- [ ] Ba shell co boundary ro rang va khong copy business logic.
- [ ] Moi feature co the duoc lap rap vao shell ma khong biet shell nao dang dung.
- [ ] Shared core co mot nguon duy nhat.
- [ ] Route va deep-link hien tai khong thay doi bat ngo.
- [ ] Task, note, journal, notebook, auth va settings van giu behavior hien tai.
- [ ] Desktop/tablet/mobile co density va navigation dung rieng, khong chi an/hien bang class.
- [ ] `npx tsc --noEmit` va `npm run build` pass sau moi phase.
- [ ] Bao cao Anti liet ke file da doi, file chua doi va regression da test.
