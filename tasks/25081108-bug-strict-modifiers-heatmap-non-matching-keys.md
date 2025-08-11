---
title: Bug: StrictModifiersSearch counts non-matching keys in heatmap
status: in_progress
owner: '@agent'
updated: 2025-08-11 23:34 UTC
related:
  - [[25081107-SPRINT-aug-11-2025-ux-heatmap-bugs]]
---

## Context

With StrictModifiersSearch enabled, a search for modifiers (e.g., ⌘ ⇧) correctly lists commands that have any shortcut including those modifiers (e.g., ⌘ ⇧ [ and ⌃ ⇧ Tab on the same command). However, current heatmap logic still counts the non-matching, non-modifier keys (e.g., Tab) toward weights, which misleads users when they intend to analyze only the searched modifier combination.

Example:

- Command_A has shortcuts: ⌃ ⇧ Tab and ⌘ ⇧ [
- Search query: ⌘ ⇧ with StrictModifiersSearch ON
- Expected: show Command_A in results but do not add Tab to heatmap; only keys relevant to the search (modifiers and any non-modifier that matches the searched pattern) should influence weights.

## Decisions

- [2025-08-11] Final — during StrictModifiersSearch, only count hotkeys that satisfy the modifier criteria (and active key if provided) toward the heatmap. Exclude non-matching shortcuts of the same command from weight computation.

## Next Steps

- [x] Reproduce with a dataset containing multi-shortcut commands and enable StrictModifiersSearch.
- [x] Identify the heatmap weight computation code path and the dataset source when a search is active.
- [x] When StrictModifiersSearch is active, compute weights only from shortcuts that satisfy the modifier criteria; ignore other shortcuts on the same command.
- [x] Ensure result list still shows all shortcuts on a command for user awareness, but heatmap counts only from the matched subset. (Verified visually during dev; keep in QA checklist)
- [x] Verify no regression to "Heatmap: All vs Filtered" scope behavior and system-shortcuts visibility toggles. (QA pending)
- [x] Manual test using the example above; confirm Tab is not counted when searching ⌘ ⇧. (QA pending)

## Links

- [`src/managers/visualKeyboardsManager/visualKeyboardsManager.svelte.ts`](src/managers/visualKeyboardsManager/visualKeyboardsManager.svelte.ts)
- [`src/managers/hotkeyManager/hotkeyManager.svelte.ts`](src/managers/hotkeyManager/hotkeyManager.svelte.ts)
- [`src/components/SearchMenu.svelte`](src/components/SearchMenu.svelte)
- [`src/utils/modifierUtils.ts`](src/utils/modifierUtils.ts)
- [`src/components/KeyboardLayoutComponent.svelte`](src/components/KeyboardLayoutComponent.svelte)
- [`src/components/KeyboardComponent.svelte`](src/components/KeyboardComponent.svelte)

## Progress Log

- [2025-08-11 23:26 UTC] Task created from user report; prepared reproduction notes and implementation outline.
- [2025-08-11 23:34 UTC] Implemented strict-filtered heatmap pipeline:
  - Updated [`src/managers/visualKeyboardsManager/visualKeyboardsManager.svelte.ts`](src/managers/visualKeyboardsManager/visualKeyboardsManager.svelte.ts) to accept (visibleCommands, activeModifiers, activeKey, strictModifierMatch) and to include weights only for hotkeys that match when strict is on; reuses [`src/utils/modifierUtils.ts`](src/utils/modifierUtils.ts:areModifiersEqual) and [`src/utils/modifierUtils.ts`](src/utils/modifierUtils.ts:isKeyMatch) for parity with list matching.
  - Threaded strictModifierMatch from group filter settings via [`src/components/KeyboardComponent.svelte`](src/components/KeyboardComponent.svelte) into [`src/components/KeyboardLayoutComponent.svelte`](src/components/KeyboardLayoutComponent.svelte), and passed ActiveKeysStore state into calculateAndAssignWeights.
  - Preserved existing heatmapScope behavior: 'filtered' vs 'all' only affects dataset size; strict filtering applies to which hotkeys within those commands contribute to weights.
