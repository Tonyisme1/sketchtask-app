# UI Restructure Verification Report

Date: 2026-09-07
Scope: flat workspace navigation, Today, Planner, Notes, Notebooks, notifications, and responsive shell changes.

## Checklist

- [x] Runtime navigation has four primary workspaces: Today, Tasks, Notes, and Notebooks.
- [x] Task sub-navigation is limited to Planner and Deadlines. Today is a primary workspace, not a nested task tab.
- [x] Notes sub-navigation is limited to Notes and Journal. Notebooks no longer repeats the Notes/Journal workspace tabs.
- [x] Dashboard and Review are not mounted by the active Desktop, Tablet, or Mobile workspaces.
- [x] Today uses one inline quick-add row and separates scheduled rows from the task list.
- [x] Today task rows use the canonical time semantics and do not show duplicated time metadata.
- [x] Planner exposes Agenda and Month views only. Year view is no longer reachable from the active Planner UI.
- [x] Planner adjacent-month cells are disabled and do not receive task counts or selected state.
- [x] Planner selected state uses an inset ring to avoid mobile overflow and doubled borders.
- [x] Quick task modal uses scroll lock while open and a mobile bottom-sheet transition.
- [x] Notification overdue tasks are grouped by effective date and distinguish past scheduled items from overdue deadlines.
- [x] Notification items due today exclude items already classified as overdue or past scheduled.
- [x] Habit notifications navigate to Today instead of the removed Review workspace.
- [x] Active runtime files were cleaned of unused Lucide imports.

## UI Sanity Fix Pass

- [x] Mobile and desktop shell headers use one shared `Công việc` title for Planner and Deadlines; the sub-navigation remains the single place to switch between the two modes.
- [x] Deadlines was reduced from three competing views to `Quá hạn` and `Sắp đến`.
- [x] Deadline items are grouped by effective date and no longer render an inline Quick Add row inside every date group.
- [x] Settings menu icons now use explicit Lucide icon tiles with semantic mint, sky, coral, white, and ink tones; the active item and primary controls no longer use yellow as their main state.
- [x] Planner agenda/backlog active states use mint and Planner future-day states use sky blue; adjacent month cells remain excluded from task counts.
- [x] Settings fallback navigation now returns to Today instead of the removed Review workspace.

## Manual Browser Checks

Browser: local SketchTask at `http://192.168.2.7:5173/app`.

- Today: verified schedule section, task section, completed group, and contextual FAB.
- Tasks/Planner Agenda: verified Planner/Deadlines controls, weekly navigation, backlog entry, task list, and no Today duplicate sub-tab.
- Tasks/Planner Month: verified September cells, disabled adjacent-month cells, task counts scoped to the displayed month, and selected-day state.
- Notes: verified Notes/Journal controls, note list, editor, contextual FAB, and switching between note items.
- Notebooks: verified standalone Sổ tay heading, create action, and notebook cards without the old nested Notes/Journal tabs.
- Desktop notification panel: verified panel opens from the header and task actions remain available.
- Deadlines: verified the two-view header, date grouping, semantic `Quá hạn`/`Đã qua` labels, and the absence of repeated Quick Add inputs.
- Account/Settings: verified the header account control opens the shared auth modal, the Settings action opens the desktop contained dialog, and the dialog no longer duplicates the Settings title.
- Settings visual tone: Settings chrome, navigation, controls, status toggles, sync/data actions, security, and About now use paper white, ink black, and neutral gray; avatar color choices remain intentionally configurable.

## Settings Business Audit

Additional security invariant: backup export/import excludes the local PIN code, in addition to account/session metadata. The PIN remains device-local and is never copied into a portable JSON backup.

Phạm vi audit: kiểm tra Settings theo nghiệp vụ thực tế, không chỉ kiểm tra bố cục và màu sắc.

### Đã xác minh và đã chỉnh

- [x] Tùy chọn nghiêng card, ẩn việc đã xong và nền giấy được lưu cục bộ, đồng thời được đọc lại sau khi reload.
- [x] Chế độ tối được lưu và bật class `dark` trên root document; màu thanh trạng thái cũng được cập nhật.
- [x] Bật thông báo phân biệt rõ cài đặt của app với quyền thông báo của trình duyệt/OS; trạng thái chưa cấp quyền hoặc bị chặn không còn hiển thị như đã sẵn sàng.
- [x] Tắt thông báo gọi hủy lịch trên cả Web/PWA và native thay vì chỉ đổi trạng thái UI.
- [x] Lịch nhắc Web được lưu theo `taskId`, nên sửa, hoàn thành hoặc xóa task sẽ hủy timer cũ và không gửi nhắc nhầm dữ liệu cũ.
- [x] Khi reload hoặc đăng nhập kéo dữ liệu về, hệ thống dựng lại lịch nhắc cho toàn bộ task chưa hoàn thành, bao gồm task chỉ có `deadlineDate`.
- [x] Restore JSON có xác nhận trước khi ghi đè, chỉ nhận namespace của app, kiểm tra các collection chính là mảng, và không phục hồi metadata phiên đăng nhập.
- [x] Confirm reset, dọn task cũ, restore và PIN được render ngoài nhánh responsive; các thao tác này hoạt động cả khi đang ở màn hình Settings detail trên mobile/tablet.

### Chưa thể đánh dấu hoàn thiện nghiệp vụ

- [ ] PIN hiện được lưu trực tiếp trong localStorage và prop vẫn mang tên `currentPinHash`; đây là khóa tiện ích cục bộ, chưa phải bảo mật cấp production. Cần một phase riêng nếu yêu cầu mã hóa thật hoặc bảo vệ bằng secure storage/native keystore.
- [ ] Cập nhật tên/avatar cho tài khoản đã đăng nhập gọi API theo kiểu fire-and-forget; nếu server từ chối, UI vẫn giữ giá trị local và chưa có rollback/thông báo lỗi chính xác.
- [ ] Store còn expose `theme`/`setTheme` và `soundVolume` nhưng Settings chưa có UI tương ứng; hiện không nên báo hai khả năng này là đã cấu hình đầy đủ.
- [ ] Reset dùng `localStorage.clear()`, nên xóa toàn bộ storage của origin hiện tại, gồm cả JWT của app. Hành vi này đúng với “xóa sạch ứng dụng” nhưng cần giữ nguyên nếu sản phẩm xác nhận đây là chủ ý.
- [ ] Browser pass cho quyền notification, PIN và restore trên thiết bị Android thật chưa thực hiện; build/typecheck không thay thế được kiểm tra permission và lifecycle native.

### File đã thay đổi trong lượt audit

- `client/src/components/features/settings/SettingsTab.tsx`
- `client/src/services/notificationService.ts`
- `client/src/stores/appStore.tsx`
- `client/src/components/features/notebooks/NotebooksTab.tsx` (removed the duplicate list-page notebook header; creation remains available through the contextual FAB)

## Settings Platform Audit

- [x] Settings now receives an explicit `desktop`, `tablet`, or `mobile` platform from each active shell instead of relying only on CSS breakpoints.
- [x] Desktop keeps the dense master-detail layout, tablet uses a wider fullscreen list/detail surface, and mobile uses the compact list/detail flow.
- [x] Mobile does not expose the keyboard-shortcuts section; stale `shortcuts` state is also cleared when entering Settings on mobile.
- [x] Desktop Settings opened from the account menu continues to use the contained dialog, while tablet/mobile keep the fullscreen flow and hide the bottom dock.

## Automated Verification

- `client/.\node_modules/.bin/tsc.cmd --noEmit --pretty false`: PASS.
- `client/npm run build`: PASS.
- `git diff --check`: PASS; only normal LF/CRLF conversion warnings were reported.
- `node scripts/audit-icons.js`: PASS with 11 remaining unused imports, all in legacy `ReviewTab.tsx`, which is not mounted by the active runtime. The audit still reports 15 intentional/raw emoji locations and does not treat them as an automatic failure.

## Remaining Risks

- The production bundle is still larger than Vite's 500 kB warning threshold; code splitting is a separate optimization task.
- Direct device-size browser verification for 320/390 px mobile and 768/1024 px tablet was not available in this pass.
- Legacy source files remain in the repository for compatibility and still appear in static icon audit results.
- The current local sample data contains a few intentionally noisy task titles; this is data quality, not a rendering failure.
- The direct browser pass was desktop-sized; 320/390 px mobile screenshots and real tablet hardware still need a dedicated visual pass.
- Header account control now opens the shared account/auth modal instead of navigating directly to a Settings subview.
- The signed-in account modal exposes a Settings action; desktop opens Settings in a contained dialog with its own scroll region.
- Mobile and tablet Settings open as a full workspace and hide the bottom dock and contextual FAB.
- Tablet Settings drill-down uses the single-column responsive branch and keeps the header back button visible.

## TaskCard Mobile Interaction Audit

- [x] The shared `TaskCard` keeps the primary time label in a right-side rail; hidden actions no longer reserve width when the row is idle.
- [x] Desktop pointer hover still reveals the quick actions without changing the touch interaction model.
- [x] Touch devices reveal `Doi sang ngay mai`, delete, and subtask actions after a 550ms long press instead of relying on hover.
- [x] Long press does not open task detail or toggle the checkbox, and small finger movement is tolerated before the gesture is cancelled.
- [ ] A real-device pass is still recommended for Android Chrome and iOS Safari because browser long-press behavior varies by OS.

## Verification Update

- `npx tsc --noEmit --pretty false`: PASS after the TaskCard interaction update.
- `npm --prefix client run build`: PASS; Vite completed and generated the PWA assets.
- `npm run build`: client passed, server build was blocked by `EPERM` while Prisma tried to rename the Windows query engine file, likely because another local server process is using it.

## Task, Planner, and Back Navigation Follow-up

- [x] Today `TaskCard` supports a left horizontal touch swipe. It reveals the existing move/delete/subtask actions instead of executing a destructive action immediately.
- [x] Vertical touch movement remains available for page scrolling; pointer capture keeps the swipe active if the finger leaves the row.
- [x] Planner selected-day agenda separates `Lịch hẹn` from `Công việc`; redundant helper labels and long empty-state copy were shortened.
- [x] Shared task-row title and metadata typography was increased one step for readability without changing the mobile one-column layout.
- [x] Task detail no longer persists title, description, date, time, priority, notebook, or tag while typing/selecting. It marks a local draft and writes only through the explicit `Lưu` action.
- [x] Saving a task clears fields that do not belong to the selected `scheduled` or `deadline` type before persistence.
- [x] Browser and Capacitor Back now request an in-app unwind first: task detail, Settings subview, mobile note detail, notebook detail, Settings, and task subtabs are closed/navigated in order.
- [x] At the app root, Back is allowed to continue to the page that opened the app; native root Back exits only after no in-app surface remains.

### Follow-up Verification

- `client/npx tsc --noEmit --pretty false`: PASS after Planner, task draft, swipe, and Back changes.
- `client/npm run build`: PASS; Vite generated the PWA bundle. Existing warning remains: the main JS chunk is larger than 500 kB.
- `git diff --check`: PASS; only normal LF/CRLF conversion warnings.

### Not Verified Automatically

- Physical Android Back behavior and iOS Safari swipe behavior still need one real-device pass.
- Browser history interactions that cross from `/login` into `/app` should be manually checked after deployment; the in-app guard is intentionally limited to the app route.

## Final Follow-up: Planner Guardrails and Verification

- [x] Planner week view no longer renders Quick Add for a selected date in the past; past dates remain view/complete/move/delete only.
- [x] Planner week task rows now receive the real delete and move-to-next-day callbacks instead of no-op delete handlers.
- [x] Planner selected-day detail disables its duplicate inline Quick Add, leaving the contextual creation action as the single creation entry point.
- [x] `TaskDetailPage` maps legacy/empty time types to a valid editor mode without weakening the shared semantic helper.
- `client/npx tsc --noEmit --pretty false`: PASS after the final Planner and task-editor fixes.
- `client/npm run build`: PASS after the final fixes; existing Vite warning remains for the main bundle exceeding 500 kB.

## Task Time Layout Follow-up

- [x] Shared `TaskCard` now places the completion checkbox directly beside the task title.
- [x] Scheduled tasks show `Lịch hẹn · HH:mm` or a time range on the line below the title.
- [x] Deadline tasks show `Hạn · HH:mm` on the line below the title.
- [x] Date-only tasks keep a separate `Ngày` label and do not receive a fake time.
- [x] The right side of the card is reserved for actions and overdue state; the time label no longer competes with action buttons.
- [x] `TodayScheduleNotes` now reuses `TaskCard`, so scheduled and deadline tasks share the same visual hierarchy and touch actions.
- `client/npx tsc --noEmit --pretty false`: PASS after the task time layout change.
- `client/npm run build`: PASS after the task time layout change.

## Account Menu And Swipe Correction

- Header account icon now exposes one menu with Settings and auth action on desktop, tablet, and mobile.
- Desktop Settings uses the contained popup callback; tablet/mobile Settings uses the fullscreen workspace callback and keeps the bottom dock hidden.
- Login action navigates to `/login`; signed-in users receive the real store logout action instead of reopening the auth modal.
- Today task rows keep the row translated while the left swipe is held/committed. The action rail contains move-to-tomorrow and delete; dragging back cancels the reveal.
- `client/npx tsc --noEmit --pretty false`: PASS.
- `client/npm run build`: PASS; existing main bundle size warning remains.
- `git diff --check`: PASS.
