---
title: Group Settings — Default vs Dynamic view behavior
status: in_progress
owner: '@agent'
updated: 2025-08-12 12:39 UTC
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
- `defaults: GroupViewState` (already planned in epic)

Where `GroupViewState` mirrors:

- `viewMode: 'keyboard' | 'list'`
- `filters: GroupFilters`
- `sort?: SortOption`
- `heatmapScope?: 'filtered' | 'all'`

## Decisions

- [2025-08-12] Proposed behavior precedence:
  - If `onOpen = 'default'`, always apply `defaults` on open.
  - If `onOpen = 'dynamic'` and `lastUsedState` exists, apply it; otherwise fall back to `defaults`.
- [2025-08-12] Persistence:
  - Debounce updates to `lastUsedState` (250–500 ms).
  - Provide `flushAllSaves()` and flush on plugin unload to prevent truncation.
- [2025-08-12] Migration:
  - If adding to v1, treat missing `behavior` as `{ onOpen: 'default' }` for backward compatibility.

## Files

- `src/interfaces/Interfaces.ts` or a new `src/interfaces/groups.ts` for typing updates.
- `src/stores/groups.ts` — store shape for `lastUsedState`, debounce, and persistence helpers.
- `src/managers/groupManager/groupManager.svelte.ts` — CRUD and migration; helpers to apply defaults vs dynamic states.
- `src/views/ShortcutsView.ts` — apply state on open based on group behavior.
- `src/components/GroupManagerModal.svelte` — UI toggle and controls to “Use current view as defaults” and “Reset to defaults”.

## Next Steps

- [x] Add types for `GroupViewState` and `behavior` to the interfaces module.
- [x] Implement persistence of `lastUsedState` with debounced writes and unload flush (filters snapshot).
- [-] Implement state application flow on group open (default vs dynamic) — initial filters-only integration shipped; wire `viewMode`, `sort`, and `heatmapScope` next.
- [x] Add UI controls to Group Manager modal with help text and explicit actions.
- [ ] Add migration path (no-op default for legacy groups).
- [ ] Manual QA: reloads, switching groups, performance with large sets, a11y labels.

## Links

- [[25080914-hotkey-groups]] — epic and current implementation plan for groups.
- `src/managers/groupManager/groupManager.svelte.ts`
- `src/components/GroupManagerModal.svelte`
- `src/stores/groups.ts`
