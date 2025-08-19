---
title: Quick View Popover — polish UI and maintainability
status: in_progress
owner: '@agent'
updated: 2025-08-19 16:28 UTC
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
- [x] Reintroduce safe persistence of `lastOpenedGroupId` (debounced on change).

  - feedback from team on usability and any edge cases encountered:
    - We need to bake modifiers in the popover active keys, consistent with SearchMenu and commands list in popover.
    - make sure it can be toggled off with developer tools
  - The `Run` toggle should be persistent, so it doesn't reset on popover reopen
    - CMD/CTRL+F when search input is focused doesn't trigger the active key listener. Need to be investigated and fixed
    - [x] `Run` commands persistence added (`quickViewAutoRun` setting).
    - When `Chord` modifiers is active, the behavior is inconsistent and needs to be reviewed. When `Chord` is active, it assigns the modifiers on click, and doesn't clear them on release.
  - [x] Bake modifier/key chip labels to use baked names when enabled (parity with SearchMenu).
  - [x] Sort active modifiers consistently with SearchMenu/Obsidian.
  - [x] Make search row match SearchMenu (chips, input, Keys toggle, Clear button) for visual and behavioral parity.
  - [x] Esc behavior consistency: Esc deactivates key listener if active, otherwise closes the popover even when input is blurred.
  - [x] Cmd/Ctrl+F toggles key listener even when input is focused.
  - [x] Status bar icon toggling: prevent immediate reopen on second click by guarding against reopen within 200ms of close.
  - [x] Chord/press mode: capture non-modifier active key while popover is focused and clear it on keyup; keep modifiers updated on press/release.

- [ ] Groups fix:
  - [ ] We need to add an intermediate state to the group "Default settings" is active to allow the user to interact with plugin views and popover independently.
  - e.g. when I open plugin view and popover and change view/filter settings it's applied to both. We need to have a way to isolate these changes. We need to display `Save` and reset button to in plugin view near the group selector and `Manage` button. It should be displayed if group filter settings are different from the default.
  - when the group `on open` setting is set to `Dynamic`, we need to ensure that we save the group state on close and restore it on reopen. This is to avoid the issue where the group filters is changing which applying settings for all views and popover.
  - So being said we need to clearly articulate the difference between `Default settings` and `Dynamic` group settings in the groupManager popup.

## Session Notes — 2025-08-18

- Fixed recurring mount crash and Svelte effect_update_depth_exceeded by removing reactive effects that mutated state during flush, deferring layout writes to microtasks, throttling recompute via rAF, and disabling ResizeObserver.
- Gated render with `mounted` and moved store/init to `onMount` to avoid pre-mount side effects.
- Restored styled GroupSelector in compact mode; now accepts `plugin` prop and guards `getGroups()`; Quick View passes `{plugin}` and handles `onchange` to refilter.
- Consolidated Open/New/Split into a single button with modifiers: Click → same pane; Ctrl/Cmd → new pane; Ctrl/Cmd+Alt → split.
- Added Run toggle; chips clickable; Backspace and Cmd/Ctrl+F behavior aligned with SearchMenu.
- Kept legacy event syntax to avoid mixed-syntax build errors with Svelte runes.

Outcome: Quick View opens reliably; no “Uncaught” or effect-depth errors; resizing and keyboard interactions verified. Build successful.

## Session Notes — 2025-08-19

- Added `quickViewAutoRun` to plugin settings (default true) and wired Quick View Run toggle to persist on change; loaded persisted value on mount.
- Reintroduced safe persistence of `lastOpenedGroupId` in Quick View via a debounced update when the bound group selector changes.
- Unified chip label rendering in Quick View with SearchMenu: use baked labels for modifiers/keys when `useBakedKeyNames` is enabled; fallback to `ActiveKeysStore.getDisplayKey()` for active key.

- Styling/UX and keys behavior:
  - Implemented scoped search row styles in Quick View (`.qv .search-wrapper`, input, chips, icon buttons) to match SearchMenu visually while avoiding global `src/styles.css` bleed. Aligned input background (transparent) and focus border/shadow.
  - Sorted active modifiers to match SearchMenu/Obsidian order; chips render from `sortedModifiers`.
  - Arrow/Tab navigation works even when input focused; Enter runs and closes when `Run` is active.
- Cmd/Ctrl+F handling hardened: capture at window level with `stopImmediatePropagation`, plus input-level handler; checks `e.code === 'KeyF'` too; toggles listener and focuses input as needed even when input is focused.
  - Also handle Mod+F globally even when the popover isn’t focused (prevents main view from stealing).
  - When popover is focused, prevent propagation of Mod+F to stop the main view from intercepting.
  - Esc consistency: Esc disables key listener if active, otherwise closes popover; works even if input isn’t focused.
  - Chord/press mode: when enabled, modifiers update on press/release; active key is set on keydown and cleared on keyup in popover scope.
- Status bar icon toggling: added 200ms reopen guard to prevent immediate reopen when closing.
  - Stabilized action buttons: removed transform-based pulse to avoid jump on activation; use subtle box-shadow glow instead.

- Command-trigger arming:
  - When opened via the Quick View command, arm a short window (~900ms) where pressing the same hotkey again (with modifiers still held) activates the key listener. Implemented by passing `armTriggers` from main to the popover and matching with `matchHotkey`.
  - Use live Obsidian `app.hotkeyManager` mappings (default+custom merged) to avoid stale cache after hotkey changes.

- Removed legacy double-run behavior:
  - Restored double-run behavior to activate listener while keeping the first run as a plain open. Implemented via a `listenToggle` nonce prop so second run toggles listener on the existing popover. Coexists with the arming approach.

Verification:

- Built locally; types pass. Confirmed Run toggle persists across reopen. Group selection updates `lastOpenedGroupId` without loops. Chip labels match SearchMenu with baked names on/off.

## Links

- [[ISSUE-quick-view-popover]]
