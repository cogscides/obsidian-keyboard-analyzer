---
title: Fix overflow/cropping of in-place pop-ups and dropdowns
status: in_progress
owner: '@agent'
updated: 2025-08-11 19:15 UTC
related:
  - [[25080913-SPRINT-list-of-bugs-and-new-feature-requests]]
---

## Context

Dropdowns and popovers are cropped or overflow when near pane/window edges. Ensure all in-place elements remain within viewport and reposition intelligently.

## Acceptance Criteria

- Popovers/dropdowns never render off-screen; they flip/shift to stay visible horizontally and vertically.
- Correctly positioned within Obsidian pane scroll containers; updates on resize/scroll.
- Developer options menu, SearchMenu filter/view dropdowns, and AddToGroup popover behave consistently.
- Click outside behavior remains reliable and does not prematurely close during repositioning.

## Files

- `src/components/AddToGroupPopover.svelte` — improve `placeAbove` and add horizontal clamping.
- `src/components/SearchMenu.svelte` — adjust positioning for filter/view dropdowns.
- `src/components/KeyboardLayoutComponent.svelte` — ensure developer options dropdown remains visible.
- `src/utils/clickOutside.js` — review for interaction with repositioning and portals.

## Decisions

- [2025-08-11] Opted for custom horizontal clamping in `AddToGroupPopover`; utility adoption still under review.

## Next Steps

- [ ] Audit current measurement/position code; list edge cases (narrow sidebars, bottom edge, RTL).
- [ ] If approved, integrate `@floating-ui/dom` for flip/shift/offset middleware; otherwise enhance custom logic.
- [x] Add horizontal clamping in `AddToGroupPopover` to keep popover within viewport.
- [ ] Add resize/scroll observers to recompute positions.
- [ ] Verify clickOutside works with portals and doesn't interfere with focus.
- [ ] Manual test in narrow panes and near edges (top/bottom/left/right).

## Links

- `src/components/AddToGroupPopover.svelte`
- `src/components/SearchMenu.svelte`
- `src/components/KeyboardLayoutComponent.svelte`
- `src/utils/clickOutside.js`
