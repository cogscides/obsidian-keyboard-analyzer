---
title: Quick View Popover — polish UI and maintainability
status: in_progress
owner: "@agent"
updated: 2025-08-18 23:59 UTC
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
- [2025-08-18] Unify Open/New/Split into a single button: click=open, Ctrl/Cmd=new, Ctrl/Cmd+Alt=split.
- [2025-08-18] Add Run toggle: when off, click/Enter does not execute; when on, selection runs.
- [2025-08-18] Make modifier/key chips clickable and Backspace clears key/modifiers when search empty (parity with SearchMenu).
- [2025-08-18] Fix CMD/Ctrl+F when input focused by handling on input keydown in addition to global capture.
- [2025-08-18] Clamp width/height to viewport caps in code to avoid CSS max-width drift that shifted the popover left.
- [2025-08-18] Update QuickView group selector to reuse the same styled GroupSelector as SearchMenu (with Manage).
 - [2025-08-18] Resolve mount/effect loops by removing reactive `$effect` blocks that mutate state; gate UI by `mounted`; init stores on mount; pass `plugin` explicitly to `GroupSelector` and guard `getGroups()` access.
 - [2025-08-18] Break layout feedback loops: defer `coords/placeAbove` writes with `queueMicrotask`, throttle recompute via `requestAnimationFrame`, and disable `ResizeObserver` for the popover.
 - [2025-08-18] Keep legacy event attributes (`onclick_outside`, `onchange`) to avoid Svelte mixed-syntax build errors.

## Implementation Summary

- [2025-08-18] Rewrote `src/components/QuickViewPopover.svelte` from scratch for a simpler layout and smaller code surface:
  - Clean header: group select, compact filters toggle, and open-view actions.
  - Search row with baked chips, clear button, and listener toggle; Mod/Ctrl+F handling.
  - Compact inlined list (name + hotkeys), arrow/Tab navigation, Enter to run and close.
  - Top-left corner resize + left-edge resize; persisted width/height; stable anchoring via `anchorOffsetX`.
- [2025-08-18] Fixed Svelte 5 event syntax to avoid mixed handlers in the new popover (`onchange`, `oninput`).
- [2025-08-18] Removed `$effect` for `listenToggle` and group persistence; `listenerActive` set once on mount; refilter invoked by explicit handlers (input, chips, selector `onchange`).
- [2025-08-18] Switched recompute to microtask + rAF scheduling; disabled `ResizeObserver`; added structured `[qv]` dev logs for mount/recompute/resize.
- [2025-08-18] `GroupSelector` now supports `compact` and optional `plugin` prop; Quick View passes `{plugin}` and uses `onchange` to refilter.
- [2025-08-18] Svelte/TS fixes outside popover:
  - `src/utils/systemShortcuts.ts`: replaced `@ts-expect-error` with safe `globalThis.process?.platform` lookup and navigator fallback.
  - `src/components/AddToGroupPopover.svelte`: typed `onkeydown` handler param as `KeyboardEvent`.

## Build & Checks

- [2025-08-18] TypeScript: `npx tsc -p tsconfig.json` — passing.
- [2025-08-18] Svelte check: errors addressed; remaining non-blocking warnings (unused selectors, a11y advisories) noted for later cleanup.
- [2025-08-18] Build: `npm run build` — success; outputs to `../obsidian-keyboard-analyzer-dev/`.

## Next Steps

- [x] Verify compact styles across themes (light/dark).
- [x] Validate keyboard behavior: Mod+F, Esc, arrows, Enter, Backspace.
- [x] Check resizing (top-left + left edge) feels natural and persists across reload; ensure top/height move together.
- [ ] Consider a minimal “view/filter” toggle grouping if needed for space.
- [ ] Optionally address Svelte a11y/unused selector warnings or suppress intentionally where appropriate.
- [ ] Reintroduce safe persistence of `lastOpenedGroupId` (debounced on change or on popover close, not via `$effect`).

## Session Notes — 2025-08-18

- Fixed recurring mount crash and Svelte effect_update_depth_exceeded by removing reactive effects that mutated state during flush, deferring layout writes to microtasks, throttling recompute via rAF, and disabling ResizeObserver.
- Gated render with `mounted` and moved store/init to `onMount` to avoid pre-mount side effects.
- Restored styled GroupSelector in compact mode; now accepts `plugin` prop and guards `getGroups()`; Quick View passes `{plugin}` and handles `onchange` to refilter.
- Consolidated Open/New/Split into a single button with modifiers: Click → same pane; Ctrl/Cmd → new pane; Ctrl/Cmd+Alt → split.
- Added Run toggle; chips clickable; Backspace and Cmd/Ctrl+F behavior aligned with SearchMenu.
- Kept legacy event syntax to avoid mixed-syntax build errors with Svelte runes.

Outcome: Quick View opens reliably; no “Uncaught” or effect-depth errors; resizing and keyboard interactions verified. Build successful.

## Links

- [[ISSUE-quick-view-popover]]
