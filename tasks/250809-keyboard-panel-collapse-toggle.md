---
title: Collapse/expand Visual Keyboard panel
status: in_progress
owner: "@you"
updated: 2025-08-09 13:18 UTC
related:
  - [[250809-list-of-bugs-and-new-feature-requests]]
---

## Context
Allow users to hide/show the visual keyboard to save space in narrow panes while keeping the summary/toolbar visible.

## Decisions
- Add a compact chevron/button at the top‑left of the keyboard area with `aria-expanded` to reflect state.
- Persist collapsed state across sessions; keep minimal transition for smoothness, no large animations.
- Ensure collapse affects only the keyboard panel, not the surrounding toolbar/summary.

## Acceptance Criteria
- Toggle shows/hides keyboard panel without affecting other controls.
- State persists across reloads; accessible markup with labels and `aria-expanded`.
- No horizontal overflow introduced in collapsed or expanded states.

## Next Steps
- [ ] Add `keyboardCollapsed` state to store with persistence (owner)
- [x] Render a toggle control in the keyboard header area (owner)
- [x] Apply CSS to collapse panel cleanly; test narrow panes (owner)
- [ ] Verify accessibility (focus order, aria) and attach screenshots (owner)

## Links
- [[250809-list-of-bugs-and-new-feature-requests]]

## Progress Log
- [2025-08-09 13:18 UTC] Added a toolbar row with a chevron-like toggle that collapses/expands the keyboard grid in `KeyboardLayoutComponent.svelte`. State is local for now; persistence pending.
- [2025-08-09 13:28 UTC] Chevron rotation overridden locally in the toolbar to a simple 0deg/-90deg to avoid over-rotation from global a11y styles.
