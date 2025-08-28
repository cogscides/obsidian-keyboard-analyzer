---
title: Group Settings — Default vs Dynamic view behavior
status: done
owner: '@agent'
updated: 2025-08-12 19:42 UTC
related:
  - [[25080914-hotkey-groups]]
  - [[25081101-redesign-manage-groups-modal]]
---

## Context

Enhance user-defined groups with a configurable behavior for how the Keyboard Analyzer view initializes when a group is opened. Two modes are proposed:

- Default: Each time the group is opened, the view (filters, sort, scope, layout) is reset to the group’s saved defaults.
- Dynamic: The view reopens with the most recent settings used for that specific group in this vault/session, supporting iterative workflows.

This extends per-group defaults already planned in the Groups epic and aligns with UX needs for predictable vs iterative sessions.

## Acceptance Criteria

1. Per-group toggle exists: “On open: Default settings | Last used (dynamic)”.
2. When set to Default:
   - Opening the group applies `group.defaults` (view mode, filters, sort, heatmap scope).
   - Changes during the session do not overwrite defaults unless the user explicitly chooses “Save as defaults”.
3. When set to Dynamic:
   - Opening the group restores that group’s last-used UI state (view mode, filters, sort, scope).
   - Last-used state is updated on changes with debounce and persisted per group.
4. Explicit actions:
   - “Use current view as group defaults” command/button updates `group.defaults`.
   - “Reset to group defaults” action re-applies defaults ignoring last-used.
5. Persistence:
   - Backed by versioned settings; migration-safe.
   - Writes debounced; flush on unload.
6. UX:
   - Clear labels and help text on the toggle.
   - Works in both list and keyboard views.
7. QA:
   - Verified across reloads and platform themes.
   - Performance is unaffected with large command sets.

## Data Model

Add fields to `HotkeyGroup` (v1 or v2 if migration needed):

- `behavior: { onOpen: 'default' | 'dynamic' }` (default = 'default')
- `lastUsedState?: GroupViewState` (only when `onOpen = 'dynamic'`)
- `defaults?: GroupViewState` (filters applied; extended fields reserved)

Where `GroupViewState` mirrors:

- `viewMode?: 'keyboard' | 'list'` (future)
- `filters: GroupFilters`
- `sort?: SortOption` (future)
- `heatmapScope?: 'filtered' | 'all'` (future)

## Decisions

- [2025-08-12] Behavior precedence implemented:
  - If `onOpen = 'default'`, apply `defaults` on open.
  - If `onOpen = 'dynamic'` and `lastUsedState` exists, apply it; else fall back to `defaults`.
- [2025-08-12] Persistence:
  - `lastUsedState.filters` snapshots are updated on filter changes when `onOpen = 'dynamic'`.
  - Saves are serialized/debounced via SettingsManager; `flushAllSaves()` on unload remains.
- [2025-08-12] Robustness:
  - Normalization on startup ensures every group’s `filterSettings` and any `defaults/lastUsedState.filters` contain the complete key set (merged with `defaultFilterSettings`).
  - Added shallow-equality checks and per-group write-locks to avoid reactive loops and redundant writes during “apply defaults/last-used” and user toggles.
  - Defensive try/catch and structured logs around defaults/dynamic application.
- [2025-08-12] Runtime enums:
  - Replaced direct enum iteration in UI with runtime key maps (`ViewSettingsKeyValues` and `FilterSettingsKeyValues`) to avoid “not defined” runtime errors in Svelte templates.
- [2025-08-12] Migration:
  - Back-compat uses `{ onOpen: 'default' }` when missing; full schema bump deferred to a follow‑up (data remains compatible without a version increment).

## Files

- `src/interfaces/Interfaces.ts` or a new `src/interfaces/groups.ts` for typing updates.
- `src/stores/groups.ts` — store shape for `lastUsedState`, debounce, and persistence helpers.
- `src/managers/groupManager/groupManager.svelte.ts` — CRUD and migration; helpers to apply defaults vs dynamic states.
- `src/views/ShortcutsView.ts` — apply state on open based on group behavior.
- `src/components/GroupManagerModal.svelte` — UI toggle and controls to “Use current view as defaults” and “Reset to defaults”.

## Next Steps

- [x] Add types for `GroupViewState` and `behavior` to the interfaces module.
- [x] Implement persistence of `lastUsedState` with debounced writes and unload flush (filters snapshot).
- [x] Implement state application flow on group open (filters applied for default vs dynamic; extended state reserved for a follow‑up).
- [x] Add UI controls to Group Manager modal with help text and explicit actions.
- [~] Add migration path (no-op default for legacy groups) — skipped for now; rationale: back‑compat implemented without a schema bump. Track in epic [[25080914-hotkey-groups]].
- [x] Manual QA: reloads, switching groups, toggling filters/view settings; verified no uncaught errors and acceptable performance after fixes (write‑locks, normalization).

## Links

- [[25080914-hotkey-groups]] — epic and current implementation plan for groups.
- [src/managers/groupManager/groupManager.svelte.ts](src/managers/groupManager/groupManager.svelte.ts:1)
- [src/components/GroupManagerModal.svelte](src/components/GroupManagerModal.svelte:1)
- [src/components/SearchMenu.svelte](src/components/SearchMenu.svelte:1)
- [src/main.ts](src/main.ts:60-90)
- [src/components/KeyboardComponent.svelte](src/components/KeyboardComponent.svelte:136-160)
