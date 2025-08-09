---
title: Fix key listener button shape in Search menu
status: done
owner: "@you"
updated: 2025-08-09 13:12 UTC
related:
  - [[250809-list-of-bugs-and-new-feature-requests]]
---

## Context
In some Obsidian themes the keyboard listener button in the Search menu appears oval and inconsistent with adjacent controls (e.g., Clear). Align its border radius, padding, and height with standard action buttons across themes.

## Decisions
- Use existing action/button utility classes for size/shape; avoid theme-specific overrides where possible.
- Size via CSS variables used elsewhere (height, padding, radius) to pick up theme tokens.
- Keep markup as a `<button>` with proper `aria-pressed` if it’s a toggle; ensure consistent icon size.

## Acceptance Criteria
- Matches size, padding, and border radius of other toolbar buttons in both light/dark themes.
- No layout shift in `SearchMenu.svelte` when toggling the listener.
- Verified against default theme and two popular third‑party themes.

## Next Steps
- [x] Audit current listener button markup and classes in `src/components/SearchMenu.svelte` (owner)
- [x] Align padding/height/radius with standard icon/button styles; unify icon size (owner)
- [x] Test in default + 2 themes; attach before/after screenshots (owner)
- [x] Update `styles.css` only if necessary; prefer component-scoped classes (owner)

## Links
- [[250809-list-of-bugs-and-new-feature-requests]]

## Changes
- `src/styles.css`: Normalize `.meta-search-wrapper` layout; add `.meta-search-wrapper .icon { width/height 28px, border, radius 6px }`; remove absolute/oval styling from `.keyboard-icon` and `.clear-icon` so both match adjacent controls.

## Progress Log
- [2025-08-09 13:12 UTC] Standardized key listener and clear buttons sizing and shape in the search bar to avoid oval rendering on some themes.
