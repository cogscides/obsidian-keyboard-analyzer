---
title: Quick View — UI/UX fixes and behaviors
status: in_progress
owner: '@agent'
updated: 2025-08-13 02:05 UTC
related:
  - [[25081213-quick-view-popover-for-fast-shortcuts]]
  - [[25081103-fix-popover-overflow]]
---

## Context

Follow-up items to refine Quick View behaviors and UI based on feedback. Focus on input/event handling consistency with the full view, visibility of action icons, showing multiple hotkeys per command, and size/resize experience.

## Decisions

- [2025-08-13] Done — Right-click activation: open Quick View on right mouse click on the status bar keyboard icon (override native context menu while click is on icon).
- [2025-08-13] Done — Mod+F parity with main view implemented inside Quick View.
- [2025-08-13] Done — Icon visibility/sizing: lucide icons render at 16×16 within 28×28 buttons for “Clear” and “Activate key listener”.
- [2025-08-13] Done — Multiple hotkeys per command: chips render with wrapping.
- [2025-08-13] Done — Resizable height and min-height with persisted value `quickViewHeight`.

## Next Steps

- [ ] Cross-theme visual QA for chips, icons, resize handle.
- [ ] Verify focus trap and keyboard navigation with screen reader.

## Links

- [`src/components/QuickViewPopover.svelte`](src/components/QuickViewPopover.svelte)
- [`src/main.ts`](src/main.ts)
- [[25081213-quick-view-popover-for-fast-shortcuts]]
