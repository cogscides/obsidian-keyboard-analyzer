---
title: Quick View — Popover for fast shortcuts and command access
status: in_progress
owner: '@agent'
updated: 2025-08-13 02:05 UTC
related:
  - [[25080913-SPRINT-list-of-bugs-and-new-feature-requests]]
  - [[25080914-hotkey-groups]]
  - [[25081301-quick-view-ui-fixes]]
  - [[25081302-quick-view-refactor-reuse-code]]
---

## Context

Provide a lightweight, fast-access popover to quickly view and filter keyboard shortcuts and commands without opening the full Keyboard Analyzer view. The UX is similar to compact popups (e.g., [MySnippets-style](mysnippets-popup)), with an Obsidian command to open it. As an idea, on double-run (invoke command twice quickly) or via consistent key presses (cmd/ctrl+f), optionally enter a key-listen mode that filters results by the pressed modifiers/keys.

## Acceptance Criteria

- A new command “Keyboard Analyzer: Open Quick View” opens a compact popover near the keyboard icon in the status bar.
- Popover shows:
  - Search input with debounce and clear (x).
  - List of commands with their primary shortcut and plugin badge (respects existing badge visibility setting).
  - Optional filter chip(s) for current group or plugin; toggling updates list.
- Key listener mode:
  - If invoked twice within a short window (e.g., 500 ms), enable a key-listen mode that filters results by active modifiers/keys.
  - While listening, display active modifiers visually; pressing Esc exits listening.
- Performance:
  - Shows results instantly for large command sets (virtualized list or capped results with “more”) -> not sure about this, as I'll prefer have a limited height of the popup (maybe with resizing DnD option) and a scrollable list of commands.
  - No layout jank; max-height is configurable in settings; list scrolls within the popover.
- Accessibility:
  - Focus traps inside the popover; Tab order logical; close with Esc; aria-expanded/controls on trigger.
- Persistence:
  - Remembers last size (if resizable) and filters/views parameters should be able to configure in settings; no heavy state persisted.
- The popover never renders off-screen; it flips/shifts as needed.

## Decisions

- [2025-08-12] Pending — Determine activation model:
  - A) Two quick invocations of the same command to enable listen mode.
  - B) Single command to open popover, press CMD/CTRL+F to toggle listen mode.
- [2025-08-12] Pending — Use `@floating-ui/dom` for positioning vs small custom utility (align with [[25081103-fix-popover-overflow]]).
- [2025-08-12] Pending — Result cap (e.g., 100) and debounce (120–200 ms).
- [2025-08-13] Planned — Add right-click activation:
  - Right mouse click on the status bar keyboard icon should open the Quick View pop-up (context-open behavior, not native context menu override).
- [2025-08-13] Planned — Mod+F behavior parity with full view:
  - If popover is focused and search is not focused → Mod+F focuses search (no listen toggle).
  - Only when search is already focused → Mod+F toggles listen mode.
  - Stop propagation of Mod+F and Esc while inside the popover to avoid leaking to underlying views.
- [2025-08-13] Planned — Fix action icon sizing:
  - Ensure “Clear” and “Activate key listener” icons render at 16×16 inside 28×28 button frames; verify lucide component sizing and CSS.
- [2025-08-13] Planned — Multiple hotkeys per command:
  - Show all assigned hotkeys in a compact chip row; wrap gracefully when multiple hotkeys exist.
- [2025-08-13] Planned — Resizable height + stable min-height:
  - Provide a drag handle to resize popover height; persist last size; when results are empty, keep a minimum height so the popover doesn’t collapse.
- [2025-08-13] Planned — Reuse existing logic/components to improve DX:
  - Prefer extracting shared logic from [`src/components/SearchMenu.svelte`](src/components/SearchMenu.svelte) and [`src/components/CommandsList.svelte`](src/components/CommandsList.svelte) into a small shared store/utilities instead of duplicating in Quick View. Evaluate a thin QuickView shell that composes shared primitives.

## Files

- `src/components/QuickViewPopover.svelte` — popover shell, focus trap, keyboard handling, list rendering.
- `src/components/CommandsList.svelte` — reuse row rendering if feasible; otherwise add a compact row variant.
- `src/managers/commandsManager/commandsManager.svelte.ts` — search API for commands by name/plugin; optional limit param.
- `src/managers/hotkeyManager/hotkeyManager.svelte.ts` — provide key-listen signals for modifiers/keys.
- `src/main.ts` — register “Open Quick View” command and optional double-run detection.
- `src/utils/clickOutside.js` — verify behavior with popover portal/positioning.

## Next Steps

- [ ] Add right-click handler on status bar icon to open Quick View (no native context menu), and document behavior in tooltip/help.
- [ ] Mod+F handling parity:
  - [ ] In popover, if search is not focused, Mod+F focuses search and prevents propagation.
  - [ ] Only when search is focused, Mod+F toggles listen mode; ensure Esc/Mod+F do not propagate to underlying views.
- [ ] Fix action icon sizing in Quick View:
  - [ ] Adjust icon button dimensions to 28×28 and verify lucide icon sizing for “clear” and “listen” buttons; test across themes.
- [ ] Render multiple hotkeys per command:
  - [ ] Show all hotkeys as chips with wrapping; keep duplicates/custom styling consistent with [`src/components/CommandsList.svelte`](src/components/CommandsList.svelte).
- [ ] Add resizable height and min-height:
  - [ ] Add DnD resize handle; persist last height in settings; enforce a minimum height even with empty results.
- [ ] Refactor to reuse existing logic/components:
  - [ ] Extract shared search/listen/filter logic into a small shared store/utility; reuse rendering patterns from:
    - [`src/components/SearchMenu.svelte`](src/components/SearchMenu.svelte)
    - [`src/components/CommandsList.svelte`](src/components/CommandsList.svelte)
  - [ ] Draft a DX proposal for shared primitives and how Quick View composes them.
- [ ] Positioning utility alignment with [[25081103-fix-popover-overflow]]: evaluate adopting `@floating-ui/dom` or consolidate custom clamp/flip utility.
- [ ] A11y verification after updates (focus trap, roles, labels, min target sizes) and manual QA with large command sets.

## Links

- [`src/components/CommandsList.svelte`](src/components/CommandsList.svelte)
- [`src/managers/hotkeyManager/hotkeyManager.svelte.ts`](src/managers/hotkeyManager/hotkeyManager.svelte.ts)
- [[25081103-fix-popover-overflow]]
- [[25080913-SPRINT-list-of-bugs-and-new-feature-requests]]

## Decisions

- [2025-08-13] Implemented — Right-click on status bar keyboard icon opens Quick View (suppresses native context menu on icon only).
- [2025-08-13] Implemented — Mod+F behavior parity in Quick View: when search not focused, Mod+F focuses search; when focused, toggles listen. Esc stops listening or closes popover. Events are stopped to avoid leaking.
- [2025-08-13] Implemented — Action icons normalized: 16×16 icons in 28×28 buttons.
- [2025-08-13] Implemented — Multiple hotkeys per command rendered as chips with duplicate/custom styling consistent with main list.
- [2025-08-13] Implemented — Popover resizable by drag handle; height persisted to settings as `quickViewHeight`; min-height enforced.

## Next Steps

- [ ] Positioning utility alignment with [[25081103-fix-popover-overflow]]: evaluate adopting `@floating-ui/dom` or consolidate custom clamp/flip utility.
- [ ] Refactor to reuse existing logic/components (see related task).
- [ ] A11y verification pass and screenshots across themes.
