# UI Declutter Recheck

- Date: `2026-09-06`
- Status: `CODE_VERIFIED_VISUAL_PENDING`
- Scope: residual issues from the UI declutter review, plus the missing task target handoff from search and notifications.

## Fixed

- Removed all currently unused Lucide imports in the scanned client source.
- Replaced raw UI emoji with Lucide icons or CSS indicators. Intentional marketing content and comments are excluded by the audit rule.
- Replaced the generic `animate-in` fade/zoom system with directional mobile motion in `client/src/index.css`: tab content enters from below, search/notification/auth/settings detail enters from the right, Back returns from the left, and secondary sheets enter from below.
- Kept the Settings root Back button for leaving the Settings area, while removing the transformed parent that caused Settings sub-views to render below the outer header. Sub-views now cover the full viewport, so the root and sub-view headers no longer appear doubled.
- Kept the desktop workspace full-width and removed header/mobile-nav background blur that made stacked UI feel visually muddy.
- Added mobile safe-area padding to the bottom navigation.
- Connected `GlobalSearchModal` and `NotificationDrawer` to `NavigationTarget`, so selecting a task preserves its task id and effective date. `TasksTab` can then open Today or Planner with the right task context.
- Replaced remaining `shadow-sm` usage in client UI with the hard-offset ink shadow pattern. Interactive overlay controls also clear the shadow on press where applicable.
- Corrected the type contracts used by Lucide icon maps and the global search result models.

## Verification

- `npx tsc --noEmit --pretty false`: PASS.
- `npm run build` from `client`: PASS, 1923 modules transformed.
- `node scripts/audit-icons.js`: PASS, 0 unused Lucide imports and 0 raw UI emoji positions.
- `rg "shadow-sm|shadow-lg|shadow-xl|shadow-2xl" client/src`: PASS, no soft shadow utility remains.
- `rg "@keyframes uiEnter|\\.animate-in|fade-in|slide-in-from|zoom-in-95" client/src/index.css`: PASS, the legacy animation CSS is gone.
- `git diff --check -- client/src scripts/audit-icons.js .agent`: PASS. Git only reports the repository's existing LF/CRLF normalization warnings.

## Remaining Risk

- No automated browser/device screenshot pass was available in this run. Visual confirmation is still required at 320/390px mobile, 768/1024px tablet, and 1280px desktop for focus, hover, active, loading, error, empty, drawer, and bottom-sheet states.
- Vite still reports the existing main bundle-size warning: about 1.6 MB minified. This is not a build failure, but it should be addressed separately with route-level code splitting.

## Conclusion

The previously reported code-level residuals are fixed and the project passes static verification. The only unverified area is final visual QA in real browser viewports.
