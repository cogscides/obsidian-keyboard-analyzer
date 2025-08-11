---
title: Redesign 'Manage Groups' pop-up for small screens
status: todo
owner: '@agent'
updated: 2025-08-11 12:00 UTC
related:
  - [[25080913-SPRINT-list-of-bugs-and-new-feature-requests]]
---

## Context

The current 'Manage Groups' pop-up is cramped on small panes and sidebars. Refactor it into a space-efficient, responsive vertical layout. Replace the groups list with a dropdown selector to save space, and provide an explicit way to reorder groups.

Definition of done: The modal is usable at narrow widths, the group selector is a dropdown, and reordering remains possible without accidental drags.

## Acceptance Criteria

- Modal uses a vertical, responsive layout and fits within narrow sidebars without horizontal scrolling.
- Group list is a dropdown selector; selecting changes the current group.
- Reordering is available via a dedicated mode or button (drag list or up/down controls).
- All existing actions (create, rename, delete, add/remove commands) still work.
- Works in both light/dark themes and across platforms.

## Files

- `src/components/GroupManagerModal.svelte` — implement vertical layout and dropdown.
- `src/components/GroupSelector.svelte` — ensure it opens and interacts with the modal correctly.

## Decisions

- [2025-08-11] Pending — choose between drag-and-drop reordering vs. explicit "Reorder" mode with handles.

## Next Steps

- [ ] Audit current modal structure and CSS constraints at 220–360px widths (sidebar).
- [ ] Replace inline list of groups with a compact dropdown/select component.
- [ ] Add a dedicated "Reorder" mode with drag handles or up/down controls.
- [ ] Review and adjust events/props between `GroupSelector` and the modal.
- [ ] Manual test in Obsidian sidebars and main pane for overflow and focus handling.
- [ ] Update README screenshots if UI changes are user-visible.

## Links

- `src/components/GroupManagerModal.svelte`
- `src/components/GroupSelector.svelte`
