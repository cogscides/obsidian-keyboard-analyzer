---
title: Add command search inside 'Manage Groups' pop-up
status: in_progress
owner: '@agent'
updated: 2025-08-12 23:50 UTC
related:
  - [[25081101-redesign-manage-groups-modal]]
  - [[25080913-SPRINT-list-of-bugs-and-new-feature-requests]]
---

## Context

Improve group management by allowing users to search and add commands directly within the modal.

## Acceptance Criteria

1. A search input is present at the top of the active group.
2. Typing shows a dropdown of matching commands (by name) below the input.
3. Each result displays the command name and current assigned hotkey.
4. Clicking a result adds it to the currently selected group and removes that item from dropdown results.
5. Other matching results remain until search is cleared.
6. Input includes a clear (x) icon to reset.

## Files

- [`src/components/GroupManagerModal.svelte`](src/components/GroupManagerModal.svelte:1) — search input and results dropdown UI.
- [`src/managers/commandsManager/commandsManager.svelte.ts`](src/managers/commandsManager/commandsManager.svelte.ts:1) — expose/extend a search function for commands by name.
- [`src/managers/groupManager/groupManager.svelte.ts`](src/managers/groupManager/groupManager.svelte.ts:1) — use `addCommandToGroup` when picking a command.

## Decisions

- [2025-08-12] Debounce delay set to 180 ms; max results = 20.

## Next Steps

- [x] Add search field with clear icon and a11y labels.
- [x] Implement debounced command search via Commands Manager.
- [x] Render dropdown list with hotkeys; prevent duplicates for already-in-group.
- [x] Wire selection to `addCommandToGroup(selectedGroupId, command)` and update local state.
- [x] Keep dropdown open with remaining matches; close on blur/escape.
- [x] Manual test with large command sets and no-result states.

## Links

- [`src/components/GroupManagerModal.svelte`](src/components/GroupManagerModal.svelte:1)
- [`src/managers/commandsManager/commandsManager.svelte.ts`](src/managers/commandsManager/commandsManager.svelte.ts:1)
- [`src/managers/groupManager/groupManager.svelte.ts`](src/managers/groupManager/groupManager.svelte.ts:1)
