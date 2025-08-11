---
title: Collapse/expand Visual Keyboard panel
status: in_progress
owner: '@agent'
updated: 2025-08-11 12:00 UTC
related:
  - [[250809-list-of-bugs-and-new-feature-requests]]
---

## Context

Allow users to hide/show the visual keyboard to save space in narrow panes while keeping the summary/toolbar visible.

## Decisions

- Add a compact chevron/button at the top‑left of the keyboard area with `aria-expanded` to reflect state.
- Persist collapsed state across sessions; keep minimal transition for smoothness, no large animations.
- Ensure collapse affects only the keyboard panel, not the surrounding toolbar/summary.
- Add a Pin control to keep the keyboard panel at the top; pin state persists.

## Acceptance Criteria

- Toggle shows/hides keyboard panel without affecting other controls.
- State persists across reloads; accessible markup with labels and `aria-expanded`.
- No horizontal overflow introduced in collapsed or expanded states.

## Next Steps

- [ ] Add `keyboardCollapsed` state to store with persistence (owner)
- [x] Render a toggle control in the keyboard header area (owner)
- [x] Apply CSS to collapse panel cleanly; test narrow panes (owner)
- [ ] SKIPPED: Verify accessibility (focus order, aria) and attach screenshots (owner)
- [x] Add Pin toggle, persistence, and sticky behavior (owner)
- [ ] Optional: Add shadow and top offset for pinned state (owner)
- [ ] Fix Developer Settings dropdown being cropped when the keyboard panel is collapsed (owner)

## Links

- [[250809-list-of-bugs-and-new-feature-requests]]

## Progress Log

- [2025-08-09 13:18 UTC] Added a toolbar row with a chevron-like toggle that collapses/expands the keyboard grid in `KeyboardLayoutComponent.svelte`. State is local for now; persistence pending.
- [2025-08-09 13:28 UTC] Chevron rotation overridden locally in the toolbar to a simple 0deg/-90deg to avoid over-rotation from global a11y styles.
- [2025-08-09 20:50 UTC] Implemented Pin toggle in `KeyboardLayoutComponent.svelte`; state persisted via `pinKeyboardPanel` in settings. Initial CSS used panel-level sticky.
- [2025-08-09 20:56 UTC] Investigated inconsistency: sticky released after ~panel height due to wrapper/overflow constraints; tested wrapper-level sticky and overflow visibility.
- [2025-08-09 21:02 UTC] Final approach: panel is block-level and sticky; `#keyboard-component` uses `height:auto; min-height:100%`; wrapper `#keyboard-preview-view` allows overflow; added wrapper sticky fallback when panel pinned to ensure consistent pin across full scroll.
- [2025-08-09 21:08 UTC] Verified: Pin now keeps the keyboard visible while scrolling long lists; will add minor polish (shadow/offset) if desired.
- [2025-08-11 12:20 UTC] Found: Developer Settings dropdown can be cropped when the panel is collapsed; track fix in Next Steps.
