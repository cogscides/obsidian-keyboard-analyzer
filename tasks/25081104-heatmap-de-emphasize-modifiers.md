---
title: Refine heatmap algorithm to de-emphasize modifier keys
status: todo
owner: '@agent'
updated: 2025-08-11 12:00 UTC
related:
  - [[25080913-SPRINT-list-of-bugs-and-new-feature-requests]]
---

## Context

Modifier keys (Ctrl/Cmd, Shift, Alt/Option) currently dominate the heatmap, obscuring primary key usage. Adjust weights so modifiers contribute less intensity.

## Acceptance Criteria

- `calculateAndAssignWeights` assigns a lower increment to modifiers (e.g., 0.25x) than to non-modifier keys.
- Visual spread remains meaningful after scaling; primary keys stand out appropriately.
- `calculateOpacity` mapping adjusted if necessary to preserve a smooth gradient.
- Manual visual verification across common shortcut sets.

## Files

- `src/managers/visualKeyboardsManager/visualKeyboardsManager.svelte.ts` — update `calculateAndAssignWeights` to differentiate modifier vs. regular keys.
- `src/components/KeyboardKey.svelte` — tweak `calculateOpacity` if new weighting requires.

## Decisions

- [2025-08-11] Pending — exact modifier factor (proposed 0.25–0.4) and normalization strategy.

## Next Steps

- [ ] Identify modifiers with a shared utility and adjust per-key increments.
- [ ] Recompute normalization and opacity mapping for a healthy range.
- [ ] Verify behavior with "Show all" and filtered scopes.
- [ ] Manual test on macOS/Windows layouts.

## Links

- `src/managers/visualKeyboardsManager/visualKeyboardsManager.svelte.ts`
- `src/components/KeyboardKey.svelte`
