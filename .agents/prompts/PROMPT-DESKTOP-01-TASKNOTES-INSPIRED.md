# Prompt Desktop 01 - Desktop Shell va Task Workspace

## Trang thai

`READY` - prompt doc lap. Chi thuc hien sau khi doc `AGENTS.md`, `.design/`, `.docs/FEATURES.md`, `.agents/ANTIGRAVITY-CURRENT-STATE.md` va report moi nhat.

## Muc tieu

Chuan hoa giao dien desktop cua SketchTask dua tren cac nguyen ly quan sat duoc tu TaskNotes desktop:

- Sidebar trai la dieu huong chinh, thay cho bottom navigation.
- Khu vuc noi dung tap trung vao mot workflow, khong lap lai Dashboard trong moi tab.
- Task hien thi gon theo dong/grid hop ly, quet nhanh duoc nhieu thong tin.
- Chi tiet task, Note va Settings mo trong panel/trang phu hop thay vi popup lon che toan man hinh.
- Desktop co density rieng, khong dem layout mobile keo dai len man hinh rong.

Day la prompt lay nguyen ly de tham khao, **khong sao chep mau toi, branding, font, icon, text hoac layout doc quyen cua TaskNotes**. Van giu nhan dien SketchTask: nen giay, vien net muc, hard offset shadow, mau token va tieng Viet hien co.

## Pham vi responsive

- Chi thay doi presentation/layout khi `isDesktop` hoac viewport tu `1024px` tro len.
- Khong doi logic task, date/time, parent-child, API, schema, local storage, sync, auth hoac route.
- Khong xoa tinh nang dang co chi vi khong xuat hien trong screenshot desktop.
- Khong sua mobile/tablet trong prompt nay, tru truong hop can them boundary de desktop khong anh huong hai layout kia.
- Khong tao them ba pipeline task, ba app store, ba API client hoac ba bo logic semantics.

## Buoc 0 - Kiem tra source truoc khi sua

1. Doc design token va component canonical truoc khi viet UI.
2. Kiem tra source that dang duoc `App.tsx` import. Khong doan ten file chi dua tren ke hoach.
3. Lap danh sach file se sua va ly do sua trong report truoc khi ket luan.
4. Uu tien cac file hien co:
   - `client/src/App.tsx`
   - `client/src/desktop/layout/DesktopShell.tsx`
   - `client/src/desktop/layout/DesktopSidebar.tsx`
   - `client/src/desktop/layout/DesktopHeader.tsx`
   - `client/src/desktop/views/DesktopWorkspace.tsx`
   - `client/src/desktop/views/DesktopTodayView.tsx`
   - `client/src/desktop/views/DesktopTasksView.tsx`
   - cac component domain trong `client/src/components/features/`
5. Neu boundary desktop hien tai chua hoan chinh, sua boundary toi thieu va giu compatibility import; khong di chuyen ca cay thu muc trong prompt nay.

## 1. Desktop app shell

### Sidebar

- Sidebar co dinh ben trai, cao toan man hinh, rong vua du de doc nhan.
- Co hai trang thai:
  - Mo: hien logo, nhan menu, badge.
  - Thu gon: chi hien icon, co tooltip/aria-label, khong lam mat active state.
- Nut thu gon phai co animation ngan, ro rang va tactile feedback; khong lam content nhay ngang dot ngot.
- Sidebar desktop khong duoc hien `MobileNav` hoac bottom navigation.
- Giu dung navigation hierarchy hien co:
  - Dashboard neu route van dang duoc su dung.
  - Task: Hom nay, Ke hoach, Han dinh.
  - Note: Ghi chu, Nhat ky.
  - So tay.
  - Cai dat.
- Khong tu them lai tab Tong ket neu source hien tai da loai no khoi navigation.
- Active state phai cho biet ca workspace cha va sub-tab dang chon.
- Nut `Tao moi`/`New task` tren desktop duoc dat trong sidebar hoac toolbar desktop, phai goi dung context hien tai; khong tao form task thu hai.

### Header

- Header desktop nam tren cung khu vuc content, cao on dinh khoang 56-64px theo token.
- Ben trai chi hien page context can thiet; khong lap lai logo/header hai lan.
- Ben phai gom cac thao tac toan cuc: Tim kiem, Thong bao, Tai khoan/avatar.
- Moi nut co kich thuoc click thong nhat, focus va active state ro; co tooltip/aria-label.
- Khong de icon thua, icon khong co handler hoac hai control lam cung mot viec.
- Khong de page title bi nho hon micro-copy hoac bi header phu che.

### Content frame

- Dung `min-width: 0` cho cot content de khong tran ngang.
- Content phai tan dung phan dien tich con lai sau sidebar, khong bi ep vao mot cot nho giua man hinh.
- Van giu max-width hop ly cho khoi doc dai; khong de khoang trong hai ben qua lon o desktop 1280-1920px.
- Padding va gap dung mot nhiep chung; khong moi tab mot bo spacing.
- Chi khu vuc content can cuon. Khong de body va mot container cha cung cuon gay scroll kep.

## 2. Desktop Today

Today la man hinh lam viec hang ngay, khong phai Dashboard thu hai.

### Thu tu bo cuc

1. Page header: `Hom nay`, ngay dang xem va tien do ngan gon.
2. Filter/bar dieu khien gon tren cung, khong lap lai search toan cuc.
3. Khu vuc lich hen neu co: danh sach ngan, sap xep theo thoi gian hieu luc.
4. Khu vuc task can lam: danh sach task chinh.
5. Nhom `Da xong` o cuoi dung context ngay dang xem.

### Lich hen

- Lich hen chi la khu vuc tom tat thoi gian, khong render lai nguyen mot TaskCard o phia duoi.
- Moi muc chi hien gio/khung gio, tieu de ngan va diem bam mo dung task.
- Scheduled khong co gio phai hien `Chua dat gio`; tuyet doi khong tu gan `09:00`.
- Khong doc deadline de hien thi cho scheduled.
- Neu task da xuat hien trong khu vuc lich hen thi danh sach task ben duoi khong lap lai nguyen noi dung; neu product flow bat buoc can thay lai thi dung lien ket ngan den task.

### Task list

- TaskCard desktop phai gon hon hien tai:
  - checkbox/trang thai -> tieu de -> mot chip thoi gian chinh -> toi da hai metadata quan trong.
  - Khong lap ngay/gio qua nhieu badge.
  - Menu thao tac nam ben phai, khong chiem dien tich tieu de.
  - Task qua han dung mau canh bao nhe; task da xong khong gach ngang tieu de.
  - Task con thut vao va co dau hieu `Viec con`; task cha co tong so viec con gon.
- O man hinh tu `1280px` tro len, co the dung grid 2 cot de tang mat do thong tin neu:
  - moi card van doc duoc;
  - task cha/con khong bi tach sai ngu canh;
  - tieu de dai khong bi cat kho chiu;
  - khong tao cot rong hoac khoang trang bat thuong.
- O `1024-1279px`, uu tien mot cot hoac grid tu dong voi `minmax`; khong ep 2 cot neu tran.
- Khong tang padding de lam card cao hon mot cach may moc.

### Quick add desktop

- Quick Add desktop la mot thanh gon o dau danh sach hoac panel ben phai duoc mo tu nut `+`/`Tao moi`.
- Khi mo panel ben phai, content co the day nhe hoac co layout split; khong phu den toan man hinh neu khong can.
- Panel phai co dong tieu de, noi dung, luu/huy, dong bang click ngoai va Escape tren desktop.
- Giu context: dang o Hom nay thi tao task cho Hom nay; dang o Ke hoach/ngay cu thi khong cho tao sai ngay.
- Khong tao lai Quick Add mobile trong DesktopTodayView.

## 3. Task va Ke hoach tren desktop

- `Task` workspace giu sub-tab Hom nay, Ke hoach, Han dinh; khong trộn ba ngu canh vao mot danh sach khong nhan.
- Ke hoach uu tien calendar + danh sach task cua ngay dang chon; khong mo popup them task moi khi nguoi dung chi bam xem chi tiet ngay.
- Neu co du dien tich, dung split view:
  - khu lich ben trai hoac tren;
  - task cua ngay dang chon ben phai hoac ben duoi.
- Calendar khong bi rotate, khong bi crop, khong bi hien task cua thang phu vao thang dang xem.
- Han dinh nhom theo ngay va phan biet scheduled da qua voi deadline qua han.
- Click task, checkbox, menu, filter va nut quay lai phai co handler that; khong chi doi mau.

## 4. Note, Nhat ky va So tay tren desktop

### Ghi chu thuong

- Dung master-detail hai cot:
  - cot trai: danh sach note, tim kiem/filter neu flow hien tai can;
  - cot phai: noi dung note dang chon va editor.
- Click card note bat ky phai chuyen dung note; khong auto-focus vao note dau tien khi vao tab.
- Khong hien editor toolbar day man hinh khi nguoi dung chua bam vao vung noi dung.
- Khi doi note, giu selection ro rang va khong lam mat noi dung dang sua.

### Nhat ky

- Hien thi nhu timeline/document theo ngay va gio, khong dung danh sach TaskCard.
- Composer ngan gon, dat trong ngay dang xem; khong tao cuon so dai vo han.
- Entry lien ket task chi hien thong tin lien quan can thiet, khong lap nguyen card task.

### So tay

- Giu pham vi theo so tay dang chon; task/note/journal cua so khac khong duoc tron vao.
- Desktop co the dung list-detail hoac header + detail panel, nhung phai theo cung content frame voi Task va Note.

## 5. Settings, Auth va popup desktop

- Settings desktop dung layout list-danh muc + detail hai cot neu du dien tich.
- Khong lap hai header, khong hien back arrow mobile trong desktop detail.
- Auth/login tren desktop la form can giua vua phai trong content frame, khong dung bottom sheet mobile.
- Dropdown nho nen neo gan nut mo; chi dung modal che man hinh cho xac nhan huy/xoa hoac flow bat buoc.
- Search toan cuc co the la command panel, nhung phai co focus, Escape, click ngoai, loading, empty va error state.
- Notification nen la dropdown/panel ben phai, nhom qua han theo ngay va click mo dung task; khong mo mot popup khong co duong thoat.
- Khi popup/panel mo, chi khoa scroll nen can thiet; noi dung popup/panel van cuon duoc.

## 6. Visual system

- Tai su dung token trong `.design/TOKENS.md` va component trong `.design/COMPONENTS.md`.
- Giu cap bac:
  - App brand/header lon nhat trong chrome.
  - Page title ro rang.
  - Section title nho hon page title.
  - Body/label/micro-copy co scale chung giua cac tab.
- Input, calendar, table: vien net muc, khong xoay.
- TaskCard, panel, sticky note: hard offset shadow theo token, khong soft blur.
- Khong dung gradient, glassmorphism, `shadow-lg/xl/2xl`, `rounded-full` cho card/button chinh.
- Khong dua theme toi cua TaskNotes vao SketchTask.
- Moi control click duoc phai co active tactile feedback va focus visible.
- Animation chi dung cho sidebar collapse, panel/dropdown, page transition can thiet; khong animate calendar grid, input hoac vung scroll.
- Ho tro `prefers-reduced-motion`.

## 7. Khong duoc lam

- Khong copy/paste nguyen DesktopTodayView thanh DesktopTasksView.
- Khong lap lai filter, task semantics, API client, store, date helper hoac modal logic trong shell.
- Khong doi `TaskDto`, schema, database, endpoint hoac local storage.
- Khong tao du lieu mau de lam screenshot dep hon.
- Khong xoa route/component cu khi chua kiem tra import graph.
- Khong sua mobile chi de lam desktop nhanh hon.
- Khong coi viec screenshot hien dep la bang chung logic da dung.

## 8. Kiem tra bat buoc

Kiem tra bang source va thao tac that o cac viewport desktop:

- `1024px`: sidebar, header, Today, Task, Note, Settings khong tran ngang.
- `1280px`: content tan dung hop ly, task khong bi card cao bat thuong.
- `1440px` va `1920px`: khong co khoang trang lon vo nghia; grid/list van can doi.

Test toi thieu:

- Mo/thu gon sidebar va quay lai trang thai mo.
- Chuyen Dashboard/Task sub-tab/Note sub-tab/So tay/Settings.
- Tim kiem, thong bao, avatar, click ngoai va Escape.
- Today: mo lich hen, mo task, tick task, mo menu va mo quick add.
- Ke hoach: chon ngay trong thang hien tai, chuyen thang, xem chi tiet ngay.
- Note: chon note dau, note giua, note cuoi; xac nhan khong auto-focus sai; mo/sua/luu.
- Settings: vao danh muc, mo detail, quay lai dung context.
- Kiem tra khong co body scroll kep va khong co horizontal overflow.
- Smoke test mobile `320px`/`390px` sau khi sua desktop de dam bao khong regression.

Chay lenh:

```powershell
cd client
npx tsc --noEmit
npm run build
```

## 9. Bao cao sau khi lam

Bao cao phai ghi ro:

1. `CHANGED_FILES`: chi file that su da sua.
2. `DESKTOP_SHELL`: sidebar/header/content frame da thay doi gi.
3. `DESKTOP_VIEWS`: Today, Task/Planner, Note/Journal/Notebook, Settings/Auth da kiem tra gi.
4. `RESPONSIVE_CHECK`: ket qua 1024/1280/1440/1920 va smoke mobile.
5. `VERIFICATION`: lenh da chay, ket qua typecheck/build.
6. `PASS`/`PARTIAL`/`BLOCKED`: tung muc, khong ghi PASS neu chi suy doan bang mat.
7. `REMAINING_ISSUES`: file/dong hoac blocker chua giai quyet.

## Definition of Done

- Desktop co sidebar va content frame rieng, khong con bottom nav/mobile layout.
- Today tap trung task hang ngay, co lich hen gon va task list de quet.
- TaskCard desktop gon, khong lap metadata va khong tang chieu cao vo ich.
- Task/Planner, Note/Journal/Notebook va Settings dung cung hierarchy/type scale/spacing.
- Search, notification, avatar, quick add, task click, checkbox, menu va popup co handler that.
- Khong thay doi task semantics, API, data contract hoac mobile behavior ngoai regression fix can thiet.
- Typecheck/build co ket qua ro rang va report trung thuc.
