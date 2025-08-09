---
title: User-defined Hotkey Groups (manual)
status: in_progress
owner: "@agent"
updated: 2025-08-09 23:05 UTC
related: []
---

## Context
Users want to curate their own command groups (e.g., Daily, Writing, Refactor) and quickly switch the keyboard view to one of these groups. Groups should support manual curation, persist defaults (view/filter/sort), be easy to manage, and allow adding commands from the All commands list. Command order within a group should be manually re‑orderable and persistent.

## Goals / DoD
- Allow creating, renaming, deleting, and reordering groups.
- Provide fast group switching (pinned tabs + searchable dropdown/combobox).
- Support manual groups only (explicit command list).
- Allow manual reordering of commands within a group; rendering respects persisted order.
- Persist per-group defaults (view mode, filter options, sort) and autosave on change.
- Add commands to groups from the All list via an inline control with search + checkboxes.
- Optional dynamic command(s) to open the keyboard view with a specific group opened.
- Gracefully handle missing/removed commands and schema migrations.
- Validate performance with large command sets; ensure accessibility and keyboard navigation.

## Decisions
- [2025-08-09] Data model: versioned `HotkeyGroup` entities stored in plugin settings; separate `groupsStore` for reactive UI.
- [2025-08-09] UI: pinned tabs (for favorites) + searchable combobox for all groups; context menu for manage actions.
- [2025-08-09] Groups are manual only; membership is an ordered list.
- [2025-08-09] Autosave: settings persist immediately (debounced) upon changes to group config and membership.
- [2025-08-09] Commands: provide one generic command “Open Group…” and optional per‑group commands (opt‑in) to avoid palette clutter.
- [2025-08-09] Add-to-group UX: a folder-plus button on each command row opens a popover with search + checkboxes and inline “New group”.
- [2025-08-09] Missing commands: display badge in group details; offer “Clean up” to remove stale ids.
- [2025-08-09] Schema: add `settingsSchemaVersion` and migration from `0` to `1` to include groups.

## Non-Goals / Out of Scope
- Cloud sync/sharing of groups (future: import/export JSON).
- Multi-vault group sync (unless user sync handles settings file).
- Per-workspace overrides beyond existing settings model.

## Data Model
- Interface `HotkeyGroup` (v1):
  - `id: string` (uuid)
  - `name: string`
  - `description?: string`
  - `icon?: string` (e.g., lucide id) and `color?: string` (hex/var)
  - `commandIds: string[]` (ordered membership; order is persisted)
  - `defaults: {
      viewMode: 'keyboard' | 'list';
      filters: GroupFilters; // mirrors existing filter options
      sort?: SortOption;
    }`
  - `pinned: boolean` (show as tab)
  - `registerCommand?: boolean` (create per-group open command)
  - `createdAt: number`, `updatedAt: number`
  - `version: 1`

- Settings additions:
  - `groups: Record<string, HotkeyGroup>`
  - `pinnedOrder: string[]` (tab order)
  - `lastOpenedGroupId?: string`
  - `settingsSchemaVersion: number` (>= 1 when groups present)

## UI / UX
- Group Selector:
  - Pinned tabs with icon/color and name; overflow into dropdown if many.
  - Searchable combobox listing all groups with type badge (Manual/Smart), icon, color; supports quick create when typing.
  - Context menu on tab/list item: Open, Set as default on open, Rename, Edit, Pin/Unpin, Duplicate, Delete.

- Group Manager Modal:
  - Left: list of groups with search and filter by type.
  - Right: editor panel (name, icon, color, description, defaults section, and members list with drag handles for manual reordering).
  - Defaults section mirrors existing filter+view controls with a “Use current view” quick-fill.

- Add To Group Popover (from All commands list):
  - Trigger: folder-plus icon near the existing feature/command icon on each row.
  - Contents: search input; list of groups with checkboxes; inline “+ New group” that opens a tiny inline create (name, type=manual by default).
  - Actions: Apply (saves to all checked manual groups), Manage groups… (opens manager modal).
  - Note: groups are manual; checking adds in the tail position by default. If the active group is open in the manager, respect current insert position when applicable.

- Keyboard View Integration:
  - When a group is active, the view filters to that membership (manual) or query (smart); UI mirrors group defaults unless explicitly changed by user.
  - Persist last opened group for quick resume; optional per-group “default on open”.
  - Respect the group’s command order when rendering lists; provide optional local sort toggle that temporarily overrides order (does not persist unless user chooses “Save as group order”).

- Accessibility & Keyboarding:
  - All controls reachable via Tab; Enter/Space toggles; Arrow keys navigate tabs; typeahead in combobox.

## Commands
- Generic: `Open Group…` — opens a modal/quick picker of groups; opens the keyboard view focused to the selected group.
- Optional per-group: `Open: <Group Name>` — dynamically registered only when `registerCommand` is true. Updated on rename; removed on delete.
- Optional helper: `Add Selected Command(s) to Group…` — if multi-select exists in list.

## Persistence & Events
- Reactive store `groupsStore` wraps settings; `groupManager` handles CRUD, ordering, and debounced saves.
- Emit custom events (or store subscriptions) so views update immediately on group changes.
- On plugin unload, ensure pending saves flush.

## Migration
- Introduce `settingsSchemaVersion = 1` and add migration path from `0` (no groups) → `1`.
- Future-proof by ignoring unknown fields and preserving versioned structures.

## Edge Cases
- Command removed/unavailable: show it dimmed with “missing” badge in editor; offer one-click cleanup.
- Duplicate membership across groups is allowed.
- Name collisions handled (allow duplicates but warn; id is authoritative).
- Many groups: paginate/virtualize the manager list; tabs overflow into dropdown.

## Performance
- Use maps/sets internally for O(1) membership checks.
- Debounce writes (e.g., 250–500 ms) and batch mutations.
- For reordering, apply optimistic updates and debounce persistence.

## Security & Privacy
- All data stays in plugin settings; no network.
- No PII beyond user-provided names; avoid logging contents.

## i18n / Theming
- Wrap new strings for translation once i18n infra exists; keep labels concise.
- Respect theme variables; provide color pickers limited to theme palette when possible.

## Implementation Plan
- Data & Stores
  - [ ] Add `interfaces/groups.ts` with `HotkeyGroup`, `SmartQuery`, `GroupFilters`, `SortOption` types.
  - [ ] Add `stores/groups.ts` (Svelte store) with CRUD, ordering, and persistence hooks.
  - [ ] Add `managers/groupManager.ts` for higher-level operations and migrations.

- UI Components
  - [ ] `Components/GroupSelector.svelte` (tabs + combobox)
  - [ ] `Components/GroupManagerModal.svelte` (create/edit/manage with DnD ordering)
  - [ ] `Components/AddToGroupPopover.svelte` (checkbox list + search + new group)
  - [ ] Integrate selector into `views/KeyboardView.svelte` and wire defaults.

- List Integration
  - [ ] In All commands list component, add folder-plus action; open `AddToGroupPopover` anchored to row.
  - [ ] Wire membership changes for manual groups; disable for smart groups with tooltip.
  - [ ] Ensure added commands append to the end by default; provide optional “Add to top” in popover.

- Commands & View Opening
  - [ ] Register generic `Open Group…` command.
  - [ ] Add optional per-group command registration; keep ids stable (e.g., `open-group:${group.id}`).
  - [ ] Implement `openKeyboardViewWithGroup(id)` util that resolves/creates a leaf and sets group context.

- Settings & Migrations
  - [ ] Extend settings schema; add `settingsSchemaVersion` and migration code.
  - [ ] Autosave on changes (debounced) and flush on unload.

- Polish & QA
  - [ ] A11y pass (focus order, labels, tooltips, ARIA)
  - [ ] Performance check with 1–2k commands and 50+ groups
  - [ ] Biome format/lint and light refactor for consistency

## Testing Checklist (Manual)
- Create, rename, delete, and pin groups; verify persistence across reloads.
- Switch via tabs and combobox; ensure fast and keyboard-friendly.
- Add commands to manual groups from All list; verify immediate reflection in active view.
- Reorder commands in a group via drag-and-drop; verify order persists and is respected in the view.
- Toggle per-group defaults and confirm the view opens with those defaults.
- Enable a per-group command and open the view via command palette; rename group and verify command updates.
- Delete a group and confirm associated dynamic command disappears.
- Remove or disable a plugin; verify missing command handling and cleanup.

## Open Questions
- Should per-group defaults always override the last-used session state, or only on first open? Proposal: override on first open, then track session changes until group switch.
- Do we need multi-select in the All commands list to bulk add? If yes, where is selection state tracked?
- Should we allow color/icon for quick visual scanning in tabs? Default to theme accents if not set.
- Should we allow reordering directly in the main list when a group is active (drag to reorder), or keep ordering only in the manager?

## Risks & Mitigations
- Command palette clutter from per-group commands → opt-in toggle and prefix names consistently (e.g., “Keyboard Analyzer: Open <Group>”).
- Ordering UX confusion → show drag handles, keyboard move shortcuts, and clear “Save order” feedback on autosave.
- Data bloat/performance → use ids and compact structures; debounce writes.

## Links
- [[src/stores/groups.ts]] [[src/managers/groupManager.ts]] [[src/Components/GroupSelector.svelte]]
- [[src/Components/GroupManagerModal.svelte]] [[src/Components/AddToGroupPopover.svelte]] [[src/interfaces/groups.ts]]

## Next Steps
- [ ] Confirm reorder UX (manager only vs also in main list)
- [ ] Approve UI pattern (tabs + combobox + popover)
- [ ] Implement data model + store scaffolding (owner: @agent)
- [ ] Wire selector and generic “Open Group…” command (owner: @agent)
- [ ] Add list integration + popover (owner: @agent)
- [ ] Validate in `test-vault/` across platforms
