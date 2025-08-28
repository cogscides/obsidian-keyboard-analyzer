---
title: Quick View — Popover for fast shortcuts and command access
status: in_progress
owner: '@agent'
updated: 2025-08-14 08:33 UTC
related:
  - [[25080913-SPRINT-list-of-bugs-and-new-feature-requests]]
  - [[25080914-hotkey-groups]]
  - [[25081103-fix-popover-overflow]]
merged_from:
  - [[25081301-quick-view-ui-fixes]]
  - [[25081302-quick-view-refactor-reuse-code]]
merged_into:
  - [[20250814-quick-view-consolidated]]
---

## Context

Provide a lightweight, fast-access popover to quickly view and filter keyboard shortcuts and commands without opening the full Keyboard Analyzer view. The UX is similar to compact popups (e.g., [MySnippets-style](mysnippets-popup)), with an Obsidian command to open it. As an idea, on double-run (invoke command twice quickly) or via consistent key presses (cmd/ctrl+f), optionally enter a key-listen mode that filters results by the pressed modifiers/keys.

## Acceptance Criteria

- [x] A new command “Keyboard Analyzer: Open Quick View” opens a compact popover near the keyboard icon in the status bar.
- [x] Popover shows:
  - [x] Search input with debounce and clear (x), plus “activate key listener” control.
  - [x] List of commands with their hotkeys and plugin badge (respects ShowPluginBadges).
  - [ ] Optional plugin filter via badge click in Quick View (stubbed).
- [x] Key listener mode:
  - [x] Double-run within ~500 ms enables key-listen mode.
  - [x] While listening, active modifiers/keys are displayed; Esc exits or clears.
- [~] Performance:
  - [x] Limited popover height with internal scroll; results cap to 100 by default.
  - [ ] Virtualized list (deferred; current cap/scroll approach is acceptable for MVP).
- [~] Accessibility:
  - [x] Esc does not leak to underlying views; Mod+F parity behavior implemented.
  - [ ] Add explicit focus trap; ensure initial focus and SR labels are complete.
- [x] Persistence:
  - [x] Remembers last size: width and height persisted in settings.
  - [x] No heavy state persisted across sessions; filters via group settings.
- [x] The popover clamps to viewport and flips above when needed (no off-screen rendering).

## Decisions

- [2025-08-12] Pending — Determine activation model:
  - A) Two quick invocations of the same command to enable listen mode.
  - B) Single command to open popover, press CMD/CTRL+F to toggle listen mode.
- [2025-08-12] Pending — Use `@floating-ui/dom` for positioning vs small custom utility (align with [[25081103-fix-popover-overflow]]).
- [2025-08-12] Pending — Result cap (e.g., 100) and debounce (120–200 ms).
- [2025-08-13] Done — Right-click activation: open Quick View on right mouse click on the status bar keyboard icon (suppress native context menu on the icon).
- [2025-08-13] Done — Mod+F parity with full view:
  - If popover is focused and search is not focused → Mod+F focuses search.
  - Only when search is already focused → Mod+F toggles listen mode.
  - Stop propagation of Mod+F and Esc while inside the popover to avoid leaking to underlying views.
- [2025-08-13] Done — Fix action icon sizing: lucide icons render at 16×16 inside 28×28 buttons for “Clear” and “Activate key listener”.
- [2025-08-13] Done — Multiple hotkeys per command: show all assigned hotkeys as chips, wrapping as needed.
- [2025-08-13] Done — Resizable height and width with persistence:
  - Bottom-edge height resize with viewport clamps; persist quickViewHeight.
  - Left-edge width resize with viewport clamps; persist quickViewWidth; suppress outside-close during active resize.
- [2025-08-13] Done — Reuse existing logic/components to improve DX:
  - Reused [src/components/SearchMenu.svelte](src/components/SearchMenu.svelte) in compact header for behavioral parity with main view.
  - Provided required Svelte contexts (plugin, visualKeyboardManager, activeKeysStore).
- [2025-08-13] Done — Stabilize clickOutside usage and imports:
  - Normalized exports to support default and named imports in [src/utils/clickOutside.js](src/utils/clickOutside.js) and [src/utils/clickOutside.d.ts](src/utils/clickOutside.d.ts).
  - Switched SearchMenu to default import to match action usage in [src/components/SearchMenu.svelte](src/components/SearchMenu.svelte).
- [2025-08-13] Done — Prevent SearchMenu re-entrant loops/freezes:
  - Added idempotent onSearch guard to suppress duplicate payloads in [src/components/SearchMenu.svelte](src/components/SearchMenu.svelte).
- [2025-08-14] Archived — Consolidated into [[20250814-quick-view-consolidated]]; remaining Next Steps migrated there for execution and verification.

## Files

- [src/components/QuickViewPopover.svelte](src/components/QuickViewPopover.svelte) — popover shell, focus trap, keyboard handling, list rendering.
- [src/components/CommandsList.svelte](src/components/CommandsList.svelte) — reuse row rendering if feasible; otherwise add a compact row variant.
- [src/managers/commandsManager/commandsManager.svelte.ts](src/managers/commandsManager/commandsManager.svelte.ts) — search API for commands by name/plugin; optional limit param.
- [src/managers/hotkeyManager/hotkeyManager.svelte.ts](src/managers/hotkeyManager/hotkeyManager.svelte.ts) — provide key-listen signals for modifiers/keys.
- [src/main.ts](src/main.ts) — register “Open Quick View” command and optional double-run detection.
- [src/utils/clickOutside.js](src/utils/clickOutside.js) — verify behavior with popover portal/positioning; now includes default export.

## Next Steps (merged)

- [x] Add right-click handler on status bar icon to open Quick View (no native context menu); document in tooltip/help.
- [x] Mod+F handling parity inside popover.
- [x] Icon sizing for “Clear” and “Activate key listener”.
- [x] Render multiple hotkeys per command as chips with wrapping.
- [x] Resizable width/height with min/max clamps and persistence; suppress outside-close during resize.
- [ ] Implement plugin badge click to filter by plugin in Quick View.
- [ ] Positioning utility alignment with [[25081103-fix-popover-overflow]]: evaluate adopting `@floating-ui/dom` vs current custom clamps.
- [ ] Add explicit focus trap and ensure initial focus lands on the search input; verify SR labels/roles.
- [ ] Virtualization (optional): evaluate if current 100-item cap is sufficient; if not, add simple virtualization.
- [ ] Cross-theme visual QA for chips, icons, and resize handles.
- [ ] Instrument and resolve intermittent open error (see Current Issues below); add error logging around Quick View mount in main.ts.

## Links

- [`src/components/CommandsList.svelte`](src/components/CommandsList.svelte)
- [`src/managers/hotkeyManager/hotkeyManager.svelte.ts`](src/managers/hotkeyManager/hotkeyManager.svelte.ts)
- [`src/components/SearchMenu.svelte`](src/components/SearchMenu.svelte)
- [[25081103-fix-popover-overflow]]
- [[25080913-SPRINT-list-of-bugs-and-new-feature-requests]]

## Implementation Summary (2025-08-13)

- Implemented — Replaced custom search header with reused [src/components/SearchMenu.svelte](src/components/SearchMenu.svelte) in compact header for behavioral parity with main view.
- Implemented — Provided Svelte contexts in Quick View (`keyboard-analyzer-plugin`, `visualKeyboardManager`, `activeKeysStore`) to support reused components.
- Implemented — Left-edge resize with pointer capture; persisted `quickViewWidth`; suppressed outside-close during resize.
- Implemented — Bottom-edge height resize with viewport clamps; persisted `quickViewHeight`.
- Implemented — Viewport clamps: min-width 320px; width and height clamped to viewport to avoid off-screen issues.
- Implemented — Close resets listen flags to avoid sticky key-listen state after reopen.
- Implemented — Global key handler inside popover: Mod+F focuses search or toggles listen mode; Esc is stopped from propagating to underlying views.
- Implemented — Normalized clickOutside to default export and aligned imports; added idempotent onSearch guard to stabilize the UI and resolve freeze.

## Current Issues

- On Quick View open we still see:
  ```
  plugin:keyboard-analyzer:1 Uncaught
  [Violation] 'contextmenu' handler took <N>ms
  plugin:keyboard-analyzer:1 Uncaught
  ```
  Notes:
  - This appears around right-click activation on the status bar icon.
  - Potential cause: an exception thrown during Svelte mount is swallowed by try/catch in `openQuickView`, leaving only “Uncaught” console lines without stack; also the contextmenu handler may be doing extra work synchronously.
    Actions:
  - Instrument `openQuickView` catch in `src/main.ts` to log the actual error and stack (without spamming production logs).
  - Add performance marks around the contextmenu callback to measure handler duration.
  - Re-verify that `anchorEl` exists and contexts (`VisualKeyboardManager`, `ActiveKeysStore`) construct without costly side-effects.

## Refactor Plan (merged from 25081302)

- [ ] Inventory duplicated logic across:
  - [`src/components/SearchMenu.svelte`](src/components/SearchMenu.svelte)
  - [`src/components/CommandsList.svelte`](src/components/CommandsList.svelte)
  - [`src/components/QuickViewPopover.svelte`](src/components/QuickViewPopover.svelte)
- [ ] Extract a shared search/listen module (plain TS):
  - [ ] Manage text query, debounce, listen-mode toggling rules (Mod+F parity).
  - [ ] Expose helpers to compute filtered commands via `commandsManager.filterCommands`.
- [ ] Compact row rendering strategy:
  - [ ] Either parameterize `CommandsList.svelte` with a compact variant, or create `CommandsListCompact.svelte` reusing helpers for badges, chips, and duplicate/custom highlighting.
- [ ] Replace remaining Quick View internal glue with shared primitives; keep Quick View focused on shell: positioning, anchors, and resize.
