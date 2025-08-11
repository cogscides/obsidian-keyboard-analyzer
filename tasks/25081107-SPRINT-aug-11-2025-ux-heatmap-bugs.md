---
title: SPRINT — Aug 11, 2025: Small-screen UX, Heatmap tuning, Bugfixes
status: in_progress
owner: "@agent"
updated: 2025-08-11 19:15 UTC
related:
  - [[25081101-redesign-manage-groups-modal]]
  - [[25081102-command-search-in-manage-groups]]
  - [[25081103-fix-popover-overflow]]
  - [[25081104-heatmap-de-emphasize-modifiers]]
  - [[25081105-fix-filtering-bracket-left]]
  - [[25081106-remove-plus-in-hotkey-display]]
---

## Context

Coordinate parallel work across UX improvements for small screens, heatmap weighting adjustments, and high-priority bug/UI fixes.

## Workstreams & Assignments

- Small-screen UX Improvements (Owners: @agent-ux, @agent-fe)
  - [[25081101-redesign-manage-groups-modal]] — responsive vertical layout + dropdown selector.
  - [[25081102-command-search-in-manage-groups]] — in-modal command search + add-to-group.
  - [[25081103-fix-popover-overflow]] — robust positioning for popovers/dropdowns.
  - Dependencies: 25081102 depends on modal structure from 25081101.

- Heatmap Algorithm (Owner: @agent-data)
  - [[25081104-heatmap-de-emphasize-modifiers]] — reduce modifier weight, adjust opacity mapping as needed.

- Bug Fixes (Owner: @agent-core)
  - [[25081105-fix-filtering-bracket-left]] — fix normalization/matching for BracketLeft.

- UI Refinements (Owner: @agent-ux)
  - [[25081106-remove-plus-in-hotkey-display]] — space-separated hotkey rendering.

## Milestones

- M1: Modal redesign ready (enables search work) — links: [[25081101-redesign-manage-groups-modal]].
- M2: Popover overflow fixes validated in narrow panes — links: [[25081103-fix-popover-overflow]].
- M3: Heatmap tuning validated visually — links: [[25081104-heatmap-de-emphasize-modifiers]].
- M4: BracketLeft filtering regression resolved — links: [[25081105-fix-filtering-bracket-left]].
- M5: Hotkey display spacing live — links: [[25081106-remove-plus-in-hotkey-display]].

## Next Steps

- [ ] @agent-ux: Finalize modal wireframe (mobile/narrow sidebar) and confirm dropdown vs reorder mode. (rel: [[25081101-redesign-manage-groups-modal]])
- [ ] @agent-fe: Implement modal layout changes behind a feature flag; verify existing actions. (rel: [[25081101-redesign-manage-groups-modal]])
- [ ] @agent-fe: Add debounced command search with hotkey display; wire to add-to-group. (rel: [[25081102-command-search-in-manage-groups]])
- [ ] @agent-fe: Integrate/decide on positioning utility (e.g., Floating UI) and fix overflow. (rel: [[25081103-fix-popover-overflow]])
- [ ] @agent-data: Update weights and normalization; adjust opacity curve if needed. (rel: [[25081104-heatmap-de-emphasize-modifiers]])
- [ ] @agent-core: Correct normalization for `BracketLeft`; update matching logic; manual tests. (rel: [[25081105-fix-filtering-bracket-left]])
- [ ] @agent-ux: Update hotkey joiner to space; regression check in all views. (rel: [[25081106-remove-plus-in-hotkey-display]])

## Notes

- Please append brief progress updates to each linked task and this sprint note with timestamps.
- Keep scope limited to acceptance criteria; spin off follow-ups as new tasks and link them here.
- [2025-08-11] Implemented horizontal clamping for `AddToGroupPopover` to keep popover within viewport. (rel: [[25081103-fix-popover-overflow]])
