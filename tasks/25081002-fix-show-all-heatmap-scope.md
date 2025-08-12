---
title: Fix "Show: all" heatmap scope in group view
status: done
owner: "@agent"
updated: 2025-08-11 23:47 UTC
related:
  - [[25080914-hotkey-groups]]
moved_to: [[tasks/done/25081002-fix-show-all-heatmap-scope.md]]
---

This task has been completed and moved to [[tasks/done/25081002-fix-show-all-heatmap-scope.md]].

Key implementation references:

- Global heatmap scope when Show=All: [src/components/KeyboardLayoutComponent.svelte](src/components/KeyboardLayoutComponent.svelte:50)
- Toggle hidden for All Commands group: [src/components/KeyboardLayoutComponent.svelte](src/components/KeyboardLayoutComponent.svelte:121)
- Prop threading from parent: [src/components/KeyboardComponent.svelte](src/components/KeyboardComponent.svelte:281)
