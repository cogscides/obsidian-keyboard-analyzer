---
title: Unify Filter/View dropdowns and polish Keyboard UI
status: in_progress
owner: "@you"
updated: 2025-08-09 02:35 UTC
related:
  - design-note
---

## Context
Filter and View controls are currently duplicated/mixed across multiple dropdowns in `SearchMenu.svelte`. Several a11y issues (non-interactive elements with tabindex, unlabeled buttons) and minor UX polish items exist. Goal: split concerns cleanly (Filter vs View vs Modules), improve accessibility, and tighten layout/feedback.

## Decisions
- [2025-08-08] Separate concerns: Filter (data narrowing), View (presentation/sorting), Modules (include/exclude providers).
- [2025-08-08] Replace non-interactive elements with `<button>` + proper `aria-*`; remove `tabindex` from spans.
- [2025-08-08] Keep group selection as a top-level control; ensure re-filter on change without duplicating toggles.

## Next Steps
- [x] Refactor dropdowns: move settings into the right menus (owner)
- [x] Define `ViewSettingsKeys` separate from `FilterSettingsKeys` (owner)
- [x] Remove duplication: stop rendering all `FilterSettingsKeys` under View (owner)
- [x] Accessibility: change info-icon spans to buttons with `aria-label` (owner)
- [x] Accessibility: add `aria-pressed` to toggle buttons; add labels to empty `<button>`s (owner)
- [x] UX: debounce text input (150–250ms) to reduce re-compute (owner)
- [x] UX: add empty-state in CommandsList with quick tips (owner)
- [x] UX: tooltips for key controls (keyboard listener, refresh, clear) (owner)
- [x] Modules menu: rename to “Built‑in Modules” (owner)
- [x] Sorting/Presentation: move `FeaturedFirst`, `DisplayIDs`, `HighlightCustom`, `HighlightDuplicates`, `GroupByPlugin` to View (owner)
- [x] Filtering: keep `StrictModifierMatch`, `ViewWOhotkeys`; moved `DisplayInternalModules` under Built‑in Modules per decision to separate providers (owner)
- [x] Close behaviors: ESC/outside-click to close dropdowns (owner)
- [ ] Close behaviors: focus trap while open (owner)
- [ ] Visual: unify spacing, icon sizes, and button states across menus (owner)

## Links
- [[design-note]]

## Notes
- [2025-08-09] Implemented `ViewSettingsKeys`, split menus (Filter, View, Built‑in Modules), added ESC/outside-click close, button/aria fixes, and 200ms input debounce. Focus trap is still pending. If `DisplayInternalModules` should remain under Filter instead of Modules, happy to adjust.
