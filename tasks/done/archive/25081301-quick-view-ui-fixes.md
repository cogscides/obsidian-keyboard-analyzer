---
title: Quick View — UI/UX fixes and behaviors
status: done
owner: '@agent'
updated: 2025-08-14 08:33 UTC
related:
  - [[25081213-quick-view-popover-for-fast-shortcuts]]
  - [[25081103-fix-popover-overflow]]
merged_into:
  - [[20250814-quick-view-consolidated]]
---

## Context

Follow-up items to refine Quick View behaviors and UI based on feedback. Focus on input/event handling consistency with the full view, visibility of action icons, showing multiple hotkeys per command, and size/resize experience.

## Decisions

- [2025-08-13] Done — Right-click activation: open Quick View on right mouse click on the status bar keyboard icon (override native context menu while click is on icon).
- [2025-08-13] Done — Mod+F parity with main view implemented inside Quick View.
- [2025-08-13] Done — Icon visibility/sizing: lucide icons render at 16×16 within 28×28 buttons for “Clear” and “Activate key listener”.
- [2025-08-13] Done — Multiple hotkeys per command: chips render with wrapping.
- [2025-08-13] Done — Resizable height (bottom-edge handle) with persisted value `quickViewHeight`; viewport clamps to ≤ 60vh.
- [2025-08-13] Done — Left-edge width resize with persisted value `quickViewWidth`; suppress outside-close while resizing.
- [2025-08-13] Done — Normalize clickOutside usage: support default and named imports; align action usage across components.
- [2025-08-13] Done — Prevent SearchMenu re-entrant loops by guarding duplicate onSearch payloads.
- [2025-08-14] Archived — Consolidated into [[20250814-quick-view-consolidated]]; pending items moved to consolidated DoD and Plan.

## Additional Done (2025-08-13)

- Left-edge resize added; persisted `quickViewWidth`; suppressed outside-close during active resize.
- Bottom-edge resize present; clamps height to viewport with internal scroll area.
- Viewport clamps applied; min-width 320px; clamped width/height to avoid off-screen jumps.
- Reused [src/components/SearchMenu.svelte](src/components/SearchMenu.svelte) in compact header for consistent listener/search behavior.

## Next Steps

- [ ] Cross-theme visual QA for chips, icons, resize handles.
- [ ] Verify focus trap and keyboard navigation with screen reader; ensure SR labels and roles are complete.
- [ ] Evaluate adopting `@floating-ui/dom` for positioning to align with [[25081103-fix-popover-overflow]] if needed.

## Issues

- Intermittent `plugin:keyboard-analyzer:1 Uncaught` on open and `contextmenu` handler long task logged. Instrumented try/catch in [src/main.ts](src/main.ts) to surface stack traces when dev logging is enabled; still gathering repro steps.

## Links

- [`src/components/QuickViewPopover.svelte`](src/components/QuickViewPopover.svelte)
- [`src/main.ts`](src/main.ts)
- [[25081213-quick-view-popover-for-fast-shortcuts]]
