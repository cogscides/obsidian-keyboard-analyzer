---
title: Unify Filter/View dropdowns and polish Keyboard UI
status: in_progress
owner: "@you"
updated: 2025-08-09 14:20 UTC
related:
  - [[design-note]]
---

## Context
Filter and View controls are currently duplicated/mixed across multiple dropdowns in `SearchMenu.svelte`. Several a11y issues (non-interactive elements with tabindex, unlabeled buttons) and minor UX polish items exist. Goal: split concerns cleanly (Filter vs View vs Modules), improve accessibility, and tighten layout/feedback.

## Decisions
- [2025-08-08] Separate concerns: Filter (data narrowing), View (presentation/sorting), Modules (include/exclude providers).
- [2025-08-08] Replace non-interactive elements with `<button>` + proper `aria-*`; remove `tabindex` from spans.
- [2025-08-08] Keep group selection as a top-level control; ensure re-filter on change without duplicating toggles.
- [2025-08-09] Remove Built‑in Modules dropdown; include internal modules by default. Add subtle built‑in highlighting controlled by View setting.
- [2025-08-09] Add View: Group by plugin with compact rows and per‑plugin collapse/expand, plus toolbar Collapse/Expand All.
- [2025-08-09] Add Filter: Only custom hotkeys, Only duplicates. Compose with existing filters and hotkey queries.
- [2025-08-09] Fix info icon visibility in Filter dropdown by aligning markup with View dropdown structure.
- [2025-08-09] Ensure Featured First applies in flat view even without active search/filters; sort featured to top within groups when grouped.

## Next Steps
- [x] Refactor dropdowns: move settings into the right menus (owner)
- [x] Define `ViewSettingsKeys` separate from `FilterSettingsKeys` (owner)
- [x] Remove duplication: stop rendering all `FilterSettingsKeys` under View (owner)
- [x] Accessibility: change info-icon spans to buttons with `aria-label` (owner)
- [x] Accessibility: add `aria-pressed` to toggle buttons; add labels to empty `<button>`s (owner)
- [x] UX: debounce text input (150–250ms) to reduce re-compute (owner)
- [x] UX: add empty-state in CommandsList with quick tips (owner)
- [x] UX: tooltips for key controls (keyboard listener, refresh, clear) (owner)
- [x] Modules menu: remove; include internal modules by default (owner)
- [x] Sorting/Presentation: move `FeaturedFirst`, `DisplayIDs`, `HighlightCustom`, `HighlightDuplicates`, `GroupByPlugin` to View (owner)
- [x] Filtering: keep `StrictModifierMatch`, `ViewWOhotkeys`; add `OnlyCustom`, `OnlyDuplicates` (owner)
- [x] Close behaviors: ESC/outside-click to close dropdowns (owner)
- [ ] Close behaviors: focus trap while open (owner)
- [ ] Visual: unify spacing, icon sizes, and button states across menus (owner)
- [x] Grouped View: compact rows, per‑plugin collapse w/ toolbar; built‑in badge (owner)
- [x] Built‑ins: add `HighlightBuiltIns` view toggle and subtle dot badge in both flat and grouped views (owner)
- [ ] Persist collapse state per plugin across sessions (owner)

## Links
- [[design-note]]
- [[TASK-system-default-shortcuts]]

## Notes
- [2025-08-09] Implemented `ViewSettingsKeys`, split menus (Filter, View, Built‑in Modules), added ESC/outside-click close, button/aria fixes, and 200ms input debounce. Focus trap is still pending. If `DisplayInternalModules` should remain under Filter instead of Modules, happy to adjust.

## Progress Log
- [2025-08-09 14:20 UTC] SearchMenu: unified event handler syntax to legacy `ononclick_outside` (no mixed `on:` usage); removed leftover `modulesDropdownOpen` references; resolved TS type mismatch by casting `ViewSettingsKeys` safely and adding `HighlightBuiltIns` to `FilterSettingsKeys`.
