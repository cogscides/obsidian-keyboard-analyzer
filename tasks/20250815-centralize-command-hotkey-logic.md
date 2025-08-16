---
title: Refactor — Centralize command metadata, hotkey matching, and commandEntry state
status: in_progress
owner: '@agent'
updated: 2025-08-16 02:11 UTC
related:
  -
---

## Context

There is duplicated and divergent logic across managers causing drift and inconsistent behavior: plugin metadata helpers, command "reduction" (commandEntry building), and hotkey matching semantics. The planner verdict requests centralizing metadata helpers, unifying the hotkey-match function, and making CommandsManager the single source of commandEntry state.

## Decisions

- [2025-08-15] Decision made — Implement a minimal-surface refactor to: extract shared command metadata utilities, introduce a single `matchHotkey` function, unify `commandEntry` building, and consolidate `commandEntry` state under CommandsManager for consistency and to remove duplication.
- [2025-08-16] Implementation decision — Bundle `buildCommandEntry` into the app bundle (ES import) so runtime loads in built output. Use defensive lazy access to CommandsManager from HotkeyManager where initialization order may require it.
- [2025-08-16] Fixed types conflict — removed duplicate declaration that caused TS2717; this was a necessary precondition for the build and runtime to succeed.

## Next Steps

- [x] Create shared metadata utilities:
  - [x] Add [`src/utils/commandMeta.ts:1`](src/utils/commandMeta.ts:1) exporting `getPluginName(app: App, pluginId: string): string` and `isInternalCommand(app: App, commandId: string): boolean`.
  - Replaced local implementations in manager files to import from [`src/utils/commandMeta.ts:1`](src/utils/commandMeta.ts:1).
- [x] Unify hotkey matching:
  - [x] Add `matchHotkey(hotkey, activeMods, activeKey, opts)` to [`src/utils/modifierUtils.ts:188`](src/utils/modifierUtils.ts:188) with options `{ strictModifierMatch; allowKeyOnly; platformize }`.
  - [x] Updated both managers' matching helpers to delegate to [`matchHotkey()`](src/utils/modifierUtils.ts:188) with consistent options.
- [x] Extract a single commandEntry builder:
  - [x] Implement `buildCommandEntry(app, hotkeyManager, command)` in [`src/utils/commandBuilder.ts:1`](src/utils/commandBuilder.ts:1) producing unified shape (id, name, hotkeys default/custom, isInternalModule, pluginName, cmdName).
  - [x] Use it in [`src/managers/commandsManager/commandsManager.svelte.ts:102`](src/managers/commandsManager/commandsManager.svelte.ts:102) and in fallback code in [`src/managers/hotkeyManager/hotkeyManager.svelte.ts:70`](src/managers/hotkeyManager/hotkeyManager.svelte.ts:70).
- [-] Make CommandsManager the single source of commandEntry truth:
  - [-] Remove HotkeyManager’s command cache and its previous `processCommands()` duplication.
  - [x] HotkeyManager now prefers `CommandsManager.getCommandsIndex()` (sync access) and falls back defensively to building entries from `app.commands` using [`buildCommandEntry()`](src/utils/commandBuilder.ts:1) only when `CommandsManager` is unavailable. See [`src/managers/hotkeyManager/hotkeyManager.svelte.ts:44`](src/managers/hotkeyManager/hotkeyManager.svelte.ts:44) and [`src/managers/hotkeyManager/hotkeyManager.svelte.ts:296`](src/managers/hotkeyManager/hotkeyManager.svelte.ts:296).
  - [ ] Ensure CommandsManager augments with “System Shortcuts” and exposes authoritative index used across features (completed for load; remaining: audit consumers).
  - [ ] Update `searchHotkeys()` call sites to query the CommandsManager list before applying the unified [`matchHotkey()`](src/utils/modifierUtils.ts:188).
- [ ] Remove redundant wrappers:
  - [ ] Delete `getAllHotkeysForCommand()` usages in codebase and use `.all` from the unified hotkey getter where applicable. Current code still contains some defensive fallbacks in `commandBuilder` and HotkeyManager; plan to remove after audit.
- [x] Types/build fixes:
  - [x] Removed duplicate type augmentation file that caused TS2717: deleted conflicting file and re-ran `npx tsc --noEmit` — check passed.
  - [x] Rebuilt bundle and validated `npm run build` completes; `../obsidian-keyboard-analyzer-dev/main.js` now includes the new utilities and builder.
- [ ] Documentation and notes:
  - [ ] Update any developer docs/comments to reflect the new utilities and single-source-of-truth design.
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

  - [`src/managers/commandsManager/commandsManager.svelte.ts:102`](src/managers/commandsManager/commandsManager.svelte.ts:102) — uses centralized builder to construct authoritative index.
  - [`src/managers/hotkeyManager/hotkeyManager.svelte.ts:44`](src/managers/hotkeyManager/hotkeyManager.svelte.ts:44) — prefers `CommandsManager.getCommandsIndex()` and delegates matching to [`matchHotkey()`](src/utils/modifierUtils.ts:188). Fallback to builder is defensive and synchronous for cases where CommandsManager isn't available at load time.

- Build & types:
  - Removed problematic duplicate declaration file and ensured TypeScript check passes (`npx tsc --noEmit`).
  - Rebuilt with `npm run build` and verified the new bundle includes the changes (used by the user via `../obsidian-keyboard-analyzer-dev/`).

## Links

- Source (current duplication / updated): [`src/managers/hotkeyManager/hotkeyManager.svelte.ts:1`](src/managers/hotkeyManager/hotkeyManager.svelte.ts:1), [`src/managers/commandsManager/commandsManager.svelte.ts:1`](src/managers/commandsManager/commandsManager.svelte.ts:1)
- Utilities (new): [`src/utils/modifierUtils.ts:188`](src/utils/modifierUtils.ts:188), [`src/utils/commandMeta.ts:1`](src/utils/commandMeta.ts:1), [`src/utils/commandBuilder.ts:1`](src/utils/commandBuilder.ts:1)
