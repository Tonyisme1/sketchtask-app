# Current UI State

This document describes the runtime UI in `client/src`. Legacy feature files may remain for compatibility, but they are not part of the active navigation unless listed below.

## Platform shells

- Desktop uses `DesktopShell`, `DesktopHeader`, `Sidebar`, and `DesktopWorkspace`.
- Tablet uses `TabletShell`, `TabletHeader`, `TabletNav`, and `TabletWorkspace`.
- Mobile uses `MobileShell`, `MobileHeader`, `MobileNav`, and `MobileWorkspace`.
- All shells use the same paper background, ink borders, hard offset shadows, and context-aware creation action.
- Mobile and tablet use the bottom dock. Desktop uses the left sidebar and a floating creation action.

## Primary navigation

The active navigation has four workspaces:

1. `Hôm nay`: the current-day task list, schedule rows, and Today quick add. Habit data is retained for backward compatibility but is not part of the active UI.
2. `Công việc`: the Planner workspace with `Lịch trình`, `Lịch tháng`, and `Hạn định` contexts.
3. `Ghi chép`: regular notes and journal entries.
4. `Sổ tay`: notebook-scoped work.

Settings is opened from the account control in the header. The old Dashboard and Review/Tổng kết views are not active navigation destinations. `ReviewTab` can remain in source for compatibility, but active workspaces no longer render it.

## Task navigation

- The app stores the task workspace as `activeTab = "tasks"` and uses `activeTaskSubTab` for `today`, `planner`, or `deadlines`.
- Selecting `Hôm nay` maps to the task workspace with the `today` subtab.
- Selecting `Công việc` maps to the task workspace with the Planner subtab.
- Today has one inline quick-add row. The task list does not render a second quick-add row.
- Planner has one creation action and does not add a second empty-state creation button.
- Planner exposes only `Lịch trình` and `Lịch tháng`; the old year view is not rendered. Desktop `Lịch trình` uses a weekly time chart, while tablet/mobile use a seven-day list; tapping a day opens its day detail directly.
- Task detail remains a side panel on desktop and a full-screen detail surface on tablet/mobile.

## Today presentation

- Scheduled tasks are rendered in a compact flat schedule list.
- Other tasks are rendered as flat list rows rather than large desktop cards.
- Today shows a compact progress bar with completed and total task counts before the filters on desktop, tablet, and mobile.
- Notes/sticky notes are not mixed into Today desktop; they belong to Ghi chép.
- Habit tracking is currently omitted from active Today/Planner surfaces; legacy habit data remains stored for compatibility and future reactivation.
- Completed tasks remain in the correct context and are filtered by the shared status controls.

## Notes and notebooks

- `Ghi chú` and `Nhật ký` are the two modes inside Ghi chép.
- `Sổ tay` is a separate primary workspace, not a third mode inside Notes.
- Notes and journal components must keep their own detail/editor behavior while sharing shell, header, spacing, and filter conventions.
- On mobile, Ghi chú opens to a page index first; the full editor opens only after selecting a note and has an explicit back action to the index. The editor has a viewport-bounded card with an internal content scroll, and note switching is done from the index rather than inside the editor.
- The note editor header is a single compact action row: back to note list, notebook dropdown, and delete; autosave status text is not rendered.
- When the mobile/tablet keyboard toolbar is visible, its controls stay on one horizontal row and can be swiped horizontally; desktop keeps the wrapping toolbar layout.

## Time picker and task semantics

- Scheduled time and deadline time are distinct task fields.
- Shared task semantics determine the effective date and temporal state.
- A scheduled task must not be interpreted as an overdue deadline.
- A task without a date belongs in Planner backlog only when explicitly unscheduled.
- Parent/child constraints are enforced through `parentTaskId` and shared task logic.

## Responsive constraints

- Desktop can use multi-column content and a docked detail panel.
- Tablet uses a centered full-width workspace with the bottom dock.
- Mobile uses full-width content, bottom sheets for modal flows, and no desktop keyboard hints.
- Mobile workspace tabs enter from below; detail panels enter from the right and return from the left/right according to navigation direction. Search, notifications, auth, settings drill-down, notes, and task detail use directional transitions.
- Navigation and modal transitions must respect reduced-motion preferences.

## Known legacy files

- `client/src/components/layout/AppShell.tsx` is a legacy shell and is not mounted by `App.tsx`.
- `client/src/components/features/tasks/TasksTab.tsx` is a legacy task container and is not mounted by the platform workspaces.
- `client/src/components/features/planner/PlannerYearView.tsx` is retained but is not rendered after the Planner mode reduction.
- The shared account/auth modal exposes the Settings action. Desktop opens Settings in a contained dialog with its own scroll region; mobile and tablet open Settings fullscreen and hide the bottom dock and contextual FAB.
- Mobile and tablet Settings keep their own header back navigation and do not reserve space for the hidden bottom dock.
- Settings receives an explicit platform mode: desktop uses master-detail in a centered dialog, tablet uses master-detail in landscape and drill-down in portrait, and mobile uses a compact fullscreen category list without keyboard shortcuts.
- Settings uses shorter category labels on tablet/mobile; the desktop-only paper tilt option is hidden on touch layouts.
