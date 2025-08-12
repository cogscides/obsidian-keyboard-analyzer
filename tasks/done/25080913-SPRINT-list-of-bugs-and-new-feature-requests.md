---
title: Backlog — Bugs and Feature Requests
status: in_progress
owner: '@you'
updated: 2025-08-09 13:07 UTC
related:
  - [[250808-ux-filter-view-cleanup]]
  - [[250808-ux-dropdowns-and-responsive-fixes]]
  - [[250809-a11y-warnings]]
---

## Context

Backlog collector for small bugs and new feature ideas that span multiple UI areas (Search menu, Commands list, Visual keyboard). Use this note to capture, refine scope, and spin out focused task files.

## Bugs

- Key listener button shape: In some Obsidian themes the keyboard listener button in the search bar appears oval and inconsistent with adjacent controls (e.g., Clear). Align its border radius, padding, and height with standard action buttons across themes.

### Bug — Acceptance Criteria

- Matches size, padding, border radius of other toolbar buttons in both light/dark themes.
- No layout shift in `SearchMenu.svelte` when toggling the listener.
- Verified against at least 2 third‑party themes and default theme.

## Feature Requests

- Toggle: Plugin name badge in commands list. Add a View setting to show/hide plugin name as a badge next to each command. Current badges help scanability but can consume space; provide an off switch for compact lists.
  - Interactions to consider: Group by plugin, Highlight built‑ins, Title formatting when plugin name is hidden.
- Visual keyboard scope control. Add a toggle to choose whether the heatmap reflects the current filters/search only, or all known hotkeys. Active keys remain highlighted correctly in both modes.
- Visual keyboard visibility toggle. Add an affordance to collapse/expand the keyboard panel; compact toggle placed at the top‑left of the keyboard area.
- Donate button placement. Fix absolute positioning that can overlap keys; anchor it outside the key grid with consistent spacing.

### Features — Acceptance Criteria

- Plugin badge toggle: Off hides badges in both flat and grouped views; grouped headers still display plugin names; no duplicate text; works with Highlight Built‑ins and Featured sorting.
- Keyboard scope toggle: Two states — “Match filters/search” (default) and “All commands”. Heat intensities recalc accordingly; active key display remains correct.
- Keyboard visibility: Toggle persists across sessions; collapse saves space without collapsing summary/toolbar; keyboard reflows without horizontal overflow.
- Donate button: Never overlaps keycaps; remains visible in narrow panes; respects theme typography and spacing variables.

## Decisions

- [2025-08-09] Represent plugin name display as a single View setting (badge on/off). When Group by plugin is active and badges are off, do not render badges in rows; rely on group headers.
- [2025-08-09] Add Keyboard scope toggle under View, near heatmap settings; default to “Match filters/search” to keep current behavior.
- [2025-08-09] Add a compact “Hide keyboard” button inside the keyboard header area (top‑left), using a chevron icon with `aria-expanded`.
- [2025-08-09] Move Donate button out of the key grid container and style with standard toolbar button classes to avoid overlap.

## Next Steps

- [x] [[250809-fix-key-listener-button-shape]]
- [x] [[250809-plugin-name-badge-toggle]]
- [x] [[250809-keyboard-heatmap-scope-toggle]]
- [x] [[250809-keyboard-panel-collapse-toggle]]
- [x] [[250809-fix-donate-button-placement]]
- [x] [[250809-theme-validation-screenshots]]

## Links

- [[250808-ux-filter-view-cleanup]]
- [[250808-ux-dropdowns-and-responsive-fixes]]
- [[250809-a11y-warnings]]

## Progress Log

- [2025-08-09 13:07 UTC] Backfilled backlog note with template, triaged items into Bugs/Features, added acceptance criteria and concrete next steps.
- [2025-08-09 13:08 UTC] Created six focused task files and linked them above.
