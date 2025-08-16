---
title: Refactor — Centralize command metadata, hotkey matching, and commandEntry state
status: todo
owner: '@agent'
updated: 2025-08-15 09:23 UTC
related:
  -
---

## Context

There is duplicated and divergent logic across managers causing drift and inconsistent behavior: plugin metadata helpers, command "reduction" (commandEntry building), and hotkey matching semantics. The planner verdict requests centralizing metadata helpers, unifying the hotkey-match function, and making CommandsManager the single source of commandEntry state.

## Decisions

- [2025-08-15] Decision made — Implement a minimal-surface refactor to: extract shared command metadata utilities, introduce a single matchHotkey function, unify commandEntry building, and consolidate commandEntry state under CommandsManager for consistency and to remove duplication.

## Next Steps

- [ ] Create shared metadata utilities:
  - [ ] Add `getPluginName(app: App, pluginId: string): string` and `isInternalCommand(app: App, commandId: string): boolean` in a new utility file [commandMeta.ts](src/utils/commandMeta.ts:1).
  - [ ] Replace local implementations in [hotkeyManager.svelte.ts](src/managers/hotkeyManager/hotkeyManager.svelte.ts:1) and [commandsManager.svelte.ts](src/managers/commandsManager/commandsManager.svelte.ts:1) with imports from [commandMeta.ts](src/utils/commandMeta.ts:1).
- [ ] Unify hotkey matching:
  - [ ] Add `matchHotkey(hotkey, activeMods, activeKey, opts)` to [modifierUtils.ts](src/utils/modifierUtils.ts:1) with options `{ strictModifierMatch; allowKeyOnly; platformize }`.
  - [ ] Update both managers' `commandMatchesHotkey()` to delegate to [matchHotkey()](src/utils/modifierUtils.ts:1) with consistent options.
- [ ] Extract a single commandEntry builder:
  - [ ] Implement `buildCommandEntry(app, hotkeyManager, command)` in [commandBuilder.ts](src/utils/commandBuilder.ts:1) that produces the unified shape (id, name, hotkeys default/custom, isInternal, pluginName, cmdName).
  - [ ] Use it in [commandsManager.svelte.ts](src/managers/commandsManager/commandsManager.svelte.ts:1) and remove duplicated logic from [hotkeyManager.svelte.ts](src/managers/hotkeyManager/hotkeyManager.svelte.ts:1).
- [ ] Make CommandsManager the single source of commandEntry truth:
  - [ ] Remove HotkeyManager’s command cache and its local `processCommands()` usage in [hotkeyManager.svelte.ts](src/managers/hotkeyManager/hotkeyManager.svelte.ts:1).
  - [ ] Ensure CommandsManager augments with “System Shortcuts” and exposes a single authoritative index used across features.
  - [ ] Update `searchHotkeys()` call sites to query the CommandsManager list before applying the unified [matchHotkey()](src/utils/modifierUtils.ts:1).
- [ ] Remove redundant wrappers:
  - [ ] Delete `getAllHotkeysForCommand()` in [hotkeyManager.svelte.ts](src/managers/hotkeyManager/hotkeyManager.svelte.ts:1) and use `.all` from `getHotkeysForCommand()` directly.
- [ ] Documentation and notes:
  - [ ] Update any developer docs/comments to reflect the new utilities and single-source-of-truth design.
- [ ] Manual test checklist:
  - [ ] Text search vs hotkey search returns consistent sets across views.
  - [ ] “System Shortcuts” appear consistently in filters and any hotkey-driven queries (when enabled by settings).
  - [ ] StrictModifierMatch toggling produces identical behavior in both search and list filters.
  - [ ] Duplicate detection reflects changes immediately after adding/removing custom hotkeys; no stale results.
  - [ ] Internal modules visibility follows the same setting everywhere.

## Links

- Source (current duplication): [hotkeyManager.svelte.ts](src/managers/hotkeyManager/hotkeyManager.svelte.ts:1), [commandsManager.svelte.ts](src/managers/commandsManager/commandsManager.svelte.ts:1)
- Utilities (targets/new): [modifierUtils.ts](src/utils/modifierUtils.ts:1), [commandMeta.ts](src/utils/commandMeta.ts:1), [commandBuilder.ts](src/utils/commandBuilder.ts:1)
