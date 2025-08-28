---
title: Redesign 'Manage Groups' pop-up for small screens
status: done
owner: '@agent'
updated: 2025-08-12 12:36 UTC
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

- [2025-08-12] Chosen approach: a compact dropdown selector for groups plus a dedicated "Reorder" mode. Reorder mode shows a drag list with handles and explicit Up/Down controls to avoid accidental drags on small screens.
- [2025-08-12] Modal layout switched to responsive vertical stack; fits in narrow sidebars without horizontal scrolling.

## Next Steps

- [x] Audit current modal structure and CSS constraints at 220–360px widths (sidebar).
- [x] Replace inline list of groups with a compact dropdown/select component.
- [x] Add a dedicated "Reorder" mode with drag handles or up/down controls.
- [x] Review and adjust events/props between `GroupSelector` and the modal.
- [x] Manual test in Obsidian sidebars and main pane for overflow and focus handling.
- [ ] Update README screenshots if UI changes are user-visible.

## Links

- `src/components/GroupManagerModal.svelte`
- `src/components/GroupSelector.svelte`
