---
title: Quick View Popover — polish UI and maintainability
status: in_progress
owner: "@agent"
updated: 2025-08-18 23:15 UTC
related:
  - [[ISSUE-quick-view-popover]]
---

## Context

Refine the Quick View Commands popover to be clean, compact, and maintainable. Reduce custom logic by reusing existing components where practical, but keep UX responsive and robust. Fix resizing (add top-left corner handle, persist size, avoid drift), compact list density, and ensure reliable keyboard search/listen flow (Mod+F toggling).

## Decisions

- [2025-08-18] Keep SearchMenu and CommandsList for reuse; hide heavy row actions via scoped CSS in popover to keep it compact.
- [2025-08-18] Replace bottom-only height resize with a top-left corner handle that adjusts width+height; persist width/height in settings.
- [2025-08-18] Track horizontal offset from anchor during resize to prevent post-layout jumps when reflow occurs.
- [2025-08-18] Capture Mod/Ctrl+F inside popover to focus search or toggle key listener; arrow/enter navigation runs commands and closes.
- [2025-08-18] Add small header action to open the full view (current pane, new pane, split) from popover.

## Implementation Summary

- [2025-08-18] Rewrote `src/components/QuickViewPopover.svelte` from scratch for a simpler layout and smaller code surface:
  - Clean header: group select, compact filters toggle, and open-view actions.
  - Search row with baked chips, clear button, and listener toggle; Mod/Ctrl+F handling.
  - Compact inlined list (name + hotkeys), arrow/Tab navigation, Enter to run and close.
  - Top-left corner resize + left-edge resize; persisted width/height; stable anchoring via `anchorOffsetX`.
- [2025-08-18] Fixed Svelte 5 event syntax to avoid mixed handlers in the new popover (`onchange`, `oninput`).
- [2025-08-18] Svelte/TS fixes outside popover:
  - `src/utils/systemShortcuts.ts`: replaced `@ts-expect-error` with safe `globalThis.process?.platform` lookup and navigator fallback.
  - `src/components/AddToGroupPopover.svelte`: typed `onkeydown` handler param as `KeyboardEvent`.

## Build & Checks

- [2025-08-18] TypeScript: `npx tsc -p tsconfig.json` — passing.
- [2025-08-18] Svelte check: errors addressed; remaining non-blocking warnings (unused selectors, a11y advisories) noted for later cleanup.
- [2025-08-18] Build: `npm run build` — success; outputs to `../obsidian-keyboard-analyzer-dev/`.

## Next Steps

- [ ] Verify compact styles across themes (light/dark).
- [ ] Validate keyboard behavior: Mod+F, Esc, arrows, Enter.
- [ ] Check resizing feels natural and persists across reload.
- [ ] Consider a minimal “view/filter” toggle grouping if needed for space.
- [ ] Optionally address Svelte a11y/unused selector warnings or suppress intentionally where appropriate.

## Links

- [[ISSUE-quick-view-popover]]
