---
title: Toggles UX and filtering fixes
status: in_progress
owner: "@agent"
updated: 2025-08-08 18:00 UTC
related:
  - design-note
---

## Context
Dropdowns were mispositioned and toggles were not interactive. After migrating to Svelte 5 reactivity, derived settings weren’t updating UI. We refactored to bind checkboxes directly to derived `filterSettings` and fixed menu anchoring.

## Decisions
- [2025-08-08] Remove local UI mirrors to avoid reactive loops; bind directly to `filterSettings` with explicit `onchange`.
- [2025-08-08] Anchor dropdowns under triggers using `.menu-anchor` and absolute menu positioning.
- [2025-08-08] Persist group filter updates via `groupManager.updateGroupFilterSettings` (in-place update by index; fallback to defaults for special groups).
- [2025-08-08] Adjust `commandsManager.filterCommands` to apply list-level filters even when no search/active keys (ensures "Only with hotkeys" affects list).

## Next Steps
- [ ] Verify "Only with hotkeys" hides commands with zero hotkeys.
- [ ] Verify "Display internal modules" includes/excludes internal module commands.
- [ ] Verify "Highlight duplicates" marks duplicates when toggled, and does not when off.
- [ ] Verify "Display IDs" shows/hides command IDs.
- [ ] Audit duplicate options between Filter button and View dropdown; consolidate or ensure single source of truth.

## Logs
- Added [KB] logs in `SearchMenu`, `GroupManager`, `CommandsManager`, and `CommandsList` to trace settings and filtering.
---
title: Hotkeys not loading after reload when view persisted
status: todo
owner: "@unassigned"
updated: 2025-08-08 10:48 UTC
related: []
---
# Task: Hotkeys not loading after reload when view persisted

- Status: todo
- Owner: @unassigned
- Updated: 2025-08-08 10:43 UTC
- Related: <add issue/PR links>

## Context
When the keyboard shortcuts view is persisted in tabs and the app reloads, the view opens but does not load current keybindings (empty or partial UI).

## Decisions
- 2025-08-08: Ensure managers initialize before view render and re-hydrate view on layout ready.
- 2025-08-08: Validate that `ShortcutsView.onOpen()` refreshes data and that `KeyboardAnalyzerPlugin` wires the latest plugin instance into existing leaves.

## Next Steps
- [ ] Reproduce with a persisted view; capture console logs.
- [ ] Verify `settingsManager.loadSettings()` and `hotkeyManager.initialize()` timing vs. `registerView`/`onLayoutReady`.
- [ ] If needed, trigger a store refresh or explicit `view.refresh()` after `onLayoutReady`.
- [ ] Add regression note to AGENTS.md testing checklist.

## Progress Log
- 2025-08-08 10:43 UTC: Backfilled task with template; outlined init-order checks and refresh path.

## Links
- [[AGENTS.md]]
