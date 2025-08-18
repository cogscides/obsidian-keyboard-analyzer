---
title: All Commands — On open + defaults; hotkeys polishing; search UX fix
status: done
owner: "@agent"
updated: 2025-08-17 17:30 UTC
related: []
---

## Context

User requested:
- Fix implicit `any` in GroupManager modal.
- Normalize hotkey display (platform-aware) in modal: search dropdown + list.
- Show hotkeys on the right of items in modal.
- In search, show all commands on focus and when the query is empty (no cap).
- Allow controlling “On open” behavior for the implicit All Commands group but keep it non-editable otherwise.
- Fix search dropdown being clipped when a group is empty.
- “Default settings” for All Commands should work in the main list (apply on open).

## Decisions

- [2025-08-17] Add `allGroupOnOpen` to settings to support All Commands behavior.
- [2025-08-17] Drop nested All defaults (`allGroupDefaults`); store a flat `allGroupDefaultFilters` instead to avoid reactive/proxy issues.
- [2025-08-17] Defer writes for `setAllGroupDefaults` to next tick; skip no-op writes in `applyDefaultsToAllFilters` to avoid flush loops.
- [2025-08-17] Apply on-open behavior only on group change (microtask) — not on every settings flush.
- [2025-08-17] Keep All Commands non-editable (no rename/delete/add/remove/DnD). Only expose behavior + defaults controls.
- [2025-08-17] Normalize hotkey display; use baked, platform-aware labels in modal; show hotkeys on right.
- [2025-08-17] Remove cap when query is empty; on focus show entire list.
- [2025-08-17] Allow dropdowns to overflow the modal body to avoid clipping.

## Next Steps

- [ ] Skipped — All Commands dynamic last-used snapshot (future enhancement) — would require a persistent last-used state for `all`.

## Changes

- `src/components/GroupManagerModal.svelte`
  - Typed event handlers to remove implicit `any`.
  - Consistent hotkeys rendering; show on the right in list.
  - Search: show all commands on focus and when empty (no cap); render platform-aware hotkeys.
  - Hide add/remove/DnD for All Commands; show only behavior + defaults buttons.
  - Fix dropdown clipping by allowing overflow.

- `src/utils/normalizeKeyDisplay.ts`
  - Used via imports (no changes) to render baked hotkeys.

- `src/managers/settingsManager/settingsManager.d.ts`
  - Add `allGroupOnOpen`, `allGroupDefaultFilters`.

- `src/managers/settingsManager/settingsManager.svelte.ts`
  - Default `allGroupOnOpen: 'default'`.

- `src/managers/groupManager/groupManager.svelte.ts`
  - Add `getGroupBehavior`/`setGroupBehavior` for `all`.
  - Add `setAllGroupDefaults()` (deferred write) and `applyDefaultsToAllFilters()` (skip no-op), prefer flat `allGroupDefaultFilters`.

- `src/components/KeyboardComponent.svelte`
  - Apply behavior on group change (microtask); separate effect to recompute list when defaults change.

## Verification

- All Commands in modal shows “On open” and defaults buttons only.
- Toggling filters in main list updates results; clicking “Use current filters as defaults” then changing toggles and clicking “Reset” restores snapshot.
- Focus search in a custom group with empty query lists all remaining commands; hotkeys display platform-appropriately.
- Search dropdown no longer clipped when group is empty.

## Links

- None
