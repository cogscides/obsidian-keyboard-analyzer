---
title: Toggle heatmap scope — Filters vs All commands
status: done
owner: "@you"
updated: 2025-08-11 12:07 UTC
related:
  - [[250809-list-of-bugs-and-new-feature-requests]]
  - [[25081002-fix-show-all-heatmap-scope]]
---

## Context
The visual keyboard heatmap currently reflects active search/filters, which can confuse exploration of global hotkey usage. Add a toggle to choose whether the heatmap reflects the current filters/search only or all known hotkeys.

## Decisions
- Default to “Match filters/search” to preserve current expectations.
- Offer “All commands” as the alternate state; active keys remain highlighted correctly in both modes.
- Compute intensities efficiently; memoize per scope to avoid expensive recomputation.

## Acceptance Criteria
- Two explicit states with clear labels; default matches current behavior.
- Heat intensities recalc per scope; active key styling remains correct.
- No noticeable lag when toggling scope on large command sets.

## Next Steps
- [x] Add temporary `heatmapScope` UI control in keyboard toolbar (owner)
- [x] Replace with a single toggle button to cycle Filtered/All (owner)
- [x] Add `heatmapScope` view setting (`filtered | all`) with persistence (owner) — moved to [[25081002-fix-show-all-heatmap-scope]]
- [x] Update heatmap computation pipeline/util to accept scope (owner)
- [ ] Update keyboard legend/tooltip to indicate current scope (owner)
- [ ] Manual performance check with large vault; screenshots of both states (owner)

## Links
- [[250809-list-of-bugs-and-new-feature-requests]]

## Progress Log
- [2025-08-09 13:18 UTC] Added a visible Scope select in the keyboard toolbar (`filtered` vs `all`) in `KeyboardLayoutComponent.svelte`. Currently UI-only; wiring to heatmap computation pending.
- [2025-08-09 13:28 UTC] Replaced dropdown with a segmented two-button toggle (Filtered/All) for better UX and smaller footprint.
- [2025-08-09 13:55 UTC] Simplified to a single toggle button that flips between Filtered and All for an even cleaner toolbar.
- [2025-08-09 17:08 UTC] Updated toggle label to "Show: Filtered/All" styling to match desired format and improve clarity while keeping the toolbar compact.
- [2025-08-09 17:10 UTC] Hid the scope toggle when the keyboard is collapsed to reduce clutter and align with the collapsed state purpose.
