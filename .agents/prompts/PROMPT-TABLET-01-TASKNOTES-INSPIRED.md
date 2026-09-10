# Prompt Tablet 01 - Tablet Shell va Today Workspace

## Trang thai

`READY` - prompt doc lap. Truoc khi sua, Anti phai doc `AGENTS.md`, `.design/`, `.docs/FEATURES.md`, `.agents/ANTIGRAVITY-CURRENT-STATE.md` va report moi nhat.

## Muc tieu

Chuan hoa giao dien tablet cua SketchTask theo nguyen ly vua quan sat o TaskNotes tablet:

- Tablet giu trai nghiem mot cot, tap trung vao noi dung dang xu ly.
- Khong dem sidebar desktop vao tablet.
- Giu navigation duoi man hinh nhung tang vung cham va khoang cach so voi mobile.
- Today phai hien task som, khong de khoi tong quan lon day task xuong duoi.
- Task hien thi dang row gon, co ngay/gio va trang thai vua du de quet.
- Popup va navigation khong duoc lap lai hoac che toan bo man hinh.
- Chi hoc nguyen ly phan bo cua TaskNotes, khong sao chep theme toi, branding, font, icon, text hoac layout doc quyen.
- Van giu nhan dien SketchTask: nen giay, vien net muc, hard offset shadow, mau token va tieng Viet.

## Pham vi

- Chi ap dung cho `768px <= viewport < 1024px`, uu tien portrait tablet.
- Landscape tablet khong tran ngang; neu khong du dien tich thi giu mot cot.
- Khong doi task semantics, date/time, parent-child, API, schema, database, local storage, sync, auth hoac route.
- Khong sua desktop/mobile, tru smoke test regression va boundary can thiet.
- Khong tao them store, API client, task pipeline hoac date helper.

## Buoc 0 - Kiem tra source

1. Doc token va component canonical trong `.design/`.
2. Kiem tra file that dang duoc `App.tsx` render cho tablet; khong chi sua file co chu `Tablet` neu file do khong duoc dung.
3. Uu tien kiem tra:
   - `client/src/tablet/layout/TabletShell.tsx`
   - `client/src/tablet/layout/TabletHeader.tsx`
   - `client/src/tablet/views/TabletWorkspace.tsx`
   - `client/src/tablet/views/TabletTodayView.tsx`
   - `client/src/tablet/views/TabletTasksView.tsx`
   - `client/src/shared/hooks/useResponsiveLayout.ts`
   - component domain trong `client/src/components/features/`
4. Lap danh sach file se sua va ly do trong report.
5. Neu tablet dang chi la desktop/mobile wrapper, tao boundary toi thieu va tai su dung component domain; khong copy store, helper, filter hoac task pipeline.

## 1. Tablet shell va navigation

- Khong hien `DesktopSidebar` tren tablet.
- Giu navigation duoi man hinh hoac `TabletNav` voi 4 muc chinh: `Hom nay`, `Ke hoach`, `Ghi chep`, `Ca nhan` theo contract hien tai.
- Moi muc co vung cham toi thieu 44px, icon/nhan can deu, active state ro.
- Khong hien dong thoi sidebar desktop, bottom nav va mot nav phu lap lai cung muc.
- Trong workspace Task, `Hom nay / Ke hoach / Han dinh` chi xuat hien mot lan.
- Trong workspace Note, `Ghi chu / Nhat ky` chi xuat hien mot lan.
- Header tablet gon, nam trong safe area; chi giu logo/back theo context va Tim kiem, Thong bao, avatar.
- Khong hien chu phim tat desktop nhu `ESC` hay `Ctrl + K` neu khong co ban phim.
- Content chiem toan bo chieu rong kha dung; chi mot vung scroll chinh.
- Them padding bottom de bottom nav khong che noi dung cuoi.

## 2. Tablet Today

Today la man hinh lam viec trong ngay, khong phai Dashboard thu hai.

Thu tu:
1. Header ngan: `Hom nay`, ngay va tien do ngan gon neu can.
2. Filter gon, khong lap global search.
3. `Lich hen` neu co.
4. `Cong viec hom nay`.
5. `Da xong` o cuoi.

- Khong hien khoi `Chao buoi...` cao chiem phan lon man hinh.
- Khong hien 4 stat card lon nhu desktop.
- Neu can thong ke, dung mot dong compact hoac grid `2 x 2` nho; task phai xuat hien trong viewport dau tien.
- `Thoi quen hom nay` chi hien mot lan, khong lap trong summary va panel phu.
- Ghi chu phu neu co phai gon va khong lan at task.

Lich hen:
- Hien dang row theo thu tu thoi gian, khong render nguyen TaskCard trong khu nay.
- Moi row gom trang thai, gio/khung gio va tieu de rut gon.
- Scheduled khong co gio hien `Chua dat gio`; tuyet doi khong tu gan `09:00`.
- Khong doc deadline de hien thi cho scheduled.
- Moi row co diem bam mo dung task; nut xoa/menu phai co handler that.

Task row:
- Thu tu: checkbox -> tieu de -> mot chip thoi gian -> toi da hai metadata -> menu.
- Task qua han dung mau canh bao nhe; task da xong khong gach ngang tieu de.
- Task con thut vao va co nhan `Viec con`; task cha co tong so viec con ngan gon.
- Tieu de dai duoc cat co kiem soat, khong day menu khoi viewport.

## 3. Tablet Task, Ke hoach va Han dinh

- Khong tron ba ngu canh Task vao mot danh sach khong nhan.
- Ke hoach tablet uu tien lich va danh sach task cua ngay dang chon ngay ben duoi.
- Khong mo popup them task khi nguoi dung chi bam xem chi tiet ngay.
- Calendar khong hien task cua thang truoc/sau vao o cua thang hien tai.
- Ngay qua khu, ngay hom nay, ngay dang chon va ngay co task dung semantic helper hien co.
- Han dinh nhom theo ngay, tach scheduled da qua voi deadline qua han.
- Neu khong du cho split view, dung mot cot; khong thu nho chu de ep hai cot.
- Quick Add tablet co the mo panel compact/bottom sheet vua man hinh, khong che toan bo noi dung neu khong can.

## 4. Tablet Note, Nhat ky va So tay

- Ghi chu thuong mac dinh la danh sach mot cot tren tablet portrait; click mo detail/panel co Back.
- Khong auto-focus vao note dau tien khi vao tab.
- Landscape chi dung hai cot neu cot list va detail van doc duoc.
- Toolbar editor khong hien day man hinh khi chua bam vao noi dung.
- Nhat ky la timeline/document theo ngay va gio, khong dung TaskCard grid.
- So tay loc dung so tay dang chon; khong tron task/note/journal cua so khac.
- Detail chuyen man hinh phai co duong quay lai ro rang.

## 5. Popup va visual

- Uu tien inline expansion, anchored dropdown, compact panel hoac bottom sheet vua man hinh.
- Khong dung modal lon cho filter, chon so, xem chi tiet ngay hoac chon task.
- Modal bat buoc co role/aria, focus, click ngoai, nut dong va scroll lock dung.
- Nen phia sau khong duoc cuon; noi dung panel dai van cuon duoc.
- Search, notification, avatar, filter va quick add phai co loading/empty/error neu flow dang ho tro.
- Dung token trong `.design/TOKENS.md`; khong hardcode mau moi.
- Typography tablet nam giua mobile va desktop, khong dung desktop thu nho bang transform.
- Giu vien net muc va hard offset shadow; khong gradient, glassmorphism hay soft shadow.
- Khong rotate input, calendar, table hoac scroll container.
- Animation chi dung cho nav/panel can thiet va co `prefers-reduced-motion`.

## 6. Khong duoc lam

- Khong dem `DesktopSidebar` vao tablet.
- Khong de sidebar + bottom nav + top sub-nav lap lai cung mot danh sach.
- Khong copy nguyen `DesktopTodayView` sang `TabletTodayView`.
- Khong copy nguyen `MobileTodayView` neu no lam tablet chat hep hoac thieu touch target.
- Khong doi `TaskDto`, schema, API, database, sync, local storage hoac route.
- Khong tao du lieu mau de lam screenshot dep.
- Khong xoa component cu khi chua kiem tra import graph va runtime usage.

## 7. Kiem tra bat buoc

Kiem tra bang source va thao tac that tai `768x1024`, `820x1180`, `900x1200` va `1023px`:

- Header khong lap/tran; bottom nav khong che task cuoi.
- Chuyen Task sub-tab va Note sub-tab khong mat context.
- Today hien lich hen gon va task trong viewport dau tien.
- Tick task, mo detail, menu, xoa/dời task va quick add.
- Calendar chon ngay, doi thang, mo danh sach ngay; khong mo nham popup them viec.
- Note chon note dau/giua/cuoi, mo detail, Back, sua va luu.
- Mo/dong filter, notification, avatar va panel; nen phia sau khong cuon.
- Khong co horizontal overflow, scroll kep hoac shortcut desktop thua.
- Smoke test mobile `320px`/`390px` va desktop `1280px`.

Chay: `cd client`, `npx tsc --noEmit`, `npm run build`.

## 8. Bao cao sau khi lam

Bao cao phai ghi:

1. `CHANGED_FILES`: chi file that su da sua.
2. `TABLET_SHELL`: navigation, header, content frame, safe-area.
3. `TABLET_VIEWS`: Today, Task/Planner, Note/Journal/Notebook, Settings/Auth.
4. `RESPONSIVE_CHECK`: ket qua tung viewport va smoke test.
5. `VERIFICATION`: lenh da chay va ket qua that.
6. `PASS`/`PARTIAL`/`BLOCKED`: tung muc; khong ghi PASS neu chi suy doan bang mat.
7. `REMAINING_ISSUES`: file/dong hoac blocker chua giai quyet.

## Definition of Done

- Tablet co layout rieng, khong sidebar desktop va khong summary qua lon.
- Bottom navigation ro, khong trung nav va khong che noi dung.
- Today uu tien task, lich hen la row ngan, task khong bi day xa.
- Task/Planner, Note/Journal/Notebook va Settings dung chung hierarchy, typography va density.
- Popup, filter, search, notification, quick add, task click va checkbox co handler that.
- Khong thay doi task semantics, API, data contract hoac desktop/mobile behavior.
- Typecheck/build va report trung thuc.

