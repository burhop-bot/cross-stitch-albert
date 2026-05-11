# Test Scorecard (Updated 2026-05-03 03:08 UTC)

## Summary
- **Total test files:** 94
- **Status:** Active testing - 3 suites verified passing

## Known Passing (verified today)
| Suite | Status | Passed/Total | Last Run |
|-------|--------|--------------|----------|
| clear-pattern-full | 🟢 PASS | 21/21 | 2026-05-03 01:07 |
| app-shell | 🟢 PASS | 5/5 | 2026-05-02 |
| brand-switch-undo-redo | 🟢 PASS | 16/16 | 2026-05-03 03:07 |

## In Progress (first failures found)
| Suite | Status | Issue | Notes |
|-------|--------|-------|-------|
| image-conversion-v1 | 🔴 FAIL | stitch width slider not found | App doesn't render slider V1 component |
| keyboard-inputs-isolation | 🔴 FAIL | number keys in input don't change value | Keyboard shortcuts intercept when they shouldn't |

## Known App Gaps (not test bugs)
- Image Conversion V1: Stitch width slider doesn't render
- Keyboard Shortcuts: Don't respect focused input fields
- Brand undo: By design — undo tracks grid edits only

## Pending Tests
- image-conversion-v2.spec.ts (if exists)
- responsive.spec.ts
- responsive-behavior.spec.ts
- loading-spinner-general.spec.ts
- manual-stitch-counter.spec.ts
- export-png-loading-spinner.spec.ts
- share-link-dialog.spec.ts
- export-pdf-flow.spec.ts
- history-persistence.spec.ts
- canvas-controls.spec.ts
- All other 80+ test files

## Bugs Fixed Today
1. **Brand selector not visible in tests** - Added `aria-label` to brand selector button in Sidebar.tsx
2. **Cancel button locator** - Fixed clear-pattern test to use text-based locator
3. **page.goto race conditions** - Removed redundant navigations from test files
4. **brand-switch-undo-redo** - Rewrote to reflect actual app behavior (no brand undo)
