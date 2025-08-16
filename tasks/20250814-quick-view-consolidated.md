---
title: Quick View — Consolidated: Popover, UI/UX fixes, and Refactor
status: in_progress
owner: "@agent"
updated: 2025-08-16 23:20 UTC
related:
  - [[25081103-fix-popover-overflow]]
  - [[25080914-hotkey-groups]]
merged_from:
  - [[25081213-quick-view-popover-for-fast-shortcuts]]
  - [[25081301-quick-view-ui-fixes]]
  - [[25081302-quick-view-refactor-reuse-code]]
---

## Context

Unify Quick View efforts into a single task covering: the popover shell and behaviors, UI/UX refinements, and refactor to reuse shared logic/components. The Quick View provides a compact, fast-access surface to search and execute commands, with consistent keyboard-listen mode and filters shared with the main view.

## Current State (observed 2025-08-14)

Implemented (subject to re-verification after latest changes):

- Command to open Quick View near the status bar keyboard icon.
- Right-click activation on the status bar icon with native context menu suppressed on the icon.
- Mod+F parity: focuses search if not focused; toggles listen mode if already focused. Esc handling prevents leakage to underlying views.
- Reuse of [src/components/SearchMenu.svelte](src/components/SearchMenu.svelte) in the Quick View header.
- Multiple hotkeys per command rendered as chips with wrapping.
- Resizable width (left handle) and height (bottom handle) with viewport clamps and persisted size (`quickViewWidth`, `quickViewHeight`).
- Viewport clamping and flipping above when space below is insufficient.
- Stabilized clickOutside exports/usage across components; idempotent onSearch guard in SearchMenu.

Known issues/gaps:

- Intermittent “plugin:keyboard-analyzer:1 Uncaught” lines and “contextmenu handler took N ms” warning on open. Needs instrumentation around openQuickView in [src/main.ts](src/main.ts) and performance marks for the contextmenu callback.
- No explicit focus trap; initial focus behavior and SR labels require audit.
- Plugin-badge click-to-filter in Quick View is stubbed.
- Positioning utility not unified with overflow work; evaluate adopting @floating-ui/dom for consistency with [[25081103-fix-popover-overflow]].
- Virtualization not implemented; result cap of 100 used today.
- Cross-theme visual QA pending.

Recent fix (2025-08-16):

- Resolved mount failure "SearchMenu is not defined" in Quick View by adding missing imports (`SearchMenu`, `CommandsList`, and `clickOutside`) to `src/components/QuickViewPopover.svelte`. Build succeeded and Quick View verified to open. (commit 507675e)

## Definition of Done

Behavior:

- Quick View opens reliably from the status bar icon (left and right click as designed) and via the command palette.
- Mod+F and Esc behavior is consistent with the main view; no key event leakage to underlying views.
- Key-listen mode toggles via Mod+F (when focused in search) and is visibly indicated.
- Plugin badge click filters the results by plugin within Quick View.

UX/A11y:

- Explicit focus trap: initial focus lands on search input; roving tabindex for results is keyboard-navigable; Esc closes popover.
- SR labels/roles are complete: dialog, listbox, rows identified; action buttons labeled.
- Chips, icons, and resize handles render correctly across light/dark themes and major OSes.

Performance/Robustness:

- No “Uncaught” log lines during open; instrumentation in place behind dev logging flag to catch mount errors.
- Contextmenu handler duration within reasonable bounds; no long tasks attributable to Quick View open path.
- Result capping defaults to 100; virtualization added only if necessary for smooth scrolling on large sets.

Refactor:

- Introduce a shared search/listen utility (plain TS) managing query, debounce, and listen toggling rules used by both Quick View and the main view.
- Compact rendering strategy: either parameterize [src/components/CommandsList.svelte](src/components/CommandsList.svelte) with a compact variant or add `CommandsListCompact.svelte` reusing existing helpers.
- Quick View remains a thin shell: positioning, anchors, resize; filtering/listen logic composed from shared primitives.

## Plan (ordered)

1. Instrumentation and error visibility

- Add try/catch logging in Quick View open path in [src/main.ts](src/main.ts) and performance marks around the status bar icon contextmenu handler. Gate logs behind a dev flag to avoid noisy production.
- Acceptance: Repro steps create structured logs with error and stack when mount fails; Performance marks visible in Performance timeline.

2. A11y baseline and focus trap

- Implement explicit focus trap within [src/components/QuickViewPopover.svelte](src/components/QuickViewPopover.svelte): initial focus to search input; roving tabindex already exists for rows; ensure Shift+Tab and Tab cycle within the dialog.
- Add SR roles/labels: dialog, listbox, rows, and icon buttons with aria-label.
- Acceptance: Keyboard navigation fully operable without mouse; tested with macOS VoiceOver focus order.

3. Plugin-badge filter in Quick View

- In [src/components/CommandsList.svelte](src/components/CommandsList.svelte), wire badge click to emit plugin filter event; in [src/components/QuickViewPopover.svelte](src/components/QuickViewPopover.svelte) handle event to filter by plugin (via commandsManager.filterCommands).
- Acceptance: Clicking a plugin badge filters results to that plugin, visibly indicated; clearing restores previous filter.

4. Positioning consistency

- Evaluate adopting @floating-ui/dom or keep current clamps; ensure off-screen prevention matches behavior of [[25081103-fix-popover-overflow]].
- Acceptance: Popover consistently stays within viewport and flips when needed; no overlap misalignment near screen edges.

5. Refactor: shared search/listen primitives

- Extract a plain TS utility (e.g., src/utils/searchListen.ts) managing query, debounce, and listen toggling rules used by both Quick View and the main view; adjust [src/components/SearchMenu.svelte](src/components/SearchMenu.svelte) and [src/components/QuickViewPopover.svelte](src/components/QuickViewPopover.svelte) to consume.
- Acceptance: No duplicate logic for Mod+F toggling or debounce; behavior matches in both views.

6. Compact commands list strategy

- Parameterize compact variant in [src/components/CommandsList.svelte](src/components/CommandsList.svelte) or create `src/components/CommandsListCompact.svelte` reusing helpers/chips and badges; ensure selected row styling works with roving tabindex.
- Acceptance: Compact layout renders in Quick View with parity to full list visuals for chips/badges; keyboard selection highlight is visible.

7. Optional: Virtualization decision

- If performance on large lists with cap > 100 is inadequate, add a simple virtualization (e.g., fixed-height rows, windowed rendering).
- Acceptance: Smooth scrolling on 500+ items; no visual jumping.

8. Cross-theme visual QA

- Validate chips, icons, resize handles, and focus rings across light/dark; adjust CSS tokens in [src/components/QuickViewPopover.svelte](src/components/QuickViewPopover.svelte) and global styles if needed.
- Acceptance: No contrast or overflow issues; no horizontal scroll.

## Files in scope

- [src/components/QuickViewPopover.svelte](src/components/QuickViewPopover.svelte)
- [src/components/CommandsList.svelte](src/components/CommandsList.svelte)
- [src/components/SearchMenu.svelte](src/components/SearchMenu.svelte)
- [src/main.ts](src/main.ts)
- [src/utils/clickOutside.js](src/utils/clickOutside.js)
- [src/utils/searchListen.ts](src/utils/searchListen.ts) (new; if adopted)
- [src/utils/logger.ts](src/utils/logger.ts) (dev logging gate)

## Risks and Mitigations

- Scope creep in refactor — stage changes and validate in both views after each step.
- A11y regressions — use manual keyboard testing and SR checks per acceptance.
- Positioning inconsistency — prefer a single approach; keep clamps if floating-ui adds weight or complexity.

## Next Steps

- [ ] Add instrumentation around Quick View open path and contextmenu handler in main.ts
- [ ] Implement explicit focus trap and SR labels in Quick View
- [ ] Plugin-badge filter click support in CommandsList + Quick View
- [ ] Decide on positioning utility; align behavior
- [ ] Extract shared search/listen utility and adopt in Quick View + SearchMenu
- [ ] Compact commands list variant or component
- [ ] Evaluate need for virtualization
- [ ] Cross-theme QA sweep

## Progress Log

- [2025-08-16 23:19 UTC] Quick View mount error fixed by importing `SearchMenu` and `CommandsList` in `QuickViewPopover.svelte`; added `clickOutside` import for outside-click handling. Built and smoke-tested.

## Links

- [src/components/QuickViewPopover.svelte](src/components/QuickViewPopover.svelte)
- [src/components/CommandsList.svelte](src/components/CommandsList.svelte)
- [src/components/SearchMenu.svelte](src/components/SearchMenu.svelte)
- [src/managers/commandsManager/commandsManager.svelte.ts](src/managers/commandsManager/commandsManager.svelte.ts)
- [[25081103-fix-popover-overflow]]
