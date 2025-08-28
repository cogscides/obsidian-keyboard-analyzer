---
title: Summary — Active Sprints and Tasks (as of 2025-08-12)
status: done
owner: '@agent'
updated: 2025-08-12 11:49 UTC
related:
  - [[25081107-SPRINT-aug-11-2025-ux-heatmap-bugs]]
  - [[25080913-SPRINT-list-of-bugs-and-new-feature-requests]]
  - [[25080914-hotkey-groups]]
  - [[25081103-fix-popover-overflow]]
  - [[25081108-bug-strict-modifiers-heatmap-non-matching-keys]]
  - [[25081102-command-search-in-manage-groups]]
  - [[25081101-redesign-manage-groups-modal]]
---

## Context

Consolidated snapshot of in-progress sprint(s) and tasks, summarizing what’s implemented vs outstanding work, with cross-links to source and decisions.

## Sprint Overview

- [[25081107-SPRINT-aug-11-2025-ux-heatmap-bugs]] — Status: in_progress

  - Workstreams:
    - Small-screen UX Improvements
      - [[25081101-redesign-manage-groups-modal]] — status: todo
      - [[25081102-command-search-in-manage-groups]] — status: todo
      - [[25081103-fix-popover-overflow]] — status: in_progress
    - Heatmap Algorithm
      - [[25081104-heatmap-de-emphasize-modifiers]] — status: done (confirmed via sprint note)
    - Bug Fixes
      - [[25081105-fix-filtering-bracket-left]] — status: done (confirmed via sprint note)
    - UI Refinements
      - [[25081106-remove-plus-in-hotkey-display]] — status: done (confirmed via sprint note)
  - Milestones M1–M5 listed; M3–M5 effectively achieved given done items above. M1–M2 still pending completion due to modal redesign and popover overflow items.

- [[25080913-SPRINT-list-of-bugs-and-new-feature-requests]] — Status: in_progress
  - This is a backlog aggregator. Several items spawned dedicated tasks which are now in tasks/done/:
    - Key listener button shape — done: see [[tasks/done/25080913-fix-key-listener-button-shape.md]]
    - Plugin name badge toggle — done: [[tasks/done/25080913-plugin-name-badge-toggle.md]]
    - Keyboard scope toggle — done: [[tasks/done/25080913-keyboard-heatmap-scope-toggle.md]]
    - Keyboard panel collapse toggle — done: [[tasks/done/25080913-keyboard-panel-collapse-toggle.md]]
    - Donate button placement — done: [[tasks/done/25080913-fix-donate-button-placement.md]]
  - Note: The sprint file still lists “Next Steps” with placeholders; these were implemented across multiple “done” tasks. Consider updating that note to reflect completion (optional).

## Active Tasks — Status and Details

1. [[25081103-fix-popover-overflow]] — in_progress

- What’s done
  - Horizontal clamping added in [`src/components/AddToGroupPopover.svelte`](src/components/AddToGroupPopover.svelte).
  - Flip-above heuristic + viewport clamping; ResizeObserver and capture-phase scroll listeners integrated to keep in view during scroll/resize.
- What’s left
  - Audit positioning logic across edge cases (narrow sidebars, bottom/side edges, RTL).
  - Decision: adopt `@floating-ui/dom` vs enhance custom logic (still under review).
  - Verify clickOutside behavior with portals and focus management.
  - Manual tests in narrow panes and near edges.
- Files of interest
  - [`src/components/AddToGroupPopover.svelte`](src/components/AddToGroupPopover.svelte)
  - [`src/components/SearchMenu.svelte`](src/components/SearchMenu.svelte)
  - [`src/components/KeyboardLayoutComponent.svelte`](src/components/KeyboardLayoutComponent.svelte)
  - [`src/utils/clickOutside.js`](src/utils/clickOutside.js)

2. [[25081108-bug-strict-modifiers-heatmap-non-matching-keys]] — in_progress

- Problem
  - With StrictModifiersSearch enabled, non-matching non-modifier keys were counted into the heatmap, skewing results.
- Decisions
  - Only count hotkeys that satisfy the strict modifier criteria (and active key when provided) toward the heatmap; ignore other shortcuts on the same command.
- What’s done
  - Implemented strict-filtered heatmap pipeline in [`src/managers/visualKeyboardsManager/visualKeyboardsManager.svelte.ts`](src/managers/visualKeyboardsManager/visualKeyboardsManager.svelte.ts) using [`src/utils/modifierUtils.ts`](src/utils/modifierUtils.ts).
  - Threaded strict flag and active state via [`src/components/KeyboardComponent.svelte`](src/components/KeyboardComponent.svelte) → [`src/components/KeyboardLayoutComponent.svelte`](src/components/KeyboardLayoutComponent.svelte).
  - Preserved heatmapScope behavior: “filtered” vs “all” affects dataset; strict filtering limits which hotkeys contribute within that dataset.
- What’s left
  - QA: Verify “QA pending” checks in the task:
    - No regression to “Heatmap: All vs Filtered” scope behavior and system-shortcuts toggles.
    - Manual test confirms Tab not counted when searching ⌘ ⇧ as per example.
- Files of interest
  - [`src/managers/visualKeyboardsManager/visualKeyboardsManager.svelte.ts`](src/managers/visualKeyboardsManager/visualKeyboardsManager.svelte.ts)
  - [`src/managers/hotkeyManager/hotkeyManager.svelte.ts`](src/managers/hotkeyManager/hotkeyManager.svelte.ts)
  - [`src/components/SearchMenu.svelte`](src/components/SearchMenu.svelte)
  - [`src/utils/modifierUtils.ts`](src/utils/modifierUtils.ts)
  - [`src/components/KeyboardLayoutComponent.svelte`](src/components/KeyboardLayoutComponent.svelte)
  - [`src/components/KeyboardComponent.svelte`](src/components/KeyboardComponent.svelte)

3. [[25081102-command-search-in-manage-groups]] — todo

- Scope
  - Add search input to Group Manager modal to search and add commands directly.
- Dependencies
  - Relies on redesigned modal structure (see 25081101).
- What’s left
  - Implement debounced command search via Commands Manager; render results with hotkeys, add-to-group, clear, and a11y.
  - Prevent duplicates, keep dropdown behavior consistent (blur/escape), test large sets and empty states.
- Files of interest
  - [`src/components/GroupManagerModal.svelte`](src/components/GroupManagerModal.svelte)
  - [`src/managers/commandsManager/commandsManager.svelte.ts`](src/managers/commandsManager/commandsManager.svelte.ts)
  - [`src/managers/groupManager/groupManager.svelte.ts`](src/managers/groupManager/groupManager.svelte.ts)

4. [[25081101-redesign-manage-groups-modal]] — todo

- Scope
  - Responsive vertical layout, dropdown group selector, explicit reorder controls; maintain all existing actions.
- What’s left
  - Audit current structure at 220–360px widths; replace list with compact dropdown/select; add dedicated Reorder mode (drag handles or up/down); review events/props; manual tests in sidebars/main; update screenshots if visible changes.
- Files of interest
  - [`src/components/GroupManagerModal.svelte`](src/components/GroupManagerModal.svelte)
  - [`src/components/GroupSelector.svelte`](src/components/GroupSelector.svelte)

5. [[25080914-hotkey-groups]] — in_progress

- What’s done (per Progress Log)
  - Scaffolded `GroupSelector` and `GroupManagerModal` with DnD reorder.
  - Implemented `AddToGroupPopover` with search, checkboxes, inline create; wired folder-plus action in commands list; added CRUD helpers and order manipulation.
  - Popover anchoring, visibility, alignment, and flip-above heuristic; last opened group persistence; generic “Open Group…” command.
- What’s left (high-level)
  - Settings schema and migrations; autosave flush on unload; A11y pass; performance checks; optional per-group commands and util for opening view with group; confirm reorder UX and pattern approvals; implement data model/store scaffolding where still missing; cross-platform validation.
- Files of interest
  - [`src/components/GroupSelector.svelte`](src/components/GroupSelector.svelte)
  - [`src/components/GroupManagerModal.svelte`](src/components/GroupManagerModal.svelte)
  - [`src/components/AddToGroupPopover.svelte`](src/components/AddToGroupPopover.svelte)
  - See task for details and proposed interfaces/stores links.

6. [[25081002-fix-show-all-heatmap-scope]] — done

- Completed and moved to [[tasks/done/25081002-fix-show-all-heatmap-scope.md]].
- References:
  - Global scope toggle logic: [`src/components/KeyboardLayoutComponent.svelte`](src/components/KeyboardLayoutComponent.svelte:50)
  - Toggle hidden for All Commands group: [`src/components/KeyboardLayoutComponent.svelte`](src/components/KeyboardLayoutComponent.svelte:121)
  - Prop threading: [`src/components/KeyboardComponent.svelte`](src/components/KeyboardComponent.svelte:281)

## Recommendations (Administrative)

- Sprint 25081107:
  - Keep M1 “Modal redesign” and M2 “Popover overflow” open; M3–M5 validation can be marked achieved based on linked done tasks. Optionally append a dated note to reflect completion of M3–M5.
- Backlog sprint 25080913:
  - Given many items moved to done, consider appending a “Completed Items” section with links to corresponding done tasks to reduce ambiguity in Next Steps.

## Next Steps

- [ ] Complete QA for [[25081108-bug-strict-modifiers-heatmap-non-matching-keys]] (“QA pending” checks).
- [ ] Decide “Floating UI vs custom” for [[25081103-fix-popover-overflow]]; proceed with integration or finalize custom logic; verify clickOutside behavior.
- [ ] Start [[25081101-redesign-manage-groups-modal]] to unblock [[25081102-command-search-in-manage-groups]].
- [ ] Convert idea notes to formal tasks using the repo template:
  - Quick View popup for shortcuts
  - Group settings: default vs dynamic behavior

## Links

- Sprint: [[25081107-SPRINT-aug-11-2025-ux-heatmap-bugs]]
- Backlog: [[25080913-SPRINT-list-of-bugs-and-new-feature-requests]]
- Groups epic: [[25080914-hotkey-groups]]
