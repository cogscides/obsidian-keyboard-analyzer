---
title: Fix "Show: all" heatmap scope in group view
status: todo
owner: "@agent"
updated: 2025-08-10 03:45 UTC
related:
  - [[25080914-hotkey-groups]]
---

## Context

When a user selects a manual group, the command list is scoped to that group. However, the keyboard heatmap’s current "Show: all" mode still appears constrained by the group/filter context. Expected behavior: with "Show: all" enabled, heatmap should reflect all commands across the vault (including system defaults if toggled), regardless of the active group, while the list remains group-scoped. This heatmap should also respect the current search filters (e.g., modifiers) but not be limited to the group’s commands.

## Goals / DoD

- Decouple heatmap scope from the list scope.
- When "Show: all" is active, compute heatmap weights from all commands (global), even in group view.
- Preserve existing "Filtered" behavior: when not "Show: all", heatmap reflects current filters/group.
- Persist scope choice appropriately (global or per-group default; to decide below) and restore across sessions.
- No regressions to keyboard hover/preview and performance remains smooth.

## Decisions (Proposed)

- Scope control: introduce a "Heatmap scope" setting with values: All | Filtered.
  - All: compute from the full commands dataset (respecting hard visibility toggles like DisplaySystemShortcuts if desired). Should filter by the modifiers added in search.
  - Filtered: compute from the currently visible/filtered commands.
- Persistence: keep heatmap scope as a global view preference (simple; consistent across groups). Optionally allow per-group default in future.
- UI surface: add to View dropdown near "Group by plugin" etc., labeled "Heatmap: All" (toggle) with tooltip clarifying behavior.

## Implementation Plan

- Data flow:
  - Add `heatmapScope: 'all' | 'filtered'` to settings (global), default 'filtered'.
  - Wire into `VisualKeyboardManager`/`KeyboardLayoutComponent` to select dataset for weight calculation.
- Code changes:
  - `src/components/SearchMenu.svelte`: add toggle in View dropdown, persist via `settingsManager`.
  - `src/components/KeyboardComponent.svelte`: derive a `heatmapDataset` based on scope; pass to `VisualKeyboardManager` update/compute.
  - `src/managers/visualKeyboardsManager/visualKeyboardsManager.svelte.ts`: accept commands dataset for weight calc; keep hover state unchanged.
  - `src/managers/commandsManager/commandsManager.svelte.ts`: expose helper to return "all commands" array quickly (already present) and the current group-filtered array.
- Persistence:
  - Add to settings schema and defaults; migrate missing value to 'filtered'.

## Edge Cases

- Large datasets: ensure computing All is performant (cache weights, invalidate on command refresh).
- System shortcuts: if "Display system shortcuts" is off, exclude them from All to match user’s mental model.

## Testing (Manual)

- In group view with "Show: all" on: heatmap shows global intensity; list remains group-only.
- Toggle to "Filtered": heatmap matches the visible list.
- Scope persists after reload; command refresh does not break weights.
