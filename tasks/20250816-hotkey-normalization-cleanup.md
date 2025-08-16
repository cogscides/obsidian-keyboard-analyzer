---
title: Cleanup — Remove hotkey normalization and update call sites
status: in_progress
owner: "@agent"
updated: 2025-08-16 21:44 UTC
related:
  - [[20250815-centralize-command-hotkey-logic]]
---

## Context

The prior refactor centralized command metadata, hotkey matching, and `commandEntry` construction. As part of that work, `CommandsManager.processCommands()` introduced a hotkey normalization layer that populates both legacy arrays (`hotkeys`, `defaultHotkeys`, `customHotkeys`) and an additional `hotkeysObj { all, default, custom }` on each `commandEntry`. This dual-shape creates redundancy, encourages branching in consumers, and increases maintenance costs.

Goal: remove the `hotkeysObj` normalization, converge on a single canonical shape (the existing arrays on `commandEntry`), and update all consumers to rely on them. Keep fast reverse lookups via `getCommandsByHotkeyKey()` intact.

## Current State

- `CommandsManager` builds entries using `buildCommandEntry()` and then synthesizes `hotkeysObj` for compatibility; it also exposes `defaultHotkeys` and `customHotkeys` arrays.
- `HotkeyManager.getHotkeysForCommand()` prefers `entry.hotkeysObj` when present, otherwise falls back to the arrays.
- Reverse lookups are already centralized and strongly typed: `getCommandsIndex()` and `getCommandsByHotkeyKey()`.
- Types were tightened: CommandsManager API signatures are explicit; some unsafe casts in GroupManager/SettingsManager were removed and schemas updated.

## Decisions

- Deprecate `commandEntry.hotkeysObj` and stop synthesizing it during index builds (previously in `processCommands()`).
- Canonical shape for all consumers: `commandEntry.hotkeys` (all), `defaultHotkeys`, `customHotkeys`.
- Maintain `CommandsManager.getCommandsByHotkeyKey()` for fast duplicate detection and hotkey search — no change.
- Transitional period: keep `hotkeysObj` optional in `commandEntry` until all call sites are migrated, then remove from the interface.
- Optional enhancements approved:
  - Rename `processCommands()` to `rebuildIndex()` and document contract.
  - Expose `makeHotkeyKey` in `CommandsManager.d.ts` for external consumers.
  - Note: We opted not to keep a `toHotkeysObj` helper since code uses arrays directly; removing an unused helper keeps the API surface minimal.

## Next Steps

- [x] Update `HotkeyManager.getHotkeysForCommand()` to use arrays and drop `hotkeysObj` dependency.
- [x] Rename and simplify index building in `CommandsManager`:
  - [x] Rename `processCommands()` -> `rebuildIndex()` and document JSDoc.
  - [x] Remove `hotkeysObj` synthesis; build `hotkeyIndex` from `entry.hotkeys`.
- [x] API typing: expose `makeHotkeyKey` in `.d.ts`.
- [x] Remove unused `utils/hotkeys.ts` (no call sites required the helper).
- [x] Audit remaining usages of `hotkeysObj` in codebase (components/utils) and replace with arrays or `toHotkeysObj(entry)` where convenient.
- [x] After audit, remove `hotkeysObj?` from `src/interfaces/Interfaces.ts`.
- [ ] Verification:
  - [x] Type-check passes (`tsc --noEmit`).
  - [ ] Manual test in test vault (filters, search, duplicates, system shortcuts).
  - [ ] Confirm StrictModifierMatch parity between list and search.
- [ ] Documentation:
  - [ ] Update developer docs stating canonical arrays and recommended `toHotkeysObj` helper for object view.

## Links

- Supersedes cleanup from: [[20250815-centralize-command-hotkey-logic]]
- Code references: `src/managers/commandsManager/commandsManager.svelte.ts`, `src/managers/hotkeyManager/hotkeyManager.svelte.ts`, `src/interfaces/Interfaces.ts`
