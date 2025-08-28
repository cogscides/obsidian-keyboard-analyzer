---
title: Refactor — Centralize command metadata, hotkey matching, and commandEntry state (Deprecated)
status: done
owner: '@agent'
updated: 2025-08-16 21:10 UTC
related:
  - [[20250816-hotkey-normalization-cleanup]]
---

> Archived — This task was developed and logged incorrectly, then rewritten from scratch to address the core issue. Remaining work has been migrated to [[20250816-hotkey-normalization-cleanup]].

## Context

There is duplicated and divergent logic across managers causing drift and inconsistent behavior: plugin metadata helpers, command "reduction" (commandEntry building), and hotkey matching semantics. The planner verdict requests centralizing metadata helpers, unifying the hotkey-match function, and making CommandsManager the single source of commandEntry state.

## Decisions

- [2025-08-15] Decision made — Implement a minimal-surface refactor to: extract shared command metadata utilities, introduce a single `matchHotkey` function, unify `commandEntry` building, and consolidate `commandEntry` state under CommandsManager for consistency and to remove duplication.
- [2025-08-16] Implementation decision — Bundle `buildCommandEntry` into the app bundle (ES import) so runtime loads in built output. Use defensive lazy access to CommandsManager from HotkeyManager where initialization order may require it.
- [2025-08-16] Fixed types conflict — removed duplicate declaration that caused TS2717; this was a necessary precondition for the build and runtime to succeed.
- [2025-08-16] Operational note — CommandsManager now normalizes hotkeys to the authoritative `hotkeysObj { all, default, custom }` and exposes both legacy `hotkeys: hotkeyEntry[]` and `hotkeysObj` for compatibility. HotkeyManager no longer maintains a local commands mirror and defers to CommandsManager.getCommandsIndex() with a defensive fallback to `buildCommandEntry`.
- [2025-08-16] Performance fix — Removed dynamic `require('../commandsManager')` lookups from hot paths (HotkeyManager, commandBuilder). Managers are now wired once in `main.ts` via `hotkeyManager.attachCommandsManager(commandsManager)`, eliminating runtime module resolution overhead and circular-init stalls.
- [2025-08-16] Performance fix — Bounded `matchHotkey` cache to 2k entries (previously unbounded), preventing memory growth and GC thrash during rapid key filtering.
- [2025-08-16] Performance fix — Hotkey search now uses `CommandsManager`'s precomputed `hotkeyIndex` via `makeHotkeyKey()` + `getCommandsByHotkeyKey()` instead of scanning all commands, eliminating O(N) scans on each key press.
- [2025-08-16] Cleanup — Removed duplicated `getPluginName` and `isInternalModule` helpers from managers; centralized metadata helpers in `src/utils/commandMeta.ts` are the single source of truth.
- [2025-08-16] Cleanup — Simplified `buildCommandEntry()` to rely only on `hotkeyManager.getHotkeysForCommand()` (plus a minimal legacy fallback). Removed all dynamic manager lookups and any implicit caching.
- [2025-08-16] Cleanup — Simplified `buildCommandEntry()` to rely only on `hotkeyManager.getHotkeysForCommand()`; removed any remaining legacy fallbacks (e.g., `getAllHotkeysForCommand`) and dynamic lookups.
- [2025-08-16] UI cache removal — Removed component-level row caching in `QuickViewPopover.svelte`; DOM is queried on demand for selection management. No memoized caches are left in UI components.
- [2025-08-16] No-caching matcher — Removed matchHotkey memoization and profiling timers; matcher now computes directly without cache.
- [2025-08-16] HotkeyManager — Removed local warmed fallback index and any sync scans of `app.commands`; relies solely on `CommandsManager` wiring for index lookups. If unavailable, returns empty results.
- [2025-08-16] Deprecated/Refactored — Marking this task as completed and archived. Follow-up cleanup to remove `hotkeysObj` normalization and update call sites is tracked in [[20250816-hotkey-normalization-cleanup]].

## Next Steps (archived)

- [x] Create shared metadata utilities:
  - [x] Add [`src/utils/commandMeta.ts:1`](src/utils/commandMeta.ts:1) exporting `getPluginName(app: App, pluginId: string): string` and `isInternalCommand(app: App, commandId: string): boolean`.
  - [x] Replaced local implementations in manager files to import from [`src/utils/commandMeta.ts:1`](src/utils/commandMeta.ts:1).
- [x] Unify hotkey matching:
  - [x] Add `matchHotkey(hotkey, activeMods, activeKey, opts)` to [`src/utils/modifierUtils.ts:188`](src/utils/modifierUtils.ts:188) with options `{ strictModifierMatch; allowKeyOnly; platformize }`.
  - [x] Updated both managers' matching helpers to delegate to [`matchHotkey()`](src/utils/modifierUtils.ts:188) with consistent options.
- [x] Extract a single commandEntry builder:
  - [x] Implement `buildCommandEntry(app, hotkeyManager, command)` in [`src/utils/commandBuilder.ts:1`](src/utils/commandBuilder.ts:1) producing unified shape (id, name, hotkeys default/custom, isInternalModule, pluginName, cmdName).
  - [x] Use it in [`src/managers/commandsManager/commandsManager.svelte.ts:102`](src/managers/commandsManager/commandsManager.svelte.ts:102) and in fallback code in [`src/managers/hotkeyManager/hotkeyManager.svelte.ts:70`](src/managers/hotkeyManager/hotkeyManager.svelte.ts:70).
- [x] Make CommandsManager the single source of commandEntry truth:
  - [x] Remove HotkeyManager’s command cache and its previous `processCommands()` duplication.
  - [x] HotkeyManager now prefers `CommandsManager.getCommandsIndex()` (sync access) and falls back defensively to building entries from `app.commands` using [`buildCommandEntry()`](src/utils/commandBuilder.ts:1) only when `CommandsManager` is unavailable. See [`src/managers/hotkeyManager/hotkeyManager.svelte.ts:44`](src/managers/hotkeyManager/hotkeyManager.svelte.ts:44) and [`src/managers/hotkeyManager/hotkeyManager.svelte.ts:296`](src/managers/hotkeyManager/hotkeyManager.svelte.ts:296).
  - [x] Ensure CommandsManager augments with “System Shortcuts” and exposes authoritative index used across features (loaded at initialize; see `ensureSystemShortcutsLoaded()` / `loadCommands()`).
- [ ] Audit consumers and update call sites — superseded by [[20250816-hotkey-normalization-cleanup]] which removes `hotkeysObj` and updates all usages accordingly.
  - [x] `HotkeyManager.searchHotkeys()` already updated to use `CommandsManager` index and fast hotkey lookups.
- [ ] Remove redundant wrappers:
- [x] Delete `getAllHotkeysForCommand()` usages in codebase and use `.all` from the unified hotkey getter where applicable. Fully removed the fallback from `commandBuilder`.
- [x] Types/build fixes:
  - [x] Removed duplicate type augmentation file that caused TS2717: deleted conflicting file and re-ran `npx tsc --noEmit` — check passed.
  - [x] Rebuilt bundle and validated `npm run build` completes; `../obsidian-keyboard-analyzer-dev/main.js` now includes the new utilities and builder.
- [ ] Documentation and notes — moved to [[20250816-hotkey-normalization-cleanup]].
- [ ] Manual test checklist:
  - [ ] Text search vs hotkey search returns consistent sets across views.
  - [ ] “System Shortcuts” appear consistently in filters and hotkey-driven queries (when enabled by settings).
  - [ ] StrictModifierMatch toggling produces identical behavior in both search and list filters.
  - [ ] Duplicate detection reflects changes immediately after adding/removing custom hotkeys; no stale results.
  - [ ] Internal modules visibility follows the same setting everywhere.

## What changed (summary)

- Added central helpers and builder:

  - [`src/utils/commandMeta.ts:1`](src/utils/commandMeta.ts:1) — plugin metadata helpers.
  - [`src/utils/modifierUtils.ts:188`](src/utils/modifierUtils.ts:188) — unified `matchHotkey`.
  - [`src/utils/commandBuilder.ts:1`](src/utils/commandBuilder.ts:1) — `buildCommandEntry` builder.

- Manager updates:

  - [`src/managers/commandsManager/commandsManager.svelte.ts:102`](src/managers/commandsManager/commandsManager.svelte.ts:102) — uses centralized builder to construct authoritative index; normalizes hotkeys to `hotkeysObj`.
  - [`src/managers/hotkeyManager/hotkeyManager.svelte.ts`](src/managers/hotkeyManager/hotkeyManager.svelte.ts) — prefers `CommandsManager` wired via `attachCommandsManager()` (no dynamic require). Uses fast `hotkeyIndex` lookups for hotkey queries; falls back to local warm-up only if manager not available.
  - Removed duplicate metadata helpers from both managers in favor of `src/utils/commandMeta.ts`.

- Build & types:
  - Removed problematic duplicate declaration file and ensured TypeScript check passes (`npx tsc --noEmit`).
  - Rebuilt with `npm run build` and verified the new bundle includes the changes (used by the user via `../obsidian-keyboard-analyzer-dev/`).

## Links

- Source (current duplication / updated): [`src/managers/hotkeyManager/hotkeyManager.svelte.ts:1`](src/managers/hotkeyManager/hotkeyManager.svelte.ts:1), [`src/managers/commandsManager/commandsManager.svelte.ts:1`](src/managers/commandsManager/commandsManager.svelte.ts:1)
- Utilities (new): [`src/utils/modifierUtils.ts:188`](src/utils/modifierUtils.ts:188), [`src/utils/commandMeta.ts:1`](src/utils/commandMeta.ts:1), [`src/utils/commandBuilder.ts:1`](src/utils/commandBuilder.ts:1)

