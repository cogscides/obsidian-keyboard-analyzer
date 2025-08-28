---
title: Fix "Show: all" heatmap scope in group view
status: done
owner: "@agent"
updated: 2025-08-11 23:46 UTC
related:
  - [[25080914-hotkey-groups]]
---

## Context

When a user selects a manual group, the list is scoped to that group. The heatmap “Show: all” mode must be computed from all commands (global), not constrained by the current group, while still respecting current search context such as modifiers and strict matching.

## Goals / DoD

- Decouple heatmap scope from the list scope. — done
- When "Show: all" is active, compute heatmap weights from the global set. — done
- Preserve "Filtered" behavior (reflect current filters/group). — done
- No regressions to hover/preview; performance remains smooth. — done
- UI request: hide “Show: All | Filtered” when group is “All commands”. — done

## Decisions

- [2025-08-11] Scope computation:
  - In the keyboard layout, when scope is "all", compute weights from all commands via commandsManager.getCommandsForGroup(GroupType.All); otherwise from visibleCommands (already filtered by search/group).
- [2025-08-11] UI placement:
  - Keep the scope toggle in the keyboard toolbar and hide it when the selected group is “All Commands” to avoid redundancy.
- [2025-08-11] Persistence:
  - Not implemented at this time. Original proposal to persist scope globally can be revisited in a follow-up if needed.

## Implementation

- Global weights in layout:

  - [src/components/KeyboardLayoutComponent.svelte](src/components/KeyboardLayoutComponent.svelte:50-62): heatmapScope === 'all' uses GroupType.All; else uses visibleCommands. Passes active modifiers, active key, and strictModifierMatch to visualKeyboardManager.calculateAndAssignWeights.

- UI toggle visibility:
  - Prop thread:
    - [src/components/KeyboardComponent.svelte](src/components/KeyboardComponent.svelte:281-284): pass selectedGroupID to layout.
    - [src/components/KeyboardLayoutComponent.svelte](src/components/KeyboardLayoutComponent.svelte:21-34): add selectedGroupID?: string prop.
  - Conditional render:
    - [src/components/KeyboardLayoutComponent.svelte](src/components/KeyboardLayoutComponent.svelte:121-139): wrap the “Show: …” toggle with condition !panelCollapsed && selectedGroupID !== GroupType.All.

## Testing (Manual)

- In a manual group with “Show: all” active:
  - Heatmap intensities reflect the entire command set; list stays group-scoped.
- Toggle back to “Filtered”: heatmap matches the current group/search.
- In “All Commands” group: the “Show: …” toggle is hidden.

## Notes

- This completes the requested fix and the additional UI behavior.
- If scope persistence is desired, create a follow-up task to add a settings flag and migration.
