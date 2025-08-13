---
title: Quick View — UI/UX fixes and behaviors
status: todo
owner: '@agent'
updated: 2025-08-13 01:12 UTC
related:
  - [[25081213-quick-view-popover-for-fast-shortcuts]]
  - [[25081103-fix-popover-overflow]]
---

## Context

Follow-up items to refine Quick View behaviors and UI based on feedback. Focus on input/event handling consistency with the full view, visibility of action icons, showing multiple hotkeys per command, and size/resize experience.

## Decisions

- [2025-08-13] Planned — Right-click activation: open Quick View on right mouse click on the status bar keyboard icon (override native context menu while click is on icon).
- [2025-08-13] Planned — Mod+F parity with main view:
  - If popover has focus but search is NOT focused → Mod+F focuses search only.
  - Only when search IS focused → Mod+F toggles listen mode.
  - Prevent propagation of Mod+F and Esc while the popover is active.
- [2025-08-13] Planned — Icon visibility/sizing: ensure lucide icons render at 16×16 within 28×28 buttons for “Clear” and “Activate key listener”.
- [2025-08-13] Planned — Multiple hotkeys per command: render all hotkeys as chips, wrap as needed.
- [2025-08-13] Planned — Resizable height and min-height:
  - Add DnD handle to change height; persist last height.
  - Keep a minimum height even if the result list is empty (to avoid shrinking).

## Next Steps

- [ ] Add right-click handler on status bar icon to open Quick View without native context menu.
- [ ] Adjust Mod+F behavior:
  - [ ] Mod+F focuses search when search not focused; no listen toggle.
  - [ ] Mod+F toggles listen only when search is focused.
  - [ ] Prevent propagation of Mod+F/Esc while popover is active.
- [ ] Fix icon sizing:
  - [ ] Normalize icon button container (28×28), ensure lucide icon size 16×16 and visible in all themes.
- [ ] Show all hotkeys per command:
  - [ ] Render chips for each hotkey; wrap; follow duplicate/custom highlighting conventions.
- [ ] Resizable popover height:
  - [ ] Add resize handle; enforce min-height; persist last height in settings; maintain empty-state min height.

## Links

- [`src/components/QuickViewPopover.svelte`](src/components/QuickViewPopover.svelte)
- [`src/main.ts`](src/main.ts)
- [[25081213-quick-view-popover-for-fast-shortcuts]]
