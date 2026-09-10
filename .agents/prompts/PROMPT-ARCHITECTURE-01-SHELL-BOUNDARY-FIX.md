# Prompt Architecture 01 - Fix Shell Boundary va Loai Bo Duplication

## Trang thai
- Verdict Codex: NEEDS_FIX
- Muc tieu: chuan hoa dung tung giao dien Desktop, Tablet, Mobile ma khong doi business logic.
- Pham vi: client architecture boundary, import boundary va duplication.
- Khong lam: database, API contract, TaskDto, task semantics, sync algorithm, visual redesign toan app.

## Bang chung hien tai
- App.tsx da dung useResponsiveLayout va dispatcher sang DesktopShell, TabletShell, MobileShell.
- shared/hooks/useResponsiveLayout.ts da ton tai voi breakpoints Mobile < 768, Tablet 768-1023, Desktop >= 1024.
- client/src/desktop, tablet, mobile da ton tai.
- features/index.ts van re-export truc tiep tu components/features.
- shared/ui/index.ts van re-export truc tiep tu components/ui.
- DesktopWorkspace, TabletWorkspace, MobileWorkspace deu render Notes, Journal, Notebooks, Settings, Review truc tiep tu features; chua co view rieng cho tung shell.
- DesktopHeader va TabletHeader van import component cu trong components/layout.
- MobileShell van import ContextAwareFab tu components/layout.
- DesktopTasksView, TabletTasksView, MobileTasksView lap lai pipeline state/count/navigation cho task.
- DesktopSidebar, TabletSidebar va mobile/layout/MobileNav chu yeu la wrapper, chua phai boundary that su.

TypeScript va Vite build dang pass. Dieu nay chi xac nhan import hop le, khong xac nhan kien truc da tach hoan chinh.

## Yeu cau thuc thi

### Buoc 1 - Xac dinh canonical source
1. Doc AGENTS.md, .design lien quan va .docs/FEATURES.md.
2. Chon mot canonical source cho UI, hooks, services, store, types, utils va domain features.
3. Tao bang mapping old path -> canonical path trong report.
4. Khong tao ban sao noi dung chi de doi ten duong dan.

### Buoc 2 - Shared boundary
1. Chuan hoa client/src/shared thanh public boundary cua ui, hooks, stores, services, types, utils.
2. Neu chua the move an toan, dung re-export co chu dich va ghi ro compatibility bridge.
3. Khong de shared phu thuoc nguoc vao desktop, tablet, mobile hoac domain features.
4. Khong de shared va components/ui cung duoc coi la hai canonical source.
5. Khong doi behavior component trong luc doi import.

### Buoc 3 - Feature boundary
1. Chuan hoa client/src/features theo domain: today, planner, deadlines/tasks, notes, journal, notebooks, review, settings, auth, admin, marketing.
2. Moi domain co entry point ro rang va chi co mot ownership.
3. Feature chi duoc dung shared core, khong import shell.
4. Khong xoa components/features cu cho den khi rg khong con import va da test.
5. Neu con bridge, ghi ten file va ke hoach xoa trong report.

### Buoc 4 - Giam duplication task
1. Tao mot controller/helper canonical cho doc tasks, counts, navigationTarget va chuyen Today/Planner/Deadlines.
2. Desktop/Tablet/Mobile chi khac shell, navigation controls, density/columns va presentation.
3. Khong copy lai pendingTodayCount, overdueCount, dueWithin24hCount, effect navigationTarget va callback route trong ca ba file.
4. Tiep tuc dung task semantics trong shared utils; shell khong tu tinh deadline/scheduled.
5. Giu nguyen Today, Planner, Deadlines, Hop cho va parentTaskId behavior hien tai.

### Buoc 5 - View theo tung khung
- desktop/layout: shell, header, sidebar, search.
- desktop/views: composition desktop.
- tablet/layout: shell, header, icon/split navigation.
- tablet/views: composition tablet.
- mobile/layout: shell, header, bottom dock, FAB.
- mobile/views: composition mobile.
- Toi thieu giu boundary rieng cho Task workspace va Today.
- Khong tao file rong; domain chua co view rieng phai ghi PARTIAL.

### Buoc 6 - App dispatcher
1. Giu useResponsiveLayout lam mot nguon breakpoint.
2. App.tsx chi chon shell/workspace, khong chua business logic task.
3. Khong cho shell import nguoc shell khac.
4. Resize qua 767/768/1023/1024 khong mat state, modal hoac sub-tab.
5. Giu route, deep-link va workspace mapping hien tai.

## Kiem tra bat buoc
Chay trong client:

    .\\node_modules\\.bin\\tsc.cmd --noEmit --pretty false
    npm run build

Quet boundary:

    rg -n "components/features|components/ui|components/layout" src/desktop src/tablet src/mobile src/features src/shared
    rg -n "pendingTodayCount|overdueCount|dueWithin24hCount|navigationTarget" src/desktop src/tablet src/mobile

Neu npm run build bi EPERM, ghi ro blocker va khong ghi PASS neu chua co ket qua build.

## Bao cao bat buoc
Cap nhat .agents/reports/ANTIGRAVITY-REPORT.md voi:
1. File thuc su thay doi.
2. Mapping old -> canonical.
3. Bridge con ton tai.
4. Noi dat task pipeline chung.
5. Ket qua quet boundary, typecheck, build.
6. PASS, PARTIAL hoac BLOCKED theo tung buoc.
7. View nao chua co theo device.
8. Loi con lai va phan chua xac minh.
Khong bao da tach hoan toan neu van con re-export cu.
