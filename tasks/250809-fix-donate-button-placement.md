---
title: Fix Donate button placement in Visual Keyboard
status: in_progress
owner: "@you"
updated: 2025-08-09 13:18 UTC
related:
  - [[250809-list-of-bugs-and-new-feature-requests]]
---

## Context
The Donate button appears absolutely positioned and can overlap keycaps in the visual keyboard. Reposition and style it to avoid overlap and respect responsive layouts.

## Decisions
- Move the Donate button outside the key grid container; anchor it in the keyboard header/toolbar region.
- Use standard toolbar/button classes; avoid absolute positioning within the key area.
- Ensure visibility and spacing in narrow panes; prefer flex wrapping over overlap.

## Acceptance Criteria
- Donate never overlaps keycaps; remains visible in small panes.
- Styling aligns with other toolbar buttons across themes.
- No new horizontal overflow introduced.

## Next Steps
- [x] Identify current Donate button markup/location; move out of key grid (owner)
- [x] Apply consistent classes and spacing; test responsiveness (owner)
- [ ] Verify in default + 2 themes; screenshots before/after (owner)

## Links
- [[250809-list-of-bugs-and-new-feature-requests]]

## Progress Log
- [2025-08-09 13:12 UTC] Moved Donate button out of `#keyboard-layout` into a header bar in `src/components/KeyboardLayoutComponent.svelte`; removed absolute positioning and standardized styling (rounded 6px, accent background). Prevents overlap with keys and behaves in narrow panes.
- [2025-08-09 13:18 UTC] Introduced `keyboard-panel` wrapper and centered it via `#keyboard-preview-view { display:flex; justify-content:center }`. The Donate button now sits in a toolbar row above the keyboard without shifting the grid; header shrinks to content width.
- [2025-08-09 13:28 UTC] Wrapped toolbar and keyboard in a shared surface with matching background/border; Donate stays inside this surface so it visually belongs to the keyboard area and no longer dec enters content.
